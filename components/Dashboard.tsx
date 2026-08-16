import Image from "next/image";
import Reveal from "./Reveal";
import { PulseIcon } from "./diagrams";

const METRICS = [
  { label: "soil moisture", value: "62%", trend: "+4%" },
  { label: "organic matter", value: "4.8%", trend: "+0.3" },
  { label: "weed pressure", value: "Low", trend: "-38%" },
  { label: "active bugs", value: "12", trend: "3 zones" },
];

const LEGEND = [
  { c: "bg-sprout", t: "Thriving" },
  { c: "bg-leaf", t: "Healthy" },
  { c: "bg-soil", t: "Recovering" },
  { c: "bg-clay", t: "Needs attention" },
];

export default function Dashboard() {
  return (
    <section id="dashboard" className="border-t hairline bg-char py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <Reveal>
          <span className="eyebrow">The dashboard</span>
          <h2 className="display mt-6 max-w-3xl text-3xl text-paper sm:text-5xl lg:text-6xl">
            Your whole farm on one screen.
          </h2>
          <p className="mt-6 max-w-2xl text-lg font-300 leading-relaxed text-fog">
            Every reading from the bugs builds a live model of your land. Walk the
            field from your desk, zoom in to a single plant, and watch the soil
            recover in real time.
          </p>
        </Reveal>

        <Reveal delay={120}>
          <div className="mt-12 overflow-hidden rounded-xl border hairline bg-char3 shadow-[0_50px_120px_-50px_rgba(0,0,0,0.8)]">
            {/* window chrome */}
            <div className="flex items-center justify-between border-b hairline px-5 py-3.5">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-paper/15" />
                  <span className="h-2.5 w-2.5 rounded-full bg-paper/15" />
                  <span className="h-2.5 w-2.5 rounded-full bg-paper/15" />
                </div>
                <span className="font-mono text-[12px] text-fog">
                  north-field · live
                </span>
              </div>
              <span className="flex items-center gap-2 font-mono text-[12px] text-signal">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-signal" />
                streaming
              </span>
            </div>

            <div className="grid gap-0 lg:grid-cols-[1.4fr_1fr]">
              {/* live site preview */}
              <div className="border-b hairline p-5 lg:border-b-0 lg:border-r">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm font-500 text-paper">
                    Live field model
                  </span>
                  <span className="tag">42.31°N · 8.4 ha</span>
                </div>
                <SitePreview />
                <div className="mt-4 flex flex-wrap gap-4">
                  {LEGEND.map((l) => (
                    <div key={l.t} className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-sm ${l.c}`} />
                      <span className="font-mono text-[11px] text-fog">{l.t}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* metrics rail */}
              <div className="p-6">
                <div className="grid grid-cols-2 gap-3">
                  {METRICS.map((m) => (
                    <div
                      key={m.label}
                      className="card-pop rounded-lg border hairline bg-char2 p-4 hover:border-signal/40"
                    >
                      <div className="font-mono text-[11px] uppercase tracking-wider text-faint">
                        {m.label}
                      </div>
                      <div className="mt-1.5 text-2xl font-400 tabular-nums tracking-tight text-paper">
                        {m.value}
                      </div>
                      <div className="mt-1 font-mono text-[12px] text-signal">
                        {m.trend}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-lg border hairline bg-char p-5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] uppercase tracking-wider text-fog">
                      soil health index
                    </span>
                    <PulseIcon className="h-4 w-10" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="display text-4xl text-paper">78</span>
                    <span className="font-mono text-sm text-signal">/100 · rising</span>
                  </div>
                  <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-paper/10">
                    <div className="h-full w-[78%] rounded-full bg-gradient-to-r from-soil via-sprout to-signal" />
                  </div>
                </div>

                <div className="mt-4 space-y-1">
                  <Row t="Wiggler · W-04 cleared row 12" time="2m ago" />
                  <Row t="Tiller · injected microbes, zone B" time="9m ago" />
                  <Row t="Scout · flagged moisture dip, plot 14" time="14m ago" />
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* A real field photo with a live-monitoring HUD. */
function SitePreview() {
  return (
    <div className="relative overflow-hidden rounded-lg border hairline bg-char">
      <div className="relative aspect-[16/10] w-full">
        <Image
          src="https://images.unsplash.com/photo-1560493676-04071c5f467b?auto=format&fit=crop&w=1400&q=80"
          alt="Aerial view of the monitored field"
          fill
          sizes="(min-width: 1024px) 58vw, 100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-char/25" />
      </div>

      {/* detection pins, sat on the field */}
      <Pin x="26%" y="60%" tone="signal" label="Zone A · thriving" />
      <Pin x="66%" y="54%" tone="soil" label="Moisture dip" />
      <Pin x="42%" y="80%" tone="paper" label="Wiggler · W-04" />

      {/* reticle corners */}
      <div className="pointer-events-none absolute inset-3">
        {[
          "left-0 top-0 border-l border-t",
          "right-0 top-0 border-r border-t",
          "left-0 bottom-0 border-l border-b",
          "right-0 bottom-0 border-r border-b",
        ].map((c) => (
          <span key={c} className={`absolute h-4 w-4 border-signal/70 ${c}`} />
        ))}
      </div>

      {/* scan line */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="scanline h-px w-full bg-gradient-to-r from-transparent via-signal to-transparent shadow-[0_0_12px_2px] shadow-signal/40" />
      </div>

      {/* corner status */}
      <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-char/70 px-2.5 py-1 font-mono text-[11px] text-paper backdrop-blur">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-signal" />
        live · 12 bugs active
      </div>
    </div>
  );
}

function Pin({
  x,
  y,
  label,
  tone,
}: {
  x: string;
  y: string;
  label: string;
  tone: "signal" | "soil" | "paper";
}) {
  const dot =
    tone === "signal" ? "bg-signal" : tone === "soil" ? "bg-soil" : "bg-paper";
  return (
    <div
      className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5"
      style={{ left: x, top: y }}
    >
      <span className={`h-2.5 w-2.5 rounded-full ${dot} ring-2 ring-char/70`} />
      <span className="whitespace-nowrap rounded-full bg-char/85 px-2 py-0.5 font-mono text-[10px] text-paper backdrop-blur">
        {label}
      </span>
    </div>
  );
}

function Row({ t, time }: { t: string; time: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg px-1 py-1.5 font-mono text-[12px]">
      <span className="flex items-center gap-2 text-fog">
        <span className="h-1.5 w-1.5 rounded-full bg-signal" />
        {t}
      </span>
      <span className="text-faint">{time}</span>
    </div>
  );
}
