"use client";

import { SectionLabel } from "@/components/primitives/SectionLabel";
import { Badge } from "@/components/primitives/Badge";
import { MessageCard } from "@/components/primitives/MessageCard";
import { Reveal } from "@/components/motion/Reveal";
import { sampleMessages } from "@/lib/sample-messages";
import { findMatch } from "@/lib/safety";
import { cn } from "@/lib/cn";
import { ArrowRight, Inbox, Database, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { MatchCard } from "@/components/primitives/MatchCard";
import { SaferHandoffPlan } from "@/components/primitives/SaferHandoffPlan";

function Beat({
  number,
  title,
  body,
  visual,
  reverse = false,
}: {
  number: string;
  title: string;
  body: string;
  visual: ReactNode;
  reverse?: boolean;
}) {
  return (
    <Reveal>
      <div
        className={cn(
          "grid md:grid-cols-2 gap-10 md:gap-16 items-center py-16 md:py-24 border-t border-hairline",
          reverse && "md:[&>*:first-child]:order-2"
        )}
      >
        <div className="max-w-[44ch]">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-ink-tertiary">
              {number}
            </span>
            <span aria-hidden className="h-px flex-1 bg-hairline" style={{ background: "var(--border-hairline)" }} />
          </div>
          <h3
            className="mt-4 font-display text-ink"
            style={{
              fontWeight: 500,
              fontSize: "clamp(28px, 3.4vw, 44px)",
              letterSpacing: "-0.022em",
              lineHeight: 1.02,
            }}
          >
            {title}
          </h3>
          <p className="mt-4 text-[15.5px] leading-[1.65] text-ink-secondary">
            {body}
          </p>
        </div>
        <div className="relative">{visual}</div>
      </div>
    </Reveal>
  );
}

function NeedResourceMock() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="rounded-2xl bg-elevated border border-hairline p-4">
        <div className="flex items-center justify-between">
          <Badge variant="outline" dot>
            Need
          </Badge>
          <Badge variant="critical" dot>
            Critical
          </Badge>
        </div>
        <p className="mt-3 text-[13.5px] leading-[1.5] text-ink">
          Insulin · refrigerated · Mews Hall 312
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-[10.5px] tracking-[0.14em] uppercase font-mono text-ink-tertiary">
          <span>Sam K.</span>
          <span className="text-right">North Campus</span>
        </div>
      </div>
      <div className="rounded-2xl bg-elevated border border-hairline p-4">
        <div className="flex items-center justify-between">
          <Badge variant="outline" dot>
            Resource
          </Badge>
          <Badge variant="success" dot>
            Available
          </Badge>
        </div>
        <p className="mt-3 text-[13.5px] leading-[1.5] text-ink">
          Vehicle · 2–5pm · supply runs and rides
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-[10.5px] tracking-[0.14em] uppercase font-mono text-ink-tertiary">
          <span>Leo M.</span>
          <span className="text-right">Collegetown</span>
        </div>
      </div>
      <div className="rounded-2xl bg-elevated border border-hairline p-4">
        <div className="flex items-center justify-between">
          <Badge variant="outline" dot>
            Need
          </Badge>
          <Badge variant="warning" dot>
            Welfare check
          </Badge>
        </div>
        <p className="mt-3 text-[13.5px] leading-[1.5] text-ink">
          Welfare check · elderly · Belle Sherman
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-[10.5px] tracking-[0.14em] uppercase font-mono text-ink-tertiary">
          <span>Anonymous</span>
          <span className="text-right">East side</span>
        </div>
      </div>
      <div className="rounded-2xl bg-elevated border border-hairline p-4">
        <div className="flex items-center justify-between">
          <Badge variant="outline" dot>
            Resource
          </Badge>
          <Badge variant="success" dot>
            Available
          </Badge>
        </div>
        <p className="mt-3 text-[13.5px] leading-[1.5] text-ink">
          Bottled water · granola bars · drop anywhere N. Campus
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-[10.5px] tracking-[0.14em] uppercase font-mono text-ink-tertiary">
          <span>Priya R.</span>
          <span className="text-right">Discord</span>
        </div>
      </div>
    </div>
  );
}

