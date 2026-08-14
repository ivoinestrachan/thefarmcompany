"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { animate, stagger, utils } from "animejs";

/* -------------------------------------------------------------------------- */
/*  SoftwareTour — the app, explained with leader-line arrows (anime.js).       */
/*  A live console frame in the centre; callouts in the gutters draw their      */
/*  connector lines and fade in when the section scrolls into view.             */
/* -------------------------------------------------------------------------- */

type Note = { title: string; body: string };

const LEFT: Note[] = [
  { title: "Live field map", body: "Every zone and every bug, plotted in real time." },
  { title: "Detection pins", body: "Weeds, moisture dips and bug positions, flagged where they are." },
];
const RIGHT: Note[] = [
  { title: "Soil health index", body: "One number for the whole field — and it's rising." },
  { title: "Plain-language alerts", body: "What to do today, in words, not just charts." },
];

export default function SoftwareTour() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scope = root.current;
    if (!scope) return;

    const lines = scope.querySelectorAll<SVGPathElement>(".tour-line");
    const heads = scope.querySelectorAll<HTMLElement>(".tour-head");
    const notes = scope.querySelectorAll<HTMLElement>(".tour-note");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduce) {
      utils.set(lines, { strokeDashoffset: 0 });
      utils.set([...heads, ...notes], { opacity: 1, translateX: 0 });
      return;
    }

    utils.set(lines, { strokeDashoffset: 200 });
    utils.set(heads, { opacity: 0 });
    utils.set(notes, { opacity: 0, translateY: 12 });

    let done = false;
    const io = new IntersectionObserver(
      (entries) => {
        if (done || !entries[0].isIntersecting) return;
        done = true;
        io.disconnect();
        animate(lines, {
          strokeDashoffset: [200, 0],
          duration: 700,
          delay: stagger(120),
          ease: "out(3)",
        });
        animate(notes, {
          opacity: [0, 1],
          translateY: [12, 0],
          duration: 650,
          delay: stagger(120, { start: 150 }),
          ease: "out(3)",
        });
        animate(heads, {
          opacity: [0, 1],
          scale: [0.4, 1],
          duration: 400,
          delay: stagger(120, { start: 500 }),
          ease: "out(4)",
        });
      },
      { threshold: 0.35 }
    );
    io.observe(scope);
    return () => io.disconnect();
  }, []);

  return (
    <section id="software" className="border-t hairline bg-char2 py-24 lg:py-32">
      <div ref={root} className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="max-w-2xl">
          <span className="eyebrow">The software</span>
          <h2 className="display mt-6 text-3xl text-paper sm:text-5xl lg:text-6xl">
            See your whole farm <span className="display-accent">think.</span>
          </h2>
          <p className="mt-6 max-w-xl text-lg font-300 leading-relaxed text-fog">
            The herd streams what it sees into one console. Here is what it shows
            you, and what it tells you to do about it.
          </p>
        </div>

        {/* annotated app */}
        <div className="mt-16 grid items-center gap-6 lg:grid-cols-[1fr_1.5fr_1fr]">
          {/* left notes */}
          <div className="flex flex-col gap-10 lg:items-end">
            {LEFT.map((n) => (
              <Note key={n.title} note={n} side="left" />
            ))}
          </div>

          {/* the console */}
          <AppFrame />

          {/* right notes */}
          <div className="flex flex-col gap-10">
            {RIGHT.map((n) => (
              <Note key={n.title} note={n} side="right" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Note({ note, side }: { note: Note; side: "left" | "right" }) {
  const reversed = side === "left";
  return (
    <div
      className={`tour-note flex items-center gap-3 ${
        reversed ? "lg:flex-row" : "lg:flex-row-reverse"
      }`}
    >
      <div className={`max-w-[15rem] ${reversed ? "lg:text-right" : "lg:text-left"}`}>
        <div className="font-mono text-[12px] uppercase tracking-[0.12em] text-paper">
          {note.title}
        </div>
        <p className="mt-1.5 text-[13px] leading-relaxed text-fog">{note.body}</p>
      </div>

      {/* connector: thin leader line + node dot, anime.js style */}
      <svg
        width="100"
        height="10"
        viewBox="0 0 100 10"
        className="hidden shrink-0 lg:block"
        aria-hidden
      >
        <path
          className="tour-line"
          d={reversed ? "M2 5 H90" : "M98 5 H10"}
          stroke="rgba(246,244,242,0.3)"
          strokeWidth="1"
          strokeDasharray="200"
          fill="none"
        />
        <circle
          className="tour-head"
          cx={reversed ? 90 : 10}
          cy="5"
          r="2.5"
          fill="#b7ff54"
          style={{ opacity: 0 }}
        />
      </svg>
    </div>
  );
}

function AppFrame() {
  return (
    <div className="overflow-hidden rounded-xl border hairline bg-char3 shadow-[0_40px_100px_-40px_rgba(0,0,0,0.8)]">
      {/* chrome */}
      <div className="flex items-center justify-between border-b hairline px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <div className="flex gap-1.5">
            <span className="h-2 w-2 rounded-full bg-paper/15" />
            <span className="h-2 w-2 rounded-full bg-paper/15" />
            <span className="h-2 w-2 rounded-full bg-paper/15" />
          </div>
          <span className="font-mono text-[11px] text-fog">the-farm · console</span>
        </div>
        <span className="flex items-center gap-1.5 font-mono text-[11px] text-signal">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-signal" />
          streaming
        </span>
      </div>

      {/* map */}
      <div className="relative aspect-[16/10] w-full overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1560493676-04071c5f467b?auto=format&fit=crop&w=1400&q=80"
          alt="Live field map"
          fill
          sizes="(min-width: 1024px) 42vw, 100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-char/30" />

        <MapPin x="28%" y="42%" label="Zone A · thriving" tone="signal" />
        <MapPin x="63%" y="38%" label="Moisture dip" tone="soil" />
        <MapPin x="46%" y="72%" label="Grazer · G-04" tone="paper" />

        <div className="pointer-events-none absolute inset-3">
          {[
            "left-0 top-0 border-l border-t",
            "right-0 top-0 border-r border-t",
            "left-0 bottom-0 border-l border-b",
            "right-0 bottom-0 border-r border-b",
          ].map((c) => (
            <span key={c} className={`absolute h-4 w-4 border-signal/70 ${c}`} />
          ))}
        </div>
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="scanline h-px w-full bg-gradient-to-r from-transparent via-signal to-transparent shadow-[0_0_12px_2px] shadow-signal/40" />
        </div>
        <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-char/70 px-2.5 py-1 font-mono text-[10px] text-paper backdrop-blur">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-signal" />
          live · 12 bugs active
        </div>
      </div>

      {/* readout strip */}
      <div className="grid grid-cols-3 gap-px border-t hairline bg-white/[0.06]">
        <div className="bg-char3 p-4">
          <div className="font-mono text-[10px] uppercase tracking-wider text-faint">
            soil health
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="display text-2xl text-paper">78</span>
            <span className="font-mono text-[11px] text-signal">▲ rising</span>
          </div>
        </div>
        <div className="bg-char3 p-4">
          <div className="font-mono text-[10px] uppercase tracking-wider text-faint">
            moisture
          </div>
          <div className="mt-1 text-2xl text-paper">62%</div>
        </div>
        <div className="bg-char3 p-4">
          <div className="font-mono text-[10px] uppercase tracking-wider text-faint">
            action
          </div>
          <div className="mt-1 font-mono text-[12px] leading-tight text-signal">
            Irrigate plot 14 today
          </div>
        </div>
      </div>
    </div>
  );
}

function MapPin({
  x,
  y,
  label,
  tone,
}: {
  x: string;
  y: string;
  label: string;
  tone: "signal" | "soil" | "paper";
}) {
  const dot = tone === "signal" ? "bg-signal" : tone === "soil" ? "bg-soil" : "bg-paper";
  return (
    <div
      className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5"
      style={{ left: x, top: y }}
    >
      <span className={`h-2.5 w-2.5 rounded-full ${dot} ring-2 ring-char/70`} />
      <span className="whitespace-nowrap rounded-full bg-char/85 px-2 py-0.5 font-mono text-[9px] text-paper backdrop-blur">
        {label}
      </span>
    </div>
  );
}
