"use client";

import { useEffect, useRef, useState } from "react";
import { createTimeline, stagger, utils } from "animejs";

/* -------------------------------------------------------------------------- */
/*  Intro — a one-screen aerial opening that dissolves as it scrolls away.      */
/*  The drone footage fades and zooms while the wordmark rises, handing off to  */
/*  the worm hero directly below (no empty gap). Falls back to a still frame.   */
/* -------------------------------------------------------------------------- */

const VIDEO_SRC =
  "https://videos.pexels.com/video-files/6444361/6444361-uhd_2560_1440_30fps.mp4";
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
  const [failed, setFailed] = useState(false);

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
      {/* footage — fades + zooms as the section scrolls away */}
      <div ref={media} className="absolute inset-0 will-change-transform">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={POSTER}
          alt="Aerial view of farm fields"
          className="absolute inset-0 h-full w-full object-cover"
        />
        {!failed && (
          <video
            className="absolute inset-0 h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            poster={POSTER}
            onError={() => setFailed(true)}
          >
            <source src={VIDEO_SRC} type="video/mp4" />
          </video>
        )}
        <div className="absolute inset-0 bg-char/45" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(31,30,29,0.35),rgba(31,30,29,0.82))]" />
        <div className="grid-dot absolute inset-0 opacity-25" />
        <div className="absolute inset-5 sm:inset-10">
          {[
            "left-0 top-0 border-l-2 border-t-2",
            "right-0 top-0 border-r-2 border-t-2",
            "left-0 bottom-0 border-l-2 border-b-2",
            "right-0 bottom-0 border-r-2 border-b-2",
          ].map((c) => (
            <span key={c} className={`absolute h-5 w-5 border-signal/50 sm:h-6 sm:w-6 ${c}`} />
          ))}
        </div>
      </div>

      <div ref={brand} className="relative px-6 text-center">
        <span
          className="intro-eyebrow eyebrow justify-center text-[0.6rem] sm:text-[0.7rem]"
          data-in
          style={{ opacity: 0 }}
        >
          Regenerative field robotics
        </span>

        <h1 className="display mt-5 text-paper text-[15vw] leading-[0.92] sm:mt-6 sm:text-[11vw] lg:text-[7rem]">
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
        <div className="mt-1 text-signal">↓</div>
      </div>
    </section>
  );
}
