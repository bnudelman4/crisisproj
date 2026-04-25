"use client";

import { SectionLabel } from "@/components/primitives/SectionLabel";
import { Reveal, RevealStack, RevealItem } from "@/components/motion/Reveal";
import { Check } from "lucide-react";

const tenets = [
  "CrisisMesh supports human coordination. It does not replace emergency medical services or official emergency response.",
  "CrisisMesh does not encourage strangers to meet blindly. Every match runs through a Meetup Safety Check before any messaging.",
  "Public handoff locations are recommended by default. Exact addresses, contact info, and sensitive details are hidden until a coordinator approves a Safer Handoff Plan.",
  "Ride requests, medical handoffs, and one-on-one meetups require additional precautions — buddy or coordinator contact, public pickup, trip sharing.",
  "Vulnerable-person flags trigger a remote check first. No in-person match is shown until phone or coordinator contact is attempted.",
  "Identity verification in this demo is simulated and labelled as such. CrisisMesh does not pretend real verification exists.",
];

export default function SafetyEthics() {
  return (
    <section
      id="safety"
      aria-labelledby="safety-headline"
      className="relative w-full border-b border-hairline"
    >
      <div className="mx-auto max-w-3xl px-6 md:px-10 py-28 md:py-36">
        <Reveal>
          <SectionLabel>Safety Posture</SectionLabel>
        </Reveal>
        <Reveal delay={0.05}>
          <h2
            id="safety-headline"
            className="mt-5 font-display tracking-display text-ink"
            style={{
              fontWeight: 500,
              fontSize: "clamp(34px, 4.4vw, 56px)",
              letterSpacing: "-0.025em",
              lineHeight: 0.98,
            }}
          >
            We do not replace 911.
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mt-6 text-[15.5px] leading-[1.65] text-ink-secondary">
            CrisisMesh is built for the routing problem. Emergency response is
            its own discipline with its own institutions. Below is what we
            commit to before a single coordinator opens the room.
          </p>
        </Reveal>

        <RevealStack className="mt-12 divide-y divide-[color:var(--border-hairline)] border-y border-hairline" stagger={0.05}>
          {tenets.map((tenet, i) => (
            <RevealItem
              key={i}
              className="flex items-start gap-5 py-5"
            >
              <div className="flex items-center gap-3 shrink-0 pt-0.5">
                <span className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-ink-tertiary tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  aria-hidden
                  className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-hairline"
                >
                  <Check size={11} strokeWidth={1.8} className="text-ink" />
                </span>
              </div>
              <p className="text-[15px] leading-[1.6] text-ink">{tenet}</p>
            </RevealItem>
          ))}
        </RevealStack>

        <Reveal delay={0.15}>
          <div className="mt-10 font-mono text-[10.5px] tracking-[0.18em] uppercase text-ink-tertiary">
            Reviewed by · campus emergency operations advisors · 2026
          </div>
        </Reveal>
      </div>
    </section>
  );
}
