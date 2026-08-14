import Reveal from "./Reveal";

/* -------------------------------------------------------------------------- */
/*  Capabilities — a big statement on the left, an oversized index of what we   */
/*  build on the right. Arrow links go green on hover.                          */
/* -------------------------------------------------------------------------- */

const AREAS: { title: string; href: string }[] = [
  { title: "Mechanical Weeding", href: "#herd" },
  { title: "Living Soil", href: "#soil" },
  { title: "Per-Plant Sensing", href: "#herd" },
  { title: "Live Field Map", href: "#dashboard" },
  { title: "Zero Chemicals", href: "#problem" },
  { title: "Carbon in the Ground", href: "#soil" },
];

export default function Capabilities() {
  return (
    <section id="work" className="border-t hairline bg-char py-24 lg:py-36">
      <div className="mx-auto grid max-w-7xl gap-14 px-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20 lg:px-10">
        <Reveal>
          <span className="eyebrow">What we build</span>
          <h2 className="display mt-7 text-4xl leading-[1.0] text-paper sm:text-5xl lg:text-[4.4rem]">
            Working the ground beneath every harvest.
          </h2>
          <p className="mt-6 max-w-sm font-mono text-[13px] leading-relaxed text-fog">
            Six systems, one job: take chemicals out of the field and put life
            back into the soil.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 gap-x-12 sm:grid-cols-2">
          {AREAS.map((a, i) => (
            <Reveal key={a.title} delay={i * 70}>
              <a
                href={a.href}
                className="arrow-link group flex items-end justify-between gap-4 border-b hairline py-7 text-2xl text-paper transition-colors hover:text-signal sm:min-h-[9rem] lg:text-[2.4rem]"
              >
                <span className="max-w-[9ch]">{a.title}</span>
                <span className="arrow mb-2 shrink-0 text-xl text-fog transition-colors group-hover:text-signal">
                  →
                </span>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
