"use client";

import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { useRef } from "react";
import { SectionLabel } from "@/components/primitives/SectionLabel";
import { cn } from "@/lib/cn";

type Stage = {
  id: string;
  label: string;
  caption: string;
  meta: string;
  group?: boolean;
};

const stages: Stage[] = [
  {
    id: "intake",
    label: "Intake",
    caption: "SMS · QR · GroupMe · Discord · Manual",
    meta: "5 connectors",
    group: true,
  },
  {
    id: "normalize",
    label: "Normalized posts",
    caption: "Provenance preserved · raw text retained",
    meta: "Schema v3.2",
  },
  {
    id: "extract",
    label: "Structured extraction",
    caption: "Needs, resources, locations, vulnerability flags",
    meta: "14 typed fields",
  },
  {
    id: "match",
    label: "AI match",
    caption: "Capability · proximity · reliability",
    meta: "Deterministic scoring",
  },
  {
    id: "safety",
    label: "Meetup safety check",
    caption: "10 flag types · privacy guard · public-handoff suggestion",
    meta: "Block-on-fail",
  },
  {
    id: "plan",
    label: "Safer handoff plan",
    caption: "Public location · address hidden · buddy / coord contact",
    meta: "Coordinator review",
  },
  {
    id: "approve",
    label: "Approve, then message",
    caption: "AI drafts privacy-safe message · coordinator sends",
    meta: "Required gate",
  },
];

function StageCard({
  stage,
  index,
  progress,
}: {
  stage: Stage;
  index: number;
  progress: MotionValue<number>;
}) {
  const start = index / stages.length;
  const end = (index + 0.6) / stages.length;
  const opacity = useTransform(progress, [Math.max(0, start - 0.05), start, end], [0.25, 1, 1]);
  const y = useTransform(progress, [Math.max(0, start - 0.05), start], [12, 0]);
  const borderOpacity = useTransform(progress, [start, end], [0.3, 1]);
  const accentScale = useTransform(progress, [start, end], [0.7, 1]);

  return (
    <motion.div
      style={{ opacity, y }}
      className="relative shrink-0 w-[220px] md:w-[260px] rounded-xl p-4 border border-on-inverse"
      data-stage
    >
      <span
        aria-hidden
        className="absolute inset-0 rounded-xl pointer-events-none"
        style={{ background: "var(--bg-inverse-elevated)" }}
      />
      <motion.span
        aria-hidden
        className="absolute inset-0 rounded-xl border pointer-events-none"
        style={{ borderColor: "var(--accent-emphasis)", opacity: borderOpacity }}
      />
      <div className="relative">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink-on-inverse-muted">
            {String(index + 1).padStart(2, "0")} · Stage
          </span>
          <motion.span
            aria-hidden
            className="block h-1.5 w-1.5 rounded-full"
            style={{
              backgroundColor: "var(--accent-emphasis)",
              scale: accentScale,
            }}
          />
        </div>
        <h4
          className="mt-3 font-display text-[19px] leading-[1.05] text-ink-on-inverse"
          style={{ letterSpacing: "-0.02em" }}
        >
          {stage.label}
        </h4>
        <p className="mt-2 text-[12.5px] leading-[1.5] text-ink-on-inverse-muted">
          {stage.caption}
        </p>
        <div className="mt-4 pt-3 border-t border-on-inverse font-mono text-[10px] tracking-[0.18em] uppercase text-ink-on-inverse-muted">
          {stage.meta}
        </div>
      </div>
    </motion.div>
  );
}

function Connector({
  index,
  progress,
}: {
  index: number;
  progress: MotionValue<number>;
}) {
  const start = (index + 0.4) / stages.length;
  const end = (index + 1) / stages.length;
  const pathLength = useTransform(progress, [start, end], [0, 1]);
  return (
    <div className="shrink-0 self-center w-12 md:w-20 h-12 flex items-center justify-center">
      <svg
        width="100%"
        height="14"
        viewBox="0 0 80 14"
        fill="none"
        preserveAspectRatio="none"
        aria-hidden
      >
        <line
          x1="0"
          y1="7"
          x2="80"
          y2="7"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="1"
          strokeDasharray="2 3"
        />
        <motion.line
          x1="0"
          y1="7"
          x2="80"
          y2="7"
          stroke="var(--accent-emphasis)"
          strokeWidth="1.5"
          style={{ pathLength }}
        />
        <motion.circle
          cx="74"
          cy="7"
          r="2.4"
          fill="var(--accent-emphasis)"
          style={{ scale: pathLength }}
        />
      </svg>
    </div>
  );
}

