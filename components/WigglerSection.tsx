import Reveal from "./Reveal";
import WigglerDiagram from "./WigglerDiagram";

/* -------------------------------------------------------------------------- */
/*  WigglerSection — the product section. Replaces the pinned 3D worm with a    */
/*  static concept schematic: headline + diagram + a plain capability strip.    */
/* -------------------------------------------------------------------------- */

const DOES = ["pulls weeds", "aerates soil", "reads plants", "zero chemicals", "8 ac / day"];

export default function WigglerSection() {
  return (
    <section id="wiggler" className="relative overflow-hidden bg-char py-24 lg:py-32">
      <div className="grid-dot pointer-events-none absolute inset-0 opacity-30" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-10">
        <Reveal>
          <span className="eyebrow">The Wiggler</span>
          <h2 className="display mt-5 max-w-4xl text-paper text-[12.5vw] leading-[0.9] sm:text-[8vw] lg:text-7xl">
            Autonomous bugs <span className="text-faint">that</span> eat weeds.
          </h2>
          <p className="mt-7 max-w-xl text-lg leading-relaxed text-paper/80">
            Small robots that eat the weeds instead of spraying them. They loosen and
            feed the soil the way earthworms do, and send live readings from every
            plant and every acre.
          </p>
        </Reveal>

        <Reveal delay={120} className="mt-14 lg:mt-20">
          <WigglerDiagram className="mx-auto h-auto w-full max-w-5xl" />
        </Reveal>

        <Reveal delay={160}>
          <ul className="mt-10 grid grid-cols-2 gap-x-6 gap-y-5 border-t hairline pt-7 sm:grid-cols-3 lg:grid-cols-5">
            {DOES.map((d) => (
              <li key={d} className="flex items-center gap-2.5 font-mono text-[13px] lowercase text-fog">
                <span className="h-1 w-1 shrink-0 rounded-full bg-green" />
                {d}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
