/* -------------------------------------------------------------------------- */
/*  Shared soil-telemetry model — isomorphic (runs on server and client).      */
/*  Defines the channels, healthy bands, status logic and the plain-language   */
/*  advice layer. The actual readings are served by the sensor API             */
/*  (app/api/sensors) and consumed by the UI through useSoilFeed.              */
/*  This module is pure: no React, no browser globals, so the API route can    */
/*  import it too.                                                             */
/* -------------------------------------------------------------------------- */

export const POINTS = 44; // samples kept per channel
export const CADENCE = 1600; // ms between samples

export type StatusKey = "optimal" | "watch" | "alert";

export interface Channel {
  key: string;
  label: string;
  short: string; // compact label for tight tiles
  plain: string; // farmer-facing name
  role: string; // what it does for the crop, in plain words
  unit: string;
  min: number; // sensor floor (for chart scaling)
  max: number; // sensor ceiling
  optimal: [number, number]; // healthy band
  decimals: number;
  step: number; // volatility per sample
}

export const CHANNELS: Channel[] = [
  { key: "moisture", label: "Soil moisture", short: "Moisture", plain: "Soil moisture", role: "How wet the soil is", unit: "%", min: 40, max: 82, optimal: [58, 70], decimals: 0, step: 0.9 },
  { key: "temp", label: "Soil temp", short: "Temp", plain: "Soil temperature", role: "Warmth for root growth", unit: "°C", min: 10, max: 26, optimal: [15, 20], decimals: 1, step: 0.32 },
  { key: "ph", label: "pH", short: "pH", plain: "Acidity (pH)", role: "Keeps nutrients available", unit: "", min: 5.4, max: 7.6, optimal: [6.2, 6.8], decimals: 2, step: 0.03 },
  { key: "ec", label: "Salinity", short: "Salt", plain: "Salt level", role: "Salinity around the roots", unit: "dS/m", min: 0.5, max: 2.3, optimal: [1.0, 1.6], decimals: 2, step: 0.045 },
  { key: "nitrogen", label: "Nitrogen", short: "N", plain: "Nitrogen (N)", role: "Drives leafy green growth", unit: "ppm", min: 8, max: 62, optimal: [30, 50], decimals: 0, step: 0.9 },
  { key: "phosphorus", label: "Phosphorus", short: "P", plain: "Phosphorus (P)", role: "Roots & flowering", unit: "ppm", min: 4, max: 46, optimal: [20, 34], decimals: 0, step: 0.7 },
  { key: "potassium", label: "Potassium", short: "K", plain: "Potassium (K)", role: "Fruit quality & resilience", unit: "ppm", min: 90, max: 234, optimal: [150, 200], decimals: 0, step: 2.6 },
];

export const CH = Object.fromEntries(CHANNELS.map((c) => [c.key, c])) as Record<string, Channel>;

export const STATUS: Record<StatusKey, { label: string; hex: string; tint: string; dot: string; ring: string }> = {
  optimal: { label: "Optimal", hex: "#86c46b", tint: "text-sprout", dot: "bg-sprout", ring: "ring-sprout/50" },
  watch: { label: "Watch", hex: "#c9a24a", tint: "text-[#c9a24a]", dot: "bg-[#c9a24a]", ring: "ring-[#c9a24a]/50" },
  alert: { label: "Alert", hex: "#c8663a", tint: "text-[#c8663a]", dot: "bg-[#c8663a]", ring: "ring-[#c8663a]/50" },
};

export const BAND_SCORE: Record<StatusKey, number> = { optimal: 100, watch: 68, alert: 38 };

/* --- fields -------------------------------------------------------------- */

export interface Probe {
  id: string;
  zone: string;
  x: number; // 0..1 position on the field map
  y: number; // 0..1
  offset: number; // moisture delta vs. field average
}

export interface Weather {
  air: number; // air temp °C
  sky: string; // plain-language conditions
  dryDays: number; // days of no rain in the forecast
}

export interface Field {
  id: string;
  name: string;
  coords: string;
  area: string;
  seed: number;
  mood: StatusKey; // resting personality, shown in the picker
  crop: string;
  stage: string; // growth stage
  lastRain: string;
  lastIrrigation: string;
  weather: Weather;
  // Per-channel pull target offset — shifts a field off the healthy midpoint so
  // each plot has its own character (one runs wet, one acidic, etc.).
  bias: Partial<Record<string, number>>;
  probes: Probe[];
}

