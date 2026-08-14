import Reveal from "./Reveal";
import { SoilProfile } from "./diagrams";

const PROBLEMS = [
  {
    n: "01",
    title: "Chemical weed control kills the soil biome",
    body: "Broad-spectrum herbicides do not stop at weeds. They break down the fungal and microbial networks that keep soil fertile, so fields need more inputs every year just to hold their yield.",
  },
  {
    n: "02",
    title: "Tillage releases carbon and destroys structure",
    body: "Every pass of the plow breaks up soil aggregates, releases stored carbon, and leaves bare ground to erode. About a quarter of the world's cropland is already degraded.",
  },
  {
    n: "03",
    title: "Farmers work blind between harvests",
    body: "Yield problems usually show up when it is too late to fix them. Sampling is sparse, satellite data is coarse, and the real state of the soil stays hidden.",
  },
];

export default function Problem() {
  return (
    <section id="problem" className="border-t hairline bg-char2 py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <Reveal>
          <span className="eyebrow">The problem</span>
          <h2 className="display mt-6 max-w-3xl text-3xl text-paper sm:text-5xl lg:text-6xl">
            Modern agriculture fights the soil instead of feeding it.
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-9">
            {PROBLEMS.map((p, i) => (
              <Reveal key={p.n} delay={i * 90}>
                <div className="flex gap-6 border-t hairline pt-6">
                  <span className="mt-1 font-mono text-sm text-signal">{p.n}</span>
                  <div>
                    <h3 className="text-lg font-500 text-paper">{p.title}</h3>
                    <p className="mt-2 max-w-lg text-[15px] leading-relaxed text-fog">
                      {p.body}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={120}>
            {/* A physical soil-sample card — deliberately light, like a lab readout. */}
            <figure className="card-pop overflow-hidden rounded-xl border hairline bg-bone">
              <div className="flex items-center justify-between border-b border-black/10 px-4 py-2.5">
                <span className="font-mono text-[11px] uppercase tracking-wider text-black/50">
                  soil sample · core 04
                </span>
                <span className="font-mono text-[11px] text-leaf">42.31°N</span>
              </div>
              <div className="p-5">
                <SoilProfile className="w-full" />
              </div>
              <figcaption className="border-t border-black/10 px-5 py-4 text-[13px] leading-relaxed text-black/60">
                Healthy soil is a living structure of roots, fungal threads, and
                worm burrows that move water, air, and carbon through the ground.
                Our job is to protect it.
              </figcaption>
            </figure>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
