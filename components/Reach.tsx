import Reveal from "./Reveal";
import { MAP_W, MAP_H, MARKERS, STATE_PATHS, LAND_PATHS } from "./mapData";

/* -------------------------------------------------------------------------- */
/*  Reach — where the herd operates. A real North-Atlantic outline map (US      */
/*  states + neighbouring coastlines, projected at build time) with glowing     */
/*  markers on the sites we run today. Line-art on near-black, no dependency.   */
/* -------------------------------------------------------------------------- */

export default function Reach() {
  return (
    <section id="reach" className="border-t hairline bg-char py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <Reveal>
          <span className="eyebrow">Where we operate</span>
          <h2 className="display mt-6 max-w-3xl text-3xl text-paper sm:text-5xl lg:text-6xl">
            Working across the <span className="display-accent">US &amp; UK.</span>
          </h2>
          <p className="mt-6 max-w-2xl text-lg font-300 leading-relaxed text-fog">
            The herd is already clearing fields on two continents, and mapping new
            ground every season.
          </p>
        </Reveal>

        <Reveal delay={120}>
          <div
            className="relative mt-14 w-full overflow-hidden rounded-xl border hairline bg-char3"
            style={{ aspectRatio: `${MAP_W} / ${MAP_H}` }}
          >
            <div className="grid-dot absolute inset-0 opacity-20" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(240,136,60,0.06),transparent_60%)]" />

            {/* projected coastlines + state borders */}
            <svg
              viewBox={`0 0 ${MAP_W} ${MAP_H}`}
              className="absolute inset-0 h-full w-full"
              aria-hidden
            >
              <g fill="rgba(246,244,242,0.028)" stroke="rgba(246,244,242,0.17)">
                {LAND_PATHS.map((d, i) => (
                  <path key={`l${i}`} d={d} vectorEffect="non-scaling-stroke" />
                ))}
              </g>
              <g fill="none" stroke="rgba(246,244,242,0.1)">
                {STATE_PATHS.map((d, i) => (
                  <path key={`s${i}`} d={d} vectorEffect="non-scaling-stroke" />
                ))}
              </g>
            </svg>

            {/* glowing site markers */}
            {MARKERS.map((m) => (
              <div
                key={m.label}
                className="absolute"
                style={{
                  left: `${(m.x / MAP_W) * 100}%`,
                  top: `${(m.y / MAP_H) * 100}%`,
                }}
              >
                {/* dot — always centred on the true coordinate */}
                <span className="absolute -translate-x-1/2 -translate-y-1/2">
                  <span className="relative flex h-2.5 w-2.5 items-center justify-center">
                    <span className="absolute h-7 w-7 rounded-full bg-signal/20 blur-[5px]" />
                    <span className="absolute inline-flex h-2.5 w-2.5 animate-ping rounded-full bg-signal/60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-signal shadow-[0_0_8px_1px_rgba(240,136,60,0.7)]" />
                  </span>
                </span>
                {/* label — beside the dot; hidden on phones (see list below) */}
                <div
                  className={`absolute top-0 hidden whitespace-nowrap sm:block ${
                    m.side === "left" ? "right-0 mr-3.5 text-right" : "left-0 ml-3.5"
                  }`}
                  style={{ transform: `translateY(calc(-50% + ${m.dy}px))` }}
                >
                  <div className="font-mono text-[13px] font-500 leading-tight text-paper">
                    {m.label}
                  </div>
                  <div className="font-mono text-[11px] leading-tight text-faint">
                    {m.sub}
                  </div>
                </div>
              </div>
            ))}

            <span className="absolute bottom-3 left-4 flex items-center gap-1.5 font-mono text-[10px] text-faint">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-signal" />
              operations · live
            </span>
            <span className="absolute bottom-3 right-4 font-mono text-[10px] text-faint">
              {MARKERS.length} sites · 2 regions
            </span>
          </div>

          {/* phones: the wide map is too short for pinned labels — list the sites */}
          <ul className="mt-6 grid grid-cols-2 gap-x-6 gap-y-2.5 sm:hidden">
            {MARKERS.map((m) => (
              <li key={m.label} className="flex items-center gap-2 font-mono text-[12px]">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-signal" />
                <span className="text-paper">{m.label}</span>
                <span className="text-faint">
                  {m.sub === "United States" ? "US" : "UK"}
                </span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
