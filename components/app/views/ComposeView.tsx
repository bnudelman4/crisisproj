"use client";

import { useState } from "react";
import { useApp } from "../AppContext";
import { cn } from "@/lib/cn";
import { DEMO_MESSAGES } from "@/lib/backend/demo-messages";
import { DEMO_CITY } from "@/lib/backend/demo-locations";
import {
  Lock,
  ShieldCheck,
  MapPin,
  Clock,
  Users,
  Loader2,
  Wand2,
  Phone,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
} from "lucide-react";

type Mode = "need" | "offer" | "analyze";

export default function ComposeView() {
  const [mode, setMode] = useState<Mode>("analyze");
  const [analyzeText, setAnalyzeText] = useState(DEMO_MESSAGES);
  const [registerForm, setRegisterForm] = useState({
    name: "",
    phone: "",
    description: "",
  });
  const [registerStatus, setRegisterStatus] = useState<{
    state: "idle" | "running" | "ok" | "error";
    msg?: string;
  }>({ state: "idle" });

  const {
    analyzeMessages,
    analyzeStatus,
    analyzeError,
    lastAnalyzed,
    registerHelper,
  } = useApp();

  const messageCount = analyzeText.split(/\n+/).filter((l) => l.trim()).length;

  async function runAnalyze() {
    await analyzeMessages(analyzeText);
  }

  async function submitRegister() {
    if (!registerForm.name.trim() || !registerForm.phone.trim()) {
      setRegisterStatus({ state: "error", msg: "Name and phone are required." });
      return;
    }
    setRegisterStatus({ state: "running" });
    // Drop a deterministic-ish lat/lng around the demo city
    const lat = DEMO_CITY.lat + (Math.random() * 2 - 1) * 0.01;
    const lng = DEMO_CITY.lng + (Math.random() * 2 - 1) * 0.01;
    const r = await registerHelper({
      name: registerForm.name.trim(),
      phone: registerForm.phone.trim(),
      lat,
      lng,
    });
    if (r.ok) {
      setRegisterStatus({
        state: "ok",
        msg: "Helper registered. They'll receive an SMS when a match is approved.",
      });
      setRegisterForm({ name: "", phone: "", description: "" });
    } else {
      setRegisterStatus({ state: "error", msg: r.error });
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px]">
      <div className="p-4 lg:p-6">
        <div className="mb-6">
          <span className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-ink-on-inverse-muted">
            Compose · Coordinator console
          </span>
          <h2 className="mt-1 font-display text-[28px] leading-[1] text-ink-on-inverse" style={{ fontWeight: 500, letterSpacing: "-0.02em" }}>
            What landed in the room?
          </h2>
          <p className="mt-2 text-[13.5px] text-ink-on-inverse-muted max-w-[60ch] leading-[1.55]">
            Paste a stream of messages from GroupMe, Discord, SMS, or Slack
            and let Claude extract the needs, helpers, and safe matches.
            Privacy guard is on — sensitive details never leave the room
            without coordinator approval.
          </p>
        </div>

        {/* Mode picker */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-5">
          <ModePill
            id="analyze"
            active={mode === "analyze"}
            onClick={() => setMode("analyze")}
            label="Analyze messages"
            sub="Paste a feed · Claude extracts needs and matches"
            badge="Live"
          />
          <ModePill
            id="offer"
            active={mode === "offer"}
            onClick={() => setMode("offer")}
            label="Register helper"
            sub="Add a verified helper to the room"
          />
          <ModePill
            id="need"
            active={mode === "need"}
            onClick={() => setMode("need")}
            label="Post a need"
            sub="Quick-post a single coordinator-typed entry"
          />
        </div>

        {mode === "analyze" && (
          <AnalyzeMode
            value={analyzeText}
            onChange={setAnalyzeText}
            onLoadDemo={() => setAnalyzeText(DEMO_MESSAGES)}
            onClear={() => setAnalyzeText("")}
            onRun={runAnalyze}
            running={analyzeStatus === "running"}
            error={analyzeError}
            lastAnalyzed={lastAnalyzed}
            messageCount={messageCount}
          />
        )}

        {mode === "offer" && (
          <RegisterMode
            form={registerForm}
            onChange={setRegisterForm}
            onSubmit={submitRegister}
            status={registerStatus}
          />
        )}

        {mode === "need" && <QuickPostMode />}
      </div>

      <aside className="hidden lg:block border-l border-on-inverse p-5 bg-[color:var(--bg-inverse)]">
        <div className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-ink-on-inverse-muted">
          Privacy posture
        </div>
        <ul className="mt-3 space-y-2 text-[12.5px] text-ink-on-inverse-muted leading-[1.55]">
          <li className="flex items-start gap-2">
            <Lock size={11} strokeWidth={1.6} className="mt-0.5 shrink-0" />
            Exact addresses hidden until both sides accept the safety plan.
          </li>
          <li className="flex items-start gap-2">
            <ShieldCheck size={11} strokeWidth={1.6} className="mt-0.5 shrink-0" />
            Coordinator brokers the first message. No direct DMs from raw inbox.
          </li>
          <li className="flex items-start gap-2">
            <Users size={11} strokeWidth={1.6} className="mt-0.5 shrink-0" />
            Buddy / contact sharing suggested for rides and night handoffs.
          </li>
        </ul>

        <div className="mt-6 rounded-2xl bg-inverse-elevated border border-on-inverse p-4">
          <div className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-ink-on-inverse-muted">
            Pipeline
          </div>
          <ol className="mt-3 space-y-2 text-[12px] text-ink-on-inverse">
            <PipelineStep n="01" label="Intake (5 connectors)" />
            <PipelineStep n="02" label="Claude · structured extraction" />
            <PipelineStep n="03" label="Urgency scoring 1–5" />
            <PipelineStep n="04" label="Deterministic matching" />
            <PipelineStep n="05" label="Meetup safety check" />
            <PipelineStep n="06" label="Coordinator approval" />
            <PipelineStep n="07" label="Twilio dispatch + audit log" />
          </ol>
        </div>

        <p className="mt-6 font-mono text-[10.5px] tracking-[0.18em] uppercase text-ink-on-inverse-muted">
          Demo · simulated session · no real PHI
        </p>
      </aside>
    </div>
  );
}

function ModePill({
  active,
  onClick,
  label,
  sub,
  badge,
}: {
  id: string;
  active: boolean;
  onClick: () => void;
  label: string;
  sub: string;
  badge?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-2xl px-3.5 py-3 text-left border transition-colors",
        active
          ? "bg-elevated text-ink border-elevated"
          : "bg-inverse-elevated border-on-inverse text-ink-on-inverse hover:bg-white/[0.04]"
      )}
    >
      <div className="flex items-center justify-between mb-1">
        <span className={cn(
          "font-mono text-[10px] tracking-[0.18em] uppercase",
          active ? "text-ink-secondary" : "text-ink-on-inverse-muted"
        )}>
          Mode
        </span>
        {badge && (
          <span
            className={cn(
              "inline-flex items-center gap-1 font-mono text-[9.5px] tracking-[0.14em] uppercase rounded-full px-1.5 h-4",
              active ? "bg-[var(--accent-emphasis)]/15 text-[var(--accent-emphasis)]" : "bg-white/[0.06] text-ink-on-inverse-muted"
            )}
          >
            <span className="h-1 w-1 rounded-full bg-current animate-pulse-soft" />
            {badge}
          </span>
        )}
      </div>
      <div className="font-medium text-[14px] leading-[1.2]">{label}</div>
      <div className={cn(
        "mt-1 text-[11.5px] leading-[1.4]",
        active ? "text-ink-secondary" : "text-ink-on-inverse-muted"
      )}>
        {sub}
      </div>
    </button>
  );
}

