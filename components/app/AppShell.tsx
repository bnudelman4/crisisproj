"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { Logo } from "@/components/primitives/Logo";
import { LiveIndicator } from "@/components/primitives/LiveIndicator";
import { useAuth } from "@/components/auth/AuthContext";
import { LiveRibbon } from "./LiveRibbon";
import {
  MapPinned,
  ListOrdered,
  Plus,
  BellDot,
  CircleUserRound,
  Search,
  ChevronDown,
  LogOut,
  User,
} from "lucide-react";

export type AppTab = "map" | "feed" | "compose" | "alerts" | "you";

const tabs: Array<{ id: AppTab; label: string; icon: typeof MapPinned }> = [
  { id: "map", label: "Map", icon: MapPinned },
  { id: "feed", label: "Feed", icon: ListOrdered },
  { id: "compose", label: "Compose", icon: Plus },
  { id: "alerts", label: "Alerts", icon: BellDot },
  { id: "you", label: "You", icon: CircleUserRound },
];

export function AppShell({
  children,
  active,
  onNavigate,
  alertsCount = 0,
  inverse = true,
}: {
  children: ReactNode;
  active: AppTab;
  onNavigate: (t: AppTab) => void;
  alertsCount?: number;
  inverse?: boolean;
}) {
  const dark = inverse;
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMenuOpen(false); };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const initials = (user?.name ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("") || "MR";
  const displayName = user?.name ?? "M. Rivas";

  return (
    <div
      className={cn(
        "rounded-3xl overflow-hidden border shadow-[0_30px_120px_-30px_rgba(0,0,0,0.55)]",
        dark
          ? "bg-[color:var(--bg-inverse-card)] border-[color:var(--border-strong)]"
          : "bg-elevated border-hairline"
      )}
    >
      {/* OS chrome */}
      <div
        className={cn(
          "flex items-center justify-between gap-4 px-4 py-3 border-b",
          dark ? "border-on-inverse" : "border-hairline"
        )}
      >
        <div className="flex items-center gap-3 min-w-0">
          <Logo inverse={dark} />
          <span aria-hidden className={cn("h-4 w-px", dark ? "bg-white/10" : "bg-hairline")} />
          <span className={cn("font-mono text-[10.5px] tracking-[0.18em] uppercase truncate", dark ? "text-ink-on-inverse-muted" : "text-ink-tertiary")}>
            Room 0142 · North Campus Mutual Aid
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className={cn("hidden md:flex items-center gap-2 px-2.5 h-7 rounded-md border", dark ? "border-on-inverse" : "border-hairline")}>
            <Search size={12} strokeWidth={1.6} className={dark ? "text-ink-on-inverse-muted" : "text-ink-tertiary"} />
            <span className={cn("font-mono text-[10.5px] tracking-[0.14em] uppercase", dark ? "text-ink-on-inverse-muted" : "text-ink-tertiary")}>
              Search needs, offers, helpers
            </span>
            <kbd className={cn("font-mono text-[10px] ml-2 border px-1 rounded", dark ? "border-white/10 text-ink-on-inverse-muted" : "border-hairline text-ink-tertiary")}>⌘K</kbd>
          </div>
          <LiveIndicator inverse={dark} label={`Coordinator · ${displayName}`} />

          {/* User menu */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              className={cn(
                "inline-flex items-center gap-1.5 h-7 pl-1 pr-2 rounded-full transition-colors",
                dark
                  ? "bg-white/[0.05] hover:bg-white/[0.09] text-ink-on-inverse"
                  : "bg-muted hover:bg-canvas text-ink"
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "h-5 w-5 rounded-full inline-flex items-center justify-center font-mono text-[10px]",
                  dark ? "bg-white/10 text-ink-on-inverse" : "bg-elevated text-ink"
                )}
              >
                {initials}
              </span>
              <ChevronDown size={12} strokeWidth={1.6} />
            </button>

            {menuOpen && (
              <div
                role="menu"
                className={cn(
                  "absolute right-0 mt-2 w-56 rounded-xl shadow-[0_10px_30px_-10px_rgba(0,0,0,0.6)] z-50 overflow-hidden",
                  dark
                    ? "bg-[color:var(--bg-inverse-elevated)] border border-on-inverse text-ink-on-inverse"
                    : "bg-elevated border border-hairline text-ink"
                )}
              >
                <div className={cn("px-3 py-2.5 border-b", dark ? "border-on-inverse" : "border-hairline")}>
                  <div className="text-[12.5px] font-medium truncate">{displayName}</div>
                  <div className={cn("text-[11px] truncate", dark ? "text-ink-on-inverse-muted" : "text-ink-tertiary")}>
                    {user?.email ?? "coordinator@crisismesh.local"}
                  </div>
                </div>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => { setMenuOpen(false); onNavigate?.("you"); }}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 text-[12.5px] transition-colors",
                    dark ? "hover:bg-white/[0.05]" : "hover:bg-muted"
                  )}
                >
                  <User size={13} strokeWidth={1.6} />
                  Coordinator profile
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    // Route off the gated /app first, then clear auth — order
                    // matters so the AuthGuard doesn't redirect to /login.
                    router.replace("/");
                    setTimeout(signOut, 0);
                  }}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 text-[12.5px] transition-colors border-t",
                    dark
                      ? "hover:bg-white/[0.05] border-on-inverse text-ink-on-inverse-muted hover:text-ink-on-inverse"
                      : "hover:bg-muted border-hairline text-ink-secondary hover:text-ink"
                  )}
                >
                  <LogOut size={13} strokeWidth={1.6} />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Citizen-style live status ribbon — surfaces backend health + active disasters */}
      <LiveRibbon onJumpToAlerts={() => onNavigate?.("alerts")} />

      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr]">
        {/* Side rail */}
        <nav
          className={cn(
            "border-r p-2 md:p-3 flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible scrollbar-none",
            dark ? "border-on-inverse" : "border-hairline"
          )}
          aria-label="App tabs"
        >
          {tabs.map((t) => {
            const Icon = t.icon;
            const activeTab = active === t.id;
            const isCompose = t.id === "compose";
            const isAlerts = t.id === "alerts";
            return (
              <button
                key={t.id}
                onClick={() => onNavigate(t.id)}
                className={cn(
                  "group inline-flex md:flex items-center gap-2.5 rounded-lg px-2.5 h-9 text-[12.5px] font-medium transition-colors whitespace-nowrap",
                  activeTab
                    ? dark
                      ? "bg-white/[0.06] text-ink-on-inverse"
                      : "bg-muted text-ink"
                    : dark
                    ? "text-ink-on-inverse-muted hover:text-ink-on-inverse hover:bg-white/[0.04]"
                    : "text-ink-secondary hover:text-ink hover:bg-muted/70"
                )}
              >
                <span
                  className={cn(
                    "inline-flex h-6 w-6 items-center justify-center rounded-md",
                    isCompose
                      ? activeTab
                        ? dark
                          ? "bg-elevated text-ink"
                          : "bg-[var(--accent)] text-[var(--text-on-inverse)]"
                        : dark
                        ? "bg-white/[0.08] text-ink-on-inverse"
                        : "bg-[var(--accent)] text-[var(--text-on-inverse)]"
                      : ""
                  )}
                >
                  <Icon size={14} strokeWidth={1.6} />
                </span>
                <span>{t.label}</span>
                {isAlerts && alertsCount > 0 && (
                  <span
                    className="ml-auto inline-flex items-center justify-center h-4 min-w-[18px] px-1 rounded-full font-mono text-[10px]"
                    style={{
                      background: "var(--signal-critical)",
                      color: "white",
                    }}
                  >
                    {alertsCount}
                  </span>
                )}
              </button>
            );
          })}

          {/* foot label */}
          <div
            className={cn(
              "hidden md:block mt-auto pt-3 px-2.5 font-mono text-[10px] tracking-[0.18em] uppercase",
              dark ? "text-ink-on-inverse-muted" : "text-ink-tertiary"
            )}
          >
            Demo · sample data
          </div>
        </nav>

        {/* Content */}
        <div
          className={cn(
            "min-h-[640px] md:min-h-[720px] relative",
            dark ? "bg-[color:var(--bg-inverse)]" : "bg-canvas"
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
