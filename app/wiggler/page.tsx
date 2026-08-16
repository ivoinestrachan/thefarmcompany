import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import FooterBar from "@/components/FooterBar";
import SmoothScroll from "@/components/SmoothScroll";

export const metadata: Metadata = {
  title: "The Wiggler · The Farming Company",
  description:
    "The Wiggler — an autonomous segmented soil robot that pulls weeds mechanically, aerates and feeds the soil, and streams live readings from every plant and every acre.",
};

const SPECS: { heading: string; items: string[] }[] = [
  {
    heading: "What it does",
    items: ["Pulls weeds mechanically", "Aerates the soil", "Reads every plant", "Zero chemicals", "8 acres / day"],
  },
  {
    heading: "Anatomy",
    items: ["Chassis spine", "Peristaltic drive", "Support insert", "Vision sensor", "Segment ring", "Moisture probe"],
  },
  {
    heading: "Living-soil loop",
    items: ["Adds microbes", "Tracks plant health", "Soil telemetry", "Rebuilds topsoil"],
  },
];

export default function WigglerPage() {
  return (
    <main className="bg-char">
      <SmoothScroll />
      <Navbar />

      {/* hero */}
      <section className="relative flex min-h-screen flex-col justify-end overflow-hidden px-6 pb-16 pt-28 lg:px-10 lg:pb-24">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[26rem] w-[52rem] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 rounded-[50%] bg-[radial-gradient(ellipse,rgba(242,239,233,0.12),transparent_65%)] blur-2xl" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/worm.webp"
          alt="The Wiggler — an autonomous segmented soil robot"
          className="pointer-events-none absolute left-1/2 top-1/2 w-[70%] max-w-3xl -translate-x-1/2 -translate-y-[58%] drop-shadow-[0_30px_60px_rgba(0,0,0,0.7)]"
        />

        <div className="relative mx-auto w-full max-w-7xl">
          <a
            href="/#hero"
            className="group inline-flex items-center gap-2 text-[14px] text-fog transition-colors hover:text-paper"
          >
            <span className="transition-transform duration-300 group-hover:-translate-x-1">←</span>
            Back
          </a>
          <div className="mt-10">
            <span className="eyebrow">Wiggler W-04</span>
          </div>
          <h1 className="display mt-4 text-paper text-[20vw] leading-[0.82] sm:text-[16vw] lg:text-[11rem]">
            The Wiggler
          </h1>
          <p className="mt-8 max-w-xl font-mono text-[13px] uppercase leading-relaxed tracking-wide text-paper/80">
            An autonomous segmented soil robot. It pulls weeds mechanically, loosens
            and feeds the soil the way an earthworm does, and streams live readings
            from every plant and every acre.
          </p>
        </div>
      </section>

      {/* specs */}
      <section className="border-t hairline py-20 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-x-10 gap-y-14 px-6 sm:grid-cols-3 lg:px-10">
          {SPECS.map((s) => (
            <div key={s.heading}>
              <h2 className="font-mono text-[0.72rem] uppercase tracking-[0.24em] text-faint">
                {s.heading}
              </h2>
              <ul className="mt-5 flex flex-col gap-3 border-t hairline pt-5">
                {s.items.map((it) => (
                  <li key={it} className="flex items-center gap-3 text-[15px] text-paper">
                    <span className="h-1 w-1 shrink-0 rounded-full bg-signal" />
                    {it}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* CTA strip */}
      <section className="border-t hairline py-20 text-center lg:py-28">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="display text-paper text-4xl leading-[0.95] sm:text-5xl lg:text-6xl">
            Put the Wiggler to work on your land.
          </h2>
          <a
            href="/#contact"
            className="mt-8 inline-flex text-[15px] text-paper transition-colors hover:text-fog"
          >
            Talk to us
          </a>
        </div>
      </section>

      <FooterBar />
    </main>
  );
}
