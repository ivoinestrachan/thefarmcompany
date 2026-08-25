"use client";

import { useEffect, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import type { Field } from "./types";
import { primaryCrop, cropColor } from "@/lib/crops";
import {
  boundsOfRing,
  fetchElevationGrid,
  sampleElevation,
  type Bounds,
  type ElevationGrid,
} from "@/lib/terrain";

/* A physical 3D view of a plot built from real public geodata:
   - terrain displaced by real elevation (Open-Meteo)
   - draped with real USDA NAIP 0.6 m aerial imagery
   - the soil block + crops/weeds/cores/photos layered on top.
   Falls back to a stylized surface while data loads or if a fetch fails. */

const PLANE_W = 12;
const SOIL_DEPTH = 5;
const EXAG = 2.5; // vertical exaggeration so gentle relief reads in 3D
const SEG = 56; // terrain grid resolution

const HORIZONS = [
  { name: "Topsoil", depth: 0.9, color: "#5a4130" },
  { name: "Subsoil", depth: 1.4, color: "#7c5a3c" },
  { name: "Clay", depth: 1.5, color: "#a3714b" },
  { name: "Bedrock", depth: 1.2, color: "#6f6b66" },
];

function planeDims(bounds: Bounds) {
  const w = bounds.maxLng - bounds.minLng || 1e-6;
  const h = bounds.maxLat - bounds.minLat || 1e-6;
  return { planeW: PLANE_W, planeD: PLANE_W * (h / w), w, h };
}

export default function PlotScene3D({ field, onClose }: { field: Field; onClose: () => void }) {
  const crop = primaryCrop(field);
  const surfaceColor = crop ? cropColor(crop) : "#8a9a5b";
  const [openScout, setOpenScout] = useState<Field["scouts"][number] | null>(null);
  const [showCrops, setShowCrops] = useState(true);
  const [grid, setGrid] = useState<ElevationGrid | null>(null);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [status, setStatus] = useState("Loading real terrain + aerial imagery…");

  const bounds = useMemo(() => boundsOfRing(field.geometry.coordinates[0]), [field]);
  const { planeW, planeD, w, h } = useMemo(() => planeDims(bounds), [bounds]);

  // Real elevation.
  useEffect(() => {
    let live = true;
    fetchElevationGrid(bounds, 10)
      .then((g) => live && setGrid(g))
      .catch(() => live && setStatus("Terrain unavailable — showing stylized view"));
    return () => {
      live = false;
    };
  }, [bounds]);

  // Real NAIP aerial imagery, proxied same-origin so WebGL can texture with it.
  useEffect(() => {
    let live = true;
    const url =
      `/api/naip?minLng=${bounds.minLng}&minLat=${bounds.minLat}` +
      `&maxLng=${bounds.maxLng}&maxLat=${bounds.maxLat}&size=1024`;
    new THREE.TextureLoader().load(
      url,
      (t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        if (live) setTexture(t);
      },
      undefined,
      () => live && setStatus((s) => (s.includes("Terrain unavailable") ? s : "Aerial imagery unavailable"))
    );
    return () => {
      live = false;
    };
  }, [bounds]);

  const unitsPerMeter = grid ? planeW / grid.widthMeters : 0;
  const heightAtUV = (u: number, v: number) =>
    grid ? (sampleElevation(grid, u, v) - grid.min) * unitsPerMeter * EXAG : 0;
  const uvOf = (lng: number, lat: number): [number, number] => [
    (lng - bounds.minLng) / w,
    (lat - bounds.minLat) / h,
  ];
  const localOf = (lng: number, lat: number): [number, number, number] => {
    const [u, v] = uvOf(lng, lat);
    return [(u - 0.5) * planeW, heightAtUV(u, v), -((v - 0.5) * planeD)];
  };

  const ready = grid || texture;

  return (
    <div className="fixed inset-0 z-50 bg-[#0d1a12]">
      <div className="absolute top-0 inset-x-0 z-10 flex items-center justify-between px-5 h-14 bg-gradient-to-b from-black/50 to-transparent text-white">
        <div>
          <div className="text-[15px] font-semibold tracking-tight">{field.name} · 3D</div>
          <div className="text-[11.5px] text-white/60">
            {crop ? `${crop} · ` : ""}
            {ready ? "real terrain + NAIP aerial · drag to orbit" : status}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCrops((s) => !s)}
            className="h-9 px-4 rounded-lg bg-white/15 hover:bg-white/25 text-[13px] font-medium backdrop-blur"
          >
            {showCrops ? "Hide crops" : "Show crops"}
          </button>
          <button
            onClick={onClose}
            className="h-9 px-4 rounded-lg bg-white/15 hover:bg-white/25 text-[13px] font-medium backdrop-blur"
          >
            Close
          </button>
        </div>
      </div>

      <div className="absolute bottom-4 left-4 z-10 rounded-lg bg-black/45 backdrop-blur px-3 py-2.5 text-white text-[11.5px] space-y-1">
        <div className="uppercase tracking-wide text-white/50 text-[10px]">Soil profile</div>
        {HORIZONS.map((hz) => (
          <div key={hz.name} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: hz.color }} />
            {hz.name}
          </div>
        ))}
      </div>

      <Canvas camera={{ position: [planeW * 0.9, SOIL_DEPTH * 2.4, planeD * 1.4], fov: 45 }}>
        <color attach="background" args={["#0d1a12"]} />
        <ambientLight intensity={0.75} />
        <directionalLight position={[10, 18, 8]} intensity={1.6} />
        <hemisphereLight args={["#bcd4ff", "#3a2a1a", 0.5]} />

        <SoilBlock planeW={planeW} planeD={planeD} />
        <Terrain
          planeW={planeW}
          planeD={planeD}
          grid={grid}
          texture={texture}
          fallbackColor={surfaceColor}
          heightAtUV={heightAtUV}
        />
        {showCrops && <CropRows planeW={planeW} planeD={planeD} crop={crop} heightAtUV={heightAtUV} />}

        {field.weeds.map((wd) => {
          const [x, y, z] = localOf(wd.lng, wd.lat);
          const cleared = wd.status === "cleared";
          return (
            <mesh key={wd.id} position={[x, y + 0.35, z]}>
              <sphereGeometry args={[0.22, 16, 16]} />
              <meshStandardMaterial color={cleared ? "#6b8f5a" : "#e5443c"} emissive={cleared ? "#000" : "#5a0d08"} emissiveIntensity={0.4} />
            </mesh>
          );
        })}

        {field.soil.map((s) => {
          const [x, y, z] = localOf(s.lng, s.lat);
          const m = s.moisture ?? 30;
          const color = new THREE.Color().lerpColors(
            new THREE.Color("#b07a43"),
            new THREE.Color("#4f9dd0"),
            Math.min(1, Math.max(0, m / 100))
          );
          return (
            <group key={s.id}>
              <mesh position={[x, y - SOIL_DEPTH / 2, z]}>
                <cylinderGeometry args={[0.12, 0.12, SOIL_DEPTH + y, 12]} />
                <meshStandardMaterial color={color} />
              </mesh>
              <Html position={[x, y + 0.6, z]} center distanceFactor={18}>
                <div className="whitespace-nowrap rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white">
                  {s.moisture != null ? `${s.moisture}% moist` : "core"}
                  {s.ph != null ? ` · pH ${s.ph}` : ""}
                </div>
              </Html>
            </group>
          );
        })}

        {field.scouts.map((s) => {
          const [x, y, z] = localOf(s.lng, s.lat);
          const health = s.health >= 4 ? "#4fd06a" : s.health >= 2.5 ? "#f5c542" : "#e5533c";
          return (
            <group key={s.id}>
              <mesh position={[x, y + 0.28, z]}>
                <boxGeometry args={[0.18, 0.5, 0.18]} />
                <meshStandardMaterial color={health} />
              </mesh>
              <Html position={[x, y + 1.35, z]} center distanceFactor={16} occlude>
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
                    <span className="flex h-full w-full items-center justify-center text-white text-[10px]" style={{ background: health }}>
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

      {openScout && (
        <div className="absolute inset-0 z-20 grid place-items-center bg-black/70 p-6" onClick={() => setOpenScout(null)}>
          <div onClick={(e) => e.stopPropagation()} className="max-w-[440px] w-full rounded-xl bg-white overflow-hidden shadow-2xl">
            {openScout.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={openScout.photo} alt="crop" className="w-full max-h-[60vh] object-cover" />
            ) : (
              <div className="h-40 bg-neutral-100 grid place-items-center text-neutral-400 text-sm">No photo for this spot</div>
            )}
            <div className="p-4">
              <div className="flex items-center gap-2 text-[14px] font-semibold">
                Health {openScout.health}/5
                <span className="text-[12px] font-normal text-neutral-400">· weeds {openScout.weedPressure}</span>
              </div>
              {openScout.note && <p className="mt-1 text-[13px] text-neutral-600">{openScout.note}</p>}
              <p className="mt-1 text-[11.5px] text-neutral-400">
                {openScout.lat.toFixed(5)}, {openScout.lng.toFixed(5)} · {new Date(openScout.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Displaced terrain surface: real elevation + NAIP texture, with a skirt down
    to the soil block so the earth chunk reads solid. */
function Terrain({
  planeW,
  planeD,
  grid,
  texture,
  fallbackColor,
  heightAtUV,
}: {
  planeW: number;
  planeD: number;
  grid: ElevationGrid | null;
  texture: THREE.Texture | null;
  fallbackColor: string;
  heightAtUV: (u: number, v: number) => number;
}) {
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos: number[] = [];
    const uv: number[] = [];
    const idx: number[] = [];
    for (let j = 0; j <= SEG; j++) {
      for (let i = 0; i <= SEG; i++) {
        const u = i / SEG, v = j / SEG;
        pos.push((u - 0.5) * planeW, heightAtUV(u, v), -((v - 0.5) * planeD));
        uv.push(u, v);
      }
    }
    const w1 = SEG + 1;
    for (let j = 0; j < SEG; j++) {
      for (let i = 0; i < SEG; i++) {
        const a = j * w1 + i, b = a + 1, c = a + w1, d = c + 1;
        idx.push(a, c, b, b, c, d);
      }
    }
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planeW, planeD, grid]);

  // Skirt: connect the terrain's outer edge straight down to y=0 (block top).
  const skirt = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos: number[] = [];
    const push = (x: number, yTop: number, z: number) => {
      pos.push(x, yTop, z, x, 0, z);
    };
    const edge: [number, number][] = [];
    for (let i = 0; i <= SEG; i++) edge.push([i / SEG, 0]);
    for (let j = 1; j <= SEG; j++) edge.push([1, j / SEG]);
    for (let i = SEG - 1; i >= 0; i--) edge.push([i / SEG, 1]);
    for (let j = SEG - 1; j >= 0; j--) edge.push([0, j / SEG]);
    const verts: number[][] = [];
    for (const [u, v] of edge) {
      const x = (u - 0.5) * planeW, z = -((v - 0.5) * planeD);
      verts.push([x, heightAtUV(u, v), z]);
    }
    const tri: number[] = [];
    for (let k = 0; k < verts.length - 1; k++) {
      const base = k * 2;
      push(verts[k][0], verts[k][1], verts[k][2]);
      push(verts[k + 1][0], verts[k + 1][1], verts[k + 1][2]);
      tri.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
    }
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(tri);
    g.computeVertexNormals();
    return g;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planeW, planeD, grid]);

  return (
    <group>
      <mesh geometry={geom}>
        {texture ? (
          <meshStandardMaterial map={texture} roughness={0.95} />
        ) : (
          <meshStandardMaterial color={fallbackColor} roughness={0.95} />
        )}
      </mesh>
      {grid && (
        <mesh geometry={skirt}>
          <meshStandardMaterial color="#5a4130" roughness={1} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}

function SoilBlock({ planeW, planeD }: { planeW: number; planeD: number }) {
  let y = 0;
  const total = HORIZONS.reduce((a, hz) => a + hz.depth, 0);
  const scale = SOIL_DEPTH / total;
  return (
    <group>
      {HORIZONS.map((hz) => {
        const height = hz.depth * scale;
        y -= height / 2;
        const el = (
          <mesh key={hz.name} position={[0, y, 0]}>
            <boxGeometry args={[planeW, height, planeD]} />
            <meshStandardMaterial color={hz.color} roughness={1} />
          </mesh>
        );
        y -= height / 2;
        return el;
      })}
    </group>
  );
}

function CropRows({
  planeW,
  planeD,
  crop,
  heightAtUV,
}: {
  planeW: number;
  planeD: number;
  crop: string | null;
  heightAtUV: (u: number, v: number) => number;
}) {
  const woody = /grape|olive|orchard|vine|tree|apple|berry/i.test(crop ?? "");
  const green = crop ? "#4e7a3a" : "#5f8a46";
  const rows = 8, perRow = 14;
  const pts = useMemo(() => {
    const out: [number, number, number][] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < perRow; c++) {
        const u = (c + 0.5) / perRow, v = (r + 0.5) / rows;
        const x = (u - 0.5) * planeW * 0.92;
        const z = -((v - 0.5) * planeD * 0.92);
        out.push([x, heightAtUV(u, v), z]);
      }
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planeW, planeD, crop, heightAtUV]);

  return (
    <group>
      {pts.map(([x, y, z], i) =>
        woody ? (
          <group key={i} position={[x, y, z]}>
            <mesh position={[0, 0.25, 0]}>
              <cylinderGeometry args={[0.05, 0.06, 0.5, 6]} />
              <meshStandardMaterial color="#5a4632" />
            </mesh>
            <mesh position={[0, 0.6, 0]}>
              <sphereGeometry args={[0.28, 10, 10]} />
              <meshStandardMaterial color={green} roughness={0.9} />
            </mesh>
          </group>
        ) : (
          <mesh key={i} position={[x, y + 0.28, z]}>
            <coneGeometry args={[0.16, 0.55, 7]} />
            <meshStandardMaterial color={green} roughness={0.9} />
          </mesh>
        )
      )}
    </group>
  );
}
