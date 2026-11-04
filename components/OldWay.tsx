import Reveal from "./Reveal";

/* -------------------------------------------------------------------------- */
/*  OldWay — the status quo, at scale. A full-bleed photograph of commercial    */
/*  spraying equipment working a field, with the headline over it. The contrast */
/*  the Wiggler is built against. Photo: Wikimedia Commons (CC BY-SA).           */
/* -------------------------------------------------------------------------- */

export default function OldWay() {
  return (
    <section className="relative flex min-h-[620px] items-end overflow-hidden border-y hairline lg:min-h-[760px]">
      {/* full-bleed industrial spraying photo */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/oldway/sprayer.jpg"
        alt="A self-propelled commercial boom sprayer applying herbicide across a large field"
        className="absolute inset-0 h-full w-full object-cover"
      />
      {/* darken for legibility */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-char via-char/70 to-char/20" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-char/80 to-transparent" />

      <div className="relative mx-auto w-full max-w-7xl px-6 pb-16 lg:px-10 lg:pb-24">
        <Reveal>
          <span className="eyebrow">The old way</span>
          <h2 className="display mt-5 max-w-3xl text-paper text-4xl leading-[0.98] sm:text-5xl lg:text-7xl">
            Stop spraying your <span className="display-accent">soil to death.</span>
          </h2>
          <p className="mt-6 max-w-xl text-lg font-300 leading-relaxed text-paper/75">
            Conventional weed control can mean repeated blanket herbicide applications across
            thousands of acres. Wiggler&rsquo;s proposition is simpler: find the
            unwanted plant, act mechanically, and leave the rest of the row alone.
          </p>
          <p className="mt-8 font-mono text-[12px] uppercase tracking-wide text-paper/50">
            Commercial herbicide spraying · the operating model Wiggler is designed to change
          </p>
        </Reveal>
      </div>

    </section>
  );
}
