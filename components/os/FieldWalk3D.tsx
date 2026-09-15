"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { Sky } from "@react-three/drei";
import * as THREE from "three";
import type { Field } from "./types";
import { primaryCrop } from "@/lib/crops";

/* A crisp, always-sharp first-person walk through a stylised version of the
   field — real sky + lighting, neat crop rows, no blurry photogrammetry.
   Fully procedural and lightweight; works on any hardware, no API key. */

const EYE = 1.7;
const HALF = 90; // metres from centre the planted area extends

function isWoody(crop: string | null, landType: string): boolean {
  return /orchard|olive|almond|walnut|apple|orange|tree/i.test(`${crop ?? ""} ${landType}`);
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

      <Canvas shadows camera={{ fov: 72, near: 0.1, far: 2000, position: [0, EYE, 6] }}>
        <color attach="background" args={["#aecbe6"]} />
        <fog attach="fog" args={["#c7dcef", 40, 320]} />
        <Sky sunPosition={[80, 60, 40]} turbidity={4} rayleigh={1.2} />
        <hemisphereLight args={["#dff0ff", "#5c6b3a", 1.1]} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[60, 80, 30]} intensity={1.6} castShadow />

        <Ground />
        {woody ? <Orchard /> : <Vineyard />}
        <Rig />
      </Canvas>
    </div>
  );
}

/* ------------------------------- ground -------------------------------- */

function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[800, 800]} />
      <meshStandardMaterial color="#7d8a54" roughness={1} />
    </mesh>
  );
}

/* ------------------------------ vineyard ------------------------------- */

function Vineyard() {
  const ROW_GAP = 2.6; // between rows
  const VINE_GAP = 1.6; // along a row
  const rows = Math.floor((HALF * 2) / ROW_GAP);
  const perRow = Math.floor((HALF * 2) / VINE_GAP);

  const { posts, canopy, strips } = useMemo(() => {
    const posts: [number, number, number][] = [];
    const canopy: [number, number, number][] = [];
    const strips: number[] = [];
    for (let r = 0; r < rows; r++) {
      const z = -HALF + r * ROW_GAP;
      strips.push(z);
      for (let c = 0; c < perRow; c++) {
        const x = -HALF + c * VINE_GAP;
        posts.push([x, 0.85, z]);
        canopy.push([x, 1.45, z]);
      }
    }
    return { posts, canopy, strips };
  }, [rows, perRow]);

  return (
    <group>
      {strips.map((z, i) => (
        <mesh key={i} position={[0, 0.02, z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[HALF * 2, 0.9]} />
          <meshStandardMaterial color="#7a5c3c" roughness={1} />
        </mesh>
      ))}
      <Instanced positions={posts} castShadow>
        <cylinderGeometry args={[0.05, 0.06, 1.7, 5]} />
        <meshStandardMaterial color="#5a4632" />
      </Instanced>
      <Instanced positions={canopy} castShadow>
        <boxGeometry args={[1.5, 1.0, 0.7]} />
        <meshStandardMaterial color="#4e7a3a" roughness={0.9} />
      </Instanced>
    </group>
  );
}

/* ------------------------------- orchard ------------------------------- */

function Orchard() {
  const GAP = 6;
  const n = Math.floor((HALF * 2) / GAP);
  const { trunks, crowns } = useMemo(() => {
    const trunks: [number, number, number][] = [];
    const crowns: [number, number, number][] = [];
    for (let a = 0; a < n; a++)
      for (let b = 0; b < n; b++) {
        const x = -HALF + a * GAP, z = -HALF + b * GAP;
        trunks.push([x, 0.8, z]);
        crowns.push([x, 2.4, z]);
      }
    return { trunks, crowns };
  }, [n]);

  return (
    <group>
      <Instanced positions={trunks} castShadow>
        <cylinderGeometry args={[0.14, 0.18, 1.6, 6]} />
        <meshStandardMaterial color="#5a4632" />
      </Instanced>
      <Instanced positions={crowns} castShadow>
        <sphereGeometry args={[1.5, 10, 10]} />
        <meshStandardMaterial color="#3f6a37" roughness={0.9} />
      </Instanced>
    </group>
  );
}

/* Instanced mesh from a list of positions. Children = geometry + material. */
function Instanced({
  positions,
  castShadow,
  children,
}: {
  positions: [number, number, number][];
  castShadow?: boolean;
  children: React.ReactNode;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const o = new THREE.Object3D();
    positions.forEach((p, i) => {
      o.position.set(p[0], p[1], p[2]);
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
  // Start in an aisle (between two rows) looking down the row (+X).
  const s = useRef({
    yaw: -Math.PI / 2,
    pitch: 0,
    cyaw: -Math.PI / 2,
    cpitch: 0,
    vel: new THREE.Vector3(),
    pos: new THREE.Vector3(-HALF + 5, EYE, 1.3),
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
    const k = 1 - Math.exp(-dt * 12);
    st.cyaw += (st.yaw - st.cyaw) * k;
    st.cpitch += (st.pitch - st.cpitch) * k;

    const sin = Math.sin(st.cyaw), cos = Math.cos(st.cyaw);
    // forward = -Z rotated by yaw; on the XZ plane
    const fwd = new THREE.Vector3(-sin, 0, -cos);
    const right = new THREE.Vector3(cos, 0, -sin);
    const f = (st.keys.has("w") || st.keys.has("arrowup") ? 1 : 0) - (st.keys.has("s") || st.keys.has("arrowdown") ? 1 : 0);
    const r = (st.keys.has("d") || st.keys.has("arrowright") ? 1 : 0) - (st.keys.has("a") || st.keys.has("arrowleft") ? 1 : 0);
    const wish = new THREE.Vector3().addScaledVector(fwd, f).addScaledVector(right, r);
    if (wish.lengthSq() > 0) wish.normalize().multiplyScalar(st.keys.has("shift") ? 12 : 4.5);
    st.vel.lerp(wish, 1 - Math.exp(-dt * 10));
    st.pos.addScaledVector(st.vel, dt);
    st.pos.x = Math.max(-HALF - 8, Math.min(HALF + 8, st.pos.x));
    st.pos.z = Math.max(-HALF - 8, Math.min(HALF + 8, st.pos.z));
    st.pos.y = EYE;

    const look = new THREE.Vector3(
      -sin * Math.cos(st.cpitch),
      Math.sin(st.cpitch),
      -cos * Math.cos(st.cpitch)
    );
    camera.position.copy(st.pos);
    camera.lookAt(st.pos.clone().add(look));
  });

  return null;
}
