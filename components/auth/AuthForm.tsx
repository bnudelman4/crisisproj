"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { Logo } from "@/components/primitives/Logo";
import { LiveIndicator } from "@/components/primitives/LiveIndicator";
import { Button } from "@/components/primitives/Button";
import { useAuth } from "./AuthContext";
import { Eye, EyeOff, Lock, Mail, ShieldCheck, User } from "lucide-react";
import { cn } from "@/lib/cn";

type Mode = "login" | "signup";

const COPY: Record<Mode, {
  eyebrow: string;
  title: string;
  caption: string;
  submit: string;
  alt: { label: string; href: string; cta: string };
}> = {
  login: {
    eyebrow: "Sign in · Coordinator",
    title: "Welcome back to the room.",
    caption:
      "Sign in to open the command center and pick up where the coordinator left off.",
    submit: "Sign in",
    alt: { label: "Don't have an account?", href: "/signup", cta: "Sign up" },
  },
  signup: {
    eyebrow: "Create account · Coordinator",
    title: "Start a coordination room.",
    caption:
      "We'll set up a coordinator profile, seed the demo feed, and walk you through the Sam ↔ Leo Meetup Safety Check.",
    submit: "Create account",
    alt: { label: "Already coordinating?", href: "/login", cta: "Sign in" },
  },
};

