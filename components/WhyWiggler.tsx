import Reveal from "./Reveal";

const REASONS = [
  {
    number: "01",
    title: "Plant-level, not field-wide.",
    body: "The system is designed to locate an individual weed and act only where the work is needed—not coat the entire row.",
    note: "Selective action",
  },
  {
    number: "02",
    title: "Mechanical, not chemical.",
    body: "Removal is physical. That creates a route away from repeated blanket herbicide applications and their recurring input cost.",
    note: "No blanket spray",
  },
  {
    number: "03",
    title: "Measured, not assumed.",
    body: "The intended workflow records each target and action so a grower can see what happened in the field after every pass.",
    note: "Field record",
  },
];

export default function WhyWiggler() {
  return (
    <section id="approach" className="border-t hairline bg-paper text-ink">
      <div className="mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
        <Reveal>
          <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink/50">
                Why this approach
              </p>
              <h2 className="display mt-5 max-w-md text-4xl leading-[0.96] sm:text-5xl lg:text-6xl">
                Less intervention. More intelligence.
              </h2>
            </div>
            <p className="max-w-2xl text-xl font-light leading-relaxed text-ink/65 lg:pt-8 lg:text-2xl">
              Most weed control treats acreage as one surface. Wiggler is being built to understand the field one plant at a time.
            </p>
          </div>
        </Reveal>

        <div className="mt-20 border-t border-ink/20">
          {REASONS.map((reason, index) => (
            <Reveal key={reason.number} delay={index * 70}>
              <article className="grid gap-5 border-b border-ink/20 py-9 sm:grid-cols-[4rem_1fr] lg:grid-cols-[5rem_1fr_1fr_auto] lg:items-start lg:gap-10 lg:py-12">
                <span className="font-mono text-[11px] text-ink/45">{reason.number}</span>
                <h3 className="max-w-md text-2xl font-medium tracking-tight sm:text-3xl">
                  {reason.title}
                </h3>
                <p className="max-w-xl text-[15px] leading-relaxed text-ink/60 sm:text-base">
                  {reason.body}
                </p>
                <span className="w-fit border border-ink/25 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.15em] text-ink/60">
                  {reason.note}
                </span>
              </article>
            </Reveal>
          ))}
        </div>

        <p className="mt-6 max-w-2xl font-mono text-[10px] leading-relaxed text-ink/45">
          Product direction shown. Hardware, autonomy, and field performance remain in validation.
        </p>
      </div>
    </section>
  );
}
