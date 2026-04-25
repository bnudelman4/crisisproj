"use client";

import { Reveal } from "@/components/motion/Reveal";

export default function Testimonials() {
  return (
    <section
      aria-label="Testimonial"
      className="relative w-full border-b border-hairline bg-muted/40"
    >
      <div className="mx-auto max-w-3xl px-6 md:px-10 py-28 md:py-36 text-center">
        <Reveal>
          <span className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-ink-tertiary">
            Field Reflection
          </span>
        </Reveal>
        {/*
          Illustrative attribution. Do not invent real names. This quote is
          presented as a hypothetical voice that mirrors what coordinators
          have said in conversations with the team.
        */}
        <Reveal delay={0.05}>
          <blockquote
            className="mt-6 font-display text-ink-secondary"
            style={{
              fontWeight: 500,
              fontSize: "clamp(22px, 2.6vw, 30px)",
              lineHeight: 1.3,
              letterSpacing: "-0.012em",
            }}
          >
            <span aria-hidden className="font-display text-ink-tertiary mr-1">
              “
            </span>
            The hardest part of a campus crisis is not the response. It is the
            routing. CrisisMesh is the first software that treats the routing
            as the actual problem.
            <span aria-hidden className="font-display text-ink-tertiary ml-1">
              ”
            </span>
          </blockquote>
        </Reveal>
        <Reveal delay={0.12}>
          <div className="mt-8 flex items-center justify-center gap-3 font-mono text-[10.5px] tracking-[0.18em] uppercase text-ink-tertiary">
            <span aria-hidden className="h-px w-8 bg-hairline" style={{ background: "var(--border-hairline)" }} />
            <span>Hypothetical · Cornell residence life coordinator</span>
            <span aria-hidden className="h-px w-8 bg-hairline" style={{ background: "var(--border-hairline)" }} />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