function AnalyzeMode({
  value,
  onChange,
  onLoadDemo,
  onClear,
  onRun,
  running,
  error,
  lastAnalyzed,
  messageCount,
}: {
  value: string;
  onChange: (v: string) => void;
  onLoadDemo: () => void;
  onClear: () => void;
  onRun: () => Promise<void>;
  running: boolean;
  error: string | null;
  lastAnalyzed: ReturnType<typeof useApp>["lastAnalyzed"];
  messageCount: number;
}) {
  return (
    <>
      <div className="rounded-2xl bg-inverse-elevated border border-on-inverse overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-on-inverse">
          <div className="flex items-center gap-2 font-mono text-[10.5px] tracking-[0.18em] uppercase text-ink-on-inverse-muted">
            <Sparkles size={12} strokeWidth={1.6} />
            Raw inbox · paste from GroupMe, Discord, SMS, Slack
          </div>
          <div className="flex items-center gap-3 font-mono text-[10.5px] tracking-[0.14em] uppercase text-ink-on-inverse-muted">
            <span>{messageCount} message{messageCount === 1 ? "" : "s"}</span>
            <button
              type="button"
              onClick={onLoadDemo}
              className="underline underline-offset-2 hover:text-ink-on-inverse"
            >
              Load 30-message demo
            </button>
            <span aria-hidden>·</span>
            <button
              type="button"
              onClick={onClear}
              className="underline underline-offset-2 hover:text-ink-on-inverse"
            >
              Clear
            </button>
          </div>
        </div>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={14}
          spellCheck={false}
          className="w-full bg-transparent border-0 outline-none px-4 py-3 font-mono text-[12.5px] leading-[1.55] text-ink-on-inverse placeholder:text-ink-on-inverse-muted/70 resize-y"
          placeholder="[GroupMe 14:02] Maria: Need insulin at 4th and Oak ASAP …&#10;[Discord 14:05] jen.r: Power out at North Campus dorms …"
        />
      </div>

      {error && (
        <div className="mt-4 inline-flex items-start gap-2 rounded-lg border border-[var(--signal-critical)]/35 bg-[var(--signal-critical)]/10 px-3 py-2 text-[12.5px] text-[var(--signal-critical)]">
          <AlertTriangle size={13} strokeWidth={1.6} className="mt-0.5" />
          {error}
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <span className="font-mono text-[10.5px] tracking-[0.14em] uppercase text-ink-on-inverse-muted inline-flex items-center gap-2">
          <ShieldCheck size={11} strokeWidth={1.6} />
          Privacy guard active · sensitive details hidden until approval
        </span>
        <button
          type="button"
          onClick={onRun}
          disabled={running}
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-4 h-10 font-sans text-[13px] font-medium transition-colors",
            running
              ? "bg-elevated/60 text-ink-secondary cursor-progress"
              : "bg-elevated text-ink hover:bg-canvas"
          )}
        >
          {running ? (
            <>
              <Loader2 size={14} strokeWidth={1.8} className="animate-spin" />
              Claude is structuring {messageCount} message{messageCount === 1 ? "" : "s"}…
            </>
          ) : (
            <>
              <Wand2 size={14} strokeWidth={1.8} />
              Run analysis
              <ArrowRight size={13} strokeWidth={1.8} />
            </>
          )}
        </button>
      </div>

      {lastAnalyzed && (
        <div className="mt-6">
          <div className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-ink-on-inverse-muted mb-3 flex items-center gap-2">
            <CheckCircle2 size={12} strokeWidth={1.6} className="text-[var(--signal-success)]" />
            Last run · {lastAnalyzed.summary.totalNeeds} needs · {lastAnalyzed.summary.totalResources} helpers · {lastAnalyzed.matches.length} match candidates
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <ResultStat label="Needs extracted" value={lastAnalyzed.summary.totalNeeds} />
            <ResultStat label="Helpers detected" value={lastAnalyzed.summary.totalResources} accent="success" />
            <ResultStat label="Urgent (≥4)" value={lastAnalyzed.summary.urgentCases} accent="critical" />
            <ResultStat label="Safe matches" value={lastAnalyzed.summary.safeMatches} accent="ok" />
          </div>
          <p className="mt-3 font-mono text-[10.5px] tracking-[0.14em] uppercase text-ink-on-inverse-muted">
            Match candidates are now in Feed and Alerts · open one to run the
            Meetup Safety Check.
          </p>
        </div>
      )}
    </>
  );
}

function ResultStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "success" | "critical" | "ok";
}) {
  const color =
    accent === "success"
      ? "var(--signal-success)"
      : accent === "critical"
      ? "var(--signal-critical)"
      : "var(--text-on-inverse)";
  return (
    <div className="rounded-xl bg-inverse-elevated border border-on-inverse p-3">
      <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink-on-inverse-muted">
        {label}
      </div>
      <div
        className="mt-1 font-display text-[28px] leading-[1] tabular-nums"
        style={{ fontWeight: 500, letterSpacing: "-0.02em", color }}
      >
        {value}
      </div>
    </div>
  );
}

function RegisterMode({
  form,
  onChange,
  onSubmit,
  status,
}: {
  form: { name: string; phone: string; description: string };
  onChange: (v: { name: string; phone: string; description: string }) => void;
  onSubmit: () => Promise<void>;
  status: { state: "idle" | "running" | "ok" | "error"; msg?: string };
}) {
  return (
    <div className="rounded-2xl bg-inverse-elevated border border-on-inverse p-5 max-w-[640px]">
      <div className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-ink-on-inverse-muted mb-1">
        Register helper · /api/users/register
      </div>
      <h3 className="font-display text-[20px] leading-[1.05] text-ink-on-inverse" style={{ fontWeight: 500, letterSpacing: "-0.02em" }}>
        Add a verified helper to the room.
      </h3>
      <p className="mt-2 text-[12.5px] text-ink-on-inverse-muted leading-[1.55]">
        Helpers receive an SMS when the coordinator approves a match. Phone
        is normalized to E.164. Location is jittered ±100m for privacy.
      </p>

      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label="Full name" icon={<Users size={12} strokeWidth={1.6} />}>
          <input
            type="text"
            value={form.name}
            onChange={(e) => onChange({ ...form, name: e.target.value })}
            placeholder="Leo M."
            className="w-full bg-transparent border-0 outline-none text-[14px] text-ink-on-inverse placeholder:text-ink-on-inverse-muted/70"
          />
        </FormField>
        <FormField label="Phone (E.164)" icon={<Phone size={12} strokeWidth={1.6} />}>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => onChange({ ...form, phone: e.target.value })}
            placeholder="+16075550142"
            className="w-full bg-transparent border-0 outline-none text-[14px] text-ink-on-inverse placeholder:text-ink-on-inverse-muted/70"
          />
        </FormField>
      </div>
      <div className="mt-3">
        <FormField label="Capability / availability" icon={<Clock size={12} strokeWidth={1.6} />}>
          <input
            type="text"
            value={form.description}
            onChange={(e) => onChange({ ...form, description: e.target.value })}
            placeholder="Vehicle · supply runs and rides · 2–5 PM"
            className="w-full bg-transparent border-0 outline-none text-[14px] text-ink-on-inverse placeholder:text-ink-on-inverse-muted/70"
          />
        </FormField>
      </div>

      {status.msg && (
        <div className={cn(
          "mt-4 inline-flex items-start gap-2 rounded-lg px-3 py-2 text-[12.5px]",
          status.state === "ok"
            ? "bg-[var(--signal-success)]/12 text-[var(--signal-success)] border border-[var(--signal-success)]/30"
            : "bg-[var(--signal-critical)]/10 text-[var(--signal-critical)] border border-[var(--signal-critical)]/30"
        )}>
          {status.state === "ok" ? (
            <CheckCircle2 size={13} strokeWidth={1.6} className="mt-0.5" />
          ) : (
            <AlertTriangle size={13} strokeWidth={1.6} className="mt-0.5" />
          )}
          {status.msg}
        </div>
      )}

      <div className="mt-5 flex items-center justify-between gap-3">
        <span className="font-mono text-[10.5px] tracking-[0.14em] uppercase text-ink-on-inverse-muted inline-flex items-center gap-2">
          <MapPin size={11} strokeWidth={1.6} />
          Geocode · Manhattan demo zone · jittered for privacy
        </span>
        <button
          type="button"
          onClick={onSubmit}
          disabled={status.state === "running"}
          className="inline-flex items-center gap-2 rounded-full px-4 h-10 font-sans text-[13px] font-medium bg-elevated text-ink hover:bg-canvas disabled:opacity-60 disabled:cursor-progress"
        >
          {status.state === "running" ? (
            <>
              <Loader2 size={13} strokeWidth={1.8} className="animate-spin" />
              Registering…
            </>
          ) : (
            <>Register helper<ArrowRight size={13} strokeWidth={1.8} /></>
          )}
        </button>
      </div>
    </div>
  );
}

