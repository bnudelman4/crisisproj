"use client";

import { cn } from "@/lib/cn";
import { type ButtonHTMLAttributes, type ReactNode, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "inverse";
type Size = "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-sans font-medium transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas focus-visible:ring-[var(--accent-emphasis)] disabled:opacity-50 disabled:cursor-not-allowed select-none";

const sizes: Record<Size, string> = {
  md: "h-10 px-5 text-[14px]",
  lg: "h-12 px-6 text-[15px]",
};

const variants: Record<Variant, string> = {
  primary:
    "bg-[var(--accent)] text-[var(--text-on-inverse)] hover:bg-[var(--accent-emphasis)] hover:shadow-[0_8px_24px_-12px_rgba(91,141,239,0.6)] active:scale-[0.99]",
  secondary:
    "bg-elevated text-ink border border-hairline hover:border-[var(--border-strong)] hover:bg-canvas",
  ghost:
    "bg-transparent text-ink hover:bg-muted/70",
  inverse:
    "bg-elevated text-ink hover:bg-canvas hover:shadow-[0_8px_24px_-12px_rgba(255,255,255,0.2)]",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  asChild?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", className, children, leftIcon, rightIcon, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={cn(base, sizes[size], variants[variant], className)}
      {...props}
    >
      {leftIcon}
      <span>{children}</span>
      {rightIcon}
    </button>
  );
});

export function LinkButton({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
  leftIcon,
  rightIcon,
}: {
  href: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}) {
  return (
    <a
      href={href}
      className={cn(base, sizes[size], variants[variant], className)}
    >
      {leftIcon}
      <span>{children}</span>
      {rightIcon}
    </a>
  );
}
