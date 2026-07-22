import Reveal from "./Reveal";
import { PulseIcon } from "./diagrams";

const METRICS = [
  { label: "Soil moisture", value: "62%", trend: "+4%" },
  { label: "Organic matter", value: "4.8%", trend: "+0.3" },
  { label: "Weed pressure", value: "Low", trend: "-38%" },
  { label: "Active bugs", value: "12", trend: "3 zones" },
];

const LEGEND = [
  { c: "bg-leaf", t: "Thriving" },
  { c: "bg-sprout", t: "Healthy" },
  { c: "bg-loam/70", t: "Recovering" },
  { c: "bg-soil/60", t: "Needs attention" },
];

export default function Dashboard() {
  return (
    <section id="dashboard" className="bg-bone py-28 lg:py-36">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <Reveal>
          <span className="eyebrow text-leaf">The dashboard</span>
          <h2 className="display mt-5 max-w-3xl text-4xl text-ink sm:text-5xl lg:text-6xl">
            Your whole farm, alive on one screen.
          </h2>
          <p className="mt-6 max-w-2xl text-lg font-300 leading-relaxed text-ink/70">
            Every reading from the bugs rolls up into a live model of your land.
            Walk the field from your desk, zoom to a single plant, and watch soil
            health rebuild in real time.
          </p>
        </Reveal>

        <Reveal delay={120}>
          <div className="mt-14 overflow-hidden border hairline bg-paper shadow-[0_40px_120px_-40px_rgba(10,10,10,0.35)]">
            {/* window chrome */}
            <div className="flex items-center justify-between border-b hairline px-5 py-3.5">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-ink/15" />
                  <span className="h-2.5 w-2.5 rounded-full bg-ink/15" />
                  <span className="h-2.5 w-2.5 rounded-full bg-ink/15" />
                </div>
                <span className="text-[13px] text-ink/50">
                  North Field · Live
                </span>
              </div>
              <div className="flex items-center gap-2 text-[12px] text-leaf">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-leaf" />
                streaming
              </div>
            </div>

            <div className="grid gap-0 lg:grid-cols-[1.4fr_1fr]">
              {/* live site preview */}
              <div className="border-b hairline p-5 lg:border-b-0 lg:border-r">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm font-500 text-ink">
                    Live field model
                  </span>
                  <span className="rounded-full border hairline px-2.5 py-1 text-[11px] text-ink/55">
                    42.31°N · 8.4 ha
                  </span>
                </div>
                <SitePreview />
                <div className="mt-4 flex flex-wrap gap-4">
                  {LEGEND.map((l) => (
                    <div key={l.t} className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-sm ${l.c}`} />
                      <span className="text-[12px] text-ink/60">{l.t}</span>
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
                      className="card-pop border hairline bg-bone/60 p-4"
                    >
                      <div className="text-[12px] text-ink/50">{m.label}</div>
                      <div className="mt-1.5 text-2xl font-300 tracking-tight text-ink">
                        {m.value}
                      </div>
                      <div className="mt-1 text-[12px] text-leaf">{m.trend}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 border hairline bg-ink p-5 text-paper">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-paper/60">
                      Soil health index
                    </span>
                    <PulseIcon className="h-4 w-10" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="display text-4xl">78</span>
                    <span className="text-sm text-sprout">/100 · rising</span>
                  </div>
                  <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-paper/10">
                    <div className="h-full w-[78%] rounded-full bg-gradient-to-r from-loam via-sprout to-leaf" />
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <Row t="Grazer · G-04 cleared row 12" time="2m ago" />
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

/* A real field photo with a light live-monitoring HUD. */
function SitePreview() {
  return (
    <div className="relative overflow-hidden border hairline bg-ink/5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="https://images.unsplash.com/photo-1560493676-04071c5f467b?auto=format&fit=crop&w=1400&q=80"
        alt="Aerial view of the monitored field"
        className="aspect-[16/10] w-full object-cover"
      />

      {/* detection pins, sat on the field */}
      <Pin x="26%" y="60%" tone="leaf" label="Zone A · thriving" />
      <Pin x="66%" y="54%" tone="loam" label="Moisture dip" />
      <Pin x="42%" y="80%" tone="ink" label="Grazer · G-04" />

      {/* reticle corners */}
      <div className="pointer-events-none absolute inset-3">
        {[
          "left-0 top-0 border-l border-t",
          "right-0 top-0 border-r border-t",
          "left-0 bottom-0 border-l border-b",
          "right-0 bottom-0 border-r border-b",
        ].map((c) => (
          <span
            key={c}
            className={`absolute h-4 w-4 border-paper/70 ${c}`}
          />
        ))}
      </div>

      {/* scan line */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="scanline h-px w-full bg-gradient-to-r from-transparent via-leaf to-transparent shadow-[0_0_12px_2px] shadow-leaf/40" />
      </div>

      {/* corner status */}
      <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-ink/70 px-2.5 py-1 text-[11px] text-paper backdrop-blur">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-leaf" />
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
  tone: "leaf" | "loam" | "ink";
}) {
  const dot =
    tone === "leaf" ? "bg-leaf" : tone === "loam" ? "bg-loam" : "bg-ink";
  return (
    <div
      className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5"
      style={{ left: x, top: y }}
    >
      <span className={`h-2.5 w-2.5 rounded-full ${dot} ring-2 ring-paper/80`} />
      <span className="whitespace-nowrap rounded-full bg-paper/90 px-2 py-0.5 text-[10px] font-500 text-ink backdrop-blur">
        {label}
      </span>
    </div>
  );
}

function Row({ t, time }: { t: string; time: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg px-1 py-1.5 text-[13px]">
      <span className="flex items-center gap-2 text-ink/70">
        <span className="h-1.5 w-1.5 rounded-full bg-leaf" />
        {t}
      </span>
      <span className="text-ink/40">{time}</span>
    </div>
  );
}