export default function HowItWorks() {
  return (
    <section
      id="how"
      aria-labelledby="how-headline"
      className="relative w-full border-b border-hairline"
    >
      <div className="mx-auto max-w-[1280px] px-6 md:px-10 pt-24 pb-8">
        <Reveal>
          <SectionLabel>How it works</SectionLabel>
        </Reveal>
        <Reveal delay={0.05}>
          <h2
            id="how-headline"
            className="mt-5 max-w-[20ch] font-display tracking-display text-ink"
            style={{
              fontWeight: 500,
              fontSize: "clamp(34px, 4.4vw, 56px)",
              letterSpacing: "-0.025em",
              lineHeight: 0.98,
            }}
          >
            Three steps, one Meetup Safety Check.
          </h2>
        </Reveal>

        <div className="mt-6 flex items-center gap-2 text-ink-tertiary">
          <span className="font-mono text-[10.5px] tracking-[0.18em] uppercase">
            Listen
          </span>
          <ArrowRight size={12} strokeWidth={1.6} />
          <span className="font-mono text-[10.5px] tracking-[0.18em] uppercase">
            Extract
          </span>
          <ArrowRight size={12} strokeWidth={1.6} />
          <span className="font-mono text-[10.5px] tracking-[0.18em] uppercase">
            Safety check
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-[1280px] px-6 md:px-10">
        <Beat
          number="01 · Listen"
          title="Listen to every channel."
          body="Coordinators connect SMS short codes, GroupMe channels, Discord servers, intake QR forms, and manual entries. Every inbound message lands in a single live feed with provenance preserved — sender, source, raw text, timestamp."
          visual={
            <div className="space-y-3">
              {sampleMessages.slice(0, 3).map((m, i) => (
                <MessageCard key={i} message={m} />
              ))}
              <div className="flex items-center gap-2 px-1 pt-1">
                <Inbox size={13} strokeWidth={1.6} className="text-ink-tertiary" />
                <span className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-ink-tertiary">
                  Live intake · 5 sources connected
                </span>
              </div>
            </div>
          }
        />

        <Beat
          number="02 · Extract"
          title="Extract structure from chaos."
          body="Each message is parsed into typed records — needs, resources, locations, urgency cues, vulnerable-person flags. Every field links back to the source. The model proposes, the schema constrains, the coordinator can override."
          reverse
          visual={
            <div className="space-y-3">
              <NeedResourceMock />
              <div className="flex items-center gap-2 px-1 pt-1">
                <Database size={13} strokeWidth={1.6} className="text-ink-tertiary" />
                <span className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-ink-tertiary">
                  Schema · 14 fields · 0 hallucinations allowed
                </span>
              </div>
            </div>
          }
        />

        <Beat
          number="03 · Meetup safety"
          title="Run a Meetup Safety Check, then approve a Safer Handoff Plan."
          body="Before any messaging, every match runs through a Meetup Safety Check. CrisisMesh flags one-on-one meetups, private addresses, medical handoffs, ride requests, vulnerable requesters, nighttime risk, and isolated locations. Coordinators approve a public, privacy-protected Safer Handoff Plan before exact details are shared."
          visual={
            <div className="space-y-3">
              {findMatch("match-sam-leo") && (
                <MatchCard
                  match={findMatch("match-sam-leo")!}
                />
              )}
              {findMatch("match-sam-leo") && (
                <SaferHandoffPlan match={findMatch("match-sam-leo")!} />
              )}
              <div className="flex items-center gap-2 px-1 pt-1">
                <ShieldCheck size={13} strokeWidth={1.6} className="text-ink-tertiary" />
                <span className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-ink-tertiary">
                  Sensitive details hidden until the safety plan is approved
                </span>
              </div>
            </div>
          }
        />
      </div>
    </section>
  );
}
