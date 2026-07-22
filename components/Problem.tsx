import Reveal from "./Reveal";
import { SoilProfile } from "./diagrams";

const PROBLEMS = [
  {
    n: "01",
    title: "Chemical weed control kills the soil biome",
    body: "Broad-spectrum herbicides don't stop at weeds. They collapse the fungal and microbial networks that make soil fertile, leaving fields dependent on ever-higher inputs.",
  },
  {
    n: "02",
    title: "Tillage releases carbon and destroys structure",
    body: "Every pass of the plow breaks up aggregates, oxidizes stored carbon, and leaves bare soil to erode. A quarter of the world's cropland is already degraded.",
  },
  {
    n: "03",
    title: "Farmers fly blind between harvests",
    body: "Yield problems show up when it's too late to fix them. Sampling is sparse, satellite data is coarse, and the living state of the soil is effectively invisible.",
  },
];

export default function Problem() {
  return (
    <section id="problem" className="bg-bone py-28 lg:py-36">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <Reveal>
          <span className="eyebrow text-loam">The problem</span>
          <h2 className="display mt-5 max-w-3xl text-4xl text-ink sm:text-5xl lg:text-6xl">
            Modern agriculture is fighting the soil instead of feeding it.
          </h2>
        </Reveal>

        <div className="mt-16 grid gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-10">
            {PROBLEMS.map((p, i) => (
              <Reveal key={p.n} delay={i * 90}>
                <div className="flex gap-6 border-t hairline pt-6">
                  <span className="mt-1 text-sm font-500 text-loam">{p.n}</span>
                  <div>
                    <h3 className="text-xl font-400 text-ink">{p.title}</h3>
                    <p className="mt-2 max-w-lg text-[15px] leading-relaxed text-ink/65">
                      {p.body}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={120}>
            <figure className="card-pop border hairline bg-paper p-6">
              <SoilProfile className="w-full" />
              <figcaption className="mt-4 text-[13px] text-ink/55">
                A healthy profile is a living structure — roots, fungal threads,
                and worm burrows moving water, air, and carbon. Our job is to
                protect it.
              </figcaption>
            </figure>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
