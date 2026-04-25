# Bridge

**Coordination, not chaos.**

Bridge is community-crisis coordination software. It turns scattered messages from
SMS, GroupMe, Discord, and intake forms into structured, privacy-protected matches —
needs, offers, and proposed pairings — then puts a human in the loop before anything
goes out the door. Every match runs through a two-step approval, with WhatsApp /
SMS as the primary out-of-band channel.

> Bridge supports human coordination. It does not replace 911, emergency medical
> services, or official emergency response.

Built for the Cornell Claude Builders Hackathon 2026.

---

## What it does

A real campus crisis generates thousands of messages across half a dozen
platforms in the first few hours. Bridge ingests that stream and:

1. **Extracts** structured needs and offers via Anthropic Claude Opus 4 — typed,
   urgency-scored 1–5, and grouped by category (food, ride, medicine, shelter,
   info, other for needs; car, food, money, time, skill for offers).
2. **Stores** them in a local SQLite database with privacy jitter (~±100m) on
   coordinates and never exposes raw phone numbers to the client.
3. **Surfaces** them on a live map (OpenStreetMap via react-leaflet) centred on
   the logged-in user's actual location, reverse-geocoded via OSM Nominatim.
4. **Routes** WhatsApp inbound replies through `/api/sms/inbound`, validates the
   Twilio signature, classifies the body via Claude, and drops a row into the
   appropriate table.
5. **Pairs** needs and offers — either via Claude-suggested matches at seed
   time, or via a logged-in helper clicking **Accept** on an open need.
6. **Gates** every match with a two-step approval: helper accepts → requester
   confirms via app or by replying `CONFIRM HELP` over WhatsApp → both sides
   notified.
7. **Closes** the loop with dual completion: helper marks complete, requester
   confirms, request is greyed out at the bottom of the user's activity column.

---

## Demo flow

You will need two phones (or one phone with two WhatsApp identities). The demo
hard-routes all requester-bound SMS to `+16464771086` and all helper-bound SMS
to `+19293940349`, regardless of who the underlying database row is "owned"
by — so synthetic seeded users (Maria T, jen.r, etc.) effectively all pipe to
your real demo numbers.

