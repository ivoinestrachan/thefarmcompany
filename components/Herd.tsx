import Reveal from "./Reveal";

type Unit = {
  name: string;
  role: string;
  img: string;
  body: string;
  specs: [string, string][];
};

const UNITS: Unit[] = [
  {
    name: "Grazer",
    role: "Weed removal",
    img: "https://images.unsplash.com/photo-1530267981375-f0de937f5f13?auto=format&fit=crop&w=1200&q=80",
    body: "The flagship soil bug. It identifies weeds by species with onboard vision and kills them mechanically — cutting, uprooting, and mulching them in place. No chemicals, and it never touches the crop or compacts a row.",
    specs: [
      ["Coverage", "8 acres / day"],
      ["Method", "Vision-guided cutting"],
      ["Chemicals", "None"],
    ],
  },
  {
    name: "Tiller",
    role: "Soil aeration",
    img: "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=1200&q=80",
    body: "A low, burrowing bug modeled on the earthworm. It opens micro-channels for air and water and injects biochar and microbial inoculant — rebuilding structure without inverting the profile.",
    specs: [
      ["Depth", "0–30 cm"],
      ["Adds", "Biochar + microbes"],
      ["Tillage", "Zero inversion"],
    ],
  },
  {
    name: "Scout",
    role: "Plant health sensing",
    img: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=1200&q=80",
    body: "A lightweight bug that walks the rows day and night, reading chlorophyll, moisture, and pest pressure per plant. Every reading streams straight into the farm dashboard.",
    specs: [
      ["Sensors", "Multispectral + LiDAR"],
      ["Cadence", "Continuous"],
      ["Resolution", "Per-plant"],
    ],
  },
];

export default function Herd() {
  return (
    <section id="herd" className="bg-paper py-28 lg:py-36">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <Reveal>
          <span className="eyebrow text-moss">The herd</span>
          <h2 className="display mt-5 max-w-3xl text-4xl text-ink sm:text-5xl lg:text-6xl">
            Three bugs. One regenerative loop.
          </h2>
          <p className="mt-6 max-w-2xl text-lg font-300 leading-relaxed text-ink/70">
            Each bug does one thing biology already knows how to do — we just
            made it autonomous, tireless, and legible to the farmer.
          </p>
        </Reveal>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {UNITS.map((u, i) => (
            <Reveal key={u.name} delay={i * 110}>
              <article className="card-pop group flex h-full flex-col overflow-hidden border hairline bg-bone">
                <div className="relative aspect-square overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={u.img}
                    alt={`${u.name} bug in the field`}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <span className="absolute left-4 top-4 rounded-full bg-paper/90 px-3 py-1 text-[11px] font-500 text-ink backdrop-blur">
                    {u.role}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="display text-3xl text-ink">{u.name}</h3>
                  <p className="mt-3 flex-1 text-[15px] leading-relaxed text-ink/65">
                    {u.body}
                  </p>
                  <dl className="mt-6 space-y-2 border-t hairline pt-4">
                    {u.specs.map(([k, v]) => (
                      <div key={k} className="flex justify-between text-[13px]">
                        <dt className="text-ink/45">{k}</dt>
                        <dd className="text-ink/80">{v}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
