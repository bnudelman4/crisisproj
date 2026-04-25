"use client";

import { SectionLabel } from "@/components/primitives/SectionLabel";
import { Badge } from "@/components/primitives/Badge";
import { Reveal, RevealStack, RevealItem } from "@/components/motion/Reveal";
import { cn } from "@/lib/cn";
import {
  Inbox,
  Database,
  Activity,
  Workflow,
  Shield,
  UserCheck,
} from "lucide-react";
import type { ReactNode } from "react";

function Tile({
  title,
  body,
  icon,
  visual,
  className,
  meta,
}: {
  title: string;
  body: string;
  icon: ReactNode;
  visual: ReactNode;
  className?: string;
  meta?: string;
}) {
  return (
    <RevealItem
      className={cn(
        "rounded-2xl bg-elevated border border-hairline p-6 md:p-7 flex flex-col gap-4",
        className
      )}
    >
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-muted text-ink">
            {icon}
          </span>
          <h3 className="font-display text-[19px] leading-[1.05] text-ink" style={{ letterSpacing: "-0.02em" }}>
            {title}
          </h3>
        </div>
        {meta && (
          <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink-tertiary">
            {meta}
          </span>
        )}
      </header>
      <p className="text-[14px] leading-[1.6] text-ink-secondary max-w-[44ch]">
        {body}
      </p>
      <div className="pt-1">{visual}</div>
    </RevealItem>
  );
}

function ConnectorList() {
  const items = ["SMS", "GroupMe", "Discord", "QR form", "Manual"];
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((i) => (
        <Badge key={i} variant="source">
          {i}
        </Badge>
      ))}
    </div>
  );
}

function SchemaGrid() {
  const fields = [
    { k: "need.type", v: "medical" },
    { k: "need.urgency", v: "critical" },
    { k: "person.id", v: "p_4f21" },
    { k: "location", v: "Mews 312" },
    { k: "source.id", v: "sms_…0142" },
    { k: "vulnerable", v: "true" },
  ];
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
      {fields.map((f) => (
        <div key={f.k} className="flex items-baseline justify-between gap-2 border-b border-hairline pb-1">
          <span className="font-mono text-[10.5px] tracking-[0.06em] text-ink-tertiary">
            {f.k}
          </span>
          <span className="font-mono text-[11px] text-ink truncate">{f.v}</span>
        </div>
      ))}
    </div>
  );
}

function UrgencyBars() {
  const rows = [
    { label: "Critical", value: 0.92, color: "var(--signal-critical)" },
    { label: "High", value: 0.74, color: "#F59E0B" },
    { label: "Standard", value: 0.42, color: "var(--text-primary)" },
    { label: "Resolved", value: 0.18, color: "var(--text-tertiary)" },
  ];
  return (
    <ul className="space-y-2">
      {rows.map((r) => (
        <li key={r.label} className="grid grid-cols-[80px_1fr_36px] items-center gap-3">
          <span className="font-mono text-[10.5px] tracking-[0.14em] uppercase text-ink-tertiary">
            {r.label}
          </span>
          <span className="h-1 rounded-full bg-muted overflow-hidden">
            <span
              className="block h-full"
              style={{ width: `${r.value * 100}%`, background: r.color }}
            />
          </span>
          <span className="text-right font-mono text-[10.5px] text-ink-tertiary">
            {Math.round(r.value * 100)}
          </span>
        </li>
      ))}
    </ul>
  );
}

function ScoreFormula() {
  return (
    <div className="font-mono text-[11.5px] leading-[1.6] text-ink-secondary bg-muted/70 rounded-md p-3">
      <span className="text-ink-tertiary">// composite</span>
      <br />
      <span className="text-ink">match.score</span> ={" "}
      <span className="text-[var(--accent-emphasis)]">0.40</span>·urgency
      <br />
      &nbsp;&nbsp;+ <span className="text-[var(--accent-emphasis)]">0.25</span>
      ·proximity
      <br />
      &nbsp;&nbsp;+ <span className="text-[var(--accent-emphasis)]">0.20</span>
      ·capability
      <br />
      &nbsp;&nbsp;+ <span className="text-[var(--accent-emphasis)]">0.15</span>
      ·reliability
    </div>
  );
}

