"use client";

import { ProductApp } from "@/components/app/ProductApp";
import { Reveal } from "@/components/motion/Reveal";
import { LinkButton } from "@/components/primitives/Button";
import { useAuth } from "@/components/auth/AuthContext";
import { ArrowLeft } from "lucide-react";

export default function AppRoute() {
  const { user } = useAuth();
  const isCoordinator = user?.role === "coordinator";
  const firstName = user?.name?.split(" ")[0] ?? "neighbor";

  const eyebrow = isCoordinator
    ? "The Command Center · simulation"
    : "Your bridge · neighborhood feed";
  const title = isCoordinator
    ? "Coordinator-grade feed, map, and meetup safety."
    : `Hey ${firstName} — what's happening near you.`;
  const caption = isCoordinator
    ? "Run the Sam ↔ Leo demo from Alerts, or open Nora's blocked ride request from the Map. Every match runs through a Meetup Safety Check before any messaging."
    : "See needs and offers in your area, post your own, and offer help when you can. Bridge keeps personal addresses hidden until you and the requester both confirm a safer handoff plan.";

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
              {eyebrow}
            </span>
            <h1
              className="mt-1 font-display text-[26px] md:text-[34px] leading-[1.05] text-ink-on-inverse"
              style={{ fontWeight: 500, letterSpacing: "-0.025em" }}
            >
              {title}
            </h1>
            <p className="mt-2 text-[13.5px] text-ink-on-inverse-muted max-w-[60ch]">
              {caption}
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
          Bridge supports human coordination. It does not replace 911,
          emergency medical services, or official emergency response.
        </p>
      </div>
    </main>
  );
}
