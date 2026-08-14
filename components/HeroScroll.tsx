"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { createTimeline, stagger, utils } from "animejs";

/* -------------------------------------------------------------------------- */
/*  HeroScroll — the whole story in one pinned, scroll-scrubbed stage.          */
/*  The worm stays centre while the page scrolls through beats: intro → the     */
/*  herd → the exploded anatomy → the living-soil loop. Each beat annotates     */
/*  the model with thin monospace leader-line arrows (anime.js idiom).          */
/* -------------------------------------------------------------------------- */

const WormScene = dynamic(() => import("./WormScene"), {
  ssr: false,
  loading: () => <SceneFallback />,
});

// beat overlays keyed to scroll-progress windows [fadeInStart, fadeInEnd, fadeOutStart, fadeOutEnd]
const BEATS: Record<string, [number, number, number, number]> = {
  herd: [0.16, 0.23, 0.36, 0.43],
  anatomy: [0.45, 0.52, 0.66, 0.73],
  loop: [0.76, 0.83, 0.99, 1.0],
};

function smooth(p: number, a: number, b: number) {
  const t = Math.min(1, Math.max(0, (p - a) / (b - a)));
  return t * t * (3 - 2 * t);
}
const window4 = (p: number, w: [number, number, number, number]) =>
  smooth(p, w[0], w[1]) * (1 - smooth(p, w[2], w[3]));

function SplitLine({ text, accent = false }: { text: string; accent?: boolean }) {
  const words = text.split(" ");
  return (
    <>
      {words.map((word, wi) => (
        <span key={wi} className="inline-block whitespace-nowrap">
          {word.split("").map((ch, ci) => (
            <span key={ci} className={`hero-char inline-block ${accent ? "display-accent" : ""}`} style={{ opacity: 0 }}>
              {ch}
            </span>
          ))}
          {wi < words.length - 1 && (
            <span className="hero-char inline-block" style={{ opacity: 0, whiteSpace: "pre" }}>{" "}</span>
          )}
        </span>
      ))}
    </>
  );
}

