"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { Sky } from "@react-three/drei";
import * as THREE from "three";
import type { Field } from "./types";
import { primaryCrop } from "@/lib/crops";

/* A first-person walk through the field. Procedural but textured & lit for
   realism — grass/soil ground, leafy vine hedges, trellis posts + wires, sun,
   soft shadows and haze. Sharp at any distance, works with no API key. */

const EYE = 1.7;
const HALF = 90; // planted area half-extent (m)
const ROW_GAP = 2.7;
const POST_GAP = 6;

function isWoody(crop: string | null, landType: string): boolean {
  return /orchard|olive|almond|walnut|apple|orange|tree/i.test(`${crop ?? ""} ${landType}`);
}

/** Speckled tileable texture generated on a canvas — cheap, no assets. */
function noiseTexture(colors: string[], size = 128, density = 1.4, repeat = 1): THREE.Texture {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = colors[0];
  ctx.fillRect(0, 0, size, size);
  const n = Math.floor(size * size * density);
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = colors[(Math.random() * colors.length) | 0];
    const x = Math.random() * size, y = Math.random() * size, s = 1 + Math.random() * 2.5;
    ctx.fillRect(x, y, s, s);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.anisotropy = 4;
  return t;
}

export default function FieldWalk3D({ field, onExit }: { field: Field; onExit: () => void }) {
  const crop = primaryCrop(field);
  const woody = isWoody(crop, field.landType);

  return (
    <div className="fixed inset-0 z-50 bg-[#aecbe6]">
      <div className="absolute top-0 inset-x-0 z-10 flex items-center justify-between px-5 h-14 bg-gradient-to-b from-black/40 to-transparent text-white">
        <div>
          <div className="text-[15px] font-semibold tracking-tight">{field.name} · Walk</div>
          <div className="text-[11.5px] text-white/70">
            {crop ? `${crop} · ` : ""}click to look · W A S D to move · Shift to run · Esc to exit
          </div>
        </div>
        <button
          onClick={onExit}
          className="h-9 px-4 rounded-lg bg-white/20 hover:bg-white/30 text-[13px] font-medium backdrop-blur"
        >
          Exit walk
        </button>
      </div>

      <Canvas shadows camera={{ fov: 70, near: 0.1, far: 2000, position: [0, EYE, 6] }}>
        <color attach="background" args={["#aecbe6"]} />
        <fog attach="fog" args={["#c4d8ec", 60, 340]} />
        <Sky sunPosition={[100, 55, 60]} turbidity={3} rayleigh={1} mieCoefficient={0.006} />
        <hemisphereLight args={["#e6f2ff", "#5a6a38", 0.9]} />
        <ambientLight intensity={0.35} />
        <SunLight />

        <Ground />
        {woody ? <Orchard /> : <Vineyard />}
        <Rig />
      </Canvas>
    </div>
  );
}

function SunLight() {
  const ref = useRef<THREE.DirectionalLight>(null);
  useEffect(() => {
    const l = ref.current;
    if (!l) return;
    l.shadow.mapSize.set(2048, 2048);
    l.shadow.camera.near = 1;
    l.shadow.camera.far = 200;
    const c = l.shadow.camera as THREE.OrthographicCamera;
    c.left = -50; c.right = 50; c.top = 50; c.bottom = -50;
    c.updateProjectionMatrix();
    l.shadow.bias = -0.0004;
  }, []);
  return <directionalLight ref={ref} position={[60, 90, 45]} intensity={1.7} castShadow />;
}

/* ------------------------------- ground -------------------------------- */

function Ground() {
  const grass = useMemo(
    () => noiseTexture(["#6f8a3f", "#7d9a4a", "#5f7a36", "#88a655", "#647f38"], 128, 1.6, 220),
    []
  );
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[900, 900]} />
      <meshStandardMaterial map={grass} roughness={1} />
    </mesh>
  );
}

/* ------------------------------ vineyard ------------------------------- */

