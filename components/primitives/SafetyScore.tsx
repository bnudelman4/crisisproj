import { cn } from "@/lib/cn";
import { bandFor } from "@/lib/safety";

const toneColor = {
  ok: "var(--signal-success)",
  warn: "#F59E0B",
  high: "#EF4444",
  block: "#7F1D1D",
};

export function SafetyScoreRing({
  score,
  size = 60,
  inverse = false,
  className,
}: {
  score: number;
  size?: number;
  inverse?: boolean;
  className?: string;
}) {
  const band = bandFor(score);
  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (score / 100) * c;
  return (
    <div className={cn("inline-flex items-center gap-3", className)}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={inverse ? "rgba(255,255,255,0.08)" : "var(--border-hairline)"}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={toneColor[band.tone]}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="central"
          className="font-display"
          style={{
            fontWeight: 500,
            fontSize: size * 0.32,
            fill: inverse ? "var(--text-on-inverse)" : "var(--text-primary)",
            letterSpacing: "-0.02em",
          }}
        >
          {Math.round(score)}
        </text>
      </svg>
      <div className="leading-tight">
        <div
          className={cn(
            "font-mono text-[10.5px] tracking-[0.18em] uppercase",
            inverse ? "text-ink-on-inverse-muted" : "text-ink-tertiary"
          )}
        >
          Meetup Safety
        </div>
        <div
          className={cn("text-[13.5px] mt-0.5 font-medium", inverse ? "text-ink-on-inverse" : "text-ink")}
          style={{ color: toneColor[band.tone] }}
        >
          {band.label}
        </div>
        <div
          className={cn(
            "text-[11px] mt-0.5",
            inverse ? "text-ink-on-inverse-muted" : "text-ink-secondary"
          )}
        >
          {score} / 100
        </div>
      </div>
    </div>
  );
}

export function SafetyScoreBar({
  score,
  inverse = false,
  className,
}: {
  score: number;
  inverse?: boolean;
  className?: string;
}) {
  const band = bandFor(score);
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className={cn(
          "h-1.5 flex-1 rounded-full overflow-hidden",
          inverse ? "bg-white/[0.08]" : "bg-muted"
        )}
      >
        <div
          className="h-full rounded-full"
          style={{ width: `${score}%`, background: toneColor[band.tone] }}
        />
      </div>
      <span
        className="font-mono text-[10.5px] tracking-[0.14em] uppercase"
        style={{ color: toneColor[band.tone] }}
      >
        {band.label}
      </span>
    </div>
  );
}
