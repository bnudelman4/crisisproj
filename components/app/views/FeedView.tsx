"use client";

import { useState } from "react";
import { useApp } from "../AppContext";
import { PostCard } from "@/components/primitives/PostCard";
import { cn } from "@/lib/cn";

const filters = [
  { id: "all", label: "All" },
  { id: "need", label: "Needs" },
  { id: "offer", label: "Offers" },
  { id: "match", label: "Matches" },
  { id: "broadcast", label: "Broadcasts" },
  { id: "completed", label: "Completed" },
] as const;

export default function FeedView({
  onOpenMatch,
}: {
  onOpenMatch: (matchId: string) => void;
}) {
  const { feed } = useApp();
  const [active, setActive] = useState<typeof filters[number]["id"]>("all");
  const filtered = active === "all" ? feed : feed.filter((f) => f.kind === active);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px]">
      <div className="p-4 lg:p-5">
        {/* Filter bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-3 border-b border-on-inverse scrollbar-none">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setActive(f.id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 h-8 font-sans text-[12.5px] font-medium transition-colors whitespace-nowrap border",
                active === f.id
                  ? "bg-elevated text-ink border-elevated"
                  : "border-on-inverse text-ink-on-inverse-muted hover:text-ink-on-inverse hover:bg-white/[0.04]"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filtered.map((item) => (
            <PostCard
              key={item.id}
              item={item}
              inverse
              onOpenMatch={onOpenMatch}
            />
          ))}
        </div>
      </div>

      <aside className="hidden lg:block border-l border-on-inverse p-4 bg-[color:var(--bg-inverse)]">
        <div className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-ink-on-inverse-muted">
          Feed legend
        </div>
        <p className="mt-2 text-[12.5px] leading-[1.55] text-ink-on-inverse-muted">
          Bridge does not encourage strangers to meet blindly. Matches include
          a meetup safety check, privacy protection, public-handoff suggestions,
          and human approval before sensitive details are shared.
        </p>
        <ul className="mt-4 space-y-1.5 text-[11.5px] text-ink-on-inverse-muted">
          <li>· Exact location hidden until approved</li>
          <li>· Public handoff recommended</li>
          <li>· Buddy / contact sharing suggested</li>
          <li>· One-on-one meetup flagged</li>
          <li>· Ride requests require extra confirmation</li>
          <li>· Coordinator approval required</li>
        </ul>
        <div className="mt-6 rounded-xl border border-on-inverse p-3 bg-inverse-elevated">
          <div className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-ink-on-inverse-muted">
            Pinned warming spot
          </div>
          <div className="mt-1 text-[13px] text-ink-on-inverse">
            RPCC main lobby · 24h
          </div>
          <div className="text-[11.5px] text-ink-on-inverse-muted mt-1">
            Open to anyone. Heat, water, charging.
          </div>
        </div>
      </aside>
    </div>
  );
}
