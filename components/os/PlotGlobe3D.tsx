"use client";

import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  TilesRenderer,
  TilesPlugin,
  TilesAttributionOverlay,
  GlobeControls,
  EastNorthUpFrame,
  TilesRendererContext,
} from "3d-tiles-renderer/r3f";
import { GoogleCloudAuthPlugin } from "3d-tiles-renderer/plugins";
import { Html } from "@react-three/drei";
import type { Field } from "./types";

/* Photoreal 3D of the actual plot using Google Photorealistic 3D Tiles — the
   real captured mesh of the world (like Google Earth), with our farm data
   (boundary, weed targets, soil cores, scout photos) anchored at their true
   GPS positions on top. Needs NEXT_PUBLIC_GOOGLE_MAPS_API_KEY. */

const KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const D2R = Math.PI / 180;

function enuOffset(lng: number, lat: number, cLng: number, cLat: number): [number, number] {
  const east = (lng - cLng) * 111320 * Math.cos(cLat * D2R);
  const north = (lat - cLat) * 111320;
  return [east, north];
}

export default function PlotGlobe3D({
  field,
  onClose,
  onSaveShape,
}: {
  field: Field;
  onClose: () => void;
  onSaveShape?: (ring: number[][]) => Promise<string | undefined>;
}) {
  const cLat = field.centerLat;
  const cLng = field.centerLng;

  const [drawing, setDrawing] = useState(false);
  const [draftWorld, setDraftWorld] = useState<THREE.Vector3[]>([]);
  const [draftLL, setDraftLL] = useState<number[][]>([]);
  const [saving, setSaving] = useState(false);

  const addPoint = useCallback((world: THREE.Vector3, lng: number, lat: number) => {
    setDraftWorld((a) => [...a, world]);
    setDraftLL((a) => [...a, [lng, lat]]);
  }, []);
  const resetDraw = useCallback(() => {
    setDraftWorld([]);
    setDraftLL([]);
    setDrawing(false);
  }, []);
  async function finishDraw() {
    if (draftLL.length < 3 || !onSaveShape) return resetDraw();
    setSaving(true);
    await onSaveShape([...draftLL, draftLL[0]]);
    setSaving(false);
    resetDraw();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <div className="absolute top-0 inset-x-0 z-10 flex items-center justify-between px-5 h-14 bg-gradient-to-b from-black/60 to-transparent text-white">
        <div>
          <div className="text-[15px] font-semibold tracking-tight">{field.name} · Photoreal</div>
          <div className="text-[11.5px] text-white/60">
            {drawing
              ? `Click the ground to trace a plot — ${draftLL.length} point${draftLL.length === 1 ? "" : "s"}`
              : "Google Photorealistic 3D Tiles · drag to orbit, scroll to fly in"}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {KEY && onSaveShape && !drawing && (
            <button
              onClick={() => setDrawing(true)}
              className="h-9 px-4 rounded-lg bg-[#3f7a3f] hover:bg-[#356b35] text-[13px] font-medium"
            >
              ✏️ Draw plot
            </button>
          )}
          {drawing && (
            <>
              <button
                onClick={finishDraw}
                disabled={draftLL.length < 3 || saving}
                className="h-9 px-4 rounded-lg bg-[#3f7a3f] hover:bg-[#356b35] text-[13px] font-medium disabled:opacity-40"
              >
                {saving ? "Saving…" : "Finish plot"}
              </button>
              <button
                onClick={resetDraw}
                className="h-9 px-4 rounded-lg bg-white/15 hover:bg-white/25 text-[13px] font-medium backdrop-blur"
              >
                Cancel
              </button>
            </>
          )}
          <button
            onClick={onClose}
            className="h-9 px-4 rounded-lg bg-white/15 hover:bg-white/25 text-[13px] font-medium backdrop-blur"
          >
            Close
          </button>
        </div>
      </div>

      {!KEY ? (
        <SetupFallback />
      ) : (
        <Canvas camera={{ position: [0, 0, 400], near: 1, far: 4e7 }}>
          <TilesRenderer>
            <TilesPlugin plugin={GoogleCloudAuthPlugin} args={[{ apiToken: KEY, autoRefreshToken: true }]} />
            <TilesAttributionOverlay />

            <EastNorthUpFrame lat={cLat * D2R} lon={cLng * D2R} height={0}>
              <PlotOverlays field={field} cLat={cLat} cLng={cLng} />
            </EastNorthUpFrame>

            <FocusCamera lat={cLat} lon={cLng} />
            <DrawController active={drawing} onPoint={addPoint} />
            <GlobeControls />
          </TilesRenderer>

          <DraftShape points={draftWorld} />

          <ambientLight intensity={1} />
          <directionalLight position={[1, 2, 1]} intensity={1.2} />
        </Canvas>
      )}
    </div>
  );
}

