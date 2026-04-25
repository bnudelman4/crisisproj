"use client";

import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

const ease = [0.16, 1, 0.3, 1] as const;

const word: Variants = {
  hidden: { opacity: 0, y: 24 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.7, ease } },
};

export function WordReveal({
  text,
  delay = 0,
  stagger = 0.06,
  className,
  trigger = "mount",
}: {
  text: string;
  delay?: number;
  stagger?: number;
  className?: string;
  trigger?: "mount" | "view";
}) {
  const tokens = text.split(/(\s+|<br\/>)/g).filter(Boolean);
  const initial = "hidden";
  const animateProp = trigger === "mount"
    ? { animate: "shown" as const }
    : { whileInView: "shown" as const, viewport: { once: true, margin: "-10% 0px -10% 0px" } };

  return (
    <motion.span
      className={className}
      initial={initial}
      {...animateProp}
      variants={{
        hidden: {},
        shown: { transition: { staggerChildren: stagger, delayChildren: delay } },
      }}
      style={{ display: "inline-block" }}
    >
      {tokens.map((tok, i) => {
        if (tok === "<br/>") return <br key={i} />;
        if (/^\s+$/.test(tok)) return <span key={i}>{tok}</span>;
        return (
          <motion.span
            key={i}
            variants={word}
            style={{
              display: "inline-block",
              willChange: "transform, opacity",
            }}
          >
            {tok}
          </motion.span>
        );
      })}
    </motion.span>
  );
}

export function HeadingReveal({
  children,
  className,
  delay = 0,
  stagger = 0.06,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  stagger?: number;
}) {
  return (
    <motion.span
      className={className}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, margin: "-15% 0px -15% 0px" }}
      variants={{
        hidden: {},
        shown: { transition: { staggerChildren: stagger, delayChildren: delay } },
      }}
    >
      {children}
    </motion.span>
  );
}
