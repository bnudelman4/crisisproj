import { ProductApp } from "@/components/app/ProductApp";
import { Reveal } from "@/components/motion/Reveal";
import { LinkButton } from "@/components/primitives/Button";
import { ArrowLeft } from "lucide-react";

export default function AppRoute() {
  return (
    <main
      className="relative min-h-[100svh] w-full"
      style={{
        background:
          "radial-gradient(60% 40% at 50% 0%, rgba(91,141,239,0.08) 0%, var(--bg-inverse) 60%)",
        color: "var(--text-on-inverse)",
      }}
    >
      <div className="relative mx-auto max-w-[1280px] px-4 md:px-8 pt-28 pb-16">
        <header className="flex items-center justify-between gap-4 mb-6">
          <div className="min-w-0">
            <span className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-ink-on-inverse-muted">
              The Command Center · simulation
            </span>
            <h1
              className="mt-1 font-display text-[26px] md:text-[34px] leading-[1.05] text-ink-on-inverse"
              style={{ fontWeight: 500, letterSpacing: "-0.025em" }}
            >
              Coordinator-grade feed, map, and meetup safety.
            </h1>
            <p className="mt-2 text-[13.5px] text-ink-on-inverse-muted max-w-[60ch]">
              Run the Sam ↔ Leo demo from Alerts, or open Nora's blocked ride
              request from the Map. Every match runs through a Meetup Safety
              Check before any messaging.
            </p>
          </div>
          <Reveal>
            <LinkButton
              href="/"
              variant="inverse"
              size="md"
              leftIcon={<ArrowLeft size={13} strokeWidth={1.6} />}
            >
              Back to landing
            </LinkButton>
          </Reveal>
        </header>

        <ProductApp initialTab="feed" />

        <p className="mt-6 font-mono text-[10.5px] tracking-[0.18em] uppercase text-ink-on-inverse-muted text-center">
          CrisisMesh supports human coordination. It does not replace 911,
          emergency medical services, or official emergency response.
        </p>
      </div>
    </main>
  );
}
