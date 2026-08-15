"use client";

import { useEffect, useRef, useState } from "react";
import { createTimeline, stagger, utils } from "animejs";

/* -------------------------------------------------------------------------- */
/*  Intro — a one-screen aerial opening that dissolves as it scrolls away.      */
/*  The drone footage fades and zooms while the wordmark rises, handing off to  */
/*  the worm hero directly below (no empty gap). Falls back to a still frame.   */
/* -------------------------------------------------------------------------- */

const VIDEOS = [
  "https://videos.pexels.com/video-files/38942518/16564220_1920_1080_25fps.mp4", // grazing cows, NZ hillside
  "https://videos.pexels.com/video-files/36827757/15603483_1920_1080_30fps.mp4", // green tractor
  "https://videos.pexels.com/video-files/7913058/7913058-hd_1920_1080_30fps.mp4", // fumigation spraying
  "https://videos.pexels.com/video-files/3045869/3045869-hd_1920_1080_24fps.mp4", // earthworms close-up
];
const POSTER =
  "https://images.unsplash.com/photo-1560493676-04071c5f467b?auto=format&fit=crop&w=2400&q=80";

const WORDS = ["the", "farming", "company"];

function smooth(p: number, a: number, b: number) {
  const t = Math.min(1, Math.max(0, (p - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

export default function Intro() {
  const section = useRef<HTMLElement>(null);
  const media = useRef<HTMLDivElement>(null);
  const brand = useRef<HTMLDivElement>(null);
  const hint = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  // cycle through the clips — each holds ~3s, then crossfades to the next
  useEffect(() => {
    const id = window.setInterval(
      () => setActive((a) => (a + 1) % VIDEOS.length),
      4000
    );
    return () => window.clearInterval(id);
  }, []);

  // dissolve as the intro scrolls out of view (no pinning → no gap)
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const el = section.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        const exit = Math.min(1, Math.max(0, -rect.top / window.innerHeight));
        if (media.current) {
          media.current.style.opacity = `${1 - smooth(exit, 0.1, 0.9) * 0.85}`;
          media.current.style.transform = `scale(${1 + smooth(exit, 0, 1) * 0.14})`;
        }
        if (brand.current) {
          const out = smooth(exit, 0, 0.55);
          brand.current.style.opacity = `${1 - out}`;
          brand.current.style.transform = `translateY(${-out * 48}px)`;
        }
        if (hint.current) hint.current.style.opacity = `${1 - smooth(exit, 0, 0.18)}`;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // load-in
  useEffect(() => {
    const el = section.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const marked = el.querySelectorAll<HTMLElement>("[data-in]");
    const words = el.querySelectorAll<HTMLElement>(".intro-word");
    if (reduce) {
      utils.set([...marked, ...words], { opacity: 1, translateY: 0 });
      return;
    }
    const tl = createTimeline({ defaults: { ease: "out(3)", duration: 800 } });
    tl.add(".intro-eyebrow", { opacity: [0, 1], translateY: [14, 0] })
      .add(
        words,
        { opacity: [0, 1], translateY: [46, 0], duration: 780, delay: stagger(95) },
        "-=440"
      )
      .add(".intro-tag", { opacity: [0, 1], translateY: [14, 0] }, "-=400")
      .add(".intro-hint", { opacity: [0, 1] }, "-=250");
    return () => {
      tl.pause();
    };
  }, []);

  return (
    <section
      ref={section}
      id="top"
      className="relative flex h-screen items-center justify-center overflow-hidden bg-char"
    >
      {/* footage — framed below the black nav bar (Anduril-style), fades on scroll */}
      <div ref={media} className="absolute inset-x-3 bottom-3 top-[58px] overflow-hidden will-change-transform sm:inset-x-5 sm:bottom-5 lg:inset-x-6 lg:bottom-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={POSTER}
          alt="Aerial view of farm fields"
          className="absolute inset-0 h-full w-full object-cover"
        />
        {VIDEOS.map((src, i) => (
          <video
            key={src}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[800ms] ${
              i === active ? "opacity-100" : "opacity-0"
            }`}
            autoPlay
            muted
            loop
            playsInline
            poster={POSTER}
          >
            <source src={src} type="video/mp4" />
          </video>
        ))}
        <div className="absolute inset-0 bg-char/40" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(7,7,7,0.3),rgba(7,7,7,0.78))]" />
        <div className="grid-dot absolute inset-0 opacity-20" />
      </div>

      <div ref={brand} className="relative px-6 text-center">
        <h1 className="display text-paper text-[15vw] leading-[0.92] sm:text-[11vw] lg:text-[7rem]">
          {WORDS.map((w) => (
            <span
              key={w}
              className="intro-word mr-[0.22em] inline-block last:mr-0"
              style={{ opacity: 0 }}
            >
              {w}
            </span>
          ))}
        </h1>

        <p
          className="intro-tag mx-auto mt-5 max-w-xs text-sm leading-relaxed text-paper/80 sm:mt-6 sm:max-w-md sm:text-[15px]"
          data-in
          style={{ opacity: 0 }}
        >
          We&rsquo;re taking chemicals out of the field and putting life back
          into the soil.
        </p>
      </div>

      <div
        ref={hint}
        className="intro-hint pointer-events-none absolute bottom-7 left-1/2 -translate-x-1/2 text-center sm:bottom-8"
        style={{ opacity: 0 }}
      >
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-paper/60 sm:text-[11px]">
          scroll
        </div>
        <svg
          width="26"
          height="11"
          viewBox="0 0 26 11"
          fill="none"
          aria-hidden
          className="mx-auto mt-2.5 text-signal"
        >
          <path d="M1 1l12 8.5L25 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
    </section>
  );
}
