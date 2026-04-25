"use client";

import { motion, useMotionValue, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef } from "react";
import { ZoomParallax } from "@/components/ui/zoom-parallax";
import { parallaxReel } from "@/lib/unsplash";
import { LiveIndicator } from "@/components/primitives/LiveIndicator";
import { LinkButton } from "@/components/primitives/Button";
import { useAuth } from "@/components/auth/AuthContext";

export default function IntroParallax() {
  const ref = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  // Mirror scrollYProgress into a plain MotionValue. Framer-motion auto-
  // optimizes a `useScroll` value by attaching a native ScrollTimeline that
  // ignores the `offset` config (it uses document scroll progress). Routing
  // through a manual MotionValue defeats that optimization so the offset is
  // honored and our scroll-derived transforms behave as expected.
  const progress = useMotionValue(0);
  useEffect(() => {
    progress.set(scrollYProgress.get());
    return scrollYProgress.on("change", (v) => progress.set(v));
  }, [scrollYProgress, progress]);

  // Lead headline — visible at the start, fades as the parallax engages.
  const leadOpacity = useTransform(progress, [0, 0.16, 0.26], [1, 0.85, 0]);
  const leadY = useTransform(progress, [0, 0.26], [0, -32]);
  const leadScale = useTransform(progress, [0, 0.26], [1, 1.04]);
  const vignetteOpacity = useTransform(progress, [0, 0.16, 0.26], [0.45, 0.35, 0]);

  // Hero block — fades in across the back half of the parallax, so by the
  // time the photo zoom finishes "Coordination, not chaos." is established.
  const heroOpacity = useTransform(progress, [0.55, 0.85], [0, 1]);
  const heroY = useTransform(progress, [0.55, 0.85], [28, 0]);
  const heroDim = useTransform(progress, [0.5, 0.85], [0, 1]);

  return (
    <section
      ref={ref}
      data-nav-theme="dark"
      aria-label="Operations brief"
      className="relative w-full"
      style={{ background: "#000", color: "var(--text-on-inverse)" }}
    >
      {/* The 7-photo parallax — pure black, center photo zooms to fullscreen */}
      <ZoomParallax images={[...parallaxReel]} />

      {/* Lead overlay — pinned across the section, opacity hides it after
          the first viewport so we don't fight the parallax mid-scroll. */}
      <div className="pointer-events-none absolute inset-0 z-20">
        <div className="sticky top-0 h-screen w-full">
          <motion.div
            aria-hidden
            className="absolute inset-0"
            style={{
              opacity: vignetteOpacity,
              background:
                "radial-gradient(60% 50% at 50% 50%, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.55) 45%, rgba(0,0,0,0) 80%)",
            }}
          />
          <div className="relative h-full flex items-center justify-center px-6 md:px-10">
            <motion.div
              style={{ opacity: leadOpacity, y: leadY, scale: leadScale }}
              className="relative mx-auto max-w-[840px] text-center pointer-events-auto"
            >
              <h1
                className="font-display text-ink-on-inverse"
                style={{
                  fontWeight: 500,
                  fontSize: "clamp(40px, 6vw, 84px)",
                  letterSpacing: "-0.03em",
                  lineHeight: 0.96,
                  maxWidth: "16ch",
                  margin: "0 auto",
                  textShadow: "0 2px 18px rgba(0,0,0,0.6)",
                }}
              >
                When the lights go out,
                <br />
                the messages don&apos;t.
              </h1>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Hero overlay — same sticky structure, fades IN with the back half
          of the parallax. Sits on top of the lead so the transition is one
          continuous piece, no hard cut. */}
      <div
        id="hero"
        aria-labelledby="hero-headline"
        className="pointer-events-none absolute inset-0 z-30"
      >
        <div className="sticky top-0 h-screen w-full">
          {/* Dark legibility wash — fades in with the hero text */}
          <motion.div
            aria-hidden
            className="absolute inset-0"
            style={{
              opacity: heroDim,
              background:
                "linear-gradient(180deg, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.42) 38%, rgba(0,0,0,0.58) 78%, rgba(0,0,0,0.92) 100%)",
            }}
          />

          <div className="relative h-full flex items-center justify-center px-6 md:px-10">
            <motion.div
              style={{ opacity: heroOpacity, y: heroY }}
              className="relative mx-auto flex max-w-[1280px] flex-col items-center justify-center text-center pointer-events-auto"
            >
              <div className="mb-8">
                <div className="inline-flex items-center gap-3 font-mono text-[11px] tracking-[0.18em] uppercase text-ink-on-inverse-muted">
                  <LiveIndicator inverse label="LIVE COORDINATION" />
                  <span aria-hidden className="h-px w-6" style={{ background: "rgba(255,255,255,0.18)" }} />
                  <span>CrisisMesh · Coordination Infrastructure</span>
                </div>
              </div>

              <h2
                id="hero-headline"
                className="font-display tracking-display text-ink-on-inverse"
                style={{
                  fontWeight: 500,
                  fontSize: "clamp(48px, 7.4vw, 104px)",
                  maxWidth: "12ch",
                  textShadow: "0 2px 22px rgba(0,0,0,0.65)",
                }}
              >
                Coordination,
                <br />
                not chaos.
              </h2>

              <p
                className="mt-7 max-w-[560px] text-[17px] leading-[1.55] text-ink-on-inverse-muted font-sans"
                style={{ textShadow: "0 1px 14px rgba(0,0,0,0.6)" }}
              >
                Crisis coordination software with a Meetup Safety Check at
                every step. CrisisMesh turns scattered messages from SMS,
                GroupMe, Discord, and forms into structured, privacy-protected
                matches a coordinator can approve.
              </p>

              <div className="mt-9 flex flex-col sm:flex-row items-center gap-3">
                {user ? (
                  <LinkButton href="/app" size="lg" variant="inverse">
                    Open dashboard
                  </LinkButton>
                ) : (
                  <>
                    <LinkButton href="/signup" size="lg" variant="inverse">
                      Sign up
                    </LinkButton>
                    <LinkButton
                      href="/login"
                      size="lg"
                      variant="ghost"
                      className="!text-ink-on-inverse hover:!bg-white/[0.08] border border-white/15"
                    >
                      Log in
                    </LinkButton>
                  </>
                )}
              </div>

              <div className="mt-10 font-mono text-[10.5px] tracking-[0.18em] uppercase text-ink-on-inverse-muted">
                git commit · Cornell Claude Builders Hackathon · 2026
              </div>
            </motion.div>
          </div>

          {/* Bottom footnote — fades in with the rest of the hero block */}
          <motion.div
            style={{ opacity: heroOpacity }}
            className="absolute inset-x-0 bottom-0"
          >
            <div className="border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
              <div className="mx-auto flex max-w-[1280px] items-center justify-between px-6 md:px-10 py-3 font-mono text-[10.5px] tracking-[0.18em] uppercase text-ink-on-inverse-muted">
                <span>↓ Scroll · Operations brief</span>
                <span>v0.4 · pre-release</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
