"use client";

import { useEffect } from "react";
import Lenis from "lenis";

/* -------------------------------------------------------------------------- */
/*  SmoothScroll — Lenis momentum scrolling. Eases every scroll-driven bit     */
/*  (the intro dissolve, the worm, the beats) so transitions feel buttery.     */
/* -------------------------------------------------------------------------- */

export default function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      lerp: 0.085, // frame-synced interpolation — a continuous, buttery glide
      wheelMultiplier: 0.95, // soften each wheel tick so it never jumps
      smoothWheel: true,
      syncTouch: false, // leave touch scrolling native — feels better on phones
      touchMultiplier: 1.4,
      anchors: true, // smooth-scroll #top / #contact links too
    });

    // drive Lenis from a single rAF and keep the scroll-linked scenes in sync
    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, []);

  return null;
}
