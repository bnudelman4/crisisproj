"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Play } from "lucide-react";
import { LinkButton } from "@/components/primitives/Button";
import { LiveIndicator } from "@/components/primitives/LiveIndicator";
import { WordReveal } from "@/components/motion/TextReveal";
import { heroAerial } from "@/lib/unsplash";

const ease = [0.16, 1, 0.3, 1] as const;

export default function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const photoY = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const photoOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.45]);

  return (
    <section
      ref={ref}
      data-nav-theme="dark"
      className="relative min-h-[100svh] w-full overflow-hidden border-b border-on-inverse"
      aria-labelledby="hero-headline"
      style={{ background: "#000", color: "var(--text-on-inverse)" }}
    >
      {/* Background photo + dark overlay */}
      <motion.div
        className="absolute inset-0"
        style={{ y: photoY, opacity: photoOpacity }}
        aria-hidden
      >
        <img
          src={heroAerial.src}
          alt={heroAerial.alt}
          className="editorial-image absolute inset-0 h-full w-full object-cover object-bottom"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.55) 38%, rgba(0,0,0,0.65) 78%, rgba(0,0,0,0.92) 100%)",
          }}
        />
        {/* faint topographic line texture */}
        <svg
          className="absolute inset-x-0 bottom-0 w-full h-[40%] opacity-[0.06] mix-blend-screen"
          viewBox="0 0 1200 200"
          preserveAspectRatio="none"
          aria-hidden
        >
          {Array.from({ length: 18 }).map((_, i) => (
            <path
              key={i}
              d={`M0 ${20 + i * 10} Q 200 ${i * 5} 400 ${30 + i * 9} T 800 ${10 + i * 11} T 1200 ${20 + i * 9}`}
              fill="none"
              stroke="#F3F4F6"
              strokeWidth="0.6"
            />
          ))}
        </svg>
      </motion.div>

      {/* hairline cross under nav */}
      <div aria-hidden className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-[64px] left-0 right-0 h-px"
          style={{ background: "rgba(255,255,255,0.06)" }}
        />
      </div>

      <div className="relative mx-auto flex min-h-[100svh] max-w-[1280px] flex-col items-center justify-center px-6 md:px-10 pt-[88px] pb-24 text-center">
        {/* eyebrow */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6, ease }}
          className="mb-8"
        >
          <div className="inline-flex items-center gap-3 font-mono text-[11px] tracking-[0.18em] uppercase text-ink-on-inverse-muted">
            <LiveIndicator inverse label="LIVE COORDINATION" />
            <span aria-hidden className="h-px w-6" style={{ background: "rgba(255,255,255,0.18)" }} />
            <span>CrisisMesh · Coordination Infrastructure</span>
          </div>
        </motion.div>

        {/* headline */}
        <h1
          id="hero-headline"
          className="font-display tracking-display text-ink-on-inverse"
          style={{
            fontWeight: 500,
            fontSize: "clamp(48px, 7.4vw, 104px)",
            maxWidth: "12ch",
          }}
        >
          <WordReveal text="Coordination," delay={0.05} />
          <br />
          <WordReveal text="not chaos." delay={0.45} />
        </h1>

        {/* sub */}
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85, duration: 0.7, ease }}
          className="mt-7 max-w-[560px] text-[17px] leading-[1.55] text-ink-on-inverse-muted font-sans"
        >
          Crisis coordination software with a Meetup Safety Check at every
          step. CrisisMesh turns scattered messages from SMS, GroupMe,
          Discord, and forms into structured, privacy-protected matches a
          coordinator can approve.
        </motion.p>

        {/* buttons */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.7, ease }}
          className="mt-9 flex flex-col sm:flex-row items-center gap-3"
        >
          <LinkButton href="/app" size="lg" variant="inverse">
            Open the command center
          </LinkButton>
          <LinkButton
            href="#walkthrough"
            size="lg"
            variant="ghost"
            leftIcon={<Play size={14} strokeWidth={1.6} />}
            className="!text-ink-on-inverse hover:!bg-white/[0.08] border border-white/15"
          >
            Watch a 60-second walkthrough
          </LinkButton>
        </motion.div>

        {/* tiny mono caption */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 0.6, ease }}
          className="mt-12 font-mono text-[10.5px] tracking-[0.18em] uppercase text-ink-on-inverse-muted"
        >
          git commit · Cornell Claude Builders Hackathon · 2026
        </motion.div>
      </div>

      {/* Bottom-anchored editorial footnote */}
      <div className="absolute inset-x-0 bottom-0" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-6 md:px-10 py-3 font-mono text-[10.5px] tracking-[0.18em] uppercase text-ink-on-inverse-muted">
          <span>↓ Scroll · Operations brief</span>
          <span>v0.4 · pre-release</span>
        </div>
      </div>
    </section>
  );
}
