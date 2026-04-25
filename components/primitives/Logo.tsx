import { cn } from "@/lib/cn";

export function Logo({
  className,
  inverse = false,
}: {
  className?: string;
  inverse?: boolean;
}) {
  const ink = inverse ? "var(--text-on-inverse)" : "var(--text-primary)";
  const accent = "var(--accent-emphasis)";
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        {/* triangle of three small circles */}
        <circle cx="6" cy="18" r="2.4" fill={ink} />
        <circle cx="18" cy="18" r="2.4" fill={ink} />
        {/* top-right pulses */}
        <circle
          cx="18"
          cy="6"
          r="2.4"
          fill={accent}
          className="origin-center animate-pulse-soft"
          style={{ transformOrigin: "18px 6px", transformBox: "fill-box" }}
        />
      </svg>
      <span
        className={cn(
          "font-sans font-semibold text-[15px]",
          inverse ? "text-ink-on-inverse" : "text-ink"
        )}
        style={{ letterSpacing: "-0.01em" }}
      >
        Bridge
      </span>
    </div>
  );
}