1. Open `http://localhost:3000`. Middleware redirects to `/login`.
2. Log in as the helper account (`9293940349 / hunter2`).
3. **Feed** tab — pick a seeded request from "neighbours" (Maria T's grandma
   needing insulin, jen.r's cold dorm, etc.). Click **Accept**.
4. WhatsApp ding on `+16464771086` — *"Helper Demo accepted your medicine
   request… Reply CONFIRM HELP to approve."*
5. Switch accounts to the requester (`6464771086 / hunter2`). **Alerts** tab
   shows the pending confirmation. Click **Confirm helper**.
6. WhatsApp ding on `+19293940349` — *"NYC Test approved your help."*
7. Both sides go to **You** tab. **Mark complete** appears on the approved
   match. Both must mark; row greys out and drops to the bottom.

A barely-visible **reset** link at the bottom-right of every page wipes seeded
data and re-runs Claude analysis on the demo messages, spreading them around
the requester user's actual lat / lng.

---

## UI

Five-tab dark coordinator console inside a rounded card:

| Tab | Purpose |
| --- | --- |
| **Map** | OSM tiles with red (need) / green (offer) / blue (match) pins. Click any pin → details + Accept button. Disaster zones (USGS quakes + NWS alerts) overlaid as yellow rings. |
| **Feed** | Open requests near you (not your own) with one-click Accept; available helpers as cards. |
| **Compose** | Pointer to the WhatsApp bot — quickest way to post a need or offer. Web compose form pending. |
| **Alerts** | Pending confirmations and safety-flagged matches that need your eye. |
| **You** | Your requests and the help you're providing, split active / completed. Mark-complete buttons live here. |

Login + register pages use the bridge editorial split layout — black panel with
the brand on the left, form on the right.

---

## Backend

| Method · path | Purpose |
| --- | --- |
| `POST /api/auth/login` | Phone + password. Phone normalises any common US format → E.164. Sets a signed (HMAC-SHA256) httpOnly cookie. |
| `POST /api/auth/logout` | Clears the cookie. |
| `GET /api/auth/me` | Returns the logged-in user (no `password_hash`). |
| `POST /api/users/register` | name + phone + password (≥6 chars) + lat / lng. scrypt-hashed password. Claims passwordless legacy accounts on phone match. |
| `POST /api/users/me` | Update name / lat / lng / password. Requires current password. |
| `POST /api/analyze` | Anthropic Opus 4 extracts `{ needs, resources, matches, summary }` from raw multi-channel text. Strict JSON schema validation; 422 on malformed. |
| `GET /api/disasters/active` | USGS significant-7-day earthquakes + NWS active alerts. 60-second in-memory cache. |
| `POST /api/disasters/notify` | Sends WhatsApp / SMS to every registered user inside `radiusKm` of a lat / lng (haversine). |
| `GET /api/map/data` | Composite payload — requests + providers + matches + disasters — used by the dashboard and map. Coordinates jittered ±0.001°; no phone numbers exposed. |
| `POST /api/matches/accept-request` | Logged-in helper accepts an open request → match `helper_accepted`, SMS to requester. |
| `POST /api/matches/approve` | Logged-in helper accepts a Claude-proposed match → match `helper_accepted`, SMS to requester. |
| `POST /api/matches/confirm` | Requester confirms helper → match `approved`, SMS to helper. |
| `POST /api/matches/complete` | Helper or requester marks complete; both required to flip to `completed`. No SMS — in-app only. |
| `POST /api/sms/inbound` | Twilio webhook. Validates signature, detects `CONFIRM HELP` keyword for in-WhatsApp confirmation, otherwise classifies via Claude and inserts into `requests` or `providers`. Returns TwiML. |
| `POST /api/seed` | Idempotent — runs Claude on the bundled 30-message demo set, spreads around the requester user's lat / lng, populates SQLite + in-memory match store. |
| `POST /api/seed/reset` | Force re-seed. Wipes only `seeded=1` rows. |
| `GET /api/location/reverse` | Reverse-geocode `lat / lng` → city / state / country via OSM Nominatim. 24-hour in-memory cache. |

All API routes outside `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`,
`/api/users/register`, and `/api/sms/inbound` are gated by `middleware.ts` —
unauthenticated requests get 401 (API) or 307 → `/login` (pages).

Twilio falls back to `demo-mode` (server-log only) when keys are absent, so the
full UI flow runs without a Twilio account.

---

## Match state machine

```
proposed                   (Claude-suggested at seed time)
   │ helper accepts
   ▼
helper_accepted            (SMS to requester)
   │ requester confirms (app or "CONFIRM HELP" via WhatsApp)
   ▼
approved                   (SMS to helper · request.status='matched')
   │ helper marks complete
   │ requester marks complete
   ▼
completed                  (request.status='completed' · row greys out)
```

Manual accept-request skips `proposed` and lands directly at `helper_accepted`.

---

## Tech stack

- **Framework** — Next.js 14 (App Router), React 18, TypeScript 5.
- **Styling** — Tailwind 3 with custom Bridge design tokens layered into
  `globals.css`. Inter (body), Fraunces (display), JetBrains Mono (eyebrows /
  technical) self-hosted via `next/font/google`.
- **Motion** — framer-motion 11.
- **Map** — react-leaflet 4 + Leaflet 1.9 with OpenStreetMap tiles.
- **Icons** — lucide-react.
- **AI** — `@anthropic-ai/sdk` calling **`claude-opus-4-20250514`** for
  `/api/analyze` and the SMS-inbound classifier.
- **SMS / WhatsApp** — `twilio` v6 with WhatsApp Sandbox support via
  `TWILIO_CHANNEL=whatsapp`. Demo-mode console fallback.
- **Storage** — `better-sqlite3` v12 (synchronous, in-process). Local file at
  `data/crisismesh.db`. Schema bootstraps on first request via
  `ensureColumn` migrations.
- **Auth** — phone + password. scrypt-hashed via Node `crypto`. Sessions via
  HMAC-signed httpOnly cookies (30-day max-age).
- **External feeds** — USGS earthquake significant-7-day GeoJSON, NWS active
  alerts GeoJSON, OSM Nominatim reverse geocode.

### Project structure

```
app/
  layout.tsx                  Root layout (fonts)
  globals.css                 Bridge tokens + Tailwind 3 base
  page.tsx                    /  → redirects to /dashboard
  login/page.tsx              Bridge editorial split-layout login
  register/page.tsx           Profile creation (name, phone, password, location)
  profile/page.tsx            Edit name / location / password
  dashboard/page.tsx          ProductApp shell with 5 tabs
  api/
    analyze/route.ts
    auth/{login,logout,me}/route.ts
    disasters/{active,notify}/route.ts
    location/reverse/route.ts
    map/data/route.ts
    matches/{accept-request,approve,confirm,complete}/route.ts
    seed/{,reset}/route.ts
    sms/inbound/route.ts
    users/{register,me}/route.ts
components/
  map/CrisisMap.tsx           react-leaflet with toggle layers, popups, accept buttons
  ui/{button,card,badge,textarea}.tsx
lib/
  analyze.ts                  Reusable Anthropic call + schema validator
  auth.ts                     scrypt + HMAC cookie helpers
  db.ts                       better-sqlite3 setup + idempotent column migrations
  demo-locations.ts           spreadAround() helper
  demo-messages.ts            30 multi-channel demo messages
  demo-routing.ts             Hard-route all SMS to demo phones
  disasters.ts                USGS + NWS fetchers with 60s cache
  geo.ts                      Haversine
  icons.ts                    Need / resource type → Lucide icon
  jitter.ts                   ±0.001° privacy jitter
  matches.ts                  In-memory match store + state transitions
  phone.ts                    Phone normalization (US 10-digit → E.164)
  seed.ts                     analyze + persist + propose helpers
  sms.ts                      Twilio wrapper with WhatsApp + demo-mode
  types.ts                    AnalyzeResult shape
middleware.ts                 Cookie-presence gate
data/                         SQLite file (gitignored)
```

---

## Setup

Requires Node 18+ and npm.

```bash
git clone git@github.com:bnudelman4/crisisproj.git
cd crisisproj
npm install
cp .env.local.example .env.local
# fill in ANTHROPIC_API_KEY (required)
# optional: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER, TWILIO_CHANNEL=whatsapp
npm run dev
```

Open `http://localhost:3000`. Without auth, you'll bounce to `/login`. Register
two accounts (one demo requester at `+16464771086`, one demo helper at
`+19293940349`), give them passwords, and the seed will populate Claude-extracted
demo data around your registered location on first dashboard load.

### Environment variables

| Key | Purpose | Required |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | Claude Opus 4 for `/api/analyze` and SMS classifier | yes |
| `SESSION_SECRET` | HMAC key for the session cookie. Falls back to a fixed dev string if absent. | recommended in prod |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` | Twilio credentials. Without these, outbound SMS logs to console only. | optional |
| `TWILIO_PHONE_NUMBER` | Twilio number for SMS mode. | optional |
| `TWILIO_CHANNEL` | `whatsapp` or `sms`. With `whatsapp`, uses the Twilio Sandbox `+1 415 523 8886` from-number. | optional |
| `TWILIO_WHATSAPP_FROM` | Override the WhatsApp from-number. | optional |
| `DEMO_REQUESTER_PHONE`, `DEMO_HELPER_PHONE` | Override the hard-coded demo recipients. Defaults: `+16464771086` / `+19293940349`. | optional |
| `DEMO_DISABLE_ROUTING` | Set to `1` to send SMS to actual user phones instead of the demo numbers. | optional |
| `CRISIS_MESH_OUTBOUND_MESSAGE` | Override the disaster-alert SMS body. | optional |

### WhatsApp Sandbox setup

1. Twilio Console → Messaging → **Try it out** → Send a WhatsApp message.
2. WhatsApp `join <code>` to `+1 415 523 8886` from each demo phone.
3. Run `ngrok http 3000`. Copy the `https://...ngrok-free.dev` URL.
4. Sandbox settings → "WHEN A MESSAGE COMES IN" → `https://<ngrok>/api/sms/inbound` · POST.
5. Set `TWILIO_CHANNEL=whatsapp` in `.env.local`. Restart `npm run dev`.

---

## Privacy & safety posture

- Phone numbers never leave the server. The `/api/map/data` payload uses display
  names only.
- Coordinates are jittered ±0.001° (~100m) before being sent to the client.
- All matches are *suggestions* — both the helper and the requester must
  explicitly confirm before any meetup is implied.
- No automatic messaging without an approved match. The "approve" verbs in the
  UI both fan out a single Twilio message to the appropriate party.
- The dashboard's bottom-right "reset" link wipes seeded rows only — real
  WhatsApp inbound replies (`seeded=0`) are preserved.

---

## Status

This is a hackathon build. There is no rate limiting, no row-level access
control beyond the obvious "you can only confirm matches you're the requester
of", and no audit log. The Twilio trial account caps at 50 outbound messages
per day, which is enough for a demo run twice through.

The bridge UI lives at `/dashboard`. The marketing landing from the
`bridge-frontend` branch is intentionally not merged — main is a working
coordinator console, not a public site.
