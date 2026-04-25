"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, EyeOff, Lock, Phone, ShieldCheck, AlertTriangle, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsRegister, setNeedsRegister] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setNeedsRegister(false);
    if (!phone.trim()) return setError("Enter a phone number.");
    if (!password) return setError("Enter your password.");
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || `HTTP ${res.status}`);
        if (data?.needsRegister) setNeedsRegister(true);
        return;
      }
      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="relative min-h-[100svh] w-full grid grid-cols-1 lg:grid-cols-[1.1fr_1fr]"
      style={{ background: "#000", color: "var(--text-on-inverse)" }}
    >
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

        <Link href="/" className="relative inline-flex items-center gap-2.5">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-on-inverse">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-emphasis animate-pulse" />
          </span>
          <span className="font-display text-[18px] tracking-display text-ink-on-inverse" style={{ fontWeight: 500 }}>
            Bridge
          </span>
        </Link>

        <div className="relative max-w-[44ch]">
          <span className="inline-flex items-center gap-2 font-mono text-[10.5px] tracking-[0.18em] uppercase text-ink-on-inverse-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-emphasis animate-pulse" />
            Coordinator console
          </span>
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
            Bridge is the coordinator-facing command center for community
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

      <main className="relative flex items-center justify-center p-6 sm:p-10 lg:p-14">
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[420px]"
        >
          <div className="lg:hidden mb-8">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-on-inverse">
                <span className="h-1.5 w-1.5 rounded-full bg-accent-emphasis animate-pulse" />
              </span>
              <span className="font-display text-[18px] tracking-display text-ink-on-inverse" style={{ fontWeight: 500 }}>
                Bridge
              </span>
            </Link>
          </div>

          <span className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-ink-on-inverse-muted">
            Sign in · Coordinator
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
            Welcome back to the room.
          </h2>
          <p className="mt-3 text-[14.5px] leading-[1.6] text-ink-on-inverse-muted">
            Sign in to open the command center and pick up where the coordinator left off.
          </p>

          <div className="mt-8 space-y-3">
            <Field icon={<Phone size={13} strokeWidth={1.6} />} label="Phone">
              <input
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 646 477 1086"
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
                  {showPassword ? <EyeOff size={13} strokeWidth={1.6} /> : <Eye size={13} strokeWidth={1.6} />}
                </button>
              }
            >
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-transparent border-0 outline-none text-[15px] text-ink-on-inverse placeholder:text-ink-on-inverse-muted/70"
              />
            </Field>
          </div>

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-[12.5px] text-red-300">
              <AlertTriangle size={13} strokeWidth={1.6} className="mt-0.5 shrink-0" />
              <div>
                {error}
                {needsRegister && (
                  <div className="mt-1">
                    <Link href="/register" className="underline">
                      Register a new account
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 w-full inline-flex items-center justify-center gap-2 h-11 rounded-md bg-white text-black font-medium text-[14px] tracking-[-0.01em] hover:bg-white/90 disabled:opacity-60 transition-colors"
          >
            {submitting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </button>

          <p className="mt-6 text-[13px] text-ink-on-inverse-muted">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-ink-on-inverse underline underline-offset-2">
              Register
            </Link>
          </p>
        </motion.form>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-on-inverse bg-inverse-card p-3">
      <div className="font-display text-[22px] text-ink-on-inverse" style={{ fontWeight: 500 }}>
        {value}
      </div>
      <div className="mt-1 font-mono text-[9.5px] tracking-[0.16em] uppercase text-ink-on-inverse-muted">
        {label}
      </div>
    </div>
  );
}

function Field({
  icon,
  label,
  right,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block rounded-lg border border-on-inverse bg-inverse-card px-3.5 py-3 transition-colors focus-within:border-white/30">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.18em] uppercase text-ink-on-inverse-muted">
          {icon}
          {label}
        </span>
        {right}
      </div>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
