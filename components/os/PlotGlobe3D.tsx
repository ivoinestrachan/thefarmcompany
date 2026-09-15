"use client";

import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
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
  const [walking, setWalking] = useState(false);

  // Google's photoreal tiles occasionally fail a fetch (network / free-tier
  // quota). They're non-fatal — the renderer retries — so keep the noisy
  // console.errors from tripping the dev error overlay while this view is open.
  useEffect(() => {
    const orig = console.error;
    console.error = (...args: unknown[]) => {
      const m = String(args[0] ?? "");
      if (m.includes("Failed to load tile") || m.includes("TilesRenderer :")) return;
      orig(...(args as []));
    };
    return () => {
      console.error = orig;
    };
  }, []);

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
            {walking
              ? "Walking · click to look around · W A S D to move · Shift to run · Esc to exit"
              : drawing
              ? `Click the ground to trace a plot — ${draftLL.length} point${draftLL.length === 1 ? "" : "s"}`
              : "Google Photorealistic 3D Tiles · drag to orbit, scroll to fly in"}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {KEY && !drawing && (
            <button
              onClick={() => setWalking((w) => !w)}
              className={`h-9 px-4 rounded-lg text-[13px] font-medium ${
                walking ? "bg-white/20 hover:bg-white/30" : "bg-[#2f5a2f] hover:bg-[#274c27]"
              }`}
            >
              {walking ? "Exit walk" : "🚶 Walk the field"}
            </button>
          )}
          {KEY && onSaveShape && !drawing && !walking && (
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
          <color attach="background" args={["#aecbe6"]} />
          <TilesRenderer>
            <TilesPlugin plugin={GoogleCloudAuthPlugin} args={[{ apiToken: KEY, autoRefreshToken: true }]} />
            <TilesAttributionOverlay />
            <TilesConfig walking={walking} />

            <EastNorthUpFrame lat={cLat * D2R} lon={cLng * D2R} height={0}>
              <PlotOverlays field={field} cLat={cLat} cLng={cLng} />
            </EastNorthUpFrame>

            {walking ? (
              <WalkController lat={cLat} lon={cLng} onExit={() => setWalking(false)} />
            ) : (
              <>
                <FocusCamera lat={cLat} lon={cLng} />
                <DrawController active={drawing} onPoint={addPoint} />
                <GlobeControls />
              </>
            )}
          </TilesRenderer>

          <DraftShape points={draftWorld} />

          <ambientLight intensity={2} />
          <hemisphereLight args={["#dcefff", "#6b5a44", 1.4]} />
          <directionalLight position={[1, 2, 1]} intensity={1.8} />
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

/** Tune tile detail: coarser (fewer requests) at ground level where the tiles
    are blurry anyway, sharper from the air. Also swallows tile load errors. */
function TilesConfig({ walking }: { walking: boolean }) {
  const tiles = useContext(TilesRendererContext);
  useEffect(() => {
    if (!tiles) return;
    // Lower = refine to finer tiles. Pull the sharpest tiles the dataset has
    // when walking (still coarse in rural areas — that's a data limit).
    tiles.errorTarget = walking ? 3 : 6;
    const onErr = () => {}; // handled: non-fatal, keep going
    tiles.addEventListener?.("load-error", onErr);
    return () => tiles.removeEventListener?.("load-error", onErr);
  }, [tiles, walking]);
  return null;
}

/** First-person "walk the field": WASD move + mouse-look, camera held at eye
    height above the real terrain (ground-snapped each frame). */
function WalkController({ lat, lon, onExit }: { lat: number; lon: number; onExit: () => void }) {
  const tiles = useContext(TilesRendererContext);
  const { camera, gl, scene } = useThree();
  const EYE = 5; // metres above ground — a raised vantage over the rows

  const s = useRef({
    ready: false,
    feet: new THREE.Vector3(), // ground position under the camera
    vel: new THREE.Vector3(), // smoothed horizontal velocity
    east: new THREE.Vector3(),
    north: new THREE.Vector3(),
    up: new THREE.Vector3(),
    yaw: 0, // target heading (0 = north)
    pitch: -0.05,
    cyaw: 0, // eased heading actually used
    cpitch: -0.05,
    hasGround: false,
    keys: new Set<string>(),
    ray: new THREE.Raycaster(),
  });

  // Set up starting position + local basis, and camera clipping for ground scale.
  useEffect(() => {
    if (!tiles) return;
    const ell = tiles.ellipsoid;
    const m = new THREE.Matrix4();
    ell.getOrientedEastNorthUpFrame(lat * D2R, lon * D2R, 0, 0, 0, 0, m);
    const st = s.current;
    st.east.setFromMatrixColumn(m, 0).transformDirection(tiles.group.matrixWorld);
    st.north.setFromMatrixColumn(m, 1).transformDirection(tiles.group.matrixWorld);
    st.up.setFromMatrixColumn(m, 2).transformDirection(tiles.group.matrixWorld);
    const ecef = new THREE.Vector3();
    ell.getCartographicToPosition(lat * D2R, lon * D2R, 2, ecef);
    st.feet.copy(ecef).applyMatrix4(tiles.group.matrixWorld);
    st.vel.set(0, 0, 0);
    st.cyaw = st.yaw;
    st.cpitch = st.pitch;
    st.hasGround = false;
    st.ready = true;

    camera.near = 0.3;
    camera.far = 5e6;
    camera.updateProjectionMatrix();

    // Haze the far, low-detail tiles into the sky for depth.
    const prevFog = scene.fog;
    scene.fog = new THREE.Fog(0xaecbe6, 80, 3200);

    const el = gl.domElement;
    const onClick = () => el.requestPointerLock?.();
    const onMove = (e: MouseEvent) => {
      if (document.pointerLockElement !== el) return;
      st.yaw -= e.movementX * 0.0025;
      st.pitch = Math.max(-1.35, Math.min(1.35, st.pitch - e.movementY * 0.0025));
    };
    const onDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onExit(); return; }
      st.keys.add(e.key.toLowerCase());
    };
    const onUp = (e: KeyboardEvent) => st.keys.delete(e.key.toLowerCase());

    el.addEventListener("click", onClick);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      el.removeEventListener("click", onClick);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      if (document.pointerLockElement === el) document.exitPointerLock?.();
      scene.fog = prevFog;
    };
  }, [tiles, lat, lon, camera, gl, scene, onExit]);

  useFrame((_, rawDt) => {
    const st = s.current;
    if (!st.ready || !tiles) return;
    const dt = Math.min(rawDt, 0.05); // clamp big frames so nothing lurches
    // Exponential smoothing factor helper.
    const k = (rate: number) => 1 - Math.exp(-dt * rate);

    // Ease the look toward the mouse target (removes micro-jitter).
    st.cyaw += (st.yaw - st.cyaw) * k(18);
    st.cpitch += (st.pitch - st.cpitch) * k(18);
    const cos = Math.cos(st.cyaw), sin = Math.sin(st.cyaw);
    const horiz = new THREE.Vector3().addScaledVector(st.north, cos).addScaledVector(st.east, sin);
    const right = new THREE.Vector3().addScaledVector(st.east, cos).addScaledVector(st.north, -sin);

    // Velocity with smooth accel/decel instead of instant start/stop.
    const fwd = (st.keys.has("w") || st.keys.has("arrowup") ? 1 : 0) - (st.keys.has("s") || st.keys.has("arrowdown") ? 1 : 0);
    const strafe = (st.keys.has("d") || st.keys.has("arrowright") ? 1 : 0) - (st.keys.has("a") || st.keys.has("arrowleft") ? 1 : 0);
    const wish = new THREE.Vector3().addScaledVector(horiz, fwd).addScaledVector(right, strafe);
    if (wish.lengthSq() > 0) wish.normalize().multiplyScalar(st.keys.has("shift") ? 13 : 5);
    st.vel.lerp(wish, k(9));
    st.feet.addScaledVector(st.vel, dt);

    // Follow the ground smoothly (don't hard-snap through LOD pops).
    const from = st.feet.clone().addScaledVector(st.up, 80);
    st.ray.set(from, st.up.clone().multiplyScalar(-1));
    st.ray.far = 600;
    const hits = st.ray.intersectObject(tiles.group, true);
    if (hits.length) {
      // ray is vertical, so only the height differs — ease toward it.
      const rate = st.hasGround ? 6 : 60; // snap immediately the first time
      st.feet.lerp(hits[0].point, k(rate));
      st.hasGround = true;
    }

    const look = horiz.clone().multiplyScalar(Math.cos(st.cpitch)).addScaledVector(st.up, Math.sin(st.cpitch));
    camera.position.copy(st.feet).addScaledVector(st.up, EYE);
    camera.up.copy(st.up);
    camera.lookAt(camera.position.clone().add(look));
    camera.updateMatrixWorld();
  });

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
