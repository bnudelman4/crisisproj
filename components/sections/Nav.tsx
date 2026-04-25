"use client";

import { useEffect, useState } from "react";
import { Logo } from "@/components/primitives/Logo";
import { LinkButton } from "@/components/primitives/Button";
import { useAuth } from "@/components/auth/AuthContext";
import { cn } from "@/lib/cn";

const links = [
  { href: "#problem", label: "Problem" },
  { href: "#how", label: "How it works" },
  { href: "#pipeline", label: "Pipeline" },
  { href: "#command", label: "Command center" },
  { href: "#safety", label: "Safety" },
];

const NAV_PROBE_Y = 36;

function detectInverse(): boolean {
  const candidates = document.querySelectorAll<HTMLElement>("[data-nav-theme='dark']");
  for (const el of candidates) {
    const r = el.getBoundingClientRect();
    if (r.top <= NAV_PROBE_Y && r.bottom > NAV_PROBE_Y) {
      return true;
    }
  }
  return false;
}

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [inverse, setInverse] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    let frame = 0;
    const tick = () => {
      setScrolled(window.scrollY > 12);
      setInverse(detectInverse());
      frame = 0;
    };
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(tick);
    };
    tick();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
        scrolled
          ? inverse
            ? "bg-black/70 backdrop-blur-md border-b border-white/[0.06]"
            : "bg-canvas/85 backdrop-blur-md border-b border-hairline"
          : "bg-transparent border-b border-transparent"
      )}
    >
      <div className="mx-auto max-w-[1280px] px-6 md:px-10 h-[64px] flex items-center justify-between gap-6">
        <a href="#" className="flex items-center" aria-label="CrisisMesh home">
          <Logo inverse={inverse} />
        </a>

        <nav className="hidden md:flex items-center gap-7">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={cn(
                "text-[13px] transition-colors duration-150",
                inverse
                  ? "text-white/70 hover:text-white"
                  : "text-ink-secondary hover:text-ink"
              )}
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <LinkButton
              href="/app"
              size="md"
              variant={inverse ? "inverse" : "primary"}
            >
              Open dashboard
            </LinkButton>
          ) : (
            <>
              <LinkButton
                href="/login"
                size="md"
                variant="ghost"
                className={cn(
                  "hidden sm:inline-flex",
                  inverse
                    ? "!text-white/80 hover:!bg-white/[0.06] hover:!text-white"
                    : "!text-ink-secondary hover:!bg-muted hover:!text-ink"
                )}
              >
                Log in
              </LinkButton>
              <LinkButton
                href="/signup"
                size="md"
                variant={inverse ? "inverse" : "primary"}
              >
                Sign up
              </LinkButton>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
