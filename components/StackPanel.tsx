"use client";

import { useEffect, useRef } from "react";

/* -------------------------------------------------------------------------- */
/*  StackPanel — the "stacked cards" scroll transition. Each panel pins at the  */
/*  top while the next section scrolls up and covers it; the panel behind       */
/*  scales down, dims, and rounds its corners so it reads as receding into      */
/*  depth. Desktop only (lg+) — phones keep the plain, tall-content flow.       */
/* -------------------------------------------------------------------------- */

export default function StackPanel({ children }: { children: React.ReactNode }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const o = outer.current;
    const i = inner.current;
    if (!o || !i) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let cleared = true;

    const loop = () => {
      const desktop = window.innerWidth >= 1024;
      if (desktop && !reduce) {
        // how far the *next* section has risen up to cover this one
        const next = o.nextElementSibling as HTMLElement | null;
        const vh = window.innerHeight;
        const nextTop = next ? next.getBoundingClientRect().top : vh * 2;
        const p = Math.min(1, Math.max(0, 1 - nextTop / vh));
        const e = p * p * (3 - 2 * p); // smoothstep
        i.style.transform = `scale(${(1 - e * 0.1).toFixed(4)})`;
        i.style.filter = `brightness(${(1 - e * 0.55).toFixed(3)})`;
        i.style.borderRadius = `${(e * 26).toFixed(1)}px`;
        cleared = false;
      } else if (!cleared) {
        i.style.transform = "";
        i.style.filter = "";
        i.style.borderRadius = "";
        cleared = true;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div ref={outer} className="lg:sticky lg:top-0">
      <div
        ref={inner}
        className="origin-center lg:overflow-hidden lg:shadow-[0_-30px_70px_-28px_rgba(0,0,0,0.75)] lg:will-change-transform"
      >
        {children}
      </div>
    </div>
  );
}