export const FIELDS: Field[] = [
  {
    id: "north",
    name: "North Field",
    coords: "42.31°N",
    area: "8.4 ha",
    seed: 1013,
    mood: "optimal",
    crop: "Winter wheat",
    stage: "Tillering",
    lastRain: "2 days ago",
    lastIrrigation: "Yesterday",
    weather: { air: 18, sky: "Partly cloudy", dryDays: 2 },
    bias: {},
    probes: [
      { id: "PR-01", zone: "North Field · row 4", x: 0.22, y: 0.28, offset: -3 },
      { id: "PR-02", zone: "North Field · row 12", x: 0.68, y: 0.34, offset: 5 },
      { id: "PR-03", zone: "North Field · row 20", x: 0.4, y: 0.66, offset: -1 },
      { id: "PR-04", zone: "North Field · headland", x: 0.8, y: 0.74, offset: 2 },
    ],
  },
  {
    id: "river",
    name: "River Plot",
    coords: "42.29°N",
    area: "3.1 ha",
    seed: 5501,
    mood: "watch",
    crop: "Paddy rice",
    stage: "Vegetative",
    lastRain: "This morning",
    lastIrrigation: "Flooded",
    weather: { air: 21, sky: "Humid", dryDays: 0 },
    // Sits low by the water — runs wet, and a touch salty near the bank.
    bias: { moisture: 7, ec: 0.4, nitrogen: -6 },
    probes: [
      { id: "PR-05", zone: "River Plot · bed A", x: 0.28, y: 0.36, offset: 6 },
      { id: "PR-06", zone: "River Plot · bed C", x: 0.58, y: 0.3, offset: 3 },
      { id: "PR-07", zone: "River Plot · bank edge", x: 0.74, y: 0.62, offset: 9 },
      { id: "PR-08", zone: "River Plot · gate", x: 0.34, y: 0.7, offset: 1 },
    ],
  },
  {
    id: "orchard",
    name: "Orchard Terrace",
    coords: "42.33°N",
    area: "5.7 ha",
    seed: 8821,
    mood: "alert",
    crop: "Apple orchard",
    stage: "Fruit set",
    lastRain: "6 days ago",
    lastIrrigation: "3 days ago",
    weather: { air: 26, sky: "Sunny", dryDays: 4 },
    // South-facing terrace — dries out fast and the soil trends acidic.
    bias: { moisture: -15, ph: -0.55, temp: 2.4, potassium: -30 },
    probes: [
      { id: "PR-09", zone: "Orchard · terrace 1", x: 0.24, y: 0.32, offset: -8 },
      { id: "PR-10", zone: "Orchard · terrace 2", x: 0.52, y: 0.4, offset: -4 },
      { id: "PR-11", zone: "Orchard · terrace 3", x: 0.72, y: 0.5, offset: -11 },
      { id: "PR-12", zone: "Orchard · windbreak", x: 0.44, y: 0.72, offset: -6 },
    ],
  },
];

/* --- math ---------------------------------------------------------------- */

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

// Deterministic PRNG (mulberry32) so the server and first client render match.
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Deterministic reading for a channel at an absolute step index. Combines a
// slow drift, a faster oscillation and a little seeded noise so the trace looks
// like a real probe without ever depending on prior state — which lets any
// caller (server or client) reproduce the same value for the same step.
export function sampleAt(ch: Channel, seed: number, step: number, bias = 0): number {
  const mid = clamp((ch.optimal[0] + ch.optimal[1]) / 2 + bias, ch.min, ch.max);
  const amp = (ch.optimal[1] - ch.optimal[0]) * 0.5 + ch.step * 2.5;
  const rnd = mulberry32((seed >>> 0) ^ Math.imul(step, 2654435761));
  const noise = (rnd() * 2 - 1) * ch.step * 1.4;
  const fast = Math.sin((step / POINTS) * Math.PI * 2 * 1.3 + seed) * amp * 0.35;
  const slow = Math.sin((step / (POINTS * 4)) * Math.PI * 2 + seed * 0.1) * amp * 0.5;
  return clamp(mid + slow + fast + noise, ch.min, ch.max);
}

// A window of POINTS readings ending at `endStep`. Advancing endStep by one
// scrolls the trace, which is how the live feed streams over time.
export function seriesAt(ch: Channel, seed: number, endStep: number, bias = 0): number[] {
  const out: number[] = [];
  for (let i = 0; i < POINTS; i++) out.push(sampleAt(ch, seed, endStep - POINTS + 1 + i, bias));
  return out;
}

// Build every channel's window for a field at a given step — the payload shape
// the sensor API returns and the UI consumes.
export function fieldSeriesAt(field: Field, endStep: number): Record<string, number[]> {
  const out: Record<string, number[]> = {};
  CHANNELS.forEach((ch, i) => (out[ch.key] = seriesAt(ch, field.seed + i * 97, endStep, field.bias[ch.key] ?? 0)));
  return out;
}

