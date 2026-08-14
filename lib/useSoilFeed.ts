"use client";

/* -------------------------------------------------------------------------- */
/*  Client-side live feed.                                                     */
/*  Polls the sensor API (/api/sensors) on a fixed cadence and hands the UI a  */
/*  rolling window of readings. The very first render uses a deterministic     */
/*  window so server and client markup match; once mounted, real fetched data  */
/*  takes over.                                                                */
/* -------------------------------------------------------------------------- */

import { useEffect, useRef, useState } from "react";
import { CADENCE, CHANNELS, Field, POINTS, fieldSeriesAt } from "./soil";

export interface SoilFeed {
  series: Record<string, number[]>;
  tick: number;
  source: "live" | "generated" | null;
}

// Deterministic seed frame (step 0) — identical on server and client, so the
// first paint never triggers a hydration mismatch.
function seedFrame(field: Field): Record<string, number[]> {
  return fieldSeriesAt(field, POINTS);
}

interface Payload {
  series: Record<string, number[]>;
  source: "live" | "generated";
}

export function useSoilFeed(field: Field): SoilFeed {
  const [series, setSeries] = useState<Record<string, number[]>>(() => seedFrame(field));
  const [tick, setTick] = useState(0);
  const [source, setSource] = useState<"live" | "generated" | null>(null);
  const fieldId = field.id;

  useEffect(() => {
    let active = true;
    setSeries(seedFrame(field));
    setTick(0);

    const load = async () => {
      try {
        const res = await fetch(`/api/sensors?field=${encodeURIComponent(fieldId)}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as Payload;
        if (!active || !data?.series) return;
        // Guard: only accept a payload that covers every channel.
        if (!CHANNELS.every((ch) => Array.isArray(data.series[ch.key]))) return;
        setSeries(data.series);
        setSource(data.source);
        setTick((t) => t + 1);
      } catch {
        // Network hiccup — keep the last good frame and try again next tick.
      }
    };

    load();

    const reduce =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return () => {
      active = false;
    };

    const timer = setInterval(load, CADENCE);
    return () => {
      active = false;
      clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fieldId]);

  return { series, tick, source };
}

// Wall clock — kept out of the render pass so SSR and first client render match.
export function useClock(): string {
  const [now, setNow] = useState("");
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const paint = () => setNow(new Date().toLocaleTimeString("en-US", { hour12: false }));
    paint();
    const id = setInterval(paint, 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}
