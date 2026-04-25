"use client";

import { LinkButton } from "@/components/primitives/Button";
import { Reveal } from "@/components/motion/Reveal";
import { LiveIndicator } from "@/components/primitives/LiveIndicator";
import { useAuth } from "@/components/auth/AuthContext";

export default function CTA() {
  const { user } = useAuth();
  const primaryHref = user ? "/app" : "/signup";
  const primaryLabel = user ? "Open dashboard" : "Sign up";
  const secondaryHref = user ? null : "/login";
  return (
    <section
      id="cta"
      data-nav-theme="dark"
      aria-labelledby="cta-headline"
      className="relative w-full overflow-hidden border-y border-on-inverse"
      style={{ background: "var(--bg-inverse)", color: "var(--text-on-inverse)" }}
    >
      {/* spotlight + grain */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(50% 50% at 30% 0%, rgba(91,141,239,0.16) 0%, rgba(0,0,0,0) 60%)",
        }}
      />
      <div className="absolute inset-0 grain pointer-events-none" />

      {/* warm grading lines */}
      <svg
        aria-hidden
        className="absolute inset-0 w-full h-full opacity-[0.05] pointer-events-none"
        viewBox="0 0 1200 600"
        preserveAspectRatio="none"
      >
        {Array.from({ length: 24 }).map((_, i) => (
          <path
            key={i}
            d={`M0 ${i * 28} Q 300 ${i * 22 + 30} 600 ${i * 26 + 12} T 1200 ${i * 24 + 18}`}
            fill="none"
            stroke="#F3F4F6"
            strokeWidth="0.7"
          />
        ))}
      </svg>

      <div className="relative mx-auto max-w-[1280px] px-6 md:px-10 py-32 md:py-44 grid md:grid-cols-12 gap-10 items-end">
        <div className="md:col-span-8">
          <Reveal>
            <LiveIndicator inverse label="ROOM 0142 · OPEN" />
          </Reveal>
          <Reveal delay={0.05}>
            <h2
              id="cta-headline"
              className="mt-6 font-display tracking-display text-ink-on-inverse"
              style={{
                fontWeight: 500,
                fontSize: "clamp(40px, 5.6vw, 88px)",
                letterSpacing: "-0.028em",
                lineHeight: 0.96,
                maxWidth: "16ch",
              }}
            >
              Built for the moment help arrives as chaos.
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-6 max-w-[60ch] text-[16px] leading-[1.65] text-ink-on-inverse-muted">
              Sign up to open the command center and run a 60-second crisis
              simulation. See the intake feed populate, watch the safety
              check fire on Sam ↔ Leo, and approve a Safer Handoff Plan as
              if it were 2:14 a.m. on a power-out Tuesday.
            </p>
          </Reveal>
        </div>
        <div className="md:col-span-4 flex flex-col gap-3 md:items-end">
          <Reveal delay={0.15}>
            <div className="flex items-center gap-2">
              <LinkButton href={primaryHref} size="lg" variant="inverse">
                {primaryLabel}
              </LinkButton>
              {secondaryHref && (
                <LinkButton
                  href={secondaryHref}
                  size="lg"
                  variant="ghost"
                  className="!text-ink-on-inverse hover:!bg-white/[0.08] border border-white/15"
                >
                  Log in
                </LinkButton>
              )}
            </div>
          </Reveal>
          <Reveal delay={0.2}>
            <span className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-ink-on-inverse-muted">
              {user ? "Coordinator session active" : "Free · simulation mode · no real PHI"}
            </span>
          </Reveal>
        </div>
      </div>

      <div className="relative border-t border-on-inverse">
        <div className="mx-auto max-w-[1280px] px-6 md:px-10 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-[10.5px] tracking-[0.18em] uppercase text-ink-on-inverse-muted">
          <span>Latency · ≤ 350ms</span>
          <span>Audit · 100% logged</span>
          <span>Channels · 5 connectors</span>
          <span>Approval · always required</span>
        </div>
      </div>
    </section>
  );
}
