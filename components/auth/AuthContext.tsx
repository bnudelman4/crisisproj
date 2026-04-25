"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * Mock auth — localStorage-backed. There's no real password check; the demo
 * just persists a name + email so the gated /app routes have a "user." A real
 * deployment would swap this for NextAuth, Clerk, or whatever the backend
 * stack picks.
 */

/**
 * Role taxonomy:
 *  - "user"        — neighbor / member of the room. Can post needs, offer
 *                    help, react. Default for new signups. This is the
 *                    primary dashboard surface.
 *  - "coordinator" — trained admin who approves match safety plans. Ops
 *                    surface. Granted to a small allowlist of emails (or
 *                    explicitly chosen at signup).
 */
export type AuthUser = {
  name: string;
  email: string;
  role: "user" | "coordinator";
  joinedAt: string;
};

/** Demo allowlist — emails that auto-promote to coordinator. */
const COORDINATOR_EMAILS = new Set<string>([
  "coordinator@bridge.com",
  "coord@bridge.com",
  "admin@bridge.com",
  "rivas@bridge.com",
]);

function inferRole(email: string, requested?: AuthUser["role"]): AuthUser["role"] {
  if (requested) return requested;
  const e = email.trim().toLowerCase();
  if (COORDINATOR_EMAILS.has(e)) return "coordinator";
  if (e.startsWith("coord") || e.startsWith("admin")) return "coordinator";
  return "user";
}

type AuthState = {
  user: AuthUser | null;
  status: "idle" | "loading" | "ready";
  signIn: (input: { email: string; password: string }) => Promise<AuthUser>;
  signUp: (input: { name: string; email: string; password: string; role?: AuthUser["role"] }) => Promise<AuthUser>;
  signOut: () => void;
};

const Ctx = createContext<AuthState | null>(null);

const STORAGE_KEY = "bridge:user";

function load(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

function persist(user: AuthUser | null) {
  if (typeof window === "undefined") return;
  if (user) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } else {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}

function nameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? email;
  const parts = local.split(/[._-]/).filter(Boolean);
  if (parts.length === 0) return email;
  return parts
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join(" ");
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthState["status"]>("idle");

  useEffect(() => {
    setUser(load());
    setStatus("ready");
  }, []);

  const signIn = useCallback<AuthState["signIn"]>(async ({ email }) => {
    // Mock — accept any non-empty email/password. Real auth would round-trip.
    await new Promise((r) => setTimeout(r, 500));
    const next: AuthUser = {
      name: nameFromEmail(email),
      email,
      role: inferRole(email),
      joinedAt: new Date().toISOString(),
    };
    persist(next);
    setUser(next);
    return next;
  }, []);

  const signUp = useCallback<AuthState["signUp"]>(async ({ name, email, role }) => {
    await new Promise((r) => setTimeout(r, 600));
    const next: AuthUser = {
      name: name.trim() || nameFromEmail(email),
      email,
      role: inferRole(email, role),
      joinedAt: new Date().toISOString(),
    };
    persist(next);
    setUser(next);
    return next;
  }, []);

  const signOut = useCallback(() => {
    persist(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, status, signIn, signUp, signOut }),
    [user, status, signIn, signUp, signOut]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
