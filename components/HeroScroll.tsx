"use client";

import { useEffect, useRef } from "react";
import { createTimeline, stagger, utils } from "animejs";

/* -------------------------------------------------------------------------- */
/*  HeroScroll — a pinned, scroll-scrubbed stage. The robot stays centre while  */
/*  the page scrolls through beats: intro → the bug → inside it → the living-   */
/*  soil loop. Each beat fades a short spec list over the machine.              */
/* -------------------------------------------------------------------------- */

// beat overlays keyed to scroll-progress windows [fadeInStart, fadeInEnd, fadeOutStart, fadeOutEnd]
const BEATS: Record<string, [number, number, number, number]> = {
  herd: [0.16, 0.24, 0.4, 0.48],
  anatomy: [0.5, 0.58, 0.72, 0.8],
  loop: [0.82, 0.88, 0.99, 1.0],
};

function smooth(p: number, a: number, b: number) {
  const t = Math.min(1, Math.max(0, (p - a) / (b - a)));
  return t * t * (3 - 2 * t);
}
const window4 = (p: number, w: [number, number, number, number]) =>
  smooth(p, w[0], w[1]) * (1 - smooth(p, w[2], w[3]));

function SplitLine({ text }: { text: string }) {
  const words = text.split(" ");
  return (
    <>
      {words.map((word, wi) => (
        <span key={wi} className="inline-block whitespace-nowrap">
          {word.split("").map((ch, ci) => (
            <span key={ci} className="hero-char inline-block" style={{ opacity: 0 }}>
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
  const robotWrap = useRef<HTMLDivElement>(null);
  const glow = useRef<HTMLDivElement>(null);
  const hint = useRef<HTMLDivElement>(null);
  const beatRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    let raf = 0;
    let lastScroll = window.scrollY;
    let glowVal = 0;
    const loop = () => {
      // scroll velocity → a soft glow + slight blur on the robot, decays when idle
      const nowY = window.scrollY;
      glowVal = Math.max(Math.abs(nowY - lastScroll), glowVal * 0.9);
      lastScroll = nowY;
      const g = Math.min(1, glowVal / 70);
      if (robotWrap.current)
        robotWrap.current.style.filter = g > 0.01 ? `blur(${(g * 3).toFixed(2)}px)` : "none";
      if (glow.current) glow.current.style.opacity = `${(0.35 + g * 0.4).toFixed(3)}`;

      const el = section.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        const vh = window.innerHeight;
        const dist = rect.height - vh;
        const p = dist > 0 ? Math.min(1, Math.max(0, -rect.top / dist)) : 0;

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
    <section ref={section} id="hero" className="relative h-[360vh]">
      <div ref={stage} className="sticky top-0 flex h-screen items-start overflow-hidden bg-char md:items-center">
        <div className="grid-dot pointer-events-none absolute inset-0 opacity-30" />

        {/* backlight behind the machine, lifting it off the black */}
        <div
          ref={glow}
          className="pointer-events-none absolute left-1/2 top-1/2 h-[26rem] w-[52rem] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 rounded-[50%] bg-[radial-gradient(ellipse,rgba(242,239,233,0.14),transparent_65%)] blur-2xl"
        />

        {/* the robot — pinned centrepiece */}
        <div ref={robotWrap} className="pointer-events-none absolute inset-0 flex items-center justify-center will-change-[filter]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/worm.webp"
            alt="The Grazer — an autonomous segmented soil robot"
            className="w-[54%] max-w-2xl drop-shadow-[0_30px_60px_rgba(0,0,0,0.7)]"
          />
        </div>

        {/* BEAT · intro */}
        <div className="relative mx-auto w-full max-w-7xl px-6 pt-24 md:pt-0 lg:px-10">
          <div ref={intro} className="max-w-xl">
            <span className="hero-eyebrow eyebrow" data-anim style={{ opacity: 0 }}>
              Regenerative field robotics
            </span>
            <h1 className="display mt-5 text-paper text-[12.5vw] leading-[0.9] sm:text-[9vw] lg:text-[4.9rem]">
              <SplitLine text="Autonomous" />
              <br />
              <SplitLine text="bugs that" />
              <br />
              <SplitLine text="kill weeds." />
            </h1>
            <p className="hero-sub mt-6 max-w-sm text-sm leading-relaxed text-fog" data-anim style={{ opacity: 0 }}>
              Small robots that eat the weeds instead of spraying them. They
              loosen and feed the soil the way earthworms do, and send you live
              readings from every plant and every acre.
            </p>
            <div className="hero-cta mt-7 flex flex-wrap items-center gap-4" data-anim style={{ opacity: 0 }}>
              <a href="#contact" className="group inline-flex items-center gap-2 py-2 text-[15px] text-paper transition-colors hover:text-fog">
                Talk to us
                <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
              </a>
              <button type="button" onClick={scrollOn} className="group inline-flex items-center gap-2 px-1 py-2 text-[15px] text-fog transition-colors hover:text-paper">
                see how it works
                <span className="transition-transform duration-300 group-hover:translate-y-0.5">↓</span>
              </button>
            </div>
          </div>
        </div>

        {/* BEAT · the bug */}
        <Beat innerRef={setBeat("herd")} eyebrow="The Grazer" title="One bug," accent="every job."
          items={["pulls weeds", "aerates soil", "reads plants", "zero chemicals", "8 ac / day"]}
        />

        {/* BEAT · inside */}
        <Beat innerRef={setBeat("anatomy")} eyebrow="Anatomy · Grazer G-04" title="Inside" accent="the Grazer."
          items={["chassis spine", "peristaltic drive", "support insert", "vision sensor", "segment ring", "moisture probe"]}
        />

        {/* BEAT · the living-soil loop */}
        <Beat innerRef={setBeat("loop")} eyebrow="Living-soil loop" title="Eats the weeds," accent="heals the soil."
          items={["pulls weeds", "adds microbes", "plant health", "soil telemetry", "rebuilds soil"]}
        />

        {/* scroll hint */}
        <div ref={hint} className="pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
          <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-faint">scroll</div>
          <svg width="26" height="11" viewBox="0 0 26 11" fill="none" aria-hidden className="mx-auto mt-2.5 text-paper/70">
            <path d="M1 1l12 8.5L25 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    </section>
  );
}

function Beat({
  innerRef,
  eyebrow,
  title,
  accent,
  items,
}: {
  innerRef: (n: HTMLDivElement | null) => void;
  eyebrow: string;
  title: string;
  accent: string;
  items: string[];
}) {
  return (
    <div ref={innerRef} className="pointer-events-none absolute inset-0 opacity-0" aria-hidden>
      <div className="mx-auto flex h-full max-w-7xl flex-col justify-start px-6 pt-24 md:justify-end md:pb-24 lg:px-10">
        <span className="eyebrow">{eyebrow}</span>
        <h2 className="display mt-4 max-w-xl text-paper text-4xl leading-[0.95] sm:text-5xl lg:text-6xl">
          {title} <span className="display-accent">{accent}</span>
        </h2>
        <ul className="mt-7 grid max-w-md grid-cols-2 gap-x-6 gap-y-2.5">
          {items.map((l) => (
            <li key={l} className="flex items-center gap-2 font-mono text-[12px] lowercase text-fog">
              <span className="h-1 w-1 shrink-0 rounded-full bg-signal" />
              {l}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
