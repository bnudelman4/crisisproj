export default function SocialProof() {
  return (
    <section
      aria-labelledby="social-proof"
      className="relative w-full bg-muted border-y border-hairline"
    >
      <div className="mx-auto max-w-[1280px] px-6 md:px-10 py-16">
        <p
          id="social-proof"
          className="text-center font-mono text-[11px] sm:text-[12px] tracking-[0.18em] uppercase text-ink-secondary leading-[1.7]"
        >
          In a 4-hour power outage, a 200-person campus generates{" "}
          <span className="text-ink">1,400+</span> coordination messages across{" "}
          <span className="text-ink">6 platforms</span>.
        </p>
      </div>
    </section>
  );
}
