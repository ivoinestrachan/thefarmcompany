import Reveal from "./Reveal";
import { WormDiagram } from "./diagrams";

const STEPS = [
  {
    k: "Kill weeds",
    v: "Grazers hunt and kill every weed mechanically — cutting and uprooting them so crops keep the light, water, and nutrients, with zero herbicide.",
  },
  {
    k: "Aerate",
    v: "Tillers open worm-like channels and inject carbon and living microbes, restarting the soil food web from the roots up.",
  },
  {
    k: "Enrich",
    v: "As the biome recovers, organic matter and water-holding capacity climb season over season. The land compounds.",
  },
  {
    k: "Sense",
    v: "Scouts read every plant continuously, closing the loop so the herd acts on evidence, not on a calendar.",
  },
];

export default function Soil() {
  return (
    <section id="soil" className="bg-ink py-28 text-paper lg:py-36">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="grid gap-16 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <Reveal>
              <span className="eyebrow text-sprout">The regenerative loop</span>
              <h2 className="display mt-5 text-4xl sm:text-5xl lg:text-6xl">
                We took our cues from the earthworm.
              </h2>
              <p className="mt-6 max-w-xl text-lg font-300 leading-relaxed text-paper/70">
                A single worm can move its own weight in soil every day —
                aerating, mixing, and leaving behind castings richer than the
                ground it ate. Our herd industrializes that gift without
                industrializing the land.
              </p>
            </Reveal>

            <div className="mt-12 grid gap-x-10 gap-y-8 sm:grid-cols-2">
              {STEPS.map((s, i) => (
                <Reveal key={s.k} delay={i * 90}>
                  <div className="border-t border-paper/15 pt-4">
                    <h3 className="text-lg font-400">{s.k}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-paper/60">
                      {s.v}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

          <Reveal delay={140}>
            <div className="rounded-2xl border border-paper/10 bg-paper/[0.03] p-6 lg:p-10">
              <WormDiagram className="w-full" />
              <p className="mt-6 text-[13px] text-paper/50">
                Fig. 01 — Burrowing intake and nutrient-rich castings. The Tiller
                unit reproduces this cycle at field scale.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
