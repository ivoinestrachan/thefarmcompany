/* -------------------------------------------------------------------------- */
/*  Server-side sensor data source.                                            */
/*                                                                            */
/*  If a real probe gateway is configured via env (SENSOR_API_URL +           */
/*  SENSOR_API_KEY), we pull live readings from it. Those values live in       */
/*  .env.local, which is gitignored — so the real endpoint and key never       */
/*  reach GitHub. When they're absent (the default for anyone who clones the   */
/*  repo) we fall back to a deterministic on-device generator, so the          */
/*  dashboard still streams believable data and the app runs out of the box.   */
/* -------------------------------------------------------------------------- */

import { CADENCE, Field, fieldSeriesAt } from "./soil";

export type SensorSource = "live" | "generated";

export interface FieldReadings {
  field: string;
  step: number;
  series: Record<string, number[]>;
  source: SensorSource;
  ts: string;
}

// Absolute step index derived from wall-clock time, so the window scrolls one
// sample per CADENCE and every caller lands on the same frame.
function currentStep(): number {
  return Math.floor(Date.now() / CADENCE);
}

// Pull from the real gateway, if one is wired up. Returns null on any failure
// so the caller can fall back cleanly — a flaky probe network must never take
// the dashboard down.
async function fetchLive(field: Field): Promise<FieldReadings | null> {
  const base = process.env.SENSOR_API_URL;
  const key = process.env.SENSOR_API_KEY;
  if (!base || !key) return null;

  try {
    const res = await fetch(`${base}/fields/${encodeURIComponent(field.id)}/readings`, {
      headers: { Authorization: `Bearer ${key}` },
      // Readings are volatile — never serve a cached probe value.
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;

    const data = (await res.json()) as { series?: Record<string, number[]>; step?: number };
    if (!data.series) return null;

    return {
      field: field.id,
      step: data.step ?? currentStep(),
      series: data.series,
      source: "live",
      ts: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

// Deterministic fallback — same model the marketing site uses.
function generate(field: Field): FieldReadings {
  const step = currentStep();
  return {
    field: field.id,
    step,
    series: fieldSeriesAt(field, step),
    source: "generated",
    ts: new Date().toISOString(),
  };
}

export async function getFieldReadings(field: Field): Promise<FieldReadings> {
  return (await fetchLive(field)) ?? generate(field);
}
