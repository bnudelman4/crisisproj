"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { profileCoordinator } from "@/lib/feed";
import { useAuth } from "@/components/auth/AuthContext";
import { cn } from "@/lib/cn";
import { ShieldCheck, Lock, Users, Moon, Phone, MapPin, LogOut } from "lucide-react";

const toggleDefs = [
  { key: "publicHandoff", label: "Prefer public handoff locations", icon: MapPin },
  { key: "hideAddress", label: "Hide exact address until approved", icon: Lock },
  { key: "coordApprovalRequired", label: "Require coordinator approval before contact", icon: ShieldCheck },
  { key: "buddyForRides", label: "Require buddy / contact sharing for rides", icon: Users },
  { key: "blockNightOneOnOne", label: "Block one-on-one nighttime meetups", icon: Moon },
  { key: "remoteCheckVulnerable", label: "Use remote check-in first for vulnerable cases", icon: Phone },
] as const;

export default function YouView() {
  const [prefs, setPrefs] = useState(profileCoordinator.preferences);
  const { user, signOut } = useAuth();
  const router = useRouter();

  const displayName = user?.name ?? profileCoordinator.name;
  const initials = (user?.name ?? profileCoordinator.name)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("") || "MR";
  const role = user
    ? `${user.role === "helper" ? "Helper" : "Coordinator"} · North Campus Mutual Aid`
    : profileCoordinator.role;
  const joined = user
    ? `Joined ${new Date(user.joinedAt).toLocaleDateString(undefined, { month: "short", year: "numeric" })}`
    : profileCoordinator.joined;

  return (
    <div className="p-4 lg:p-5 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5">
      <div>
        {/* Profile */}
        <div className="rounded-2xl bg-inverse-elevated border border-on-inverse p-5 flex items-center gap-4">
          <span
            aria-hidden
            className="h-14 w-14 rounded-full bg-white/[0.06] border border-on-inverse inline-flex items-center justify-center font-display text-[18px] text-ink-on-inverse"
            style={{ letterSpacing: "-0.02em" }}
          >
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[16px] font-medium text-ink-on-inverse">{displayName}</div>
            <div className="text-[12.5px] text-ink-on-inverse-muted truncate">{user?.email ?? role}</div>
            <div className="font-mono text-[10.5px] tracking-[0.14em] uppercase text-ink-on-inverse-muted mt-1">
              {joined}
            </div>
          </div>
          <button
            type="button"
            onClick={() => { router.replace("/"); setTimeout(signOut, 0); }}
            className="inline-flex items-center gap-1.5 rounded-full px-3 h-8 font-sans text-[12px] font-medium border border-on-inverse text-ink-on-inverse-muted hover:bg-white/[0.04] hover:text-ink-on-inverse transition-colors"
          >
            <LogOut size={12} strokeWidth={1.6} />
            Sign out
          </button>
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          <Stat label="Approvals · today" value={profileCoordinator.approvalsToday} />
          <Stat label="Blocks · today" value={profileCoordinator.blocksToday} />
          <Stat label="Flags resolved" value={profileCoordinator.flagsResolved} />
        </div>

        {/* Preferences */}
        <div className="mt-5 rounded-2xl bg-inverse-elevated border border-on-inverse">
          <div className="px-4 py-3 border-b border-on-inverse flex items-center justify-between">
            <span className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-ink-on-inverse-muted">
              Meetup Safety Preferences
            </span>
            <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-on-inverse-muted">
              Default for all new posts
            </span>
          </div>
          <ul className="divide-y divide-[color:var(--border-on-inverse)]">
            {toggleDefs.map((t) => {
              const Icon = t.icon;
              const value = prefs[t.key];
              return (
                <li key={t.key} className="px-4 py-3 flex items-center gap-3">
                  <span className="h-7 w-7 rounded-md bg-white/[0.04] border border-on-inverse inline-flex items-center justify-center text-ink-on-inverse-muted">
                    <Icon size={13} strokeWidth={1.6} />
                  </span>
                  <span className="flex-1 text-[13px] text-ink-on-inverse">{t.label}</span>
                  <button
                    onClick={() => setPrefs({ ...prefs, [t.key]: !value })}
                    className={cn(
                      "h-5 w-9 rounded-full border transition-colors flex items-center px-0.5",
                      value ? "bg-[var(--signal-success)]/20 border-[var(--signal-success)]/40" : "bg-white/[0.04] border-on-inverse"
                    )}
                    aria-label={`Toggle ${t.label}`}
                  >
                    <span
                      className={cn(
                        "h-3.5 w-3.5 rounded-full transition-transform",
                        value ? "translate-x-3.5 bg-[var(--signal-success)]" : "translate-x-0 bg-white/40"
                      )}
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <aside>
        <div className="rounded-2xl bg-inverse-elevated border border-on-inverse p-5">
          <span className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-ink-on-inverse-muted">
            Verification
          </span>
          <h3 className="mt-1 font-display text-[20px] leading-[1.1] text-ink-on-inverse" style={{ fontWeight: 500, letterSpacing: "-0.02em" }}>
            Demo profile · simulated.
          </h3>
          <p className="mt-2 text-[12.5px] leading-[1.55] text-ink-on-inverse-muted">
            Identity, phone, and past-assist counts shown here are simulated for
            this demo. Bridge does not pretend real verification exists.
          </p>
          <ul className="mt-4 space-y-2 text-[12.5px] text-ink-on-inverse">
            <li className="flex items-center gap-2"><Phone size={11} strokeWidth={1.6} className="text-ink-on-inverse-muted" /> Phone confirmed: simulated</li>
            <li className="flex items-center gap-2"><ShieldCheck size={11} strokeWidth={1.6} className="text-ink-on-inverse-muted" /> Coordinator role: simulated</li>
            <li className="flex items-center gap-2"><Users size={11} strokeWidth={1.6} className="text-ink-on-inverse-muted" /> Past assists: 22 (mock)</li>
          </ul>
        </div>

        <div className="mt-4 rounded-2xl bg-inverse-elevated border border-on-inverse p-5">
          <span className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-ink-on-inverse-muted">
            Disclaimer
          </span>
          <p className="mt-2 text-[12.5px] leading-[1.55] text-ink-on-inverse-muted">
            Bridge supports human coordination. It does not replace 911,
            emergency medical services, or official emergency response.
          </p>
        </div>
      </aside>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-inverse-elevated border border-on-inverse p-3">
      <div className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-ink-on-inverse-muted">{label}</div>
      <div className="mt-1 font-display text-[28px] leading-[1] text-ink-on-inverse" style={{ fontWeight: 500, letterSpacing: "-0.02em" }}>{value}</div>
    </div>
  );
}