export function statusOf(ch: Channel, v: number): StatusKey {
  const [lo, hi] = ch.optimal;
  if (v >= lo && v <= hi) return "optimal";
  const dist = v < lo ? lo - v : v - hi;
  return dist <= (ch.max - ch.min) * 0.07 ? "watch" : "alert";
}

export function healthTone(idx: number): StatusKey {
  return idx >= 85 ? "optimal" : idx >= 65 ? "watch" : "alert";
}

export function fmt(v: number, decimals: number): string {
  return v.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

// Map a series to an SVG polyline path inside a w×h box.
export function linePath(series: number[], min: number, max: number, w: number, h: number): string {
  const n = series.length;
  const span = max - min || 1;
  return series
    .map((v, i) => {
      const x = (i / (n - 1)) * w;
      const y = h - ((v - min) / span) * h;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

/* -------------------------------------------------------------------------- */
/*  Plain-language layer — turns raw numbers into what a farmer should read    */
/*  and, more importantly, what they should DO about it.                       */
/* -------------------------------------------------------------------------- */

// One plain sentence per channel, per situation (in / low-side / high-side, and
// how far out). This is the whole point of the dashboard: legible guidance.
const ADVICE: Record<string, Record<string, string>> = {
  moisture: {
    good: "Just right — the root zone has plenty of water.",
    low_watch: "Drying out — plan to water in the next day or two.",
    low_act: "Too dry — irrigate today so the roots don't stress.",
    high_watch: "A little wet — ease back on the watering.",
    high_act: "Waterlogged — stop irrigating and check the drainage.",
  },
  temp: {
    good: "Warm enough for healthy root growth.",
    low_watch: "Soil is on the cool side — growth will be a bit slow.",
    low_act: "Too cold — hold off planting until it warms up.",
    high_watch: "Warming up — keep an eye on the moisture.",
    high_act: "Soil is too hot — mulch to keep the roots cool and hold water.",
  },
  ph: {
    good: "Ideal — nutrients stay easy for the crop to take up.",
    low_watch: "Turning acidic — fine for now, but worth watching.",
    low_act: "Too acidic — spread lime to bring the pH back up.",
    high_watch: "Slightly alkaline — most crops will cope.",
    high_act: "Too alkaline — work in sulfur or compost to lower the pH.",
  },
  ec: {
    good: "Salt level is healthy.",
    low_watch: "Very low salts — usually nothing to worry about.",
    low_act: "Salts very low — check the crop is actually being fed.",
    high_watch: "Salt is creeping up — flush with fresh water soon.",
    high_act: "Salt too high — leach the soil with a deep watering; it's stressing the roots.",
  },
  nitrogen: {
    good: "Good nitrogen for strong green growth.",
    low_watch: "Nitrogen slipping — plan a feed this week.",
    low_act: "Low nitrogen — apply an N feed for leaf growth.",
    high_watch: "Nitrogen on the high side — hold off feeding.",
    high_act: "Too much nitrogen — stop feeding; the excess burns roots and leaches away.",
  },
  phosphorus: {
    good: "Good phosphorus for roots and flowering.",
    low_watch: "Phosphorus easing down — plan to top it up.",
    low_act: "Low phosphorus — add P to support roots and flowering.",
    high_watch: "Phosphorus a touch high — no feed needed.",
    high_act: "Phosphorus very high — skip the P fertiliser for now.",
  },
  potassium: {
    good: "Good potassium for fruit quality and drought resistance.",
    low_watch: "Potassium easing down — plan a top-up.",
    low_act: "Low potassium — add K for better fruit and stress tolerance.",
    high_watch: "Potassium a little high — nothing to do.",
    high_act: "Potassium very high — hold off on the K feed.",
  },
};

export interface Advice {
  tone: StatusKey;
  text: string;
}

export function readingAdvice(ch: Channel, v: number): Advice {
  const tone = statusOf(ch, v);
  const below = v < ch.optimal[0];
  const bucket = tone === "optimal" ? "good" : `${below ? "low" : "high"}_${tone === "alert" ? "act" : "watch"}`;
  return { tone, text: ADVICE[ch.key]?.[bucket] ?? ADVICE[ch.key]?.good ?? "" };
}

// Farmer-facing labels for a status (the traffic light).
export const CARE_LABEL: Record<StatusKey, string> = {
  optimal: "Good",
  watch: "Keep an eye on it",
  alert: "Act now",
};

// A word for how a value is trending over the recent window.
export function trendWord(ch: Channel, series: number[]): { word: string; dir: "up" | "down" | "flat" } {
  const v = series[series.length - 1];
  const prev = series[series.length - 6] ?? v;
  const d = v - prev;
  if (Math.abs(d) < ch.step * 0.5) return { word: "Steady over the last hour", dir: "flat" };
  return d > 0 ? { word: "Rising over the last hour", dir: "up" } : { word: "Falling over the last hour", dir: "down" };
}

/* --- soil moisture by depth --------------------------------------------- */

export interface DepthReading {
  cm: number;
  name: string;
  root: boolean;
  value: number;
  word: string;
  tone: StatusKey;
}

// Plain wet/dry wording for a moisture percentage.
export function moistureWord(v: number): { word: string; tone: StatusKey } {
  if (v < 48) return { word: "Dry", tone: "alert" };
  if (v < 58) return { word: "Drying", tone: "watch" };
  if (v <= 72) return { word: "Moist", tone: "optimal" };
  if (v <= 80) return { word: "Wet", tone: "watch" };
  return { word: "Saturated", tone: "alert" };
}

// Derive a moisture-by-depth profile from the surface reading: topsoil dries
// out fastest, the subsoil holds water longest.
const DEPTHS: { cm: number; name: string; root: boolean; delta: number }[] = [
  { cm: 10, name: "Surface", root: false, delta: -9 },
  { cm: 20, name: "Topsoil", root: false, delta: -3 },
  { cm: 40, name: "Root zone", root: true, delta: 2 },
  { cm: 60, name: "Subsoil", root: false, delta: 6 },
];

export function depthProfile(moistureNow: number): DepthReading[] {
  return DEPTHS.map((d) => {
    const value = clamp(moistureNow + d.delta, 20, 95);
    const { word, tone } = moistureWord(value);
    return { cm: d.cm, name: d.name, root: d.root, value, word, tone };
  });
}

/* --- the headline recommendation ---------------------------------------- */

export interface Recommendation {
  icon: string;
  tone: StatusKey;
  headline: string;
  detail: string;
}

export function rootZoneMoisture(moistureNow: number): number {
  return clamp(moistureNow + 2, 20, 95);
}

// The single most important thing to tell the farmer today.
export function fieldRecommendation(field: Field, series: Record<string, number[]>): Recommendation {
  const moistureNow = series.moisture[series.moisture.length - 1];
  const mStatus = statusOf(CH.moisture, moistureNow);
  const rz = rootZoneMoisture(moistureNow);
  const rzWord = moistureWord(rz);

  const offband = CHANNELS.map((ch) => {
    const v = series[ch.key][series[ch.key].length - 1];
    return { ch, v, tone: statusOf(ch, v) };
  }).filter((r) => r.tone !== "optimal");
  const acts = offband.filter((r) => r.tone === "alert");

  // Waterlogged wins — turning water off matters more than any nutrient.
  if (mStatus === "alert" && moistureNow > CH.moisture.optimal[1]) {
    return {
      icon: "🚱",
      tone: "alert",
      headline: "Hold off watering",
      detail: `The soil is saturated at ${fmt(moistureNow, 0)}%. Turn irrigation off and make sure ${field.name} is draining.`,
    };
  }

  // Dry root zone → irrigation call with a rough depth to apply.
  if (rzWord.tone === "alert" || (mStatus === "alert" && moistureNow < CH.moisture.optimal[0])) {
    const mm = Math.max(10, Math.round((64 - rz) * 1.1));
    const rain = field.weather.dryDays > 0 ? ` — no rain forecast for ${field.weather.dryDays} day${field.weather.dryDays > 1 ? "s" : ""}` : "";
    return {
      icon: "💧",
      tone: "alert",
      headline: "Irrigate today",
      detail: `The root zone is down to ${fmt(rz, 0)}% (${rzWord.word.toLowerCase()}). Apply about ${mm} mm${rain}.`,
    };
  }

  // Otherwise surface the most urgent nutrient/chemistry action.
  if (acts.length > 0) {
    const top = acts[0];
    return { icon: "🧪", tone: "alert", headline: `${top.ch.plain} needs attention`, detail: readingAdvice(top.ch, top.v).text };
  }

  if (offband.length > 0) {
    return {
      icon: "👀",
      tone: "watch",
      headline: "A couple of things to watch",
      detail: `${offband.length} reading${offband.length > 1 ? "s are" : " is"} drifting from the ideal range, but nothing needs doing right now.`,
    };
  }

  return {
    icon: "✓",
    tone: "optimal",
    headline: "Nothing needed today",
    detail: `Moisture and every nutrient in ${field.name} are in the healthy range. Next automatic check at 6:00 PM.`,
  };
}
