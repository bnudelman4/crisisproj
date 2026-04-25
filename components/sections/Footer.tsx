import { Logo } from "@/components/primitives/Logo";
import { ArrowUpRight } from "lucide-react";

const columns = [
  {
    label: "Product",
    items: [
      { label: "Command center", href: "#cta" },
      { label: "Pipeline", href: "#pipeline" },
      { label: "Safety posture", href: "#safety" },
      { label: "Walkthrough", href: "#walkthrough" },
    ],
  },
  {
    label: "Resources",
    items: [
      { label: "Field brief", href: "#" },
      { label: "Coordinator handbook", href: "#" },
      { label: "Schema reference", href: "#" },
      { label: "Audit log spec", href: "#" },
    ],
  },
  {
    label: "Built by",
    items: [
      { label: "Cornell Claude Builders", href: "#" },
      { label: "Hackathon · 2026", href: "#" },
      { label: "Contact", href: "mailto:hello@crisismesh.local" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="relative w-full bg-canvas">
      <div className="mx-auto max-w-[1280px] px-6 md:px-10 pt-20 pb-10 grid md:grid-cols-12 gap-10">
        <div className="md:col-span-5 flex flex-col gap-5">
          <Logo />
          <p className="max-w-[44ch] text-[13.5px] leading-[1.65] text-ink-secondary">
            CrisisMesh is coordination infrastructure for community crisis
            response — built around a human approval gate, not around it.
          </p>
          <div className="flex items-center gap-3">
            <a
              href="#"
              className="inline-flex items-center gap-2 h-8 px-3 rounded-full border border-hairline text-[12px] text-ink-secondary hover:text-ink hover:border-[var(--border-strong)] transition-colors"
            >
              github.com/crisismesh
              <ArrowUpRight size={12} strokeWidth={1.5} />
            </a>
          </div>
        </div>

        {columns.map((col) => (
          <nav key={col.label} className="md:col-span-2 flex flex-col gap-3">
            <span className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-ink-tertiary">
              {col.label}
            </span>
            <ul className="space-y-2">
              {col.items.map((it) => (
                <li key={it.label}>
                  <a
                    href={it.href}
                    className="text-[13.5px] text-ink-secondary hover:text-ink transition-colors"
                  >
                    {it.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div className="md:col-span-1" />
      </div>

      <div className="border-t border-hairline">
        <div className="mx-auto max-w-[1280px] px-6 md:px-10 py-6 grid md:grid-cols-2 gap-4 items-center">
          <p className="text-[12px] leading-[1.6] text-ink-secondary max-w-[64ch]">
            CrisisMesh supports human coordination. It does not replace 911,
            emergency medical services, or official emergency response.
          </p>
          <p className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-ink-tertiary md:text-right">
            © 2026 CrisisMesh · Cornell Claude Builders Hackathon
          </p>
        </div>
      </div>
    </footer>
  );
}
