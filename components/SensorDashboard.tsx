"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CHANNELS,
  Channel,
  Field,
  FIELDS,
  Recommendation,
  StatusKey,
  fmt,
  fieldRecommendation,
  statusOf,
} from "@/lib/soil";
import { useClock, useSoilFeed } from "@/lib/useSoilFeed";

/* -------------------------------------------------------------------------- */
/*  /dashboard — the soil monitoring dashboard.                                */
/*  Sidebar nav + a summary row + the sensor readings. Data updates live.      */
/* -------------------------------------------------------------------------- */

const CARE: Record<StatusKey, { text: string; dot: string; panel: string; kpi: string }> = {
  optimal: { text: "text-[#2f5d3a]", dot: "bg-[#4a8f5b]", panel: "bg-[#eef4ea] border-[#cfe0c6]", kpi: "text-[#2f5d3a]" },
  watch: { text: "text-[#7d5f16]", dot: "bg-[#c9a24a]", panel: "bg-[#f8f1e1] border-[#e7d6ab]", kpi: "text-[#7d5f16]" },
  alert: { text: "text-[#a2431f]", dot: "bg-[#c8663a]", panel: "bg-[#f9ece4] border-[#ecccbb]", kpi: "text-[#a2431f]" },
};

const WORDS: Record<string, [string, string]> = {
  moisture: ["Dry", "Wet"],
  temp: ["Cold", "Hot"],
  ph: ["Acidic", "Alkaline"],
  ec: ["Low salt", "Salty"],
  nitrogen: ["Low", "High"],
  phosphorus: ["Low", "High"],
  potassium: ["Low", "High"],
};

function statusWord(ch: Channel, v: number): { tone: StatusKey; word: string } {
  const tone = statusOf(ch, v);
  if (tone === "optimal") return { tone, word: "Good" };
  const [low, high] = WORDS[ch.key] ?? ["Low", "High"];
  return { tone, word: v < ch.optimal[0] ? low : high };
}