export function AuthForm({ mode }: { mode: Mode }) {
  const copy = COPY[mode];
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params.get("redirect") || "/app";
  const { signIn, signUp } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim()) return setError("Enter an email.");
    if (password.length < 4) return setError("Password must be at least 4 characters.");
    if (mode === "signup" && !name.trim()) return setError("Enter your name.");

    setSubmitting(true);
    try {
      if (mode === "login") {
        await signIn({ email: email.trim(), password });
      } else {
        await signUp({ name: name.trim(), email: email.trim(), password });
      }
      router.replace(redirectTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  return (
    <div
      className="relative min-h-[100svh] w-full grid grid-cols-1 lg:grid-cols-[1.1fr_1fr]"
      style={{ background: "#000", color: "var(--text-on-inverse)" }}
    >
      {/* Editorial side panel — hidden on small screens */}
      <aside className="relative hidden lg:flex flex-col justify-between p-10 xl:p-14 overflow-hidden border-r border-on-inverse">
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(60% 40% at 30% 0%, rgba(91,141,239,0.14) 0%, rgba(0,0,0,0) 60%)",
          }}
        />
        <div className="absolute inset-0 grain pointer-events-none" />

        <Link href="/" className="relative inline-flex">
          <Logo inverse />
        </Link>

        <div className="relative max-w-[44ch]">
          <LiveIndicator inverse label="Coordinator console" />
          <h1
            className="mt-5 font-display text-ink-on-inverse"
            style={{
              fontWeight: 500,
              fontSize: "clamp(36px, 4vw, 56px)",
              letterSpacing: "-0.025em",
              lineHeight: 0.98,
            }}
          >
            Coordination, not chaos.
          </h1>
          <p className="mt-4 text-[15px] leading-[1.6] text-ink-on-inverse-muted">
            CrisisMesh is the coordinator-facing command center for community
            crisis response. Sign in to access live intake, AI matches, and
            the Meetup Safety Check before any messaging goes out.
          </p>
        </div>

        <div className="relative">
          <div className="grid grid-cols-3 gap-4">
            <Stat label="Approvals · today" value="14" />
            <Stat label="Blocks · today" value="3" />
            <Stat label="Flags resolved" value="22" />
          </div>
          <p className="mt-6 inline-flex items-center gap-2 font-mono text-[10.5px] tracking-[0.18em] uppercase text-ink-on-inverse-muted">
            <ShieldCheck size={11} strokeWidth={1.6} />
            Demo · simulated session · no real PHI
          </p>
        </div>
      </aside>

      {/* Form */}
      <main className="relative flex items-center justify-center p-6 sm:p-10 lg:p-14">
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[420px]"
        >
          <div className="lg:hidden mb-8">
            <Link href="/" className="inline-flex">
              <Logo inverse />
            </Link>
          </div>

          <span className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-ink-on-inverse-muted">
            {copy.eyebrow}
          </span>
          <h2
            className="mt-2 font-display text-ink-on-inverse"
            style={{
              fontWeight: 500,
              fontSize: "clamp(28px, 3.4vw, 40px)",
              letterSpacing: "-0.022em",
              lineHeight: 1.05,
            }}
          >
            {copy.title}
          </h2>
          <p className="mt-3 text-[14.5px] leading-[1.6] text-ink-on-inverse-muted">
            {copy.caption}
          </p>

          <div className="mt-8 space-y-3">
            {mode === "signup" && (
              <Field
                icon={<User size={13} strokeWidth={1.6} />}
                label="Full name"
              >
                <input
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="M. Rivas"
                  className="w-full bg-transparent border-0 outline-none text-[15px] text-ink-on-inverse placeholder:text-ink-on-inverse-muted/70"
                />
              </Field>
            )}
            <Field icon={<Mail size={13} strokeWidth={1.6} />} label="Email">
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="coordinator@crisismesh.local"
                className="w-full bg-transparent border-0 outline-none text-[15px] text-ink-on-inverse placeholder:text-ink-on-inverse-muted/70"
              />
            </Field>
            <Field
              icon={<Lock size={13} strokeWidth={1.6} />}
              label="Password"
              right={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="inline-flex items-center justify-center h-7 w-7 rounded-md text-ink-on-inverse-muted hover:bg-white/[0.05]"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff size={13} strokeWidth={1.6} />
                  ) : (
                    <Eye size={13} strokeWidth={1.6} />
                  )}
                </button>
              }
            >
              <input
                type={showPassword ? "text" : "password"}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-transparent border-0 outline-none text-[15px] text-ink-on-inverse placeholder:text-ink-on-inverse-muted/70 tracking-[0.04em]"
              />
            </Field>
          </div>

          {error && (
            <div className="mt-4 rounded-md border border-[var(--signal-critical)]/35 bg-[var(--signal-critical)]/10 px-3 py-2 text-[12.5px] text-[var(--signal-critical)]">
              {error}
            </div>
          )}

          <Button
            type="submit"
            variant="inverse"
            size="lg"
            disabled={submitting}
            className="mt-6 w-full"
          >
            {submitting ? "Connecting…" : copy.submit}
          </Button>

          <p className="mt-5 text-[13px] text-ink-on-inverse-muted">
            {copy.alt.label}{" "}
            <Link
              href={copy.alt.href}
              className="text-ink-on-inverse underline underline-offset-4 hover:text-white"
            >
              {copy.alt.cta}
            </Link>
          </p>

          <p className="mt-10 font-mono text-[10.5px] tracking-[0.18em] uppercase text-ink-on-inverse-muted">
            CrisisMesh supports human coordination. It does not replace 911,
            emergency medical services, or official emergency response.
          </p>
        </motion.form>
      </main>
    </div>
  );
}

function Field({
  icon,
  label,
  children,
  right,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <label
      className={cn(
        "block rounded-xl bg-inverse-elevated border border-on-inverse px-3.5 pt-2 pb-2.5",
        "focus-within:border-[var(--accent-emphasis)] focus-within:bg-[#1a1a1a] transition-colors"
      )}
    >
      <div className="flex items-center justify-between gap-2 font-mono text-[10.5px] tracking-[0.18em] uppercase text-ink-on-inverse-muted">
        <span className="inline-flex items-center gap-1.5">
          {icon}
          {label}
        </span>
        {right}
      </div>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-inverse-elevated border border-on-inverse p-3">
      <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink-on-inverse-muted">
        {label}
      </div>
      <div
        className="mt-1 font-display text-[26px] leading-[1] text-ink-on-inverse"
        style={{ fontWeight: 500, letterSpacing: "-0.02em" }}
      >
        {value}
      </div>
    </div>
  );
}
