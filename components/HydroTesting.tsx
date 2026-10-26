import Reveal from "./Reveal";

/* -------------------------------------------------------------------------- */
/*  HydroTesting — the honest current stage, told with real imagery. The        */
/*  Wiggler is validated in controlled hydroponic trials before the field.      */
/*  Photos: Wikimedia Commons (CC BY-SA).                                        */
/* -------------------------------------------------------------------------- */

const CARDS: { img: string; k: string; label: string; body: string }[] = [
  { img: "/hydroponics/trays.jpg", k: "01", label: "Controlled first", body: "A clean, repeatable environment to prove the sensing, the weeding motion, and the soil-loop — one variable at a time." },
  { img: "/hydroponics/lettuce.jpg", k: "02", label: "Measurable", body: "Every run is instrumented: what the sensor sees, what it removes, what it leaves. Results you can check, not claims." },
  { img: "/hydroponics/vertical.jpg", k: "03", label: "A path to the field", body: "Each trial de-risks the next. We earn our way onto real acreage by proving it in water first." },
];

export default function HydroTesting() {
  return (
    <section id="testing" className="border-t hairline bg-char py-24 lg:py-32">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-10">
        <Reveal>
          <span className="eyebrow">Stage · Early testing</span>
          <h2 className="display mt-6 max-w-3xl text-paper text-3xl sm:text-5xl lg:text-6xl">
            Proving it in water, <span className="display-accent">first.</span>
          </h2>
          <p className="mt-6 max-w-2xl text-lg font-300 leading-relaxed text-fog">
            Before the field, the Wiggler is being validated in controlled
            hydroponic trials — the honest stage we&rsquo;re at today, and the
            right way to earn a place on real farmland.
          </p>
        </Reveal>

        {/* Image-led validation story — intentionally borderless and editorial. */}
        <Reveal delay={120}>
          <figure className="relative mt-14 aspect-[4/3] w-full overflow-hidden sm:aspect-[2/1] lg:aspect-[21/9]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/hydroponics/greenhouse.jpg"
              alt="Rows of crops growing in a commercial hydroponic greenhouse"
              className="h-full w-full object-cover"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-char/85 via-char/10 to-transparent" />
            <figcaption className="absolute bottom-6 left-6 flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.16em] text-paper sm:bottom-8 sm:left-8">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-paper/60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-paper" />
              </span>
              Hydroponic trials · in progress
            </figcaption>
          </figure>
        </Reveal>

        {/* Three plain editorial columns, not UI cards. */}
        <Reveal delay={80}>
          <div className="mt-12 grid border-t hairline sm:grid-cols-3">
            {CARDS.map((c) => (
              <figure key={c.k} className="border-b hairline py-7 sm:border-b-0 sm:border-r sm:pr-6 sm:even:px-6 sm:last:border-r-0 sm:last:pl-6 sm:last:pr-0">
                <div className="aspect-[4/3] overflow-hidden bg-char3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.img} alt={c.label} className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.04]" />
                </div>
                <figcaption className="pt-6">
                  <span className="font-mono text-[10px] text-faint">{c.k}</span>
                  <h3 className="mt-3 text-2xl text-paper">{c.label}</h3>
                  <p className="mt-3 text-[14px] font-300 leading-relaxed text-fog">{c.body}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </Reveal>

      </div>
    </section>
  );
}
