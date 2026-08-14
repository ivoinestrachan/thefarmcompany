"use client";

/* -------------------------------------------------------------------------- */
/*  WormScene — the hero centrepiece, choreographed to scroll (anime.js-style). */
/*                                                                             */
/*  A translucent segmented soft-robot worm, modelled on the printed bellows   */
/*  worm. It assembles from its rings on load, turns as you scroll, and         */
/*  explodes into a labelled diagram. Driven by a scroll-progress ref shared    */
/*  with HeroScroll, so the DOM and the WebGL stay in lockstep.                 */
/*                                                                             */
/*  Swap point: set NEXT_PUBLIC_BUG_MODEL_URL to a GLB and <Model/> renders it  */
/*  instead of the procedural worm.                                             */
/* -------------------------------------------------------------------------- */

import { Suspense, useMemo, useRef, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, useGLTF } from "@react-three/drei";
import * as THREE from "three";

export type Anchor = { x: number; y: number };

const MODEL_URL = process.env.NEXT_PUBLIC_BUG_MODEL_URL ?? "";
const SEG_COUNT = 7;

function smooth(p: number, a: number, b: number) {
  const t = Math.min(1, Math.max(0, (p - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

/* One bellows segment — a bulging disc, lathed from a cross-section. */
function useSegmentGeometry(radius: number, half: number) {
  return useMemo(() => {
    const pts = [
      new THREE.Vector2(0.05, half * 0.5),
      new THREE.Vector2(radius * 0.55, half),
      new THREE.Vector2(radius * 0.92, half * 0.45),
      new THREE.Vector2(radius, 0),
      new THREE.Vector2(radius * 0.92, -half * 0.45),
      new THREE.Vector2(radius * 0.55, -half),
      new THREE.Vector2(0.05, -half * 0.5),
    ];
    const g = new THREE.LatheGeometry(pts, 48);
    g.computeVertexNormals();
    return g;
  }, [radius, half]);
}

function WormModel({
  progressRef,
  anchorsRef,
}: {
  progressRef: RefObject<number>;
  anchorsRef?: RefObject<Anchor[]>;
}) {
  const outer = useRef<THREE.Group>(null);
  const segs = useRef<THREE.Group>(null);
  const born = useRef(0); // seconds since mount, for the assemble-on-load
  const { camera, size } = useThree();
  const tmp = useMemo(() => new THREE.Vector3(), []);

  const geo = useSegmentGeometry(1, 0.34);
  const capGeo = useSegmentGeometry(0.82, 0.3);

  const spacing = 0.62;

  useFrame((state, delta) => {
    born.current += delta;
    const p = progressRef.current ?? 0;
    const t = state.clock.elapsedTime;

    // assemble on load: rings fly in from spread-out to seated over ~1.6s
    const assemble = 1 - smooth(born.current, 0.1, 1.7); // 1 → 0
    // scroll explodes them apart during the anatomy beat, then reseats them
    const explode = smooth(p, 0.45, 0.58) * (1 - smooth(p, 0.65, 0.74));
    const separation = assemble * 2.6 + explode * 2.2;
    const crawl = 1 - explode; // no peristalsis while it's an exploded diagram

    if (segs.current) {
      // whole body reaches out and pulls back in, like a worm
      const breathe = 1 + Math.sin(t * 1.4) * 0.08 * crawl;
      segs.current.children.forEach((child, i) => {
        const idx = i - (SEG_COUNT - 1) / 2;
        // a compression wave that travels head-to-tail
        const phase = t * 2.0 - i * 0.95;
        const wave = Math.sin(phase);
        const gap = (spacing + separation * 0.42) * breathe;
        child.position.x = idx * gap + Math.cos(phase) * 0.13 * crawl;
        // a bulge that rolls down the body (fatten radially on the crest)
        const bulge = 1 + Math.max(0, wave) * 0.18 * crawl;
        child.scale.set(1, bulge, bulge);
      });
    }

    if (outer.current) {
      // Hold a side-on profile (you see the segmented body, like the real worm);
      // only turn it to a 3/4 diagonal while it explodes into the anatomy diagram.
      outer.current.rotation.y = -0.12 + explode * 1.0;
      outer.current.rotation.x = 0.08 + explode * 0.3;
      outer.current.rotation.z = explode * -0.2;
      if (size.width < 760) {
        // phones: the intro copy is tall so sit low; the beats are short, so
        // rise up close to the heading + callout list (less empty gap)
        outer.current.position.x = 0;
        outer.current.position.y = -1.5 + smooth(p, 0.12, 0.28) * 0.95 + explode * 0.4;
        outer.current.scale.setScalar(0.36);
      } else {
        // desktop: start right of the intro copy, glide to centre for the beats
        outer.current.position.x = (1 - smooth(p, 0.04, 0.16)) * 2.1;
        outer.current.position.y = 0.1;
        outer.current.scale.setScalar(0.5);
      }
    }

    // Project each segment centre to normalized screen coords so the DOM
    // leader lines can connect to the actual parts as the worm moves/explodes.
    const anchors = anchorsRef?.current;
    if (anchors && segs.current && outer.current) {
      outer.current.updateWorldMatrix(true, true);
      segs.current.children.forEach((child, i) => {
        child.getWorldPosition(tmp);
        tmp.project(camera);
        anchors[i] = { x: (tmp.x + 1) / 2, y: (1 - tmp.y) / 2 };
      });
    }
  });

  return (
    <group ref={outer}>
      <group ref={segs}>
        {Array.from({ length: SEG_COUNT }).map((_, i) => {
          const isCap = i === 0 || i === SEG_COUNT - 1;
          return (
            <mesh
              key={i}
              geometry={isCap ? capGeo : geo}
              rotation={[0, 0, Math.PI / 2]}
              castShadow
            >
              {/* soft pearl white — clean and bright on the charcoal */}
              <meshStandardMaterial
                color="#f0ede5"
                roughness={0.42}
                metalness={0.05}
                envMapIntensity={0.85}
              />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

export default function WormScene({
  progressRef,
  anchorsRef,
}: {
  progressRef: RefObject<number>;
  anchorsRef?: RefObject<Anchor[]>;
}) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 0.4, 7.2], fov: 40 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ background: "transparent" }}
    >
      {/* soft neutral lighting for a clean pearl surface */}
      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 6, 5]} intensity={2.4} color="#fff6ec" />
      <pointLight position={[-5, 2, -3]} intensity={14} color="#ffffff" distance={16} />
      <pointLight position={[4, -2, 3]} intensity={5} color="#e8eefc" distance={12} />

      <Suspense fallback={null}>
        {MODEL_URL ? (
          <Model url={MODEL_URL} />
        ) : (
          <WormModel progressRef={progressRef} anchorsRef={anchorsRef} />
        )}
        {/* inline environment (no network HDR) so the pearl has soft reflections */}
        <Environment resolution={128}>
          <Lightformer intensity={2.2} position={[0, 3, 4]} scale={[8, 8, 1]} color="#fff6e8" />
          <Lightformer intensity={1.4} position={[-4, 1, -3]} scale={[5, 5, 1]} color="#ffffff" />
          <Lightformer intensity={1.5} position={[4, -2, 2]} scale={[5, 5, 1]} color="#cfe6ff" />
        </Environment>
      </Suspense>
    </Canvas>
  );
}

if (MODEL_URL) useGLTF.preload(MODEL_URL);
