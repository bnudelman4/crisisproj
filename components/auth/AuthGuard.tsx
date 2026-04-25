"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "./AuthContext";

/**
 * Wraps gated client routes (e.g. /app) and redirects to /login when there
 * is no persisted user. Renders a brief skeleton while auth state resolves
 * from localStorage so we don't flash protected content during hydration.
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "ready" && !user) {
      const redirect = pathname && pathname !== "/login"
        ? `?redirect=${encodeURIComponent(pathname)}`
        : "";
      router.replace(`/login${redirect}`);
    }
  }, [status, user, router, pathname]);

  if (status !== "ready" || !user) {
    return (
      <div
        className="min-h-[100svh] w-full flex items-center justify-center"
        style={{ background: "var(--bg-inverse)", color: "var(--text-on-inverse-muted)" }}
      >
        <span className="font-mono text-[10.5px] tracking-[0.18em] uppercase">
          Checking session…
        </span>
      </div>
    );
  }

  return <>{children}</>;
}
