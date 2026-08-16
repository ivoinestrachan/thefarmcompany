import Reveal from "./Reveal";
import { LoopDiagram } from "./diagrams";

const STEPS = [
  {
    k: "Kill weeds",
    v: "Wigglers find and remove every weed mechanically, so crops keep the light, water, and nutrients they need. No herbicide.",
  },
  {
    k: "Aerate",
    v: "Tillers open channels and add carbon and living microbes, restarting the soil food web from the roots up.",
  },
  {
    k: "Enrich",
    v: "As the soil recovers, organic matter and water-holding capacity rise season after season, and the land keeps improving.",
  },
  {
    k: "Sense",
    v: "Scouts read every plant around the clock, so the bugs act on real data instead of a calendar.",
  },
];

export default function Soil() {
  return (
    <section id="soil" className="border-t hairline bg-char2 py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="grid gap-16 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <Reveal>
              <span className="eyebrow">The regenerative loop</span>
              <h2 className="display mt-6 text-3xl text-paper sm:text-5xl lg:text-6xl">
                We took our cues from the earthworm.
              </h2>
              <p className="mt-6 max-w-xl text-lg font-300 leading-relaxed text-fog">
                A single worm can move its own weight in soil every day. It
                aerates, mixes, and leaves behind castings richer than the ground
                it ate. Our bugs do the same work at the scale of a whole field.
              </p>
            </Reveal>

            <div className="mt-11 grid gap-x-10 gap-y-7 sm:grid-cols-2">
              {STEPS.map((s, i) => (
                <Reveal key={s.k} delay={i * 90}>
                  <div className="border-t hairline pt-4">
                    <h3 className="font-mono text-sm uppercase tracking-wider text-signal">
                      {s.k}
                    </h3>
                    <p className="mt-2.5 text-sm leading-relaxed text-fog">
                      {s.v}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

          <Reveal delay={140}>
            <div className="rounded-2xl border hairline bg-char3 p-6 lg:p-10">
              <LoopDiagram className="mx-auto w-full max-w-sm" />
              <p className="mt-6 font-mono text-[12px] leading-relaxed text-faint">
                fig. 01 — one continuous loop. Each bug hands off to the next, so
                the land improves season after season.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