export default function Pipeline() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  const progress = useTransform(scrollYProgress, [0.05, 0.95], [0, 1]);
  const railX = useTransform(scrollYProgress, [0.05, 0.95], ["8%", "-58%"]);
  const barWidth = useTransform(progress, [0, 1], ["0%", "100%"]);

  return (
    <section
      id="pipeline"
      ref={ref}
      data-nav-theme="dark"
      aria-labelledby="pipeline-headline"
      className="relative w-full"
      style={{ height: "260vh", background: "var(--bg-inverse)", color: "var(--text-on-inverse)" }}
    >
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden border-y border-on-inverse">
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(60% 40% at 50% 0%, rgba(91,141,239,0.12) 0%, rgba(0,0,0,0) 60%)",
          }}
        />
        <div className="absolute inset-0 grain pointer-events-none" />

        <div className="relative mx-auto max-w-[1280px] px-6 md:px-10 pt-24 md:pt-28">
          <SectionLabel inverse>The Pipeline</SectionLabel>
          <h2
            id="pipeline-headline"
            className="mt-4 max-w-[20ch] font-display tracking-display text-ink-on-inverse"
            style={{
              fontWeight: 500,
              fontSize: "clamp(32px, 4.2vw, 54px)",
              letterSpacing: "-0.025em",
              lineHeight: 0.98,
            }}
          >
            Every message moves through seven stages.
          </h2>
          <p className="mt-3 max-w-[60ch] text-[14.5px] leading-[1.6] text-ink-on-inverse-muted">
            Each stage is auditable. Each transition is traceable to the
            source message. Coordinators approve at the gate, not in the
            stream.
          </p>
        </div>

        {/* progress legend */}
        <div className="absolute top-28 right-6 md:right-10 flex items-center gap-3 z-10">
          <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink-on-inverse-muted">
            Pipeline progress
          </span>
          <div className="relative h-[2px] w-32" style={{ background: "rgba(255,255,255,0.10)" }}>
            <motion.div
              className="absolute inset-y-0 left-0"
              style={{
                width: barWidth,
                background: "var(--accent-emphasis)",
              }}
            />
          </div>
        </div>

        <motion.div
          className="absolute top-1/2 left-0 -translate-y-1/2 flex items-stretch px-6 md:px-10"
          style={{ x: railX }}
        >
          {stages.map((stage, i) => (
            <div key={stage.id} className="flex items-stretch">
              <StageCard stage={stage} index={i} progress={progress} />
              {i < stages.length - 1 && <Connector index={i} progress={progress} />}
            </div>
          ))}
        </motion.div>

        {/* Edge fades */}
        <div
          aria-hidden
          className="absolute inset-y-0 left-0 w-24 md:w-40 pointer-events-none"
          style={{
            background:
              "linear-gradient(90deg, var(--bg-inverse) 20%, rgba(0,0,0,0))",
          }}
        />
        <div
          aria-hidden
          className="absolute inset-y-0 right-0 w-24 md:w-40 pointer-events-none"
          style={{
            background:
              "linear-gradient(270deg, var(--bg-inverse) 20%, rgba(0,0,0,0))",
          }}
        />

        <div className="absolute bottom-0 inset-x-0 border-t border-on-inverse">
          <div className={cn("mx-auto flex max-w-[1280px] items-center justify-between px-6 md:px-10 py-3 font-mono text-[10.5px] tracking-[0.18em] uppercase text-ink-on-inverse-muted")}>
            <span>Audit log · seven stages · zero black boxes</span>
            <span>↻ Continue scrolling</span>
          </div>
        </div>
      </div>
    </section>
  );
}
