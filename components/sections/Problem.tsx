"use client";

import { SectionLabel } from "@/components/primitives/SectionLabel";
import { MessageCard } from "@/components/primitives/MessageCard";
import { Reveal, RevealStack, RevealItem } from "@/components/motion/Reveal";
import { sampleMessages } from "@/lib/sample-messages";

export default function Problem() {
  return (
    <section
      id="problem"
      aria-labelledby="problem-headline"
      className="relative w-full border-b border-hairline"
    >
      <div className="mx-auto max-w-[1280px] px-6 md:px-10 py-28 md:py-36 grid md:grid-cols-2 gap-12 md:gap-20 items-start">
        <div className="md:sticky md:top-24">
          <Reveal>
            <SectionLabel>The Problem</SectionLabel>
          </Reveal>
          <Reveal delay={0.05}>
            <h2
              id="problem-headline"
              className="mt-5 font-display tracking-display text-ink"
              style={{
                fontWeight: 500,
                fontSize: "clamp(34px, 4.4vw, 56px)",
                letterSpacing: "-0.025em",
                lineHeight: 0.98,
                maxWidth: "16ch",
              }}
            >
              When the help arrives, it arrives as noise.
            </h2>
          </Reveal>
          <div className="mt-7 space-y-5 text-[15.5px] leading-[1.65] text-ink-secondary max-w-[44ch]">
            <Reveal delay={0.1}>
              <p>
                A real crisis on a college campus generates messages across
                SMS, GroupMe channels, Discord servers, intake forms, and
                direct phone calls.
              </p>
            </Reveal>
            <Reveal delay={0.16}>
              <p>
                A coordinator has minutes to figure out who needs help, who
                can offer it, what is urgent, what is risky, and what
                requires a real emergency response.
              </p>
            </Reveal>
            <Reveal delay={0.22}>
              <p>
                Most of that work happens in spreadsheets and group chats.
                Bridge replaces that with structured coordination data.
              </p>
            </Reveal>
          </div>

          <Reveal delay={0.3}>
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[10.5px] tracking-[0.18em] uppercase text-ink-tertiary">
              <span>5 sources</span>
              <span>·</span>
              <span>12 message types</span>
              <span>·</span>
              <span>1 coordinator</span>
            </div>
          </Reveal>
        </div>

        <RevealStack className="space-y-3" stagger={0.07}>
          {sampleMessages.slice(0, 4).map((m, i) => (
            <RevealItem key={i}>
              <MessageCard
                message={m}
                highlight={
                  m.source === "SMS"
                    ? "critical"
                    : m.source === "FORM"
                    ? "warning"
                    : null
                }
              />
            </RevealItem>
          ))}
        </RevealStack>
      </div>
    </section>
  );
}
