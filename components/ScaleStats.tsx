import Reveal from "./Reveal";

/* -------------------------------------------------------------------------- */
/*  ScaleStats — the herbicide problem, in big honest numbers. Independent data  */
/*  (not company claims) that frame why a mechanical alternative matters at      */
/*  commercial scale. Oversized bold numerals against the light display type.    */
/* -------------------------------------------------------------------------- */

const STATS: { n: string; l: string }[] = [
  { n: "21 / 31", l: "known herbicide sites of action now have resistant weeds" },
  { n: "2.03M t", l: "herbicide active ingredients used in agriculture worldwide in 2024" },
  { n: "550", l: "unique cases of herbicide-resistant weeds reported globally" },
  { n: "0", l: "herbicides the Wiggler puts into the ground" },
];

export default function ScaleStats() {
  return (
    <section id="scale" className="border-t hairline bg-char py-24 lg:py-32">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-10">
        <Reveal>
          <span className="eyebrow">The problem · at scale</span>
          <h2 className="display mt-6 max-w-3xl text-paper text-3xl sm:text-5xl lg:text-6xl">
            A herbicide cycle the land <span className="display-accent">can&rsquo;t afford.</span>
          </h2>
        </Reveal>

        <Reveal delay={120}>
          <div className="mt-16 grid grid-cols-1 gap-y-12 sm:grid-cols-2 sm:gap-x-10 lg:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.l} className="border-t border-edge pt-6">
                <div className="text-6xl font-bold leading-[0.9] tracking-tight text-paper lg:text-[5.5rem]">
                  {s.n}
                </div>
                <p className="mt-5 max-w-[15rem] text-[14px] font-300 leading-relaxed text-fog">{s.l}</p>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={60}>
          <p className="mt-12 font-mono text-[11px] text-faint">
            Sources: FAOSTAT herbicides data (2024) and the International Herbicide-Resistant Weed Database (November 2026). The Wiggler is pre-commercial.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