/** Anchor our farm data in the plot's local East-North-Up frame (metres). */
function PlotOverlays({ field, cLat, cLng }: { field: Field; cLat: number; cLng: number }) {
  const ring = field.geometry.coordinates[0].map(([lng, lat]) => {
    const [e, n] = enuOffset(lng, lat, cLng, cLat);
    return new THREE.Vector3(e, n, 3);
  });
  const lineGeom = new THREE.BufferGeometry().setFromPoints(ring);

  return (
    <group>
      {/* Plot boundary hovering just above the ground */}
      <primitive object={new THREE.Line(lineGeom, new THREE.LineBasicMaterial({ color: "#ffe14d" }))} />

      {field.weeds.map((w) => {
        const [e, n] = enuOffset(w.lng, w.lat, cLng, cLat);
        return (
          <mesh key={w.id} position={[e, n, 2]}>
            <sphereGeometry args={[2, 16, 16]} />
            <meshStandardMaterial color={w.status === "cleared" ? "#6b8f5a" : "#e5443c"} />
          </mesh>
        );
      })}

      {field.scouts.map((s) => {
        const [e, n] = enuOffset(s.lng, s.lat, cLng, cLat);
        return (
          <Html key={s.id} position={[e, n, 8]} center distanceFactor={200} occlude>
            <div className="rounded-md overflow-hidden ring-2 ring-white shadow-lg" style={{ width: 48, height: 48 }}>
              {s.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.photo} alt="scout" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-[#4fd06a] grid place-items-center text-white text-[10px]">
                  {s.health}/5
                </div>
              )}
            </div>
          </Html>
        );
      })}
    </group>
  );
}

/** On load, drop the camera in above the plot looking down at an angle. */
function FocusCamera({ lat, lon }: { lat: number; lon: number }) {
  const tiles = useContext(TilesRendererContext);
  const { camera } = useThree();
  useEffect(() => {
    if (!tiles) return;
    const ell = tiles.ellipsoid;
    const eye = new THREE.Vector3();
    const target = new THREE.Vector3();
    // Eye offset SOUTH of the plot and up, so we look north at an oblique
    // ~40° tilt — a 3D, near-street-level view rather than straight down.
    const southOffsetM = 700;
    const dLat = southOffsetM / 111320;
    ell.getCartographicToPosition((lat - dLat) * D2R, lon * D2R, 500, eye);
    ell.getCartographicToPosition(lat * D2R, lon * D2R, 20, target);
    camera.position.copy(eye);
    camera.up.copy(eye).normalize(); // geodetic up ≈ surface normal on the globe
    camera.lookAt(target);
    camera.updateMatrixWorld();
  }, [tiles, lat, lon, camera]);
  return null;
}

/** Raycasts clicks onto the Google 3D mesh and converts hits to real lng/lat. */
function DrawController({
  active,
  onPoint,
}: {
  active: boolean;
  onPoint: (world: THREE.Vector3, lng: number, lat: number) => void;
}) {
  const tiles = useContext(TilesRendererContext);
  const { camera, gl, raycaster } = useThree();

  useEffect(() => {
    if (!active || !tiles) return;
    const el = gl.domElement;
    const invGroup = new THREE.Matrix4();
    const ndc = new THREE.Vector2();

    const onClick = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      ndc.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      raycaster.setFromCamera(ndc, camera);
      const hits = raycaster.intersectObject(tiles.group, true);
      if (!hits.length) return;
      const world = hits[0].point.clone();
      // world → tile-local (ECEF) → geographic
      invGroup.copy(tiles.group.matrixWorld).invert();
      const ecef = world.clone().applyMatrix4(invGroup);
      const carto = { lat: 0, lon: 0, height: 0 };
      tiles.ellipsoid.getPositionToCartographic(ecef, carto);
      onPoint(world, (carto.lon * 180) / Math.PI, (carto.lat * 180) / Math.PI);
    };

    el.addEventListener("click", onClick);
    return () => el.removeEventListener("click", onClick);
  }, [active, tiles, camera, gl, raycaster, onPoint]);

  return null;
}

/** The in-progress traced outline drawn in world space. */
function DraftShape({ points }: { points: THREE.Vector3[] }) {
  const line = useMemo(() => {
    if (points.length < 2) return null;
    return new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(points),
      new THREE.LineBasicMaterial({ color: "#7ee081" })
    );
  }, [points]);
  return (
    <group>
      {line && <primitive object={line} />}
      {points.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[2.5, 12, 12]} />
          <meshBasicMaterial color="#7ee081" />
        </mesh>
      ))}
    </group>
  );
}

function SetupFallback() {
  return (
    <div className="absolute inset-0 grid place-items-center p-6 text-center">
      <div className="max-w-[440px] rounded-2xl bg-white/10 backdrop-blur ring-1 ring-white/15 p-7 text-white">
        <div className="text-[18px] font-semibold">Turn on photoreal 3D</div>
        <p className="mt-2 text-[13.5px] text-white/70 leading-relaxed">
          This view streams Google&apos;s real captured 3D mesh of the world — the actual vineyards,
          terrain and trees, with your farm data on top.
        </p>
        <ol className="mt-4 text-left text-[13px] text-white/80 space-y-1.5 list-decimal pl-5">
          <li>Create a Google Maps Platform API key with the <em>Map Tiles API</em> enabled.</li>
          <li>
            Add it to <code className="px-1 rounded bg-white/15">.env</code> as{" "}
            <code className="px-1 rounded bg-white/15">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code>.
          </li>
          <li>Restart the dev server — this view lights up automatically.</li>
        </ol>
      </div>
    </div>
  );
}
