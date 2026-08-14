"use client";

import { useMemo } from "react";
import Reveal from "./Reveal";
import {
  CH,
  CHANNELS,
  Channel,
  FIELDS,
  Probe,
  STATUS,
  StatusKey,
  clamp,
  fmt,
  linePath,
  statusOf,
} from "@/lib/soil";
import { useSoilFeed } from "@/lib/useSoilFeed";

/* -------------------------------------------------------------------------- */
/*  Live soil-sensor telemetry — a simulated probe feed for the landing page.  */
/*  Shares its model with the /dashboard console via lib/soil.ts, so the two   */
/*  always agree on channels, bands and statuses.                              */
/* -------------------------------------------------------------------------- */

const FIELD = FIELDS[0]; // North Field — the marketing showcase plot

export default function SoilSensors() {
  const { series, tick } = useSoilFeed(FIELD);
  const packet = (20481 + tick).toLocaleString("en-US");

  const moisture = series.moisture;
  const moistureNow = moisture[moisture.length - 1];
  const moistureStatus = statusOf(CH.moisture, moistureNow);

  // Live alert log, derived from whichever channels drift out of band.
  const alerts = useMemo(() => {
    return CHANNELS.map((ch) => {
      const v = series[ch.key][series[ch.key].length - 1];
      return { ch, v, status: statusOf(ch, v) };
    })
      .filter((r) => r.status !== "optimal")
      .sort((a, b) => (a.status === "alert" ? 0 : 1) - (b.status === "alert" ? 0 : 1));
  }, [series]);

  return (
    <section id="sensors" className="border-t hairline bg-char py-24 text-paper lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <Reveal>
          <span className="eyebrow">Live telemetry</span>
          <h2 className="display mt-6 max-w-3xl text-3xl sm:text-5xl lg:text-6xl">
            The soil, reporting for itself.
          </h2>
          <p className="mt-6 max-w-2xl text-lg font-300 leading-relaxed text-fog">
            In-ground probes stream moisture, temperature, pH and nutrients every
            few seconds. This is a live simulation of one field&rsquo;s sensor
            array &mdash; every number is drifting in real time.
          </p>
        </Reveal>

        <Reveal delay={120}>
          <div className="mt-14 overflow-hidden rounded-xl border border-paper/10 bg-paper/[0.03] shadow-[0_40px_120px_-40px_rgba(0,0,0,0.6)]">
            {/* window chrome */}
            <div className="flex items-center justify-between border-b border-paper/10 px-5 py-3.5">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-paper/20" />
                  <span className="h-2.5 w-2.5 rounded-full bg-paper/20" />
                  <span className="h-2.5 w-2.5 rounded-full bg-paper/20" />
                </div>
                <span className="font-mono text-[12px] text-paper/45">
                  soil-array · {FIELD.name} · packet #{packet}
                </span>
              </div>
              <span className="flex items-center gap-2 font-mono text-[12px] text-sprout">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sprout" />
                streaming
              </span>
            </div>

            {/* top: gauge + primary chart */}
            <div className="grid gap-0 lg:grid-cols-[0.85fr_1.15fr]">
              <div className="border-b border-paper/10 p-6 lg:border-b-0 lg:border-r">
                <MoistureGauge value={moistureNow} status={moistureStatus} />
                <div className="mt-6 space-y-2.5">
                  {FIELD.probes.map((p) => (
                    <ProbeRow key={p.id} probe={p} moisture={moistureNow} tick={tick} />
                  ))}
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-500 text-paper/90">Soil moisture · last 70s</span>
                  <span className="rounded-full border border-paper/15 px-2.5 py-1 font-mono text-[11px] text-paper/50">
                    depth 15cm
                  </span>
                </div>
                <BigChart series={moisture} channel={CH.moisture} status={moistureStatus} />
              </div>
            </div>

            {/* sensor tiles */}
            <div className="grid grid-cols-2 gap-px border-t border-paper/10 bg-paper/10 sm:grid-cols-3 lg:grid-cols-6">
              {CHANNELS.filter((c) => c.key !== "moisture").map((ch) => (
                <SensorTile key={ch.key} channel={ch} series={series[ch.key]} />
              ))}
            </div>

            {/* alert log */}
            <div className="border-t border-paper/10 p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-wider text-paper/40">
                  Signal log
                </span>
                <span className="font-mono text-[11px] text-paper/40">
                  {alerts.length === 0 ? "all channels nominal" : `${alerts.length} channel(s) off-band`}
                </span>
              </div>
              <div className="space-y-1.5">
                {alerts.length === 0 ? (
                  <LogRow status="optimal" text="All 7 channels within optimal range" />
                ) : (
                  alerts.map((a) => (
                    <LogRow
                      key={a.ch.key}
                      status={a.status}
                      text={`${a.ch.label} ${a.v > a.ch.optimal[1] ? "above" : "below"} band — ${fmt(a.v, a.ch.decimals)}${a.ch.unit ? " " + a.ch.unit : ""}`}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* --- pieces -------------------------------------------------------------- */

function MoistureGauge({ value, status }: { value: number; status: StatusKey }) {
  const ch = CH.moisture;
  const frac = clamp((value - ch.min) / (ch.max - ch.min), 0, 1);
  const arc = Math.PI * 90; // semicircle length, r = 90
  const s = STATUS[status];

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-500 text-paper/90">Volumetric water</span>
        <span className={`flex items-center gap-1.5 text-[12px] ${s.tint}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
          {s.label}
        </span>
      </div>

      <div className="relative mx-auto mt-4 w-full max-w-[240px]">
        <svg viewBox="0 0 200 118" className="w-full">
          <path d="M10 106 A90 90 0 0 1 190 106" fill="none" stroke="#ffffff" strokeOpacity="0.1" strokeWidth="12" strokeLinecap="round" />
          <path
            d="M10 106 A90 90 0 0 1 190 106"
            fill="none"
            stroke={s.hex}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={arc}
            strokeDashoffset={arc * (1 - frac)}
            style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(0.16,1,0.3,1), stroke 0.6s ease" }}
          />
        </svg>
        <div className="absolute inset-x-0 bottom-1 flex flex-col items-center">
          <span className="display text-5xl tabular-nums">{fmt(value, 0)}</span>
          <span className="mt-0.5 text-[13px] text-paper/45">% VWC · target 58–70</span>
        </div>
      </div>
    </div>
  );
}

function BigChart({ series, channel, status }: { series: number[]; channel: Channel; status: StatusKey }) {
  const W = 620;
  const H = 190;
  // pad the vertical scale a little beyond the healthy band for headroom
  const lo = Math.min(channel.min, channel.optimal[0] - 6);
  const hi = Math.max(channel.max, channel.optimal[1] + 6);
  const line = linePath(series, lo, hi, W, H);
  const area = `${line} L${W} ${H} L0 ${H} Z`;
  const span = hi - lo;
  const bandTop = H - ((channel.optimal[1] - lo) / span) * H;
  const bandBot = H - ((channel.optimal[0] - lo) / span) * H;
  const last = series[series.length - 1];
  const lastX = W;
  const lastY = H - ((last - lo) / span) * H;
  const s = STATUS[status];

  return (
    <div className="mt-4">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="moistFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={s.hex} stopOpacity="0.28" />
            <stop offset="100%" stopColor={s.hex} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* healthy band */}
        <rect x="0" y={bandTop} width={W} height={bandBot - bandTop} fill="#86c46b" opacity="0.07" />
        <line x1="0" y1={bandTop} x2={W} y2={bandTop} stroke="#86c46b" strokeOpacity="0.25" strokeWidth="1" strokeDasharray="4 5" />
        <line x1="0" y1={bandBot} x2={W} y2={bandBot} stroke="#86c46b" strokeOpacity="0.25" strokeWidth="1" strokeDasharray="4 5" />

        {/* grid */}
        {[0.25, 0.5, 0.75].map((g) => (
          <line key={g} x1="0" y1={H * g} x2={W} y2={H * g} stroke="#ffffff" strokeOpacity="0.05" strokeWidth="1" />
        ))}

        <path d={area} fill="url(#moistFill)" />
        <path
          d={line}
          fill="none"
          stroke={s.hex}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          style={{ transition: "stroke 0.6s ease" }}
        />
        {/* live head */}
        <circle cx={lastX} cy={lastY} r="8" fill={s.hex} opacity="0.18">
          <animate attributeName="r" values="6;12;6" dur="1.6s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.25;0;0.25" dur="1.6s" repeatCount="indefinite" />
        </circle>
        <circle cx={lastX} cy={lastY} r="3.5" fill={s.hex} />
      </svg>
    </div>
  );
}

function SensorTile({ channel, series }: { channel: Channel; series: number[] }) {
  const value = series[series.length - 1];
  const status = statusOf(channel, value);
  const s = STATUS[status];
  const prev = series[series.length - 6] ?? value;
  const delta = value - prev;
  const trend = Math.abs(delta) < channel.step * 0.4 ? "→" : delta > 0 ? "↑" : "↓";

  const W = 120;
  const H = 34;
  const lo = Math.min(...series);
  const hi = Math.max(...series);
  const line = linePath(series, lo, hi, W, H);

  return (
    <div className="group bg-ink p-4 transition-colors hover:bg-paper/[0.03]">
      <div className="flex items-center justify-between">
        <span className="text-[12px] text-paper/50">{channel.label}</span>
        <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} title={s.label} />
      </div>
      <div className="mt-1.5 flex items-baseline gap-1">
        <span className="text-2xl font-300 tabular-nums text-paper">{fmt(value, channel.decimals)}</span>
        {channel.unit && <span className="text-[12px] text-paper/40">{channel.unit}</span>}
      </div>
      <div className="mt-2 h-[34px]">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" preserveAspectRatio="none">
          <path d={line} fill="none" stroke={s.hex} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" opacity="0.85" />
        </svg>
      </div>
      <div className={`mt-1 flex items-center gap-1 text-[11px] ${s.tint}`}>
        <span>{trend}</span>
        <span className="text-paper/35">
          {channel.optimal[0]}–{channel.optimal[1]}
          {channel.unit ? " " + channel.unit : ""}
        </span>
      </div>
    </div>
  );
}

function ProbeRow({ probe, moisture, tick }: { probe: Probe; moisture: number; tick: number }) {
  const reading = clamp(moisture + probe.offset, 30, 90);
  // Signal bars cycle slightly so each probe feels independently alive.
  const bars = 2 + ((tick + probe.offset + 12) % 3);
  return (
    <div className="flex items-center justify-between rounded-lg border border-paper/10 bg-paper/[0.02] px-3 py-2">
      <div className="flex items-center gap-2.5">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sprout" />
        <div className="leading-tight">
          <div className="font-mono text-[12px] text-paper/80">{probe.id}</div>
          <div className="text-[11px] text-paper/40">{probe.zone}</div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="tabular-nums text-[13px] text-paper/70">{fmt(reading, 0)}%</span>
        <div className="flex items-end gap-0.5" title="signal">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={`w-0.5 rounded-full ${i < bars ? "bg-sprout" : "bg-paper/15"}`}
              style={{ height: `${5 + i * 2.5}px` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function LogRow({ status, text }: { status: StatusKey; text: string }) {
  const s = STATUS[status];
  return (
    <div className="flex items-center justify-between rounded-md px-1 py-1 font-mono text-[12px]">
      <span className="flex items-center gap-2 text-paper/70">
        <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
        {text}
      </span>
      <span className={`text-[11px] uppercase ${s.tint}`}>{s.label}</span>
    </div>
  );
}
