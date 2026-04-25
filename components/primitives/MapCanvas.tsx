"use client";

import { cn } from "@/lib/cn";
import { mapPins, MapPin, FeedItem } from "@/lib/feed";
import { Lock, ShieldCheck } from "lucide-react";
import { useState } from "react";

const urgencyColor: Record<NonNullable<MapPin["urgency"]>, string> = {
  critical: "var(--signal-critical)",
  high: "#F59E0B",
  standard: "#9CA3AF",
};

const kindColor: Record<MapPin["kind"], string> = {
  need: "var(--signal-critical)",
  offer: "var(--signal-success)",
  match: "var(--accent-emphasis)",
  broadcast: "#9CA3AF",
  completed: "#6B7280",
  alert: "#F59E0B",
};

export function MapCanvas({
  feed,
  inverse = false,
  selectedPinId,
  onSelectPin,
  approvedMatchIds = [],
  blockedMatchIds = [],
  className,
  showLines = true,
  height = 460,
}: {
  feed: FeedItem[];
  inverse?: boolean;
  selectedPinId?: string;
  onSelectPin?: (id: string) => void;
  approvedMatchIds?: string[];
  blockedMatchIds?: string[];
  className?: string;
  showLines?: boolean;
  height?: number;
}) {
  const [hover, setHover] = useState<string | null>(null);
  const stroke = inverse ? "rgba(255,255,255,0.06)" : "var(--border-hairline)";
  const labelColor = inverse ? "rgba(243,244,246,0.6)" : "var(--text-tertiary)";

  // Match suggestion lines: between Sam(p-1) ↔ Leo(p-6), Nora(p-2) ↔ Marcus (use p-2 -> p-3 stand-in)
  const lines: Array<{ from: string; to: string; matchId: string }> = [
    { from: "p-1", to: "p-6", matchId: "match-sam-leo" },
    { from: "p-2", to: "p-6", matchId: "match-nora-ride" },
    { from: "p-3", to: "p-7", matchId: "match-priya-water" },
    { from: "p-5", to: "p-7", matchId: "match-belle-welfare" },
  ];

  const findById = (id: string) => mapPins.find((p) => p.id === id);

  return (
    <div
      className={cn(
        "relative rounded-2xl overflow-hidden",
        inverse ? "bg-[#070B14] border border-on-inverse" : "bg-canvas border border-hairline",
        className
      )}
      style={{ minHeight: height }}
    >
      <svg
        viewBox="0 0 1000 620"
        preserveAspectRatio="xMidYMid slice"
        width="100%"
        height={height}
        style={{ display: "block" }}
      >
        <defs>
          <pattern id="mapGrid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke={stroke} strokeWidth="0.5" />
          </pattern>
          <radialGradient id="mapVignette" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor={inverse ? "rgba(91,141,239,0.08)" : "rgba(91,141,239,0.04)"} />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>
        <rect width="1000" height="620" fill="url(#mapGrid)" />
        <rect width="1000" height="620" fill="url(#mapVignette)" />

        {/* Stylized contour lines (rivers + zones) */}
        <g opacity={inverse ? 0.45 : 0.35}>
          <path
            d="M0 320 C 200 280, 380 360, 520 300 S 820 260, 1000 320"
            fill="none"
            stroke={stroke}
            strokeWidth="1.2"
            strokeDasharray="3 4"
          />
          <path
            d="M0 220 C 180 200, 320 240, 460 210 S 800 200, 1000 220"
            fill="none"
            stroke={stroke}
            strokeWidth="0.9"
            strokeDasharray="2 4"
          />
          <path
            d="M0 460 C 200 440, 360 480, 520 440 S 820 420, 1000 460"
            fill="none"
            stroke={stroke}
            strokeWidth="0.9"
            strokeDasharray="2 4"
          />
        </g>

        {/* Zone labels — labels are pre-uppercased; SVG text doesn't support textTransform */}
        <g
          fontFamily="var(--font-jetbrains), ui-monospace, monospace"
          fontSize="11"
          letterSpacing="2.4"
          fill={labelColor}
        >
          <text x="280" y="120">NORTH CAMPUS</text>
          <text x="430" y="320">CENTRAL CAMPUS</text>
          <text x="540" y="540">COLLEGETOWN</text>
          <text x="730" y="340">BELLE SHERMAN</text>
          <text x="80" y="520">FALL CREEK</text>
        </g>

        {/* Match suggestion lines */}
        {showLines &&
          lines.map(({ from, to, matchId }) => {
            const a = findById(from);
            const b = findById(to);
            if (!a || !b) return null;
            const blocked = blockedMatchIds.includes(matchId);
            const approved = approvedMatchIds.includes(matchId);
            const color = blocked
              ? "var(--signal-critical)"
              : approved
              ? "var(--accent-emphasis)"
              : "var(--accent-emphasis)";
            return (
              <g key={`${from}-${to}`}>
                <line
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={color}
                  strokeWidth={approved ? 2.5 : 1.5}
                  strokeDasharray={blocked ? "6 4" : approved ? "0" : "4 4"}
                  opacity={blocked ? 0.85 : approved ? 0.95 : 0.55}
                />
                {/* midpoint shield/lock if active */}
                {(approved || blocked) && (
                  <g
                    transform={`translate(${(a.x + b.x) / 2 - 9}, ${(a.y + b.y) / 2 - 9})`}
                  >
                    <circle
                      cx="9"
                      cy="9"
                      r="9"
                      fill={blocked ? "var(--signal-critical)" : "var(--accent-emphasis)"}
                    />
                    <text
                      x="9"
                      y="11"
                      textAnchor="middle"
                      fontSize="10"
                      fill="white"
                      fontFamily="var(--font-jetbrains), monospace"
                    >
                      {blocked ? "!" : "✓"}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

        {/* Pins */}
        {mapPins.map((p) => {
          const item = feed.find((f) => f.id === p.feedId);
          const active = selectedPinId === p.id || hover === p.id;
          const fill = p.urgency ? urgencyColor[p.urgency] : kindColor[p.kind];
          return (
            <g
              key={p.id}
              transform={`translate(${p.x},${p.y})`}
              style={{ cursor: "pointer" }}
              onMouseEnter={() => setHover(p.id)}
              onMouseLeave={() => setHover(null)}
              onClick={() => onSelectPin?.(p.id)}
            >
              <circle r={active ? 18 : 14} fill={fill} opacity={active ? 0.18 : 0.12} />
              <circle r={active ? 11 : 9} fill={fill} opacity={active ? 0.32 : 0.22} />
              <circle r={5.5} fill={fill} />
              {p.privateAddressHidden && (
                <g transform="translate(8,-12)">
                  <circle r="7.5" fill={inverse ? "#0A0E1A" : "#fff"} stroke={inverse ? "rgba(255,255,255,0.18)" : "var(--border-hairline)"} strokeWidth="1" />
                  {/* mini lock glyph */}
                  <rect x="-3" y="-1" width="6" height="4.5" rx="1" fill="none" stroke={inverse ? "#fff" : "#0A0E1A"} strokeWidth="0.9" />
                  <path d="M -2 -1 V -2.4 A 2 2 0 0 1 2 -2.4 V -1" fill="none" stroke={inverse ? "#fff" : "#0A0E1A"} strokeWidth="0.9" />
                </g>
              )}
              {/* Label on active */}
              {active && item && (
                <g transform={`translate(${p.x > 800 ? -260 : 14}, -10)`}>
                  <rect
                    width="240"
                    height="58"
                    rx="8"
                    fill={inverse ? "rgba(15,21,36,0.97)" : "#fff"}
                    stroke={inverse ? "rgba(255,255,255,0.08)" : "var(--border-hairline)"}
                  />
                  <text
                    x="10"
                    y="20"
                    fontSize="10"
                    letterSpacing="1.6"
                    fill={inverse ? "#9CA3AF" : "#9CA3AF"}
                    fontFamily="var(--font-jetbrains), monospace"
                  >
                    {p.zone.toUpperCase()}
                  </text>
                  <text
                    x="10"
                    y="38"
                    fontSize="12"
                    fill={inverse ? "#F3F4F6" : "#0A0E1A"}
                    fontFamily="var(--font-inter), sans-serif"
                    fontWeight="500"
                  >
                    {item.title.length > 32 ? item.title.slice(0, 30) + "…" : item.title}
                  </text>
                  <text
                    x="10"
                    y="52"
                    fontSize="10"
                    letterSpacing="1.4"
                    fill={inverse ? "#9CA3AF" : "#9CA3AF"}
                    fontFamily="var(--font-jetbrains), monospace"
                  >
                    {item.kind.toUpperCase()} · {item.postedAt}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className={cn("absolute left-3 bottom-3 right-3 flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-[10.5px] tracking-[0.14em] uppercase font-mono", inverse ? "bg-[rgba(15,21,36,0.85)] text-ink-on-inverse-muted border border-on-inverse" : "bg-elevated/90 text-ink-tertiary border border-hairline")} style={{ backdropFilter: "blur(6px)" }}>
        <span className="inline-flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: "var(--signal-critical)" }} />
          Need
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: "var(--signal-success)" }} />
          Offer
        </span>
        <span className="inline-flex items-center gap-2">
          <Lock size={10} strokeWidth={1.6} />
          Address hidden
        </span>
        <span className="inline-flex items-center gap-2">
          <ShieldCheck size={10} strokeWidth={1.6} />
          Approved match
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-px w-4 border-t border-dashed" style={{ borderColor: "var(--signal-critical)" }} />
          Blocked match
        </span>
      </div>
    </div>
  );
}