export default function SensorDashboard() {
  const [field, setField] = useState<Field>(FIELDS[0]);
  const { series } = useSoilFeed(field);
  const clock = useClock();

  const rec = useMemo<Recommendation>(() => fieldRecommendation(field, series), [field, series]);
  const moistureNow = series.moisture[series.moisture.length - 1];
  const alerts = useMemo(
    () => CHANNELS.filter((ch) => statusOf(ch, series[ch.key][series[ch.key].length - 1]) !== "optimal").length,
    [series]
  );

  const statusLabel = rec.tone === "optimal" ? "Healthy" : rec.tone === "alert" ? "Needs action" : "Watch";

  return (
    <div className="flex min-h-screen bg-[#f4f1ea] text-[#2a2622]">
      <Sidebar alerts={alerts} />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* top bar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[#e4ddce] bg-[#f4f1ea]/85 px-5 backdrop-blur-xl lg:px-8">
          <div>
            <h1 className="text-[18px] font-600 leading-tight">{field.name}</h1>
            <p className="text-[12px] text-[#8a8172]">
              {field.crop} · {field.weather.air}°C {field.weather.sky}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-1.5 text-[12px] font-500 text-[#2f5d3a] sm:flex">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#4a8f5b]" />
              Live · {clock || "--:--:--"}
            </span>
            <FieldSelect value={field} onChange={setField} />
          </div>
        </header>

        <main className="flex-1 p-5 lg:p-8">
          {/* summary row */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Kpi label="Field status" value={statusLabel} tone={rec.tone} />
            <Kpi label="Soil moisture" value={`${fmt(moistureNow, 0)}%`} tone={statusOf(CHANNELS[0], moistureNow)} />
            <Kpi label="Sensors online" value={`${field.probes.length}/${field.probes.length}`} tone="optimal" />
            <Kpi label="Open alerts" value={`${alerts}`} tone={alerts === 0 ? "optimal" : "alert"} />
          </div>

          {/* call to action */}
          <div className={`mt-5 flex items-start gap-3 rounded-2xl border p-5 ${CARE[rec.tone].panel}`}>
            <span className="text-2xl leading-none" aria-hidden>{rec.icon}</span>
            <div>
              <h2 className={`text-xl font-600 leading-tight ${CARE[rec.tone].text}`}>{rec.headline}</h2>
              <p className="mt-1 text-[15px] leading-relaxed text-[#5a5348]">{rec.detail}</p>
            </div>
          </div>

          {/* readings */}
          <h3 className="mt-8 text-[13px] font-600 uppercase tracking-wider text-[#8a8172]">Sensor readings</h3>
          <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {CHANNELS.map((ch) => {
              const v = series[ch.key][series[ch.key].length - 1];
              const { tone, word } = statusWord(ch, v);
              return (
                <div key={ch.key} className="rounded-xl border border-[#e6e0d4] bg-white p-4 shadow-[0_1px_2px_rgba(40,38,34,0.04)]">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-[#8a8172]">{ch.plain}</span>
                    <span className={`h-2 w-2 rounded-full ${CARE[tone].dot}`} />
                  </div>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-600 tabular-nums">{fmt(v, ch.decimals)}</span>
                    {ch.unit && <span className="text-[13px] text-[#8a8172]">{ch.unit}</span>}
                  </div>
                  <div className={`mt-1 text-[13px] font-500 ${CARE[tone].text}`}>{word}</div>
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}

/* --- sidebar ------------------------------------------------------------- */

function Sidebar({ alerts }: { alerts: number }) {
  const nav = [
    { label: "Overview", icon: <IconGrid />, active: true },
    { label: "Fields", icon: <IconLayers /> },
    { label: "Sensors", icon: <IconSignal /> },
    { label: "Alerts", icon: <IconBell />, badge: alerts },
    { label: "Reports", icon: <IconDoc /> },
  ];
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-[#e4ddce] bg-white lg:flex">
      <Link href="/" className="flex items-center gap-2.5 px-5 py-5 transition-opacity hover:opacity-70">
        <LeafMark />
        <span className="text-[15px] font-600">The Farming Company</span>
      </Link>

      <nav className="flex-1 px-3 py-2">
        {nav.map((n) => (
          <button
            key={n.label}
            type="button"
            className={`mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] transition-colors ${
              n.active ? "bg-[#eef4ea] font-600 text-[#2f5d3a]" : "text-[#6b6255] hover:bg-[#f6f2ea]"
            }`}
          >
            <span className={n.active ? "text-[#4a8f5b]" : "text-[#a49a88]"}>{n.icon}</span>
            <span className="flex-1 text-left">{n.label}</span>
            {typeof n.badge === "number" && n.badge > 0 && (
              <span className="rounded-full bg-[#c8663a] px-1.5 py-0.5 text-[10px] font-600 text-white">{n.badge}</span>
            )}
          </button>
        ))}
      </nav>

      <div className="border-t border-[#eee8dc] px-3 py-3">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#eef4ea] text-[13px] font-600 text-[#2f5d3a]">IV</span>
          <div className="leading-tight">
            <div className="text-[13px] font-500 text-[#3a352e]">Ivoine</div>
            <div className="text-[11px] text-[#a49a88]">Farm manager</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function Kpi({ label, value, tone }: { label: string; value: string; tone: StatusKey }) {
  return (
    <div className="rounded-xl border border-[#e6e0d4] bg-white p-4 shadow-[0_1px_2px_rgba(40,38,34,0.04)]">
      <div className="flex items-center justify-between">
        <span className="text-[12px] text-[#8a8172]">{label}</span>
        <span className={`h-1.5 w-1.5 rounded-full ${CARE[tone].dot}`} />
      </div>
      <div className={`mt-2 text-2xl font-600 tabular-nums ${CARE[tone].kpi}`}>{value}</div>
    </div>
  );
}

/* --- field switcher ------------------------------------------------------ */

function FieldSelect({ value, onChange }: { value: Field; onChange: (f: Field) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        className="flex items-center gap-2 rounded-lg border border-[#e0d8c8] bg-white px-3 py-2 text-[13px] font-500 text-[#3a352e] transition-colors hover:border-[#c9bfa9]"
      >
        <span className={`h-1.5 w-1.5 rounded-full ${CARE[value.mood].dot}`} />
        {value.name}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden className={`transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <ul className="absolute right-0 z-40 mt-2 w-56 overflow-hidden rounded-xl border border-[#e0d8c8] bg-white p-1 shadow-[0_20px_50px_-20px_rgba(40,38,34,0.35)]">
          {FIELDS.map((f) => (
            <li key={f.id}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(f);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors ${f.id === value.id ? "bg-[#f1ede3]" : "hover:bg-[#f6f2ea]"}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${CARE[f.mood].dot}`} />
                <span className="leading-tight">
                  <span className="block text-[13px] font-500 text-[#3a352e]">{f.name}</span>
                  <span className="block text-[11px] text-[#a49a88]">{f.crop}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* --- icons --------------------------------------------------------------- */

function LeafMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="11" stroke="#2f5d3a" strokeWidth="1.2" />
      <path d="M12 18v-7m0 0c0-1.6 1.3-3 3-3 0 1.6-1.3 3-3 3Zm0 0c0-1.6-1.3-3-3-3 0 1.6 1.3 3 3 3Z" stroke="#2f5d3a" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const iconProps = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

function IconGrid() {
  return (
    <svg {...iconProps} aria-hidden>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}
function IconLayers() {
  return (
    <svg {...iconProps} aria-hidden>
      <path d="M12 3 3 8l9 5 9-5-9-5Z" />
      <path d="M3 13l9 5 9-5" />
    </svg>
  );
}
function IconSignal() {
  return (
    <svg {...iconProps} aria-hidden>
      <path d="M5 20v-4M10 20v-8M15 20v-6M20 20V8" />
    </svg>
  );
}
function IconBell() {
  return (
    <svg {...iconProps} aria-hidden>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </svg>
  );
}
function IconDoc() {
  return (
    <svg {...iconProps} aria-hidden>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
      <path d="M14 3v5h5M9 13h6M9 17h6" />
    </svg>
  );
}
