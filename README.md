# Bridge

**Coordination, not chaos.**

Bridge is community-crisis coordination software with a Meetup Safety Check at every step. It turns scattered messages from SMS, GroupMe, Discord, and intake forms into structured, privacy-protected matches that a coordinator can approve — never auto-dispatch.

Built for the Cornell Claude Builders Hackathon 2026.

> Bridge supports human coordination. It does not replace 911, emergency medical services, or official emergency response.

---

## Why Bridge

A real campus crisis generates **1,400+ messages across 6 platforms** in the first four hours. A single coordinator has minutes to figure out who needs help, who can offer it, what is urgent, what is risky, and what requires real emergency response.

Most of that work happens in spreadsheets and group chats. Bridge replaces that with structured coordination data — but only after the system flags the safety risks of putting two strangers in contact, and only after a coordinator approves the plan.

Bridge does **not** encourage strangers to meet blindly. It is the inverse of a Nextdoor / Ring–style "AI matches volunteers, here's a phone number" loop. Every match runs through:

1. **Meetup Safety Check** — ten typed safety flags (one-on-one, ride request, medical handoff, vulnerable requester, private address, nighttime, isolated location, …).
2. **Safer Handoff Plan** — a public, visible, easy-to-find meetup point with exact addresses hidden until both sides accept.
3. **Coordinator approval** — an explicit human signature, time-stamped and tied to the source message.
4. **Privacy-safe outbound message** — Claude-drafted, with sensitive details stripped, sent through Twilio.

---

## Features

### Public landing (`/`)

- **Zoom-parallax intro reel** — a sticky 7-photo composition that meets the inverted hero photo at the end of scroll. Lead headline floats over the parallax with a soft vignette and fades as the photos zoom.
- **Editorial sections** — Problem · How It Works · Pipeline · Command Center · Features · Safety Posture · Testimonial · CTA · Footer. Light/dark rhythm, all on the same brand tokens.
- **`Coordination, not chaos.`** hero fades in over the back half of the parallax — no hard cut to a separate hero section.
- **Theme-aware nav** — `data-nav-theme` markers on each section flip the nav between light and inverse modes automatically.
- **Embedded `/app` preview** — the Command Center section renders the actual product surface (not a screenshot) so judges see the same UI from two angles.

### Auth (mock — `localStorage`-backed)

- `/login` and `/signup` editorial split-layout forms (left: brand panel with stats; right: form).
- `AuthContext` exposes `signIn`, `signUp`, `signOut`, `user`, and a `status` flag.
- `AuthGuard` wraps `/app`. If there's no session it redirects to `/login?redirect=/app` and bounces back after sign-in.
- Show/hide password, inline validation, "Connecting…" submitting state.
- Sign-out from the dashboard routes to `/` first, then clears auth (avoids the guard bouncing the user back to `/login`).

### Dashboard (`/app`) — the coordinator console

A 5-tab product surface (Citizen × Apple aesthetic — dense + restrained) with a live status ribbon that auto-refreshes every 30 s.

#### Map tab

- **Real Leaflet map** with CARTO Dark Matter tiles (free, no API key, on-brand for the dark editorial dispatch feel).
- **Live disaster pulses** — USGS earthquakes (M ≥ 4.5, last 7 days, significant) and NWS active alerts rendered as colour-tone severity rings + tooltips.
- **SQLite-backed pins** — needs (red) and providers (green) registered through Compose appear in real time.
- **Match suggestion lines** — dashed for under-review, solid blue for approved, dashed red for blocked.
- **Stylized canvas mode** — toggle to a hand-drawn SVG zone map (North Campus, Collegetown, Belle Sherman, Fall Creek) for editorial walkthroughs. Same data, different language.
- **Pin-detail rail** + match card on the right with the live Meetup Safety status.

#### Feed tab

