"use client";

import { useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import type { Field } from "./types";
import { primaryCrop, cropColor } from "@/lib/crops";

/* A cutaway 3D view of a plot: crop rows on the surface, weed targets and
   soil-core probes on top, and the soil horizons exposed on the sides so you
   can look "through the crops" into the ground the worm will map. */

const PLANE_W = 12; // scene units for the long axis
const SOIL_DEPTH = 5;

// Soil horizons (top→down): fraction of SOIL_DEPTH and colour.
const HORIZONS = [
  { name: "Topsoil", depth: 0.9, color: "#5a4130" },
  { name: "Subsoil", depth: 1.4, color: "#7c5a3c" },
  { name: "Clay", depth: 1.5, color: "#a3714b" },
  { name: "Bedrock", depth: 1.2, color: "#6f6b66" },
];

type XY = { minLng: number; minLat: number; w: number; h: number };

function useBounds(field: Field): { bounds: XY; planeW: number; planeD: number } {
  return useMemo(() => {
    const ring = field.geometry.coordinates[0];
    const lngs = ring.map((p) => p[0]);
    const lats = ring.map((p) => p[1]);
    const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
    const minLat = Math.min(...lats), maxLat = Math.max(...lats);
    const w = maxLng - minLng || 1e-6;
    const h = maxLat - minLat || 1e-6;
    const aspect = h / w;
    const planeW = PLANE_W;
    const planeD = PLANE_W * aspect;
    return { bounds: { minLng, minLat, w, h }, planeW, planeD };
  }, [field]);
}

/** Map a lng/lat to local scene x/z within the plot plane. */
function toLocal(lng: number, lat: number, b: XY, planeW: number, planeD: number): [number, number] {
  const x = ((lng - b.minLng) / b.w - 0.5) * planeW;
  const z = -(((lat - b.minLat) / b.h - 0.5) * planeD);
  return [x, z];
}

export default function PlotScene3D({ field, onClose }: { field: Field; onClose: () => void }) {
  const { bounds, planeW, planeD } = useBounds(field);
  const crop = primaryCrop(field);
  const surfaceColor = crop ? cropColor(crop) : "#8a9a5b";
  // The scout view opened by clicking a photo pin.
  const [openScout, setOpenScout] = useState<Field["scouts"][number] | null>(null);

  return (
    <div className="fixed inset-0 z-50 bg-[#0d1a12]">
      {/* Header overlay */}
      <div className="absolute top-0 inset-x-0 z-10 flex items-center justify-between px-5 h-14 bg-gradient-to-b from-black/50 to-transparent text-white">
        <div>
          <div className="text-[15px] font-semibold tracking-tight">{field.name} · 3D</div>
          <div className="text-[11.5px] text-white/60">
            {crop ? `${crop} · ` : ""}{field.areaAcres.toFixed(1)} ac · drag to orbit, scroll to zoom
          </div>
        </div>
        <button
          onClick={onClose}
          className="h-9 px-4 rounded-lg bg-white/15 hover:bg-white/25 text-[13px] font-medium backdrop-blur"
        >
          Close
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10 rounded-lg bg-black/45 backdrop-blur px-3 py-2.5 text-white text-[11.5px] space-y-1">
        <div className="uppercase tracking-wide text-white/50 text-[10px]">Soil profile</div>
        {HORIZONS.map((h) => (
          <div key={h.name} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: h.color }} />
            {h.name}
          </div>
        ))}
      </div>

      <Canvas camera={{ position: [planeW * 0.9, SOIL_DEPTH * 2.4, planeD * 1.4], fov: 45 }} shadows>
        <color attach="background" args={["#0d1a12"]} />
        <ambientLight intensity={0.7} />
        <directionalLight position={[10, 18, 8]} intensity={1.5} castShadow />
        <hemisphereLight args={["#bcd4ff", "#3a2a1a", 0.5]} />

        <SoilBlock planeW={planeW} planeD={planeD} surfaceColor={surfaceColor} />
        <CropRows planeW={planeW} planeD={planeD} crop={crop} />

        {/* Weed targets on the surface */}
        {field.weeds.map((w) => {
          const [x, z] = toLocal(w.lng, w.lat, bounds, planeW, planeD);
          const cleared = w.status === "cleared";
          return (
            <mesh key={w.id} position={[x, 0.35, z]}>
              <sphereGeometry args={[0.22, 16, 16]} />
              <meshStandardMaterial
                color={cleared ? "#6b8f5a" : "#e5443c"}
                emissive={cleared ? "#000000" : "#5a0d08"}
                emissiveIntensity={0.4}
              />
            </mesh>
          );
        })}

        {/* Soil cores drilling down, coloured by moisture */}
        {field.soil.map((s) => {
          const [x, z] = toLocal(s.lng, s.lat, bounds, planeW, planeD);
          const m = s.moisture ?? 30;
          const color = new THREE.Color().lerpColors(
            new THREE.Color("#b07a43"),
            new THREE.Color("#4f9dd0"),
            Math.min(1, Math.max(0, m / 100))
          );
          return (
            <group key={s.id}>
              <mesh position={[x, -SOIL_DEPTH / 2, z]}>
                <cylinderGeometry args={[0.12, 0.12, SOIL_DEPTH, 12]} />
                <meshStandardMaterial color={color} />
              </mesh>
              <Html position={[x, 0.6, z]} center distanceFactor={18}>
                <div className="whitespace-nowrap rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white">
                  {s.moisture != null ? `${s.moisture}% moist` : "core"}
                  {s.ph != null ? ` · pH ${s.ph}` : ""}
                </div>
              </Html>
            </group>
          );
        })}

        {/* Scout points — photo floats above the spot; click to view */}
        {field.scouts.map((s) => {
          const [x, z] = toLocal(s.lng, s.lat, bounds, planeW, planeD);
          const health = s.health >= 4 ? "#4fd06a" : s.health >= 2.5 ? "#f5c542" : "#e5533c";
          return (
            <group key={s.id}>
              <mesh position={[x, 0.28, z]}>
                <boxGeometry args={[0.18, 0.5, 0.18]} />
                <meshStandardMaterial color={health} />
              </mesh>
              <Html position={[x, 1.35, z]} center distanceFactor={16} occlude>
                <button
                  onClick={() => setOpenScout(s)}
                  className="block rounded-md overflow-hidden ring-2 ring-white shadow-lg"
                  style={{ width: 54, height: 54 }}
                  title="Open view"
                >
                  {s.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.photo} alt="scout" className="h-full w-full object-cover" />
                  ) : (
                    <span
                      className="flex h-full w-full items-center justify-center text-white text-[10px]"
                      style={{ background: health }}
                    >
                      {s.health}/5
                    </span>
                  )}
                </button>
              </Html>
            </group>
          );
        })}

        <OrbitControls enablePan minDistance={6} maxDistance={40} maxPolarAngle={Math.PI / 2.05} />
      </Canvas>

      {/* Clicked-location view */}
      {openScout && (
        <div
          className="absolute inset-0 z-20 grid place-items-center bg-black/70 p-6"
          onClick={() => setOpenScout(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-[440px] w-full rounded-xl bg-white overflow-hidden shadow-2xl"
          >
            {openScout.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={openScout.photo} alt="crop" className="w-full max-h-[60vh] object-cover" />
            ) : (
              <div className="h-40 bg-neutral-100 grid place-items-center text-neutral-400 text-sm">
                No photo for this spot
              </div>
            )}
            <div className="p-4">
              <div className="flex items-center gap-2 text-[14px] font-semibold">
                Health {openScout.health}/5
                <span className="text-[12px] font-normal text-neutral-400">
                  · weeds {openScout.weedPressure}
                </span>
              </div>
              {openScout.note && <p className="mt-1 text-[13px] text-neutral-600">{openScout.note}</p>}
              <p className="mt-1 text-[11.5px] text-neutral-400">
                {openScout.lat.toFixed(5)}, {openScout.lng.toFixed(5)} ·{" "}
                {new Date(openScout.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SoilBlock({ planeW, planeD, surfaceColor }: { planeW: number; planeD: number; surfaceColor: string }) {
  let y = 0;
  const total = HORIZONS.reduce((a, h) => a + h.depth, 0);
  const scale = SOIL_DEPTH / total;
  return (
    <group>
      {/* Surface (crop-coloured top face) */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[planeW, planeD]} />
        <meshStandardMaterial color={surfaceColor} roughness={0.9} />
      </mesh>
      {/* Horizon slabs stacked downward */}
      {HORIZONS.map((h) => {
        const height = h.depth * scale;
        y -= height / 2;
        const el = (
          <mesh key={h.name} position={[0, y, 0]} castShadow receiveShadow>
            <boxGeometry args={[planeW, height, planeD]} />
            <meshStandardMaterial color={h.color} roughness={1} />
          </mesh>
        );
        y -= height / 2;
        return el;
      })}
    </group>
  );
}

function CropRows({ planeW, planeD, crop }: { planeW: number; planeD: number; crop: string | null }) {
  const woody = /grape|olive|orchard|vine|tree|apple|berry/i.test(crop ?? "");
  const positions = useMemo(() => {
    const rows = 8;
    const perRow = 14;
    const pts: [number, number][] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < perRow; c++) {
        const x = ((c + 0.5) / perRow - 0.5) * planeW * 0.92;
        const z = ((r + 0.5) / rows - 0.5) * planeD * 0.92;
        pts.push([x, z]);
      }
    }
    return pts;
  }, [planeW, planeD]);

  const green = crop ? "#4e7a3a" : "#5f8a46";

  return (
    <group>
      {positions.map(([x, z], i) =>
        woody ? (
          <group key={i} position={[x, 0, z]}>
            <mesh position={[0, 0.25, 0]}>
              <cylinderGeometry args={[0.05, 0.06, 0.5, 6]} />
              <meshStandardMaterial color="#5a4632" />
            </mesh>
            <mesh position={[0, 0.6, 0]} castShadow>
              <sphereGeometry args={[0.28, 10, 10]} />
              <meshStandardMaterial color={green} roughness={0.9} />
            </mesh>
          </group>
        ) : (
          <mesh key={i} position={[x, 0.28, z]} castShadow>
            <coneGeometry args={[0.16, 0.55, 7]} />
            <meshStandardMaterial color={green} roughness={0.9} />
          </mesh>
        )
      )}
    </group>
  );
}
