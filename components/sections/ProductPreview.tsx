"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { SectionLabel } from "@/components/primitives/SectionLabel";
import { Reveal } from "@/components/motion/Reveal";
import { LinkButton } from "@/components/primitives/Button";
import { ProductApp } from "@/components/app/ProductApp";
import { ArrowUpRight } from "lucide-react";

export default function ProductPreview() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "center center"],
  });
  const rotateX = useTransform(scrollYProgress, [0, 1], [6, 0]);
  const yLift = useTransform(scrollYProgress, [0, 1], [40, 0]);

  return (
    <section
      id="command"
      ref={ref}
      data-nav-theme="dark"
      aria-labelledby="command-headline"
      className="relative w-full"
      style={{
        background: "var(--bg-inverse)",
        color: "var(--text-on-inverse)",
      }}
    >
      <div className="absolute inset-0 grain pointer-events-none" />

      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(60% 40% at 50% 0%, rgba(91,141,239,0.12) 0%, rgba(0,0,0,0) 60%)",
        }}
      />

      <div className="relative mx-auto max-w-[1280px] px-6 md:px-10 py-32 md:py-40">
        <div className="flex flex-col items-start gap-5 max-w-[60ch]">
          <Reveal>
            <SectionLabel inverse>The Command Center</SectionLabel>
          </Reveal>
          <Reveal delay={0.05}>
            <h2
              id="command-headline"
              className="font-display tracking-display"
              style={{
                color: "var(--text-on-inverse)",
                fontWeight: 500,
                fontSize: "clamp(34px, 4.6vw, 60px)",
                letterSpacing: "-0.025em",
                lineHeight: 0.98,
              }}
            >
              A safer feed for community crisis response.
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-[15.5px] leading-[1.65] text-ink-on-inverse-muted">
              CrisisMesh is built around a Meetup Safety Check, not a
              messaging-first feed. Every match is reviewed against a
              transparent set of safety flags — medical handoff, ride request,
              vulnerable requester, private address, nighttime — and a coordinator
              approves a Safer Handoff Plan before sensitive details are shared.
            </p>
          </Reveal>
        </div>

        <motion.div
          style={{
            rotateX,
            y: yLift,
            transformPerspective: 1200,
            transformStyle: "preserve-3d",
            transformOrigin: "50% 0%",
          }}
          className="mt-14 md:mt-20"
        >
          <ProductApp initialTab="feed" />
        </motion.div>

        <div className="mt-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <p className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-ink-on-inverse-muted max-w-[60ch]">
            Demo · sample data. CrisisMesh does not encourage strangers to meet
            blindly. Sam → Leo runs through a meetup safety check; Nora's ride
            request is blocked until details are confirmed.
          </p>
          <LinkButton
            href="/app"
            variant="inverse"
            size="md"
            rightIcon={<ArrowUpRight size={13} strokeWidth={1.6} />}
          >
            Open the full simulation
          </LinkButton>
        </div>
      </div>
    </section>
  );
}