- Citizen-style PostCard list with author, source badge, urgency tone, "Exact location hidden" + "Safety check required" pills.
- Filter chips: All · Needs · Offers · Matches · Broadcasts · Completed.
- Right rail: feed legend with Bridge's privacy posture and the pinned warming-spot card.

#### Compose tab — the killer demo

Three modes:
- **Analyze messages** *(default, "Live" pill)* — paste a stream of multi-channel messages (or load the bundled 30-message demo set), hit **Run analysis**, and Claude Opus 4.7 extracts needs, helpers, urgency scores 1–5, and safe-by-default match candidates. Result is adapted to the typed `Match` shape and merged into the feed + alerts. A 4-tile result summary shows Needs / Helpers / Urgent (≥4) / Safe matches.
- **Register helper** — name, phone (E.164 normalized), capability + availability → `POST /api/users/register` → SQLite insert with jittered (±100m) coordinates → triggers a `refreshLive()` so the helper count on the Map ticks up.
- **Quick post** — coordinator-typed single entry (lightweight; the analyze path is preferred for batches).

#### Alerts tab

- **Live disasters · USGS + NWS** — real-time card grid with severity tone, time-ago, source badge, and lat / lng.
- **Coordinator inbox** — match found, match blocked, broadcast, handoff complete. Each links to the relevant `MeetupSafetyModal`.
- Manual **Refresh** button for the entire live data window.

#### You tab

- Profile drawn from the live `AuthContext` user (initials, name, email, joined date).
- **Meetup Safety Preferences** — six toggles for the coordinator's defaults (public handoff, hide address, coordinator approval before contact, buddy for rides, block one-on-one nighttime, remote check for vulnerable cases).
- Stats (approvals · blocks · flags resolved) and a clearly-labelled "demo verification · simulated" panel.
- Inline **Sign out** that routes through `/` cleanly.

### Meetup Safety system

- **10 typed flags** in `lib/safety.ts` — one-on-one, private-address, medical-handoff, ride-request, vulnerable-requester, unknown-helper, unknown-requester, nighttime, isolated-location, high-value-item. Each carries a `risk`, an `action`, and a numeric weight.
- **Composite score** with a clean ring visualization (`SafetyScoreRing`) and four labeled bands: 80–100 *Safer to review*, 60–79 *Needs precautions*, 40–59 *High caution*, 0–39 *Block until safer plan*.
- **`MeetupSafetyModal`** — risk band, detected risks (with the Risk → Action pair), required precautions, location picker (six pre-baked safer meetup points), and four action buttons: Request more info · Change location · Block match · Approve safety plan.
- **`SaferHandoffPlan`** card — recommended location, rationale, 5-step plan, privacy posture, and the active handoff-option pills.
- **Adapter** (`lib/adapters.ts`) — translates the upstream `AnalyzeResult` into the typed `Match` shape, inferring flags from need type + free-text patterns ("home / dorm / address" → private-address, "grandma / elderly / minor / alone" → vulnerable-requester, etc.).

### Backend — integrated from `bnudelman4/crisisproj`

Bridge ships **all** of the upstream Anthropic + Twilio + USGS / NWS pipeline. Routes mirror the upstream contract:

| Method · path | Purpose |
| --- | --- |
| `POST /api/analyze` | Anthropic Opus 4.7 extracts `{ needs, resources, matches, summary }` from raw multi-channel text. Strict JSON schema validation; coercion to known enums; 422 on schema mismatch. |
| `GET /api/disasters/active` | USGS significant-7-day earthquakes + NWS active immediate / expected alerts. 60-second in-memory cache. |
| `POST /api/disasters/notify` | SMS-blast registered users within `radiusKm` of an event (haversine filter on `users.lat/lng`). |
| `POST /api/users/register` | Insert into SQLite `users` (name, E.164 phone, lat, lng). 409 on duplicate phone. |
| `POST /api/sms/inbound` | Twilio webhook. Validates signature, classifies replies via Claude, inserts into `requests` or `providers`. Returns TwiML. |
| `POST /api/matches/approve` | Looks up request + provider, sends Twilio SMS to both, marks both `matched`, records the match. Falls back to `mode: "demo"` when the IDs are non-numeric (e.g. seeded sample matches). |
| `GET /api/map/data` | Composite of `requests`, `providers`, `matches`, and `disasters` for the dashboard. Re-fetched every 30 s by `AppContext`. |

