import Image from "next/image";
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
    body: "Our flagship soil bug. It identifies weeds by species with onboard cameras and removes them mechanically, cutting and uprooting them in place. No chemicals, and it never touches the crop or compacts a row.",
    specs: [
      ["coverage", "8 acres / day"],
      ["method", "vision-guided cut"],
      ["chemicals", "none"],
    ],
  },
  {
    name: "Tiller",
    role: "Soil aeration",
    img: "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=1200&q=80",
    body: "A low, burrowing bug based on the earthworm. It opens small channels for air and water and adds biochar and microbes, rebuilding soil structure without ever turning it over.",
    specs: [
      ["depth", "0–30 cm"],
      ["adds", "biochar + microbes"],
      ["tillage", "zero inversion"],
    ],
  },
  {
    name: "Scout",
    role: "Plant health sensing",
    img: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=1200&q=80",
    body: "A light bug that walks the rows day and night, reading chlorophyll, moisture, and pest pressure on each plant. Every reading goes straight to your dashboard.",
    specs: [
      ["sensors", "multispectral + LiDAR"],
      ["cadence", "continuous"],
      ["resolution", "per-plant"],
    ],
  },
];

export default function Herd() {
  return (
    <section id="herd" className="border-t hairline bg-char py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <Reveal>
          <span className="eyebrow">The herd</span>
          <h2 className="display mt-6 max-w-3xl text-3xl text-paper sm:text-5xl lg:text-6xl">
            Three bugs, one regenerative loop.
          </h2>
          <p className="mt-6 max-w-2xl text-lg font-300 leading-relaxed text-fog">
            Each bug does one job that nature already knows how to do. We made it
            autonomous, tireless, and easy for the farmer to follow.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {UNITS.map((u, i) => (
            <Reveal key={u.name} delay={i * 110}>
              <article className="card-pop group flex h-full flex-col overflow-hidden rounded-xl border hairline bg-char2 hover:border-signal/40">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={u.img}
                    alt={`${u.name} bug in the field`}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover grayscale-[0.35] transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-char2 via-transparent to-transparent" />
                  <span className="tag absolute left-4 top-4 border-signal/30 bg-char/80 text-signal backdrop-blur">
                    {u.role}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-baseline justify-between">
                    <h3 className="display text-3xl text-paper">{u.name}</h3>
                    <span className="font-mono text-[11px] text-faint">
                      unit {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <p className="mt-3 flex-1 text-[15px] leading-relaxed text-fog">
                    {u.body}
                  </p>
                  <dl className="mt-6 space-y-2 border-t hairline pt-4 font-mono text-[12px]">
                    {u.specs.map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-3">
                        <dt className="text-faint">{k}</dt>
                        <dd className="text-right text-paper/80">{v}</dd>
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