function QuickPostMode() {
  return (
    <div className="rounded-2xl bg-inverse-elevated border border-on-inverse p-5 max-w-[640px]">
      <div className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-ink-on-inverse-muted mb-1">
        Quick post · coordinator-typed
      </div>
      <h3 className="font-display text-[20px] leading-[1.05] text-ink-on-inverse" style={{ fontWeight: 500, letterSpacing: "-0.02em" }}>
        Add a single entry to the room.
      </h3>
      <p className="mt-2 text-[12.5px] text-ink-on-inverse-muted leading-[1.55]">
        Use the analyze flow for batches. This form is for the rare case
        where a coordinator types a single entry by hand.
      </p>
      <div className="mt-5 space-y-3">
        <FormField label="Title" icon={<Sparkles size={12} strokeWidth={1.6} />}>
          <input
            type="text"
            placeholder="Insulin needed · refrigerated · time-sensitive"
            className="w-full bg-transparent border-0 outline-none text-[14px] text-ink-on-inverse placeholder:text-ink-on-inverse-muted/70"
          />
        </FormField>
        <FormField label="Body" icon={<Clock size={12} strokeWidth={1.6} />}>
          <textarea
            rows={3}
            placeholder="Power out 3 hours. North Campus dorm. Public lobby handoff preferred."
            className="w-full bg-transparent border-0 outline-none text-[14px] text-ink-on-inverse placeholder:text-ink-on-inverse-muted/70 resize-none"
          />
        </FormField>
      </div>
      <div className="mt-5 flex items-center justify-between gap-3">
        <span className="font-mono text-[10.5px] tracking-[0.14em] uppercase text-ink-on-inverse-muted inline-flex items-center gap-2">
          <Lock size={11} strokeWidth={1.6} />
          Privacy guard active · address hidden until approval
        </span>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full px-4 h-10 font-sans text-[13px] font-medium bg-elevated text-ink"
        >
          <ShieldCheck size={13} strokeWidth={1.8} />
          Post with safety guard
        </button>
      </div>
    </div>
  );
}

function FormField({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block rounded-xl bg-[color:var(--bg-inverse)] border border-on-inverse px-3.5 py-2.5">
      <div className="flex items-center gap-1.5 font-mono text-[10.5px] tracking-[0.18em] uppercase text-ink-on-inverse-muted">
        {icon}
        {label}
      </div>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function PipelineStep({ n, label }: { n: string; label: string }) {
  return (
    <li className="flex items-center gap-2.5">
      <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-on-inverse-muted tabular-nums">
        {n}
      </span>
      <span className="text-[12.5px]">{label}</span>
    </li>
  );
}