function SafetyChecks() {
  const flags = [
    { label: "One-on-one meetup", state: "review" },
    { label: "Private address involved", state: "review" },
    { label: "Medical item handoff", state: "review" },
    { label: "Ride request", state: "block" },
    { label: "Vulnerable requester", state: "review" },
    { label: "Self-harm signal", state: "block" },
  ];
  return (
    <ul className="space-y-1.5">
      {flags.map((f) => (
        <li
          key={f.label}
          className="flex items-center justify-between gap-3 py-1.5 border-b border-hairline last:border-0"
        >
          <span className="text-[12.5px] text-ink">{f.label}</span>
          <Badge
            variant={
              f.state === "block"
                ? "critical"
                : f.state === "review"
                ? "warning"
                : "success"
            }
            dot
          >
            {f.state === "block" ? "Block" : f.state === "review" ? "Review" : "OK"}
          </Badge>
        </li>
      ))}
    </ul>
  );
}

function ApprovalGate() {
  return (
    <div className="flex items-center justify-between rounded-xl bg-muted px-3 py-2.5">
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--signal-success)" }} />
        <span className="font-mono text-[10.5px] tracking-[0.14em] uppercase text-ink-secondary">
          Coordinator · M. Rivas
        </span>
      </div>
      <span className="font-mono text-[10.5px] tracking-[0.14em] uppercase text-ink-tertiary">
        Approved 14:02:41
      </span>
    </div>
  );
}

export default function Features() {
  return (
    <section
      id="features"
      aria-labelledby="features-headline"
      className="relative w-full border-b border-hairline bg-canvas"
    >
      <div className="mx-auto max-w-[1280px] px-6 md:px-10 py-28 md:py-36">
        <div className="grid md:grid-cols-12 gap-8 mb-12">
          <div className="md:col-span-7">
            <Reveal>
              <SectionLabel>What you get</SectionLabel>
            </Reveal>
            <Reveal delay={0.05}>
              <h2
                id="features-headline"
                className="mt-5 font-display tracking-display text-ink"
                style={{
                  fontWeight: 500,
                  fontSize: "clamp(34px, 4.4vw, 56px)",
                  letterSpacing: "-0.025em",
                  lineHeight: 0.98,
                  maxWidth: "20ch",
                }}
              >
                Operations primitives for community crisis response.
              </h2>
            </Reveal>
          </div>
          <div className="md:col-span-5 md:pt-12">
            <Reveal delay={0.1}>
              <p className="text-[15.5px] leading-[1.65] text-ink-secondary max-w-[44ch]">
                Six primitives that form the spine of an emergency operations
                center: ingest, structure, prioritize, match, review, approve.
              </p>
            </Reveal>
          </div>
        </div>

        <RevealStack className="grid grid-cols-1 md:grid-cols-6 gap-4 items-start" stagger={0.06}>
          <Tile
            className="md:col-span-3"
            icon={<Inbox size={14} strokeWidth={1.5} />}
            title="Multi-source intake"
            body="SMS, GroupMe, Discord, QR forms, manual entry. Every channel is normalized into a single message stream with provenance preserved end to end."
            meta="01"
            visual={<ConnectorList />}
          />
          <Tile
            className="md:col-span-3"
            icon={<Database size={14} strokeWidth={1.5} />}
            title="Structured extraction"
            body="Free text becomes typed records — needs, resources, locations, identifiers — under a constrained schema. The model proposes; the schema rejects what does not fit."
            meta="02"
            visual={<SchemaGrid />}
          />
          <Tile
            className="md:col-span-2"
            icon={<Activity size={14} strokeWidth={1.5} />}
            title="Urgency classification"
            body="Critical cases surface first, automatically. Coordinators see priority before they see volume."
            meta="03"
            visual={<UrgencyBars />}
          />
          <Tile
            className="md:col-span-2"
            icon={<Workflow size={14} strokeWidth={1.5} />}
            title="Deterministic matching"
            body="Transparent scoring. Every dispatch ships with the weights that produced it. Never a black box."
            meta="04"
            visual={<ScoreFormula />}
          />
          <Tile
            className="md:col-span-2"
            icon={<Shield size={14} strokeWidth={1.5} />}
            title="Meetup safety check"
            body="Ten flag types — one-on-one, ride request, medical handoff, vulnerable requester, nighttime, isolated location, more. Risks are computed before a match is shown."
            meta="05"
            visual={<SafetyChecks />}
          />
          <Tile
            className="md:col-span-6"
            icon={<UserCheck size={14} strokeWidth={1.5} />}
            title="Safer handoff plan + human approval"
            body="Coordinators approve a privacy-protected meetup plan before any messaging. Public locations recommended. Exact addresses hidden until the plan is approved. Bridge does not encourage strangers to meet blindly."
            meta="06 · The gate"
            visual={
              <div className="grid sm:grid-cols-2 gap-3">
                <ApprovalGate />
                <ApprovalGate />
              </div>
            }
          />
        </RevealStack>
      </div>
    </section>
  );
}
