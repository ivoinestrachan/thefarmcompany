"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import FarmMap, { type FarmMapHandle } from "./FarmMap";
import { ringAreaAcres } from "@/lib/geo";
import type { Farm, Field, SessionUser } from "./types";

type Mode = "view" | "draw" | "scout";

export default function Console({ user, farms }: { user: SessionUser; farms: Farm[] }) {
  const router = useRouter();
  const mapRef = useRef<FarmMapHandle>(null);

  const [activeFarmId, setActiveFarmId] = useState<string | null>(farms[0]?.id ?? null);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("view");
  const [draftVertices, setDraftVertices] = useState(0);

  // Modal state
  const [showNewFarm, setShowNewFarm] = useState(farms.length === 0);
  const [pendingRing, setPendingRing] = useState<number[][] | null>(null);
  const [pendingScout, setPendingScout] = useState<{ lng: number; lat: number } | null>(null);

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
          <label className="text-[11px] font-medium uppercase tracking-wide text-neutral-400 px-2">
            Farm
          </label>
          <select
            value={activeFarm?.id ?? ""}
            onChange={(e) => {
              setActiveFarmId(e.target.value);
              setSelectedFieldId(null);
            }}
            className="mt-1 w-full h-9 rounded-lg border border-neutral-200 bg-neutral-50 px-2 text-[13.5px] outline-none focus:border-[#3f7a3f]"
          >
            {farms.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowNewFarm(true)}
            className="mt-2 w-full h-8 rounded-lg text-[12.5px] text-[#3f7a3f] font-medium hover:bg-[#eef4ee]"
          >
            + New farm
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-3">
          <div className="flex items-center justify-between px-3 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wide text-neutral-400">
              Fields · {fields.length}
            </span>
          </div>
          {fields.length === 0 && (
            <p className="px-3 py-4 text-[12.5px] text-neutral-400 leading-relaxed">
              No fields yet. Hit <span className="font-medium">Add field</span> and draw your
              boundary on the map.
            </p>
          )}
          <ul className="space-y-0.5">
            {fields.map((f) => (
              <li key={f.id}>
                <button
                  onClick={() => selectField(f.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition ${
                    selectedFieldId === f.id ? "bg-[#eef4ee]" : "hover:bg-neutral-50"
                  }`}
                >
                  <span className="h-2.5 w-2.5 rounded-sm bg-[#e0c020] shrink-0" />
                  <span className="flex-1 min-w-0">
                    <span className="block text-[13.5px] font-medium truncate">{f.name}</span>
                    <span className="block text-[11.5px] text-neutral-400">
                      {f.areaAcres.toFixed(2)} ac · {f.landType}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
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
              + Add field
            </button>
          </div>
        </header>

        {/* Map + panel */}
        <div className="flex-1 relative">
          <FarmMap
            ref={mapRef}
            fields={fields}
            selectedFieldId={selectedFieldId}
            mode={mode}
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
          />

          {/* Draw / scout instruction bar */}
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

          {/* Field detail panel */}
          {selectedField && mode === "view" && (
            <FieldPanel
              field={selectedField}
              onClose={() => setSelectedFieldId(null)}
              onScout={startScout}
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
        />
      )}

      {pendingRing && activeFarm && (
        <NewFieldModal
          areaAcres={ringAreaAcres(pendingRing)}
          onClose={() => setPendingRing(null)}
          onCreate={async (payload) => {
            const res = await fetch("/api/fields", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...payload,
                farmId: activeFarm.id,
                geometry: { type: "Polygon", coordinates: [pendingRing] },
              }),
            });
            const data = await res.json();
            if (res.ok) {
              setPendingRing(null);
              router.refresh();
            }
            return data.error as string | undefined;
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
    </div>
  );
}

/* ------------------------------- pieces -------------------------------- */

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
  onAddPlanting,
}: {
  field: Field;
  onClose: () => void;
  onScout: () => void;
  onAddPlanting: (p: { crop: string; variety: string; plantedOn: string; status: string }) => Promise<void>;
}) {
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
      </div>
    </div>
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
  dismissable,
}: {
  onClose: () => void;
  onCreate: (p: { name: string; location: string }) => Promise<string | undefined>;
  dismissable: boolean;
}) {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
  onCreate: (p: { name: string; landType: string }) => Promise<string | undefined>;
}) {
  const [name, setName] = useState("");
  const [landType, setLandType] = useState("Field");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <Shell onClose={onClose}>
      <h2 className="text-[19px] font-semibold tracking-tight">Name this field</h2>
      <p className="text-[13px] text-neutral-500 mt-1">{areaAcres.toFixed(2)} acres drawn.</p>
      <div className="mt-4 space-y-2.5">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Field name — e.g. North Plot"
          className="w-full h-10 rounded-lg border border-neutral-200 px-3 text-[14px] outline-none focus:border-[#3f7a3f]"
        />
        <select
          value={landType}
          onChange={(e) => setLandType(e.target.value)}
          className="w-full h-10 rounded-lg border border-neutral-200 px-3 text-[14px] outline-none focus:border-[#3f7a3f]"
        >
          {["Field", "Pasture", "Orchard", "Bed", "Greenhouse"].map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        {error && <p className="text-[12.5px] text-red-600">{error}</p>}
        <button
          disabled={!name || busy}
          onClick={async () => {
            setBusy(true);
            const err = await onCreate({ name, landType });
            if (err) { setError(err); setBusy(false); }
          }}
          className="w-full h-10 rounded-lg bg-[#3f7a3f] text-white text-[14px] font-medium disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save field"}
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