function Vineyard() {
  const rows = Math.floor((HALF * 2) / ROW_GAP);
  const soil = useMemo(
    () => noiseTexture(["#6b4f34", "#7a5c3c", "#5a4228", "#846547"], 96, 1.3, HALF),
    []
  );
  const leaf = useMemo(
    () => noiseTexture(["#3f6a2f", "#4e7a3a", "#2f5226", "#5a8a44", "#365f28"], 128, 2.2, 24),
    []
  );

  const rowZ = useMemo(() => Array.from({ length: rows }, (_, r) => -HALF + r * ROW_GAP), [rows]);
  const posts = useMemo(() => {
    const out: [number, number, number][] = [];
    const per = Math.floor((HALF * 2) / POST_GAP);
    for (const z of rowZ) for (let c = 0; c <= per; c++) out.push([-HALF + c * POST_GAP, 1.0, z]);
    return out;
  }, [rowZ]);

  return (
    <group>
      {/* per-row: soil path, leafy hedge, two trellis wires */}
      {rowZ.map((z, i) => (
        <group key={i}>
          <mesh position={[0, 0.03, z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[HALF * 2, 1.0]} />
            <meshStandardMaterial map={soil} roughness={1} />
          </mesh>
          <mesh position={[0, 1.55, z]} castShadow receiveShadow>
            <boxGeometry args={[HALF * 2, 1.5, 0.85]} />
            <meshStandardMaterial map={leaf} roughness={0.95} />
          </mesh>
          {[1.5, 2.0].map((wy, k) => (
            <mesh key={k} position={[0, wy, z]}>
              <boxGeometry args={[HALF * 2, 0.012, 0.012]} />
              <meshStandardMaterial color="#4a4a4a" metalness={0.6} roughness={0.5} />
            </mesh>
          ))}
        </group>
      ))}
      <Instanced positions={posts} castShadow>
        <cylinderGeometry args={[0.06, 0.07, 2.0, 6]} />
        <meshStandardMaterial color="#6b5233" roughness={0.9} />
      </Instanced>
    </group>
  );
}

/* ------------------------------- orchard ------------------------------- */

function Orchard() {
  const GAP = 6;
  const n = Math.floor((HALF * 2) / GAP);
  const leaf = useMemo(
    () => noiseTexture(["#3f6a37", "#345c2c", "#4e7a3a", "#2b4d24"], 128, 2.4, 3),
    []
  );
  const { trunks, crowns } = useMemo(() => {
    const trunks: [number, number, number][] = [];
    const crowns: [number, number, number][] = [];
    for (let a = 0; a < n; a++)
      for (let b = 0; b < n; b++) {
        const x = -HALF + a * GAP + (Math.random() - 0.5), z = -HALF + b * GAP + (Math.random() - 0.5);
        trunks.push([x, 0.9, z]);
        crowns.push([x, 2.6, z]);
      }
    return { trunks, crowns };
  }, [n]);

  return (
    <group>
      <Instanced positions={trunks} castShadow>
        <cylinderGeometry args={[0.16, 0.2, 1.8, 6]} />
        <meshStandardMaterial color="#5a4632" roughness={0.9} />
      </Instanced>
      <Instanced positions={crowns} castShadow leaf={leaf}>
        <sphereGeometry args={[1.7, 12, 12]} />
        <meshStandardMaterial map={leaf} roughness={0.95} />
      </Instanced>
    </group>
  );
}

/* Instanced mesh from a list of positions. Children = geometry + material.
   Adds a little per-instance scale/rotation jitter for an organic look. */
function Instanced({
  positions,
  castShadow,
  children,
}: {
  positions: [number, number, number][];
  castShadow?: boolean;
  leaf?: THREE.Texture;
  children: React.ReactNode;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const o = new THREE.Object3D();
    positions.forEach((p, i) => {
      o.position.set(p[0], p[1], p[2]);
      const s = 0.9 + Math.random() * 0.25;
      o.scale.set(s, 0.9 + Math.random() * 0.3, s);
      o.rotation.y = Math.random() * Math.PI;
      o.updateMatrix();
      mesh.setMatrixAt(i, o.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [positions]);

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, positions.length]} castShadow={castShadow} receiveShadow>
      {children}
    </instancedMesh>
  );
}

/* ---------------------------- FP controls ------------------------------ */

function Rig() {
  const { camera, gl } = useThree();
  const s = useRef({
    yaw: -Math.PI / 2,
    pitch: 0,
    cyaw: -Math.PI / 2,
    cpitch: 0,
    vel: new THREE.Vector3(),
    pos: new THREE.Vector3(-HALF + 6, EYE, ROW_GAP / 2),
    keys: new Set<string>(),
  });

  useEffect(() => {
    const el = gl.domElement;
    const onClick = () => el.requestPointerLock?.();
    const onMove = (e: MouseEvent) => {
      if (document.pointerLockElement !== el) return;
      s.current.yaw -= e.movementX * 0.0022;
      s.current.pitch = Math.max(-1.2, Math.min(1.2, s.current.pitch - e.movementY * 0.0022));
    };
    const onDown = (e: KeyboardEvent) => s.current.keys.add(e.key.toLowerCase());
    const onUp = (e: KeyboardEvent) => s.current.keys.delete(e.key.toLowerCase());
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
    };
  }, [gl]);

  useFrame((_, rawDt) => {
    const st = s.current;
    const dt = Math.min(rawDt, 0.05);
    st.cyaw += (st.yaw - st.cyaw) * (1 - Math.exp(-dt * 12));
    st.cpitch += (st.pitch - st.cpitch) * (1 - Math.exp(-dt * 12));
    const sin = Math.sin(st.cyaw), cos = Math.cos(st.cyaw);
    const fwd = new THREE.Vector3(-sin, 0, -cos);
    const right = new THREE.Vector3(cos, 0, -sin);
    const f = (st.keys.has("w") || st.keys.has("arrowup") ? 1 : 0) - (st.keys.has("s") || st.keys.has("arrowdown") ? 1 : 0);
    const r = (st.keys.has("d") || st.keys.has("arrowright") ? 1 : 0) - (st.keys.has("a") || st.keys.has("arrowleft") ? 1 : 0);
    const wish = new THREE.Vector3().addScaledVector(fwd, f).addScaledVector(right, r);
    if (wish.lengthSq() > 0) wish.normalize().multiplyScalar(st.keys.has("shift") ? 11 : 4.2);
    st.vel.lerp(wish, 1 - Math.exp(-dt * 10));
    st.pos.addScaledVector(st.vel, dt);
    st.pos.x = Math.max(-HALF - 8, Math.min(HALF + 8, st.pos.x));
    st.pos.z = Math.max(-HALF - 8, Math.min(HALF + 8, st.pos.z));
    st.pos.y = EYE;

    const look = new THREE.Vector3(-sin * Math.cos(st.cpitch), Math.sin(st.cpitch), -cos * Math.cos(st.cpitch));
    camera.position.copy(st.pos);
    camera.lookAt(st.pos.clone().add(look));
  });

  return null;
}
