"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import FarmMap, { type FarmMapHandle } from "./FarmMap";

// three.js can't render on the server — load the 3D view client-side only.
const PlotGlobe3D = dynamic(() => import("./PlotGlobe3D"), { ssr: false });
import { ringAreaAcres } from "@/lib/geo";
import { primaryCrop, cropColor, cropLegend, NO_CROP_COLOR } from "@/lib/crops";
import type { Farm, Field, SessionUser } from "./types";

type Mode = "view" | "draw" | "scout" | "soil" | "weed";

export default function Console({ user, farms }: { user: SessionUser; farms: Farm[] }) {
  const router = useRouter();
  const mapRef = useRef<FarmMapHandle>(null);

  const [activeFarmId, setActiveFarmId] = useState<string | null>(farms[0]?.id ?? null);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("view");
  const [draftVertices, setDraftVertices] = useState(0);

  const [layers, setLayers] = useState({ scouts: true, soil: true, weeds: true });

  // Modal state
  const [showNewFarm, setShowNewFarm] = useState(farms.length === 0);
  const [pendingRing, setPendingRing] = useState<number[][] | null>(null);
  const [pendingScout, setPendingScout] = useState<{ lng: number; lat: number } | null>(null);
  const [pendingSoil, setPendingSoil] = useState<{ lng: number; lat: number } | null>(null);
  const [pendingWeed, setPendingWeed] = useState<{ lng: number; lat: number } | null>(null);
  const [showGlobe, setShowGlobe] = useState(false);
  const [showTeam, setShowTeam] = useState(false);

  const activeFarm = farms.find((f) => f.id === activeFarmId) ?? farms[0] ?? null;
  const fields = activeFarm?.fields ?? [];
  const selectedField = fields.find((f) => f.id === selectedFieldId) ?? null;

  function selectField(id: string) {
    setSelectedFieldId(id);
    const f = fields.find((x) => x.id === id);
    if (f) mapRef.current?.flyToField(f);
  }

  function startDraw() {
    setSelectedFieldId(null);
    setMode("draw");
    setDraftVertices(0);
  }
  function startScout() {
    if (!selectedField) return;
    setMode("scout");
  }
  function startSoil() {
    if (!selectedField) return;
    setMode("soil");
  }
  function startWeed() {
    if (!selectedField) return;
    setMode("weed");
  }

  // Farm-wide rollup for the overview strip.
  const stats = fields.reduce(
    (acc, f) => {
      acc.acres += f.areaAcres;
      acc.scouts += f.scouts.length;
      acc.soil += f.soil.length;
      acc.weedHot += f.weeds.filter((w) => w.status === "active").length;
      for (const s of f.scouts) {
        acc.healthSum += s.health;
        acc.healthCount += 1;
      }
      return acc;
    },
    { acres: 0, scouts: 0, soil: 0, weedHot: 0, healthSum: 0, healthCount: 0 }
  );
  const avgHealth = stats.healthCount ? stats.healthSum / stats.healthCount : null;
  const legend = cropLegend(fields);
  function cancelMode() {
    mapRef.current?.cancelDraw();
    setMode("view");
    setDraftVertices(0);
  }

  return (
    <div className="fixed inset-0 flex bg-[#f6f7f5] text-neutral-900">
      {/* Sidebar */}
      <aside className="w-[248px] shrink-0 border-r border-neutral-200 bg-white flex flex-col">
        <div className="px-3 py-3 border-b border-neutral-100">
          <FarmPicker
            farms={farms}
            activeFarm={activeFarm}
            onSelect={(id) => {
              setActiveFarmId(id);
              setSelectedFieldId(null);
            }}
            onNew={() => setShowNewFarm(true)}
          />

          {activeFarm && (
            <button
              onClick={() => setShowTeam(true)}
              className="mt-2 w-full flex items-center gap-2 px-2 h-9 rounded-lg hover:bg-neutral-50"
              title="Manage team"
            >
              <div className="flex -space-x-1.5">
                {activeFarm.team.slice(0, 4).map((m) => (
                  <Avatar key={m.id} name={m.name} size={22} ring />
                ))}
              </div>
              <span className="text-[12px] text-neutral-500">
                {activeFarm.team.length} {activeFarm.team.length === 1 ? "member" : "members"}
              </span>
              <span className="ml-auto text-[12px] text-[#3f7a3f] font-medium">Team</span>
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-3">
          <div className="flex items-center justify-between px-3 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wide text-neutral-400">
              Plots · {fields.length}
            </span>
          </div>
          {fields.length === 0 && (
            <p className="px-3 py-4 text-[12.5px] text-neutral-400 leading-relaxed">
              No plots yet. Hit <span className="font-medium">Add plot</span> and draw your
              boundary on the map.
            </p>
          )}
          <ul className="space-y-0.5">
            {fields.map((f) => {
              const crop = primaryCrop(f);
              return (
                <li key={f.id}>
                  <button
                    onClick={() => selectField(f.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition ${
                      selectedFieldId === f.id ? "bg-[#eef4ee]" : "hover:bg-neutral-50"
                    }`}
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-sm shrink-0"
                      style={{ background: crop ? cropColor(crop) : NO_CROP_COLOR }}
                    />
                    <span className="flex-1 min-w-0">
                      <span className="block text-[13.5px] font-medium truncate">{f.name}</span>
                      <span className="block text-[11.5px] text-neutral-400 truncate">
                        {crop ? `${crop} · ` : ""}{f.areaAcres.toFixed(2)} ac · {f.landType}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Crop legend */}
          {legend.length > 0 && (
            <div className="mt-4 px-3">
              <span className="text-[11px] font-medium uppercase tracking-wide text-neutral-400">
                Crops
              </span>
              <ul className="mt-1.5 space-y-1">
                {legend.map((c) => (
                  <li key={c.crop} className="flex items-center gap-2 text-[12.5px] text-neutral-600">
                    <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ background: c.color }} />
                    <span className="flex-1 truncate">{c.crop}</span>
                    <span className="text-neutral-400">{c.plots}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <UserFooter user={user} onSignOut={async () => {
          await fetch("/api/auth/logout", { method: "POST" });
          router.push("/login");
          router.refresh();
        }} />
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 shrink-0 flex items-center justify-between px-5 border-b border-neutral-200 bg-white">
          <div>
            <h1 className="text-[15px] font-semibold tracking-tight">
              {selectedField ? selectedField.name : "Field map"}
            </h1>
            <p className="text-[11.5px] text-neutral-400">
              {activeFarm?.location || activeFarm?.name || "—"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={startWeed}
              disabled={!selectedField || mode !== "view"}
              className="h-9 px-3.5 rounded-lg text-[13px] font-medium border border-neutral-200 hover:bg-neutral-50 disabled:opacity-40"
            >
              Mark weed
            </button>
            <button
              onClick={startSoil}
              disabled={!selectedField || mode !== "view"}
              className="h-9 px-3.5 rounded-lg text-[13px] font-medium border border-neutral-200 hover:bg-neutral-50 disabled:opacity-40"
            >
              Soil sample
            </button>
            <button
              onClick={startScout}
              disabled={!selectedField || mode !== "view"}
              className="h-9 px-3.5 rounded-lg text-[13px] font-medium border border-neutral-200 hover:bg-neutral-50 disabled:opacity-40"
            >
              Scout crop
            </button>
            <button
              onClick={startDraw}
              disabled={mode !== "view"}
              className="h-9 px-3.5 rounded-lg text-[13px] font-medium bg-[#3f7a3f] text-white hover:bg-[#356b35] disabled:opacity-50"
            >
              + Add plot
            </button>
          </div>
        </header>

        {/* Farm overview strip */}
        <div className="shrink-0 flex items-stretch gap-px bg-neutral-200 border-b border-neutral-200 text-center">
          <StatCell label="Plots" value={String(fields.length)} />
          <StatCell label="Acres" value={stats.acres.toFixed(1)} />
          <StatCell
            label="Avg health"
            value={avgHealth ? `${avgHealth.toFixed(1)}/5` : "—"}
            tone={avgHealth ? (avgHealth >= 4 ? "good" : avgHealth >= 2.5 ? "warn" : "bad") : undefined}
          />
          <StatCell label="Weed targets" value={String(stats.weedHot)} tone={stats.weedHot ? "bad" : undefined} />
          <StatCell label="Scout points" value={String(stats.scouts)} />
          <StatCell label="Soil samples" value={String(stats.soil)} />
        </div>

        {/* Map + panel */}
        <div className="flex-1 relative">
          <FarmMap
            ref={mapRef}
            fields={fields}
            selectedFieldId={selectedFieldId}
            mode={mode}
            layers={layers}
            onSelectField={(id) => setSelectedFieldId(id)}
            onDraftChange={setDraftVertices}
            onPolygonComplete={(ring) => {
              setPendingRing(ring);
              setMode("view");
            }}
            onScoutPoint={(lng, lat) => {
              setPendingScout({ lng, lat });
              setMode("view");
            }}
            onSoilPoint={(lng, lat) => {
              setPendingSoil({ lng, lat });
              setMode("view");
            }}
            onWeedPoint={(lng, lat) => {
              setPendingWeed({ lng, lat });
              setMode("view");
            }}
          />

          {/* Layer toggles */}
          {mode === "view" && (
            <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-1 rounded-lg bg-white/95 backdrop-blur px-3 py-2.5 shadow-lg ring-1 ring-black/5">
              <span className="text-[10px] font-medium uppercase tracking-wide text-neutral-400">Layers</span>
              <LayerToggle
                label="Crop scouting"
                dot="#4fd06a"
                on={layers.scouts}
                onClick={() => setLayers((l) => ({ ...l, scouts: !l.scouts }))}
              />
              <LayerToggle
                label="Soil samples"
                dot="#4f9dd0"
                on={layers.soil}
                onClick={() => setLayers((l) => ({ ...l, soil: !l.soil }))}
              />
              <LayerToggle
                label="Weed targets"
                dot="#e5443c"
                on={layers.weeds}
                onClick={() => setLayers((l) => ({ ...l, weeds: !l.weeds }))}
              />
            </div>
          )}

          {/* Draw / scout / soil instruction bar */}
          {mode === "draw" && (
            <ModeBar
              text={
                draftVertices < 3
                  ? `Click the map to drop corners — ${draftVertices}/3 minimum`
                  : `${draftVertices} corners set. Finish when the shape looks right.`
              }
              primary={{ label: "Finish field", disabled: draftVertices < 3, onClick: () => mapRef.current?.finishDraw() }}
              onCancel={cancelMode}
            />
          )}
          {mode === "scout" && (
            <ModeBar text="Click the exact spot in the field you're scouting." onCancel={cancelMode} />
          )}
          {mode === "soil" && (
            <ModeBar text="Click where you pulled the soil sample." onCancel={cancelMode} />
          )}
          {mode === "weed" && (
            <ModeBar text="Click each weed patch — these become the worm's targets." onCancel={cancelMode} />
          )}

          {/* Field detail panel */}
          {selectedField && mode === "view" && (
            <FieldPanel
              field={selectedField}
              onClose={() => setSelectedFieldId(null)}
              onScout={startScout}
              onSoil={startSoil}
              onWeed={startWeed}
              onGlobe={() => setShowGlobe(true)}
              onToggleWeed={async (id, status) => {
                await fetch("/api/weeds", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ id, status }),
                });
                router.refresh();
              }}
              onAddPlanting={async (payload) => {
                await fetch("/api/plantings", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ ...payload, fieldId: selectedField.id }),
                });
                router.refresh();
              }}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      {showNewFarm && (
        <NewFarmModal
          dismissable={farms.length > 0}
          onClose={() => setShowNewFarm(false)}
          onCreate={async (payload) => {
            const res = await fetch("/api/farms", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (res.ok) {
              setActiveFarmId(data.farm.id);
              setShowNewFarm(false);
              router.refresh();
            }
            return data.error as string | undefined;
          }}
          onImport={async () => {
            const res = await fetch("/api/farms/import-osm", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: "Napa Valley (real fields)",
                location: "Napa, California",
                // A vineyard-dense box around Oakville/Yountville.
                minLng: -122.44, minLat: 38.40, maxLng: -122.36, maxLat: 38.47,
                limit: 24,
              }),
            });
            const data = await res.json();
            if (res.ok) {
              setActiveFarmId(data.farm.id);
              setSelectedFieldId(null);
              setShowNewFarm(false);
              router.refresh();
            }
            return data.error as string | undefined;
          }}
        />
      )}

      {pendingRing && activeFarm && (
        <NewFieldModal
          areaAcres={ringAreaAcres(pendingRing)}
          onClose={() => setPendingRing(null)}
          onCreate={async ({ name, landType, crop }) => {
            const res = await fetch("/api/fields", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name,
                landType,
                farmId: activeFarm.id,
                geometry: { type: "Polygon", coordinates: [pendingRing] },
              }),
            });
            const data = await res.json();
            if (!res.ok) return data.error as string | undefined;
            // Optionally seed the plot with its crop right away.
            if (crop && data.field?.id) {
              await fetch("/api/plantings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fieldId: data.field.id, crop, status: "growing" }),
              });
            }
            setPendingRing(null);
            router.refresh();
            return undefined;
          }}
        />
      )}

      {pendingScout && selectedField && (
        <ScoutModal
          onClose={() => setPendingScout(null)}
          onCreate={async (payload) => {
            const res = await fetch("/api/observations", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...payload, fieldId: selectedField.id, ...pendingScout }),
            });
            const data = await res.json();
            if (res.ok) {
              setPendingScout(null);
              router.refresh();
            }
            return data.error as string | undefined;
          }}
        />
      )}

      {pendingSoil && selectedField && (
        <SoilModal
          onClose={() => setPendingSoil(null)}
          onCreate={async (payload) => {
            const res = await fetch("/api/soil-samples", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...payload, fieldId: selectedField.id, ...pendingSoil }),
            });
            const data = await res.json();
            if (res.ok) {
              setPendingSoil(null);
              router.refresh();
            }
            return data.error as string | undefined;
          }}
        />
      )}

      {pendingWeed && selectedField && (
        <WeedModal
          onClose={() => setPendingWeed(null)}
          onCreate={async (payload) => {
            const res = await fetch("/api/weeds", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...payload, fieldId: selectedField.id, ...pendingWeed }),
            });
            const data = await res.json();
            if (res.ok) {
              setPendingWeed(null);
              router.refresh();
            }
            return data.error as string | undefined;
          }}
        />
      )}

      {showGlobe && selectedField && activeFarm && (
        <PlotGlobe3D
          field={selectedField}
          onClose={() => setShowGlobe(false)}
          onSaveShape={async (ring) => {
            const res = await fetch("/api/fields", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: `Plot ${activeFarm.fields.length + 1}`,
                landType: "Field",
                farmId: activeFarm.id,
                geometry: { type: "Polygon", coordinates: [ring] },
              }),
            });
            const data = await res.json();
            if (res.ok) router.refresh();
            return data.error as string | undefined;
          }}
        />
      )}

      {showTeam && activeFarm && (
        <TeamModal
          farm={activeFarm}
          meId={user.id}
          onClose={() => setShowTeam(false)}
          onInvite={async (email, role) => {
            const res = await fetch(`/api/farms/${activeFarm.id}/members`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email, role }),
            });
            const data = await res.json();
            if (res.ok) router.refresh();
            return data.error as string | undefined;
          }}
          onRemove={async (memberUserId) => {
            await fetch(`/api/farms/${activeFarm.id}/members?userId=${memberUserId}`, {
              method: "DELETE",
            });
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function FarmPicker({
  farms,
  activeFarm,
  onSelect,
  onNew,
}: {
  farms: Farm[];
  activeFarm: Farm | null;
  onSelect: (id: string) => void;
  onNew: () => void;
}) {
  const [open, setOpen] = useState(false);
  const acresOf = (f: Farm) => f.fields.reduce((a, x) => a + x.areaAcres, 0);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2.5 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-left hover:border-neutral-300 transition"
      >
        <span className="h-8 w-8 shrink-0 rounded-lg bg-[#3f7a3f] text-white grid place-items-center text-[14px]">🌱</span>
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-semibold tracking-tight truncate">
            {activeFarm?.name ?? "Select a farm"}
          </span>
          <span className="block text-[11px] text-neutral-400 truncate">
            {activeFarm
              ? `${activeFarm.location || "—"} · ${acresOf(activeFarm).toFixed(0)} ac`
              : ""}
          </span>
        </span>
        <svg
          className={`h-4 w-4 text-neutral-400 transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6"
        >
          <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 rounded-xl border border-neutral-200 bg-white shadow-xl p-1.5">
            <div className="max-h-[280px] overflow-y-auto">
              {farms.map((f) => {
                const active = f.id === activeFarm?.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => { onSelect(f.id); setOpen(false); }}
                    className={`w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition ${
                      active ? "bg-[#eef4ee]" : "hover:bg-neutral-50"
                    }`}
                  >
                    <span className="h-7 w-7 shrink-0 rounded-lg bg-[#3f7a3f]/10 text-[#3f7a3f] grid place-items-center text-[13px]">🌱</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13.5px] font-medium truncate">{f.name}</span>
                      <span className="block text-[11px] text-neutral-400 truncate">
                        {f.fields.length} plots · {acresOf(f).toFixed(0)} ac
                      </span>
                    </span>
                    {active && <span className="text-[#3f7a3f] text-[13px]">✓</span>}
                  </button>
                );
              })}
            </div>
            <div className="border-t border-neutral-100 mt-1 pt-1">
              <button
                onClick={() => { onNew(); setOpen(false); }}
                className="w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] font-medium text-[#3f7a3f] hover:bg-[#eef4ee]"
              >
                <span className="h-7 w-7 grid place-items-center rounded-lg bg-[#eef4ee] text-[16px]">+</span>
                New farm
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/** Deterministic avatar: initials on a colour hashed from the name. */
function Avatar({ name, size = 28, ring }: { name: string; size?: number; ring?: boolean }) {
  const colors = ["#3f7a3f", "#c8663a", "#7fb2cf", "#9b7fcf", "#d19a66", "#c94f7c", "#4fd0a0"];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  const bg = colors[h % colors.length];
  return (
    <span
      className={`grid place-items-center rounded-full text-white font-semibold ${ring ? "ring-2 ring-white" : ""}`}
      style={{ width: size, height: size, background: bg, fontSize: size * 0.42 }}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

function TeamModal({
  farm,
  meId,
  onClose,
  onInvite,
  onRemove,
}: {
  farm: Farm;
  meId: string;
  onClose: () => void;
  onInvite: (email: string, role: string) => Promise<string | undefined>;
  onRemove: (userId: string) => Promise<void>;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <Shell onClose={onClose}>
      <h2 className="text-[19px] font-semibold tracking-tight">Team · {farm.name}</h2>
      <p className="text-[13px] text-neutral-500 mt-1">Everyone here can see and work this farm.</p>

      <ul className="mt-4 space-y-1.5 max-h-[240px] overflow-y-auto">
        {farm.team.map((m) => (
          <li key={m.id} className="flex items-center gap-2.5 rounded-lg bg-neutral-50 px-3 py-2">
            <Avatar name={m.name} />
            <div className="min-w-0 flex-1">
              <div className="text-[13.5px] font-medium truncate">
                {m.name} {m.id === meId && <span className="text-neutral-400 font-normal">(you)</span>}
              </div>
              <div className="text-[11.5px] text-neutral-400 truncate">{m.email}</div>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-white text-neutral-500 ring-1 ring-neutral-200 capitalize">
              {m.role}
            </span>
            {m.role !== "owner" && (
              <button
                onClick={() => onRemove(m.id)}
                className="text-[11.5px] text-neutral-400 hover:text-red-600"
                title="Remove"
              >
                ✕
              </button>
            )}
          </li>
        ))}
      </ul>

      <div className="mt-4 border-t border-neutral-100 pt-4">
        <label className="text-[12px] font-medium text-neutral-600">Invite a teammate</label>
        <div className="mt-1.5 flex gap-2">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="their@email.com"
            className="flex-1 h-10 rounded-lg border border-neutral-200 px-3 text-[14px] outline-none focus:border-[#3f7a3f]"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="h-10 rounded-lg border border-neutral-200 px-2 text-[13px] outline-none focus:border-[#3f7a3f]"
          >
            {["member", "scout", "manager"].map((r) => (
              <option key={r} value={r} className="capitalize">{r}</option>
            ))}
          </select>
        </div>
        {error && <p className="mt-2 text-[12.5px] text-red-600">{error}</p>}
        <button
          disabled={!email || busy}
          onClick={async () => {
            setBusy(true);
            setError(null);
            const err = await onInvite(email, role);
            if (err) setError(err);
            else setEmail("");
            setBusy(false);
          }}
          className="mt-2 w-full h-10 rounded-lg bg-[#3f7a3f] text-white text-[14px] font-medium disabled:opacity-50"
        >
          {busy ? "Adding…" : "Add to team"}
        </button>
      </div>
    </Shell>
  );
}

/* ------------------------------- pieces -------------------------------- */

function StatCell({ label, value, tone }: { label: string; value: string; tone?: "good" | "warn" | "bad" }) {
  const color =
    tone === "good" ? "text-[#3f7a3f]" : tone === "warn" ? "text-[#b8860b]" : tone === "bad" ? "text-[#c0392b]" : "text-neutral-900";
  return (
    <div className="flex-1 bg-white py-2.5">
      <div className={`text-[17px] font-semibold leading-none ${color}`}>{value}</div>
      <div className="mt-1 text-[10.5px] uppercase tracking-wide text-neutral-400">{label}</div>
    </div>
  );
}

function LayerToggle({ label, dot, on, onClick }: { label: string; dot: string; on: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-2 text-[12.5px] text-neutral-700">
      <span
        className="h-3.5 w-3.5 rounded-[4px] border grid place-items-center"
        style={{ borderColor: dot, background: on ? dot : "transparent" }}
      >
        {on && <span className="text-white text-[9px] leading-none">✓</span>}
      </span>
      {label}
    </button>
  );
}

function UserFooter({ user, onSignOut }: { user: SessionUser; onSignOut: () => void }) {
  return (
    <div className="border-t border-neutral-100 p-3 flex items-center gap-2">
      <div className="h-8 w-8 rounded-full bg-[#3f7a3f] text-white grid place-items-center text-[13px] font-semibold">
        {user.name.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium truncate">{user.name}</div>
        <div className="text-[11px] text-neutral-400 truncate">{user.email}</div>
      </div>
      <button
        onClick={onSignOut}
        title="Sign out"
        className="text-[11.5px] text-neutral-400 hover:text-neutral-700 px-1"
      >
        Sign out
      </button>
    </div>
  );
}

function ModeBar({
  text,
  primary,
  onCancel,
}: {
  text: string;
  primary?: { label: string; disabled?: boolean; onClick: () => void };
  onCancel: () => void;
}) {
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3 rounded-full bg-white/95 backdrop-blur px-4 py-2 shadow-lg ring-1 ring-black/5">
      <span className="text-[13px] text-neutral-700">{text}</span>
      {primary && (
        <button
          onClick={primary.onClick}
          disabled={primary.disabled}
          className="h-7 px-3 rounded-full bg-[#3f7a3f] text-white text-[12.5px] font-medium disabled:opacity-40"
        >
          {primary.label}
        </button>
      )}
      <button onClick={onCancel} className="h-7 px-3 rounded-full text-[12.5px] text-neutral-500 hover:bg-neutral-100">
        Cancel
      </button>
    </div>
  );
}

function FieldPanel({
  field,
  onClose,
  onScout,
  onSoil,
  onWeed,
  onGlobe,
  onToggleWeed,
  onAddPlanting,
}: {
  field: Field;
  onClose: () => void;
  onScout: () => void;
  onSoil: () => void;
  onWeed: () => void;
  onGlobe: () => void;
  onToggleWeed: (id: string, status: string) => Promise<void>;
  onAddPlanting: (p: { crop: string; variety: string; plantedOn: string; status: string }) => Promise<void>;
}) {
  const activeWeeds = field.weeds.filter((w) => w.status === "active").length;
  const [crop, setCrop] = useState("");
  const [variety, setVariety] = useState("");
  const [plantedOn, setPlantedOn] = useState("");
  const [adding, setAdding] = useState(false);

  const avgHealth =
    field.scouts.length > 0
      ? field.scouts.reduce((s, o) => s + o.health, 0) / field.scouts.length
      : null;

  return (
    <div className="absolute top-4 right-4 bottom-4 w-[340px] z-10 flex flex-col rounded-xl bg-white shadow-[0_20px_50px_-20px_rgba(0,0,0,0.4)] ring-1 ring-black/5 overflow-hidden">
      <div className="flex items-start justify-between px-4 pt-4">
        <div>
          <h2 className="text-[17px] font-semibold tracking-tight">{field.name}</h2>
          <p className="text-[12px] text-neutral-400">
            {field.areaAcres.toFixed(2)} ac · {field.landType}
          </p>
        </div>
        <button onClick={onClose} className="text-neutral-300 hover:text-neutral-600 text-lg leading-none">
          ✕
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 px-4 py-3">
        <Stat label="Plantings" value={String(field.plantings.length)} />
        <Stat
          label="Crop health"
          value={avgHealth ? `${avgHealth.toFixed(1)}/5` : "—"}
          tone={avgHealth ? (avgHealth >= 4 ? "good" : avgHealth >= 2.5 ? "warn" : "bad") : undefined}
        />
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-5">
        {/* Worm mission */}
        <section className="rounded-lg bg-[#f3f6f1] ring-1 ring-[#3f7a3f]/15 p-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[12.5px] font-semibold text-[#2f5a2f]">Worm mission</div>
              <div className="text-[11.5px] text-neutral-500">
                {activeWeeds} target{activeWeeds === 1 ? "" : "s"} · geofenced route
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={onGlobe}
                className="h-8 px-3 rounded-lg bg-[#2f5a2f] text-white text-[12.5px] font-medium hover:bg-[#274c27]"
                title="Photoreal 3D (Google Tiles)"
              >
                Photoreal 3D
              </button>
              <a
                href={`/api/fields/${field.id}/mission`}
                className="h-8 px-3 grid place-items-center rounded-lg bg-white ring-1 ring-neutral-200 text-neutral-600 text-[12.5px] font-medium hover:bg-neutral-50"
              >
                Export
              </a>
            </div>
          </div>
        </section>

        {/* Weed targets */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[11px] font-medium uppercase tracking-wide text-neutral-400">
              Weed targets · {field.weeds.length}
            </h3>
            <button onClick={onWeed} className="text-[12px] text-[#c0392b] font-medium">
              + Mark weed
            </button>
          </div>
          {field.weeds.length === 0 && (
            <p className="text-[12.5px] text-neutral-400">
              No weeds marked. Drop a pin on each patch — these become the worm&apos;s targets.
            </p>
          )}
          <ul className="space-y-1.5">
            {field.weeds.map((w) => (
              <li key={w.id} className="flex items-center gap-2 rounded-lg bg-neutral-50 px-3 py-2">
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ background: w.status === "cleared" ? "#6b8f5a" : "#e5443c" }}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-medium capitalize">
                    {w.density} density{w.species ? ` · ${w.species}` : ""}
                  </div>
                  {w.note && <div className="text-[11.5px] text-neutral-400 truncate">{w.note}</div>}
                </div>
                <button
                  onClick={() => onToggleWeed(w.id, w.status === "cleared" ? "active" : "cleared")}
                  className="text-[11.5px] font-medium text-neutral-500 hover:text-neutral-800 shrink-0"
                >
                  {w.status === "cleared" ? "Reopen" : "Mark done"}
                </button>
              </li>
            ))}
          </ul>
        </section>

        {/* Plantings */}
        <section>
          <h3 className="text-[11px] font-medium uppercase tracking-wide text-neutral-400 mb-2">
            What's growing
          </h3>
          {field.plantings.length === 0 && (
            <p className="text-[12.5px] text-neutral-400">Nothing logged yet.</p>
          )}
          <ul className="space-y-1.5">
            {field.plantings.map((p) => (
              <li key={p.id} className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2">
                <div>
                  <div className="text-[13.5px] font-medium">{p.crop}</div>
                  {p.variety && <div className="text-[11.5px] text-neutral-400">{p.variety}</div>}
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-white text-neutral-500 ring-1 ring-neutral-200">
                  {p.status}
                </span>
              </li>
            ))}
          </ul>

          <details className="mt-2 group">
            <summary className="cursor-pointer text-[12.5px] text-[#3f7a3f] font-medium list-none">
              + Add planting
            </summary>
            <div className="mt-2 space-y-2">
              <input
                value={crop}
                onChange={(e) => setCrop(e.target.value)}
                placeholder="Crop (e.g. Carrots)"
                className="w-full h-9 rounded-lg border border-neutral-200 px-2.5 text-[13px] outline-none focus:border-[#3f7a3f]"
              />
              <input
                value={variety}
                onChange={(e) => setVariety(e.target.value)}
                placeholder="Variety (optional)"
                className="w-full h-9 rounded-lg border border-neutral-200 px-2.5 text-[13px] outline-none focus:border-[#3f7a3f]"
              />
              <input
                type="date"
                value={plantedOn}
                onChange={(e) => setPlantedOn(e.target.value)}
                className="w-full h-9 rounded-lg border border-neutral-200 px-2.5 text-[13px] text-neutral-600 outline-none focus:border-[#3f7a3f]"
              />
              <button
                disabled={!crop || adding}
                onClick={async () => {
                  setAdding(true);
                  await onAddPlanting({ crop, variety, plantedOn, status: "growing" });
                  setCrop(""); setVariety(""); setPlantedOn(""); setAdding(false);
                }}
                className="h-9 px-3 rounded-lg bg-[#3f7a3f] text-white text-[12.5px] font-medium disabled:opacity-40"
              >
                Save planting
              </button>
            </div>
          </details>
        </section>

        {/* Scouting */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[11px] font-medium uppercase tracking-wide text-neutral-400">
              Scouting log · {field.scouts.length}
            </h3>
            <button onClick={onScout} className="text-[12px] text-[#3f7a3f] font-medium">
              + Scout
            </button>
          </div>
          {field.scouts.length === 0 && (
            <p className="text-[12.5px] text-neutral-400">
              No scouting yet. Walk the field, drop a point, snap a photo.
            </p>
          )}
          <ul className="space-y-2">
            {field.scouts.map((s) => (
              <li key={s.id} className="flex gap-3 rounded-lg bg-neutral-50 p-2">
                {s.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.photo} alt="scout" className="h-14 w-14 rounded-md object-cover shrink-0" />
                ) : (
                  <div className="h-14 w-14 rounded-md bg-neutral-200 shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <HealthDot health={s.health} />
                    <span className="text-[12.5px] font-medium">Health {s.health}/5</span>
                    <span className="text-[11px] text-neutral-400">· weeds {s.weedPressure}</span>
                  </div>
                  {s.note && <p className="text-[12px] text-neutral-500 mt-0.5 line-clamp-2">{s.note}</p>}
                  <p className="text-[11px] text-neutral-300 mt-0.5">
                    {new Date(s.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Soil samples */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[11px] font-medium uppercase tracking-wide text-neutral-400">
              Soil samples · {field.soil.length}
            </h3>
            <button onClick={onSoil} className="text-[12px] text-[#3f7a3f] font-medium">
              + Sample
            </button>
          </div>
          {field.soil.length === 0 && (
            <p className="text-[12.5px] text-neutral-400">
              No soil readings yet. Drop a sample point to log moisture, pH and nutrients.
            </p>
          )}
          <ul className="space-y-1.5">
            {field.soil.map((s) => (
              <li key={s.id} className="rounded-lg bg-neutral-50 px-3 py-2">
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[12px]">
                  {s.moisture != null && <Metric label="moist" value={`${s.moisture}%`} />}
                  {s.ph != null && <Metric label="pH" value={s.ph.toFixed(1)} />}
                  {s.temperature != null && <Metric label="temp" value={`${s.temperature}°C`} />}
                  {s.nitrogen != null && <Metric label="N" value={`${s.nitrogen}`} />}
                  {s.phosphorus != null && <Metric label="P" value={`${s.phosphorus}`} />}
                  {s.potassium != null && <Metric label="K" value={`${s.potassium}`} />}
                </div>
                {s.note && <p className="text-[12px] text-neutral-500 mt-0.5">{s.note}</p>}
                <p className="text-[11px] text-neutral-300 mt-0.5">
                  {new Date(s.createdAt).toLocaleDateString()}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <span className="text-neutral-700">
      <span className="text-neutral-400">{label} </span>
      <span className="font-medium">{value}</span>
    </span>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "good" | "warn" | "bad" }) {
  const color =
    tone === "good" ? "text-[#3f7a3f]" : tone === "warn" ? "text-[#b8860b]" : tone === "bad" ? "text-[#c0392b]" : "text-neutral-900";
  return (
    <div className="rounded-lg bg-neutral-50 px-3 py-2">
      <div className="text-[11px] text-neutral-400">{label}</div>
      <div className={`text-[18px] font-semibold ${color}`}>{value}</div>
    </div>
  );
}

function HealthDot({ health }: { health: number }) {
  const c = health >= 4 ? "#4fd06a" : health >= 2.5 ? "#f5c542" : "#e5533c";
  return <span className="h-2.5 w-2.5 rounded-full inline-block" style={{ background: c }} />;
}

/* ------------------------------- modals -------------------------------- */

function Shell({ children, onClose, dismissable = true }: { children: React.ReactNode; onClose: () => void; dismissable?: boolean }) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/30 backdrop-blur-sm p-4"
      onClick={() => dismissable && onClose()}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[380px] rounded-xl bg-white shadow-2xl ring-1 ring-black/5 p-6"
      >
        {children}
      </div>
    </div>
  );
}

function NewFarmModal({
  onClose,
  onCreate,
  onImport,
  dismissable,
}: {
  onClose: () => void;
  onCreate: (p: { name: string; location: string }) => Promise<string | undefined>;
  onImport: () => Promise<string | undefined>;
  dismissable: boolean;
}) {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [importing, setImporting] = useState(false);

  return (
    <Shell onClose={onClose} dismissable={dismissable}>
      <h2 className="text-[19px] font-semibold tracking-tight">Create a farm</h2>
      <p className="text-[13px] text-neutral-500 mt-1">Give it a name and where it sits.</p>
      <div className="mt-4 space-y-2.5">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Farm name — e.g. East Bay"
          className="w-full h-10 rounded-lg border border-neutral-200 px-3 text-[14px] outline-none focus:border-[#3f7a3f]"
        />
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Location (optional)"
          className="w-full h-10 rounded-lg border border-neutral-200 px-3 text-[14px] outline-none focus:border-[#3f7a3f]"
        />
        {error && <p className="text-[12.5px] text-red-600">{error}</p>}
        <button
          disabled={!name || busy}
          onClick={async () => {
            setBusy(true);
            const err = await onCreate({ name, location });
            if (err) { setError(err); setBusy(false); }
          }}
          className="w-full h-10 rounded-lg bg-[#3f7a3f] text-white text-[14px] font-medium disabled:opacity-50"
        >
          {busy ? "Creating…" : "Create farm"}
        </button>
      </div>

      <div className="my-4 flex items-center gap-3 text-[11px] text-neutral-400">
        <span className="flex-1 h-px bg-neutral-200" /> or <span className="flex-1 h-px bg-neutral-200" />
      </div>

      <button
        disabled={importing}
        onClick={async () => {
          setImporting(true);
          setError(null);
          const err = await onImport();
          if (err) { setError(err); setImporting(false); }
        }}
        className="w-full h-10 rounded-lg border border-[#3f7a3f]/30 text-[#2f5a2f] text-[13px] font-medium hover:bg-[#eef4ee] disabled:opacity-50"
      >
        {importing ? "Importing real fields…" : "Import real Napa vineyards (OpenStreetMap)"}
      </button>
      <p className="mt-1.5 text-[11px] text-neutral-400 text-center">
        Loads actual mapped vineyard &amp; orchard boundaries near Napa.
      </p>
    </Shell>
  );
}

function NewFieldModal({
  areaAcres,
  onClose,
  onCreate,
}: {
  areaAcres: number;
  onClose: () => void;
  onCreate: (p: { name: string; landType: string; crop: string }) => Promise<string | undefined>;
}) {
  const [name, setName] = useState("");
  const [landType, setLandType] = useState("Field");
  const [crop, setCrop] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <Shell onClose={onClose}>
      <h2 className="text-[19px] font-semibold tracking-tight">Name this plot</h2>
      <p className="text-[13px] text-neutral-500 mt-1">{areaAcres.toFixed(2)} acres drawn.</p>
      <div className="mt-4 space-y-2.5">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Plot name — e.g. North Plot"
          className="w-full h-10 rounded-lg border border-neutral-200 px-3 text-[14px] outline-none focus:border-[#3f7a3f]"
        />
        <input
          value={crop}
          onChange={(e) => setCrop(e.target.value)}
          placeholder="Crop growing here (optional) — e.g. Carrots"
          className="w-full h-10 rounded-lg border border-neutral-200 px-3 text-[14px] outline-none focus:border-[#3f7a3f]"
        />
        <select
          value={landType}
          onChange={(e) => setLandType(e.target.value)}
          className="w-full h-10 rounded-lg border border-neutral-200 px-3 text-[14px] outline-none focus:border-[#3f7a3f]"
        >
          {["Field", "Pasture", "Orchard", "Bed", "Greenhouse", "Row crop"].map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        {error && <p className="text-[12.5px] text-red-600">{error}</p>}
        <button
          disabled={!name || busy}
          onClick={async () => {
            setBusy(true);
            const err = await onCreate({ name, landType, crop });
            if (err) { setError(err); setBusy(false); }
          }}
          className="w-full h-10 rounded-lg bg-[#3f7a3f] text-white text-[14px] font-medium disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save plot"}
        </button>
      </div>
    </Shell>
  );
}

function ScoutModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (p: { health: number; weedPressure: string; note: string; photo: string | null }) => Promise<string | undefined>;
}) {
  const [health, setHealth] = useState(4);
  const [weedPressure, setWeedPressure] = useState("none");
  const [note, setNote] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await downscaleImage(file, 1280, 0.8);
    setPhoto(dataUrl);
  }

  return (
    <Shell onClose={onClose}>
      <h2 className="text-[19px] font-semibold tracking-tight">Scout this spot</h2>
      <p className="text-[13px] text-neutral-500 mt-1">Rate the crop, note weed pressure, snap a photo.</p>

      <div className="mt-4 space-y-4">
        <div>
          <label className="text-[12px] font-medium text-neutral-600">Crop health — {health}/5</label>
          <input
            type="range" min={1} max={5} step={1} value={health}
            onChange={(e) => setHealth(Number(e.target.value))}
            className="w-full mt-1 accent-[#3f7a3f]"
          />
          <div className="flex justify-between text-[10.5px] text-neutral-400 px-0.5">
            <span>Poor</span><span>Thriving</span>
          </div>
        </div>

        <div>
          <label className="text-[12px] font-medium text-neutral-600 block mb-1">Weed pressure</label>
          <div className="grid grid-cols-4 gap-1.5">
            {["none", "low", "medium", "high"].map((w) => (
              <button
                key={w}
                onClick={() => setWeedPressure(w)}
                className={`h-8 rounded-lg text-[12px] capitalize border transition ${
                  weedPressure === w
                    ? "bg-[#3f7a3f] text-white border-[#3f7a3f]"
                    : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                }`}
              >
                {w}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[12px] font-medium text-neutral-600 block mb-1">Photo</label>
          {photo ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo} alt="crop" className="w-full h-40 object-cover rounded-lg" />
              <button
                onClick={() => setPhoto(null)}
                className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 text-white text-sm"
              >
                ✕
              </button>
            </div>
          ) : (
            <label className="flex h-24 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-neutral-200 text-[13px] text-neutral-400 hover:border-[#3f7a3f] hover:text-[#3f7a3f]">
              Tap to add crop photo
              <input type="file" accept="image/*" capture="environment" onChange={onPhoto} className="hidden" />
            </label>
          )}
        </div>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Notes — what did you see? (optional)"
          rows={2}
          className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-[13px] outline-none focus:border-[#3f7a3f] resize-none"
        />

        {error && <p className="text-[12.5px] text-red-600">{error}</p>}
        <button
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            const err = await onCreate({ health, weedPressure, note, photo });
            if (err) { setError(err); setBusy(false); }
          }}
          className="w-full h-10 rounded-lg bg-[#3f7a3f] text-white text-[14px] font-medium disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save observation"}
        </button>
      </div>
    </Shell>
  );
}

type SoilPayload = {
  moisture: string; ph: string; temperature: string;
  nitrogen: string; phosphorus: string; potassium: string; note: string;
};

function SoilModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (p: SoilPayload) => Promise<string | undefined>;
}) {
  const [v, setV] = useState<SoilPayload>({
    moisture: "", ph: "", temperature: "", nitrogen: "", phosphorus: "", potassium: "", note: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof SoilPayload) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setV((prev) => ({ ...prev, [k]: e.target.value }));

  return (
    <Shell onClose={onClose}>
      <h2 className="text-[19px] font-semibold tracking-tight">Log a soil sample</h2>
      <p className="text-[13px] text-neutral-500 mt-1">Fill in whatever you measured — all optional.</p>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <NumField label="Moisture %" value={v.moisture} onChange={set("moisture")} />
        <NumField label="pH" value={v.ph} onChange={set("ph")} step="0.1" />
        <NumField label="Temp °C" value={v.temperature} onChange={set("temperature")} />
        <NumField label="N ppm" value={v.nitrogen} onChange={set("nitrogen")} />
        <NumField label="P ppm" value={v.phosphorus} onChange={set("phosphorus")} />
        <NumField label="K ppm" value={v.potassium} onChange={set("potassium")} />
      </div>

      <textarea
        value={v.note}
        onChange={set("note")}
        placeholder="Notes (optional)"
        rows={2}
        className="w-full mt-3 rounded-lg border border-neutral-200 px-3 py-2 text-[13px] outline-none focus:border-[#3f7a3f] resize-none"
      />

      {error && <p className="text-[12.5px] text-red-600 mt-2">{error}</p>}
      <button
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          const err = await onCreate(v);
          if (err) { setError(err); setBusy(false); }
        }}
        className="w-full h-10 mt-3 rounded-lg bg-[#3f7a3f] text-white text-[14px] font-medium disabled:opacity-50"
      >
        {busy ? "Saving…" : "Save sample"}
      </button>
    </Shell>
  );
}

function NumField({
  label, value, onChange, step,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  step?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium text-neutral-500">{label}</span>
      <input
        type="number"
        inputMode="decimal"
        step={step}
        value={value}
        onChange={onChange}
        className="w-full h-9 rounded-lg border border-neutral-200 px-2 text-[13px] outline-none focus:border-[#3f7a3f]"
      />
    </label>
  );
}

function WeedModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (p: { density: string; species: string; note: string }) => Promise<string | undefined>;
}) {
  const [density, setDensity] = useState("medium");
  const [species, setSpecies] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <Shell onClose={onClose}>
      <h2 className="text-[19px] font-semibold tracking-tight">Mark a weed patch</h2>
      <p className="text-[13px] text-neutral-500 mt-1">This becomes a target the worm will service.</p>

      <div className="mt-4 space-y-4">
        <div>
          <label className="text-[12px] font-medium text-neutral-600 block mb-1">Density</label>
          <div className="grid grid-cols-3 gap-1.5">
            {["low", "medium", "high"].map((d) => (
              <button
                key={d}
                onClick={() => setDensity(d)}
                className={`h-8 rounded-lg text-[12px] capitalize border transition ${
                  density === d
                    ? "bg-[#c0392b] text-white border-[#c0392b]"
                    : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <input
          value={species}
          onChange={(e) => setSpecies(e.target.value)}
          placeholder="Species (optional) — e.g. Bindweed"
          className="w-full h-10 rounded-lg border border-neutral-200 px-3 text-[14px] outline-none focus:border-[#3f7a3f]"
        />
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Notes (optional)"
          rows={2}
          className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-[13px] outline-none focus:border-[#3f7a3f] resize-none"
        />

        {error && <p className="text-[12.5px] text-red-600">{error}</p>}
        <button
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            const err = await onCreate({ density, species, note });
            if (err) { setError(err); setBusy(false); }
          }}
          className="w-full h-10 rounded-lg bg-[#c0392b] text-white text-[14px] font-medium disabled:opacity-50"
        >
          {busy ? "Saving…" : "Mark weed target"}
        </button>
      </div>
    </Shell>
  );
}

/** Downscale a photo in-browser to keep the base64 payload small. */
function downscaleImage(file: File, maxDim: number, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("no canvas"));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