Twilio falls back to `demo-mode` (server-log only) when keys aren't set, so the full UI flow runs without a Twilio account.

---

## Tech stack

- **Framework** — [Next.js 16](https://nextjs.org) (App Router, Turbopack, route groups, dynamic imports).
- **React** — 19 with the canary features the App Router pulls in.
- **Language** — TypeScript 5.x throughout.
- **Styling** — Tailwind v4 with `@theme inline` design tokens. Custom CSS variables for the editorial palette (`--bg-canvas`, `--bg-inverse`, `--accent`, `--accent-emphasis`, `--signal-*`). Lenis smooth scroll. Editorial photo filter.
- **Type** — `next/font/google` self-hosting **Inter** (variable, body), **Fraunces** (display, opsz axis 144), **JetBrains Mono** (technical labels). `font-feature-settings: "ss01", "cv11"` on Inter.
- **Motion** — `framer-motion` v12 with scroll-tied transforms (intentionally mirrored through a plain `useMotionValue` to defeat framer's auto-applied native ScrollTimeline that ignores `useScroll` offsets — see comment in `IntroParallax.tsx`).
- **Map** — `react-leaflet` 5 + `leaflet` 1.9 with **CARTO Dark Matter** tile layer (free, no API key, brand-friendly). Custom popup / tooltip / zoom-control styling in `globals.css`.
- **Icons** — `lucide-react`.
- **AI** — `@anthropic-ai/sdk` calling **`claude-opus-4-7`** for `/api/analyze` and the SMS-inbound classifier.
- **SMS / WhatsApp** — `twilio` v6 (with WhatsApp Sandbox support via `TWILIO_CHANNEL=whatsapp`). Falls back to console logging when no keys are present.
- **Storage** — `better-sqlite3` v12 (synchronous, in-process). Local file at `data/bridge.db`. Schema bootstraps on first request. Not durable on Vercel — local dev / demo only.
- **External feeds** — USGS earthquake significant-7-day GeoJSON, NWS active alerts (immediate / expected) GeoJSON.

### Project structure

```
app/
  layout.tsx                  Root layout (fonts, AuthProvider, SmoothScrollProvider)
  globals.css                 Tokens, Lenis, Leaflet overrides, editorial filter
  (marketing)/
    layout.tsx                Adds Nav + ScrollProgress only on the landing
    page.tsx                  Section composition
  app/
    layout.tsx                AuthGuard wrapper
    page.tsx                  ProductApp host with Back-to-landing
  login/page.tsx              <AuthForm mode="login" />
  signup/page.tsx             <AuthForm mode="signup" />
  api/
    analyze/route.ts          Anthropic extraction + JSON schema validation
    disasters/active/route.ts USGS + NWS feed
    disasters/notify/route.ts Radius SMS-blast
    map/data/route.ts         Composite SQLite + disasters payload (we authored this; absent upstream)
    matches/approve/route.ts  Twilio dispatch + DB update
    sms/inbound/route.ts      Twilio webhook + Claude classifier
    users/register/route.ts   SQLite insert with E.164 normalization
components/
  app/                        Dashboard (AppShell, AppContext, LiveRibbon, LeafletMap, ProductApp, views/*)
  auth/                       AuthContext, AuthGuard, AuthForm
  motion/                     SmoothScrollProvider, ScrollProgress, Reveal, TextReveal
  primitives/                 Logo, Button, Badge, MatchCard, MeetupSafetyModal, SafetyScore, SaferHandoffPlan, MapCanvas, …
  sections/                   Landing-page sections
  ui/zoom-parallax.tsx        Drop-in third-party parallax component
lib/
  safety.ts                   10 flag types, sample matches, DEMO_GEO Cornell coords
  feed.ts                     Seeded feed items, app alerts, SVG map pins
  adapters.ts                 AnalyzeResult → typed Match
  unsplash.ts                 Curated brand-safe Unsplash IDs (with alt text)
  cn.ts, sample-messages.ts
  backend/                    Vendored from bnudelman4/crisisproj
    db.ts                     better-sqlite3 schema + global handle
    sms.ts                    Twilio with WhatsApp + demo-mode fallback
    geo.ts                    Haversine
    jitter.ts                 ±100m privacy jitter
    phone.ts                  E.164 normalization
    matches.ts                In-memory match log
    disasters.ts              USGS + NWS fetchers, 60s cache
    types.ts                  AnalyzeResult shape
    demo-locations.ts         Spread-around-city helper
    demo-messages.ts          30 multi-channel demo messages
```

---

## Setup

Requires Node 24 LTS + npm.

```bash
git clone <this repo>
cd crisismesh-site            # folder name; the app is named Bridge
npm install
cp .env.local.example .env.local   # then fill in ANTHROPIC_API_KEY
npm run dev
```

`http://localhost:3000` — landing.
`http://localhost:3000/signup` — create a session, get redirected to `/app`.

### Required env

| Key | Used by | Notes |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | `/api/analyze`, `/api/sms/inbound` | Without this, analyze returns 500 and SMS classification falls back. |

### Optional env (Twilio)

| Key | Notes |
| --- | --- |
| `TWILIO_ACCOUNT_SID` | Without these, `sendSms()` runs in demo-mode and logs the body to the server console. |
| `TWILIO_AUTH_TOKEN` | |
| `TWILIO_PHONE_NUMBER` | Required for SMS channel. |
| `TWILIO_CHANNEL=whatsapp` | Optional WhatsApp Sandbox mode. |
| `TWILIO_WHATSAPP_FROM` | Override for the sandbox-default `+14155238886`. |
| `CRISIS_MESH_OUTBOUND_MESSAGE` | Override the default disaster-notify SMS body. |

### Demo flow (no Twilio, no real keys needed)

1. Visit `/` and scroll through the parallax + landing.
2. Sign up at `/signup` (any email, ≥4-char password).
3. Land on `/app`. The **Live ribbon** pulls real USGS + NWS data within ~1 second.
4. **Map** tab — see the seeded Sam ↔ Leo, Nora-blocked, Belle Sherman, Priya-water matches placed around Cornell with safety lines.
5. **Compose → Analyze messages** — load the 30-message demo, hit **Run analysis** *(needs `ANTHROPIC_API_KEY`)*. Watch the feed and alerts populate with real Claude-extracted needs and matches.
6. **Compose → Register helper** — register a helper. Switch to the Map tab and they're now a green pin.
7. **Feed** tab — click **Review match** on Sam K.'s post → `MeetupSafetyModal` opens with the full safety check. Pick a meetup point and hit **Approve safety plan**. The flow flips to the Alerts tab with a "Safety plan approved · sam ↔ leo" entry, the match card flips to approved (blue line on the map), and the backend gets a best-effort `POST /api/matches/approve` call.
8. **Alerts** tab — Nora's ride request is blocked with the reason; Sam's match shows an approval card; live USGS + NWS cards show real disaster data.

---

## Design

**Brand tokens** (`globals.css`):
- Surfaces — `--bg-canvas` (`#FAFAF7`, warm off-white), `--bg-inverse` (`#000000`, pure black), `--bg-inverse-card` (`#0E0E0E`), `--bg-inverse-elevated` (`#141414`).
- Ink — `--text-primary` (`#0A0E1A`), `--text-secondary` (`#4B5563`), `--text-tertiary` (`#9CA3AF`), `--text-on-inverse` (`#F3F4F6`).
- Accent — `--accent-emphasis` (`#5B8DEF`, a single restrained blue, used in the live indicator, scroll progress bar, and pipeline accents — three places maximum).
- Signals — `--signal-critical` (`#EF4444`), `--signal-success` (`#10B981`), `--signal-warning` (`#F59E0B`).
- Borders — `--border-hairline` (`#E5E5E0`), `--border-on-inverse` (`#1F1F1F`).

**Aesthetic direction** — Citizen × Apple. Citizen for the urgent, dense, real-time feel: pulsing live indicator, severity-coloured disaster cards, time-ago timestamps, lat / lng everywhere, ribbon ticker. Apple for the restraint: pure black canvas surfaces, single accent colour, Fraunces display, JetBrains Mono labels, generous gaps inside the dense compositions, no bouncy springs, hairline strokes, subtle radial-gradient ambient lights.

**Type** — `Inter 400/500/600` (body), `Fraunces 500` with `opsz: 144` (display, headlines), `JetBrains Mono` (IDs, timestamps, technical labels). Numbers are tabular for the stat tiles.

**Motion** — `framer-motion` for entrance reveals, scroll-tied photo parallax, and the parallax → hero fade-in. Lenis for smooth scroll. Scroll-progress bar across the top of the landing.

---

## Notable engineering details

- **Framer-motion `useScroll` + ScrollTimeline gotcha** — passing a `useScroll` MotionValue directly into `useTransform` triggers framer's auto-attached native `ScrollTimeline`, which ignores the `offset` config and uses document-scroll progress instead. Bridge mirrors `scrollYProgress` into a plain `useMotionValue` to defeat the optimization (see `IntroParallax.tsx`).
- **Lenis × modal scroll** — Lenis intercepts wheel events globally; nested scroll containers get starved. The `MeetupSafetyModal` uses the `data-lenis-prevent` attribute (Lenis 1.x walks `composedPath` for it) plus a body-scroll lock.
- **SSR safety for Leaflet** — `react-leaflet` touches `window` at import time, so the map is loaded via `next/dynamic` with `ssr: false` and a skeleton state.
- **Anthropic schema validation** — the `/api/analyze` route enforces strict enum coercion + integer urgency clamping so a model regression can't break the dashboard. Returns 422 on schema mismatch.
- **Privacy posture as code** — the safety adapter actively *adds* the `private-address` flag when free text matches `/home|dorm|apt|address|street|avenue|st\.|ave\./i` and `vulnerable-requester` when text matches `/grandma|elderly|alone|child|kid/i`, so the safety system errs on the side of more-cautious by default.

---

## What this is *not*

- Not a 911 replacement. The Safety Posture section makes this explicit and the disclaimer appears in the footer, the auth screens, and the dashboard.
- Not a real verification system. The "Demo profile · simulated" label appears wherever identity / phone / past-assist counts are shown.
- Not a Vercel-deployable demo without changes — `better-sqlite3` writes a local file at `data/bridge.db` which won't survive a serverless cold start. Swap to Neon Postgres or Upstash KV for production.
- Not a Nextdoor / Ring–style "we connect the dots, you handle the rest" tool. Bridge is built around the Meetup Safety Check; the matching is the *easy* part of the problem.

---

## Acknowledgements

- Backend pipeline (Anthropic extraction, Twilio SMS, USGS / NWS feeds, SQLite store) authored by [@bnudelman4](https://github.com/bnudelman4) in [bnudelman4/crisisproj](https://github.com/bnudelman4/crisisproj).
- Map tiles courtesy of [CARTO](https://carto.com/) and [OpenStreetMap](https://www.openstreetmap.org/).
- Editorial photography curated from [Unsplash](https://unsplash.com/) under the Unsplash License.
- Built for the Cornell Claude Builders Hackathon 2026.

— *The hardest part of a campus crisis is not the response. It is the routing. Bridge is the first software that treats the routing as the actual problem.*