export default function HeroScroll() {
  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const intro = useRef<HTMLDivElement>(null);
  const hint = useRef<HTMLDivElement>(null);
  const scrubFill = useRef<HTMLDivElement>(null);
  const scrubDot = useRef<HTMLDivElement>(null);
  const scrubPct = useRef<HTMLSpanElement>(null);
  const beatRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const progressRef = useRef(0);
  // live screen positions of the worm's 7 segments (0..1), filled by WormScene
  const anchorsRef = useRef(Array.from({ length: 7 }, () => ({ x: 0.5, y: 0.5 })));
  // registered leader lines → the segment index each one connects to
  const linesRef = useRef<Record<string, { el: SVGLineElement; seg: number }>>({});
  const register = (key: string, el: SVGLineElement, seg: number) => {
    linesRef.current[key] = { el, seg };
  };

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const el = section.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        const vh = window.innerHeight;
        const dist = rect.height - vh;
        const p = dist > 0 ? Math.min(1, Math.max(0, -rect.top / dist)) : 0;
        progressRef.current = p;

        // fade the hero in as it scrolls up into view — crossfades with the
        // intro dissolving out, so entering the section feels like a transition
        if (stage.current) {
          const entry = Math.min(1, Math.max(0, 1 - rect.top / (vh * 0.75)));
          stage.current.style.opacity = `${smooth(entry, 0, 1)}`;
        }

        const introOut = smooth(p, 0.05, 0.14);
        if (intro.current) {
          intro.current.style.opacity = `${1 - introOut}`;
          intro.current.style.transform = `translateY(${-introOut * 42}px)`;
          intro.current.style.pointerEvents = introOut > 0.6 ? "none" : "auto";
        }
        for (const key in BEATS) {
          const node = beatRefs.current[key];
          if (node) {
            const o = window4(p, BEATS[key]);
            node.style.opacity = `${o}`;
            node.style.transform = `translateY(${(1 - o) * 16}px)`;
          }
        }
        if (hint.current) hint.current.style.opacity = `${1 - smooth(p, 0, 0.06)}`;
        if (scrubFill.current) scrubFill.current.style.width = `${p * 100}%`;
        if (scrubDot.current) scrubDot.current.style.left = `${p * 100}%`;
        if (scrubPct.current)
          scrubPct.current.textContent = `${String(Math.round(p * 100)).padStart(2, "0")}%`;

        // connect each leader line to its worm segment's live screen position
        const A = anchorsRef.current;
        for (const key in linesRef.current) {
          const { el, seg } = linesRef.current[key];
          const a = A[seg];
          if (a) {
            el.setAttribute("x2", `${a.x * 100}`);
            el.setAttribute("y2", `${a.y * 100}`);
          }
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const scope = stage.current;
    if (!scope) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hidden = scope.querySelectorAll<HTMLElement>("[data-anim]");
    const chars = scope.querySelectorAll<HTMLElement>(".hero-char");
    if (reduce) {
      utils.set([...hidden, ...chars], { opacity: 1, translateY: 0 });
      return;
    }
    const tl = createTimeline({ defaults: { ease: "out(3)", duration: 720 } });
    tl.add(".hero-eyebrow", { opacity: [0, 1], translateY: [14, 0] })
      .add(chars, { opacity: [0, 1], translateY: [46, 0], duration: 640, delay: stagger(15) }, "-=340")
      .add(".hero-sub", { opacity: [0, 1], translateY: [16, 0] }, "-=250")
      .add(".hero-cta", { opacity: [0, 1], translateY: [16, 0] }, "-=450");
    return () => {
      tl.pause();
    };
  }, []);

  const scrollOn = () => {
    window.scrollBy({ top: window.innerHeight * 1.1, behavior: "smooth" });
  };

  const setBeat = (key: string) => (n: HTMLDivElement | null) => {
    beatRefs.current[key] = n;
  };

  return (
    <section ref={section} id="hero" className="relative h-[420vh]">
      <div ref={stage} className="sticky top-0 flex h-screen items-center overflow-hidden bg-char">
        <div className="grid-dot pointer-events-none absolute inset-0 opacity-40" />
        <Burrow />

        {/* the worm — pinned centrepiece, crawling through the burrow */}
        <div className="pointer-events-none absolute inset-0">
          <WormScene progressRef={progressRef} anchorsRef={anchorsRef} />
        </div>

        {/* BEAT · intro */}
        <div className="relative mx-auto w-full max-w-7xl px-6 lg:px-10">
          <div ref={intro} className="max-w-xl">
            <span className="hero-eyebrow eyebrow" data-anim style={{ opacity: 0 }}>
              Regenerative field robotics
            </span>
            <h1 className="display mt-5 text-paper text-[12.5vw] leading-[0.9] sm:text-[9vw] lg:text-[4.9rem]">
              <SplitLine text="Autonomous" />
              <br />
              <SplitLine text="bugs that" />
              <br />
              <SplitLine text="kill weeds." accent />
            </h1>
            <p className="hero-sub mt-6 max-w-sm text-sm leading-relaxed text-fog" data-anim style={{ opacity: 0 }}>
              Small robots that eat the weeds instead of spraying them. They
              loosen and feed the soil the way earthworms do, and send you live
              readings from every plant and every acre.
            </p>
            <div className="hero-cta mt-7 flex flex-wrap items-center gap-4" data-anim style={{ opacity: 0 }}>
              <a href="#contact" className="rounded-md bg-signal px-6 py-3 font-mono text-sm font-700 text-ink transition-opacity hover:opacity-90">
                Talk to us
              </a>
              <button type="button" onClick={scrollOn} className="group inline-flex items-center gap-2 px-1 py-2 font-mono text-sm text-paper transition-colors hover:text-signal">
                see how it works
                <span className="transition-transform duration-300 group-hover:translate-y-0.5">↓</span>
              </button>
            </div>
          </div>
        </div>

        {/* BEAT · the bug */}
        <Beat innerRef={setBeat("herd")} beatKey="herd" register={register} eyebrow="The Grazer" title="One bug," accent="every job."
          left={["pulls weeds", "aerates soil"]}
          right={["reads plants", "zero chemicals", "8 ac / day"]}
        />

        {/* BEAT · anatomy (worm explodes here) */}
        <Beat innerRef={setBeat("anatomy")} beatKey="anatomy" register={register} eyebrow="Anatomy · Grazer G-04" title="Inside" accent="the Grazer."
          left={["chassis spine", "peristaltic drive", "support insert"]}
          right={["vision sensor", "segment ring", "moisture probe"]}
        />

        {/* BEAT · the living-soil loop */}
        <Beat innerRef={setBeat("loop")} beatKey="loop" register={register} eyebrow="Living-soil loop" title="Eats the weeds," accent="heals the soil."
          left={["pulls weeds", "adds microbes"]}
          right={["plant health", "soil telemetry", "rebuilds soil"]}
        />

        {/* scroll hint */}
        <div ref={hint} className="pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
          <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-faint">scroll</div>
          <div className="mt-1 text-signal">↓</div>
        </div>

        {/* timeline scrubber */}
        <div className="pointer-events-none absolute bottom-8 right-4 flex items-center gap-2 sm:gap-3 lg:right-10">
          <span ref={scrubPct} className="font-mono text-[11px] text-fog">00%</span>
          <div className="relative h-3 w-24 overflow-hidden rounded-full border hairline bg-char2 sm:w-56">
            <div className="pointer-events-none absolute inset-0 opacity-40" style={{ backgroundImage: "repeating-linear-gradient(90deg, rgba(246,244,242,0.5) 0 1px, transparent 1px 7px)" }} />
            <div ref={scrubFill} className="absolute inset-y-0 left-0 w-0 bg-signal/25" />
            <div ref={scrubDot} className="absolute top-1/2 h-4 w-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-signal" style={{ left: "0%", boxShadow: "0 0 8px 0 rgba(246,244,242,0.55)" }} />
          </div>
        </div>
      </div>
    </section>
  );
}

function Beat({
  innerRef,
  beatKey,
  register,
  eyebrow,
  title,
  accent,
  left,
  right,
}: {
  innerRef: (n: HTMLDivElement | null) => void;
  beatKey: string;
  register: (key: string, el: SVGLineElement, seg: number) => void;
  eyebrow: string;
  title: string;
  accent: string;
  left: string[];
  right: string[];
}) {
  // Labels sit in tidy columns beside the worm; each line's far end is updated
  // every frame to the live screen position of its segment (see HeroScroll rAF).
  // Right labels map to head-side segments (6,5,4), left to tail-side (0,1,2).
  const rCol = (i: number) => ({ x: 63, y: 30 + i * 11 });
  const lCol = (i: number) => ({ x: 37, y: 44 + i * 11 });
  const stroke = "rgba(246,244,242,0.5)";

  return (
    <div ref={innerRef} className="pointer-events-none absolute inset-0 opacity-0" aria-hidden>
      <div className="mx-auto flex max-w-7xl flex-col px-6 pt-24 lg:px-10 lg:pt-28">
        <span className="eyebrow">{eyebrow}</span>
        <h2 className="display mt-4 max-w-xl text-paper text-4xl leading-[0.95] sm:text-5xl lg:text-6xl">
          {title} <span className="display-accent">{accent}</span>
        </h2>
      </div>

      {/* leader lines — far end tracks the actual worm segment */}
      <svg
        className="absolute inset-0 hidden h-full w-full md:block"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {right.map((l, i) => {
          const c = rCol(i);
          return (
            <line
              key={l}
              ref={(el) => {
                if (el) register(`${beatKey}-r-${i}`, el, 6 - i);
              }}
              x1={c.x}
              y1={c.y}
              x2={c.x}
              y2={c.y}
              stroke={stroke}
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
        {left.map((l, i) => {
          const c = lCol(i);
          return (
            <line
              key={l}
              ref={(el) => {
                if (el) register(`${beatKey}-l-${i}`, el, i);
              }}
              x1={c.x}
              y1={c.y}
              x2={c.x}
              y2={c.y}
              stroke={stroke}
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
      </svg>

      {/* labels at the outer end of each leader */}
      {right.map((l, i) => {
        const c = rCol(i);
        return (
          <span
            key={l}
            className="absolute hidden font-mono text-[11px] lowercase tracking-wide text-paper/90 md:block"
            style={{ left: `${c.x + 1}%`, top: `${c.y}%`, transform: "translateY(-50%)" }}
          >
            {l}
          </span>
        );
      })}
      {left.map((l, i) => {
        const c = lCol(i);
        return (
          <span
            key={l}
            className="absolute hidden text-right font-mono text-[11px] lowercase tracking-wide text-paper/90 md:block"
            style={{ left: `${c.x - 1}%`, top: `${c.y}%`, transform: "translate(-100%, -50%)" }}
          >
            {l}
          </span>
        );
      })}
    </div>
  );
}

// Fixed positions so SSR and client render the same motes (no hydration drift).
const MOTES = [
  { l: "20%", t: "40%", d: "0s" },
  { l: "32%", t: "58%", d: "1.2s" },
  { l: "44%", t: "46%", d: "2.4s" },
  { l: "56%", t: "62%", d: "0.6s" },
  { l: "62%", t: "38%", d: "3s" },
  { l: "70%", t: "54%", d: "1.8s" },
  { l: "26%", t: "66%", d: "2.1s" },
  { l: "50%", t: "34%", d: "3.6s" },
  { l: "38%", t: "70%", d: "0.9s" },
  { l: "66%", t: "44%", d: "2.7s" },
];

/* Monochrome burrow — soil above and below, faint strata, drifting motes. */
function Burrow() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* darker ground above and below, leaving a lit channel for the worm */}
      <div className="absolute inset-x-0 top-0 h-[34%] bg-gradient-to-b from-black/50 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-[34%] bg-gradient-to-t from-black/50 to-transparent" />
      {/* loose soil drifting through the channel */}
      {MOTES.map((m, i) => (
        <span
          key={i}
          className="mote absolute h-[2px] w-[2px] rounded-full bg-paper/30"
          style={{ left: m.l, top: m.t, animationDelay: m.d }}
        />
      ))}
    </div>
  );
}

function SceneFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="h-40 w-40 rounded-full border border-signal/30 spin-slow" />
    </div>
  );
}
