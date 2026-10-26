"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Html, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

const PHASES = [
  {
    k: "01",
    name: "Scan",
    label: "Build a plant-level map",
    body: "On-board vision reconstructs each row and gives every crop and weed a position in the field.",
    signal: "STEP 1 · MAP THE FIELD",
    facts: ["Coverage · mixed-crop block", "Output · plant coordinates", "Chemicals · none"],
  },
  {
    k: "02",
    name: "Identify",
    label: "Tell crop from weed",
    body: "The system identifies each plant in place. Crops stay untouched; weeds are marked for removal.",
    signal: "STEP 2 · CLASSIFY EACH PLANT",
    facts: ["Crop · preserved", "Weed · target", "Decision · plant level"],
  },
  {
    k: "03",
    name: "Eat",
    label: "Bite the weed. Leave the crop.",
    body: "Wiggler stops at the selected weed, opens its jaws, and pulls the plant into its intake one bite at a time.",
    signal: "STEP 3 · EAT THE WEED",
    facts: ["Action · repeated bites", "Crop contact · none", "Weed · consumed"],
  },
  {
    k: "04",
    name: "Underground",
    label: "Follow it below",
    body: "After the weed is removed, the view follows each Wiggler beneath the surface and through the root zone.",
    signal: "STEP 4 · GO BELOW THE SURFACE",
    facts: ["View · soil cutaway", "Movement · below ground", "Crop roots · undisturbed"],
  },
] as const;

function smoothStep(value: number, start: number, end: number) {
  const t = Math.min(1, Math.max(0, (value - start) / (end - start)));
  return t * t * (3 - 2 * t);
}

const TARGETS = [
  { id: "A", crop: "corn", position: new THREE.Vector3(-4.6, 0.24, -3.25), type: "Broadleaf weed" },
  { id: "B", crop: "soy", position: new THREE.Vector3(0.35, 0.24, 0.15), type: "Broadleaf weed" },
  { id: "C", crop: "leafy", position: new THREE.Vector3(4.8, 0.24, 3.15), type: "Grass weed" },
] as const;

function seeded(index: number, salt = 0) {
  const value = Math.sin(index * 91.137 + salt * 17.371) * 43758.5453;
  return value - Math.floor(value);
}

function useNoiseTexture(colors: string[], repeat: [number, number], size = 128) {
  return useMemo(() => {
    const parsed = colors.map((color) => new THREE.Color(color));
    const pixels = new Uint8Array(size * size * 4);
    for (let index = 0; index < size * size; index += 1) {
      const base = parsed[Math.floor(seeded(index, 2) * parsed.length)];
      const grain = (seeded(index, 5) - 0.5) * 0.12;
      pixels[index * 4] = THREE.MathUtils.clamp((base.r + grain) * 255, 0, 255);
      pixels[index * 4 + 1] = THREE.MathUtils.clamp((base.g + grain) * 255, 0, 255);
      pixels[index * 4 + 2] = THREE.MathUtils.clamp((base.b + grain) * 255, 0, 255);
      pixels[index * 4 + 3] = 255;
    }
    const texture = new THREE.DataTexture(pixels, size, size, THREE.RGBAFormat);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(...repeat);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  }, [colors, repeat, size]);
}

function useLeafGeometry() {
  return useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.bezierCurveTo(-0.16, 0.08, -0.18, 0.34, 0, 0.52);
    shape.bezierCurveTo(0.18, 0.34, 0.16, 0.08, 0, 0);
    const geometry = new THREE.ShapeGeometry(shape, 5);
    geometry.computeVertexNormals();
    return geometry;
  }, []);
}

function useCornLeafGeometry() {
  return useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.bezierCurveTo(-0.07, 0.16, -0.055, 0.62, 0, 0.88);
    shape.bezierCurveTo(0.065, 0.62, 0.075, 0.16, 0, 0);
    const geometry = new THREE.ShapeGeometry(shape, 5);
    geometry.computeVertexNormals();
    return geometry;
  }, []);
}

function useCropPositions(startRow: number, rowCount: number, salt: number) {
  return useMemo(() => {
    const result: THREE.Vector3[] = [];
    for (let localRow = 0; localRow < rowCount; localRow += 1) {
      const row = startRow + localRow;
      const z = -4 + row;
      for (let col = 0; col < 21; col += 1) {
        const index = row * 21 + col;
        result.push(
          new THREE.Vector3(
            -7.8 + col * 0.78 + (seeded(index, salt) - 0.5) * 0.11,
            0.23,
            z + (seeded(index, salt + 1) - 0.5) * 0.085
          )
        );
      }
    }
    return result;
  }, [startRow, rowCount, salt]);
}

function useWigglerSegmentGeometry(radius: number, half: number) {
  return useMemo(() => {
    const points = [
      new THREE.Vector2(0.06, half * 0.55),
      new THREE.Vector2(radius * 0.58, half),
      new THREE.Vector2(radius * 0.94, half * 0.46),
      new THREE.Vector2(radius, 0),
      new THREE.Vector2(radius * 0.94, -half * 0.46),
      new THREE.Vector2(radius * 0.58, -half),
      new THREE.Vector2(0.06, -half * 0.55),
    ];
    const geometry = new THREE.LatheGeometry(points, 28);
    geometry.computeVertexNormals();
    return geometry;
  }, [radius, half]);
}

export default function FarmSimulation() {
  const section = useRef<HTMLElement>(null);
  const hero = useRef<HTMLDivElement>(null);
  const chapter = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const [phase, setPhase] = useState(0);
  const [selectedTarget, setSelectedTarget] = useState(0);

  useEffect(() => {
    let frame = 0;
    let lastPhase = 0;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const update = () => {
      const node = section.current;
      if (node) {
        const rect = node.getBoundingClientRect();
        const distance = Math.max(1, rect.height - window.innerHeight);
        const progress = Math.min(1, Math.max(0, -rect.top / distance));
        progressRef.current = reduce ? Math.round(progress * 4) / 4 : progress;

        const heroExit = smoothStep(progress, 0.035, 0.17);
        if (hero.current) {
          hero.current.style.opacity = `${1 - heroExit}`;
          hero.current.style.transform = `translateY(${-heroExit * 90}px) scale(${1 - heroExit * 0.035})`;
        }
        if (chapter.current) {
          chapter.current.style.opacity = `${smoothStep(progress, 0.13, 0.2)}`;
        }

        if (progress > 0.13) {
          const chapterProgress = Math.min(0.999, Math.max(0, (progress - 0.13) / 0.87));
          const nextPhase = Math.floor(chapterProgress * PHASES.length);
          if (nextPhase !== lastPhase) {
            lastPhase = nextPhase;
            setPhase(nextPhase);
            setSelectedTarget(Math.min(nextPhase, TARGETS.length - 1));
          }
        }
      }
      frame = requestAnimationFrame(update);
    };

    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, []);

  const choosePhase = (index: number) => {
    setPhase(index);
    setSelectedTarget(Math.min(index, TARGETS.length - 1));
    const node = section.current;
    if (!node) return;
    const distance = node.offsetHeight - window.innerHeight;
    const progress = 0.16 + ((index + 0.35) / PHASES.length) * 0.84;
    window.scrollTo({ top: node.offsetTop + distance * progress, behavior: "smooth" });
  };

  return (
    <section ref={section} id="how-it-works" className="relative h-[340vh] bg-char">
      <div className="sticky top-0 h-screen overflow-hidden bg-char pt-[58px]">
        <div className="pointer-events-none absolute inset-0 grid-dot opacity-10" />

        <div ref={hero} className="pointer-events-none absolute inset-x-0 top-[58px] z-20 mx-auto w-full max-w-5xl px-6 pt-10 text-center will-change-transform sm:pt-14 lg:pt-16">
          <h1 className="display mx-auto mt-4 max-w-5xl text-[13vw] leading-[0.9] text-paper sm:mt-7 sm:text-[5.4rem] lg:text-[6.1rem]">
            See every plant.
            <br className="sm:hidden" />
            <span className="text-paper"> Remove only weeds.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base font-light leading-relaxed text-paper/72 sm:text-lg">
            Wiggler moves between crop rows, distinguishes crop from weed, and targets only what should be removed—without blanket spraying.
          </p>

          <div className="pointer-events-auto mt-7 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => choosePhase(0)}
              className="group inline-flex h-12 items-center gap-4 bg-paper px-6 text-sm font-medium text-ink transition-colors hover:bg-white"
            >
              See how it works
              <span className="transition-transform duration-300 group-hover:translate-x-1">↓</span>
            </button>
          </div>
        </div>

        <div className="absolute inset-0">
          <Canvas
            aria-label="Interactive 3D farm showing the Wiggler scan, identify, remove, and verify workflow"
            dpr={[1, 1.65]}
            shadows
            camera={{ position: [11.5, 7.8, 13.5], fov: 35, near: 0.1, far: 100 }}
            gl={{
              antialias: true,
              alpha: false,
              powerPreference: "high-performance",
              toneMapping: THREE.ACESFilmicToneMapping,
              toneMappingExposure: 1.08,
            }}
            style={{ background: "#050505", touchAction: "pan-y" }}
          >
            <FarmWorld
              phase={phase}
              progressRef={progressRef}
              selectedTarget={selectedTarget}
              onSelectTarget={setSelectedTarget}
            />
          </Canvas>
        </div>

        <div ref={chapter} className="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-300">
          <div className="absolute inset-x-0 top-20 mx-auto flex max-w-7xl items-start justify-between gap-6 px-6 lg:px-10">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-paper/55">
              Interactive field <span className="hidden sm:inline">· drag to inspect</span>
            </div>
            <div className="text-right">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-paper/50">
                {phase === 3 ? "Below ground" : "Selected weed"}
              </div>
              <div className="mt-1 text-sm text-paper">
                {phase === 3 ? (
                  <>3 Wigglers<span className="hidden sm:inline"> · below-ground movement</span></>
                ) : (
                  <>{TARGETS[selectedTarget].id}<span className="hidden sm:inline"> · {TARGETS[selectedTarget].type} · {TARGETS[selectedTarget].crop === "soy" ? "soybean" : TARGETS[selectedTarget].crop} row</span></>
                )}
              </div>
            </div>
          </div>

          <div className="absolute bottom-36 left-6 max-w-[19rem] sm:bottom-32 sm:left-10 lg:left-[5vw] lg:max-w-[21rem]">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-paper/50">
              {PHASES[phase].signal}
            </div>
            <h2 className="mt-2 text-2xl font-medium tracking-tight text-paper sm:text-3xl">
              {PHASES[phase].label}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-fog sm:text-[15px]">
              {PHASES[phase].body}
            </p>
            {phase === 3 && (
              <div className="mt-4 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.14em] text-paper/60">
                <span>surface</span><span className="text-paper/25">→</span><span>soil profile</span><span className="text-paper/25">→</span><span>root zone</span>
              </div>
            )}
          </div>

          <div className="absolute bottom-40 right-[5vw] hidden min-w-[17rem] border border-paper/20 bg-char/80 p-5 backdrop-blur-md lg:block">
            <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-faint">
              What happens here
            </div>
            <div className="mt-4 space-y-3">
              {PHASES[phase].facts.map((fact) => {
                const [name, value] = fact.split(" · ");
                return (
                  <div key={fact} className="flex items-center justify-between gap-8 border-t border-paper/10 pt-3 text-sm">
                    <span className="text-fog">{name}</span>
                    <span className="font-medium text-paper">{value}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pointer-events-auto absolute inset-x-0 bottom-0 bg-gradient-to-t from-char via-char/88 to-transparent px-5 pb-5 pt-24 sm:px-8 sm:pb-6">
            <div className="mx-auto grid max-w-6xl grid-cols-4 border-t hairline">
              {PHASES.map((item, index) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => choosePhase(index)}
                  aria-current={phase === index ? "step" : undefined}
                  className={`relative flex flex-col items-start border-r hairline py-4 pr-3 text-left last:border-r-0 sm:flex-row sm:items-baseline sm:gap-3 ${
                    phase === index ? "text-paper" : "text-paper/42 hover:text-paper/75"
                  }`}
                >
                  <span className="font-mono text-[9px] sm:text-[10px]">{item.k}</span>
                  <span className="mt-1 text-xs font-medium sm:mt-0 sm:text-sm">{item.name}</span>
                  {phase === index && <span className="absolute inset-x-0 -top-px h-px bg-paper" />}
                </button>
              ))}
            </div>
            <p className="mx-auto mt-2 max-w-6xl text-[9px] leading-relaxed text-faint">
              Interactive concept. Field performance is still being validated.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function FarmWorld({
  phase,
  progressRef,
  selectedTarget,
  onSelectTarget,
}: {
  phase: number;
  progressRef: { current: number };
  selectedTarget: number;
  onSelectTarget: (index: number) => void;
}) {
  const [interactive, setInteractive] = useState(false);
  const world = useRef<THREE.Group>(null);
  const controls = useRef<OrbitControlsImpl>(null);
  const cameraHome = useMemo(() => new THREE.Vector3(11.5, 7.8, 13.5), []);
  const cameraSoil = useMemo(() => new THREE.Vector3(8.4, 1.15, 15.8), []);
  const cameraSoilMobile = useMemo(() => new THREE.Vector3(14, 3.5, 23.5), []);
  const targetHome = useMemo(() => new THREE.Vector3(0.4, 0, 0), []);
  const targetSoil = useMemo(() => new THREE.Vector3(-0.5, -1.15, 7.5), []);
  const targetSoilMobile = useMemo(() => new THREE.Vector3(-1.5, -0.9, 7.7), []);
  const cameraGoal = useMemo(() => new THREE.Vector3(), []);
  const targetGoal = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    setInteractive(window.matchMedia("(any-pointer: fine)").matches);
  }, []);

  useFrame(({ camera }, delta) => {
    if (!world.current) return;
    const progress = progressRef.current;
    const reveal = smoothStep(progress, 0.025, 0.2);
    const underground = phase === 3 ? smoothStep(progress, 0.77, 0.9) : 0;
    const narrow = camera instanceof THREE.PerspectiveCamera && camera.aspect < 0.8;
    const desiredScale = THREE.MathUtils.lerp(0.98, 1.22, reveal);

    cameraGoal.lerpVectors(cameraHome, narrow ? cameraSoilMobile : cameraSoil, underground);
    camera.position.x = THREE.MathUtils.damp(camera.position.x, cameraGoal.x, 4.2, delta);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, cameraGoal.y, 4.2, delta);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, cameraGoal.z, 4.2, delta);
    targetGoal.lerpVectors(targetHome, narrow ? targetSoilMobile : targetSoil, underground);
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = THREE.MathUtils.damp(camera.fov, narrow && phase === 3 ? 48 : 35, 4.2, delta);
      camera.updateProjectionMatrix();
    }
    if (controls.current) {
      controls.current.target.x = THREE.MathUtils.damp(controls.current.target.x, targetGoal.x, 4.2, delta);
      controls.current.target.y = THREE.MathUtils.damp(controls.current.target.y, targetGoal.y, 4.2, delta);
      controls.current.target.z = THREE.MathUtils.damp(controls.current.target.z, targetGoal.z, 4.2, delta);
      controls.current.update();
    } else {
      camera.lookAt(targetGoal);
    }

    world.current.position.x = THREE.MathUtils.damp(
      world.current.position.x,
      THREE.MathUtils.lerp(0.4, 0.1, reveal),
      5,
      delta
    );
    world.current.position.y = THREE.MathUtils.damp(
      world.current.position.y,
      THREE.MathUtils.lerp(-2.2, -0.7, reveal),
      5,
      delta
    );
    world.current.rotation.y = THREE.MathUtils.damp(
      world.current.rotation.y,
      -0.12 + reveal * 0.12 + progress * 0.16,
      4,
      delta
    );
    world.current.rotation.x = THREE.MathUtils.damp(
      world.current.rotation.x,
      progress * 0.035,
      4,
      delta
    );
    const scale = THREE.MathUtils.damp(world.current.scale.x, desiredScale, 5, delta);
    world.current.scale.setScalar(scale);
  });

  return (
    <>
      <color attach="background" args={["#050505"]} />
      <fog attach="fog" args={["#050505", 20, 38]} />
      <ambientLight intensity={0.42} />
      <hemisphereLight args={["#e7e7e4", "#151515", 1.65]} />
      <directionalLight
        position={[-8, 14, 7]}
        intensity={4.2}
        color="#f5f5f2"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-13}
        shadow-camera-right={13}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-bias={-0.00035}
      />
      <pointLight position={[8, 3.5, -6]} intensity={7} color="#c9ced3" distance={22} />
      <pointLight position={[-3, 8, 3]} intensity={17} color="#e2e1df" distance={28} />

      <group ref={world} rotation={[0, -0.12, 0]} position={[0.4, -2.2, 0]} scale={0.98}>
        <FarmBed phase={phase} />
        <FarmInfrastructure />
        <CropRows />
        <ScanPointCloud />
        <ScanSweep active={phase === 0} />
        <Route active={phase === 2} />
        <WigglerFleet phase={phase} />
        {TARGETS.map((target, index) => (
          <WeedTarget
            key={target.id}
            target={target}
            index={index}
            phase={phase}
            selected={selectedTarget === index}
            onSelect={() => onSelectTarget(index)}
          />
        ))}
        <SoilRegeneration active={phase === 3} />
      </group>

      <ContactShadows
        position={[0, -0.48, 0]}
        opacity={0.48}
        scale={24}
        blur={2.4}
        far={6}
        color="#000000"
      />

      <OrbitControls
        ref={controls}
        enabled={interactive && phase !== 3}
        enableZoom={false}
        enablePan={false}
        enableDamping
        dampingFactor={0.06}
        minPolarAngle={0.68}
        maxPolarAngle={1.18}
        minAzimuthAngle={-0.72}
        maxAzimuthAngle={0.72}
        target={[0.4, 0, 0]}
        rotateSpeed={0.45}
        makeDefault
      />
    </>
  );
}

function FarmBed({ phase }: { phase: number }) {
  const soilColors = useMemo(
    () => ["#292929", "#363636", "#1d1d1d", "#444444", "#171717"],
    []
  );
  const grassColors = useMemo(
    () => ["#171817", "#202220", "#111211", "#2a2c2a"],
    []
  );
  const soilRepeat = useMemo<[number, number]>(() => [18, 12], []);
  const grassRepeat = useMemo<[number, number]>(() => [24, 18], []);
  const soil = useNoiseTexture(soilColors, soilRepeat);
  const grass = useNoiseTexture(grassColors, grassRepeat);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.42, 0]} receiveShadow>
        <planeGeometry args={[44, 34]} />
        <meshStandardMaterial map={grass} color="#8b8f8a" roughness={1} />
      </mesh>
      <mesh position={[0, -0.21, 0]} receiveShadow>
        <boxGeometry args={[18.4, 0.38, 11.4, 2, 1, 2]} />
        <meshStandardMaterial map={soil} color="#999999" roughness={0.96} metalness={0.04} />
      </mesh>
      {Array.from({ length: 9 }, (_, index) => {
        const z = -4 + index;
        return (
          <group key={z}>
            <mesh position={[0, -0.02, z]} rotation={[0, 0, Math.PI / 2]} receiveShadow castShadow>
              <capsuleGeometry args={[0.24, 16.35, 4, 10]} />
              <meshStandardMaterial map={soil} color={index % 2 ? "#a2a2a0" : "#8d8d8b"} roughness={0.98} />
            </mesh>
            <mesh position={[0, 0.215, z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
              <planeGeometry args={[16.7, 0.035]} />
              <meshStandardMaterial color="#777775" roughness={1} />
            </mesh>
          </group>
        );
      })}
      <FieldDebris />
      <FieldEdge hidden={phase === 3} />
      <gridHelper args={[18.4, 24, "#8a8a88", "#363636"]} position={[0, 0.235, 0]} />
    </group>
  );
}

function FieldDebris() {
  const stones = useRef<THREE.InstancedMesh>(null);
  const count = 120;

  useLayoutEffect(() => {
    const helper = new THREE.Object3D();
    for (let index = 0; index < count; index += 1) {
      helper.position.set(
        -8.5 + seeded(index, 10) * 17,
        0.14 + seeded(index, 11) * 0.025,
        -5 + seeded(index, 12) * 10
      );
      const scale = 0.025 + seeded(index, 13) * 0.07;
      helper.scale.set(scale * 1.4, scale, scale);
      helper.rotation.set(seeded(index, 14) * 2, seeded(index, 15) * 3, seeded(index, 16) * 2);
      helper.updateMatrix();
      stones.current?.setMatrixAt(index, helper.matrix);
    }
    if (stones.current) stones.current.instanceMatrix.needsUpdate = true;
  }, []);

  return (
    <instancedMesh ref={stones} args={[undefined, undefined, count]} castShadow receiveShadow>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#777774" roughness={1} />
    </instancedMesh>
  );
}

function FieldEdge({ hidden }: { hidden: boolean }) {
  const bushes = useRef<THREE.InstancedMesh>(null);
  const count = 42;

  useLayoutEffect(() => {
    const helper = new THREE.Object3D();
    for (let index = 0; index < count; index += 1) {
      const side = index < count / 2 ? -1 : 1;
      const local = index % (count / 2);
      helper.position.set(-9 + local * 1.03, 0.04 + seeded(index, 20) * 0.1, side < 0 ? -9.1 : 7.2);
      const scale = 0.42 + seeded(index, 21) * 0.35;
      helper.scale.set(scale * 1.25, scale, scale);
      helper.rotation.y = seeded(index, 22) * Math.PI;
      helper.updateMatrix();
      bushes.current?.setMatrixAt(index, helper.matrix);
    }
    if (bushes.current) bushes.current.instanceMatrix.needsUpdate = true;
  }, []);

  if (hidden) return null;

  return (
    <instancedMesh ref={bushes} args={[undefined, undefined, count]} castShadow receiveShadow>
      <dodecahedronGeometry args={[0.72, 1]} />
      <meshStandardMaterial color="#353735" roughness={1} />
    </instancedMesh>
  );
}

function FarmInfrastructure() {
  const posts = useRef<THREE.InstancedMesh>(null);
  const barnGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-1.45, 0);
    shape.lineTo(1.45, 0);
    shape.lineTo(1.45, 0.92);
    shape.lineTo(0, 1.58);
    shape.lineTo(-1.45, 0.92);
    shape.closePath();
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: 2.35,
      bevelEnabled: false,
    });
    geometry.translate(0, 0, -1.175);
    geometry.computeVertexNormals();
    return geometry;
  }, []);

  const fencePositions = useMemo(() => {
    const result: THREE.Vector3[] = [];
    for (let index = 0; index < 20; index += 1) {
      const x = -9.2 + index * (18.4 / 19);
      result.push(new THREE.Vector3(x, 0.12, -5.82));
      result.push(new THREE.Vector3(x, 0.12, 5.82));
    }
    for (let index = 1; index < 11; index += 1) {
      const z = -5.82 + index * (11.64 / 11);
      result.push(new THREE.Vector3(-9.2, 0.12, z));
      result.push(new THREE.Vector3(9.2, 0.12, z));
    }
    return result;
  }, []);

  useLayoutEffect(() => {
    const helper = new THREE.Object3D();
    fencePositions.forEach((position, index) => {
      helper.position.copy(position);
      helper.position.y += 0.18;
      helper.rotation.y = seeded(index, 90) * 0.05;
      helper.scale.set(0.045, 0.42 + seeded(index, 91) * 0.08, 0.045);
      helper.updateMatrix();
      posts.current?.setMatrixAt(index, helper.matrix);
    });
    if (posts.current) posts.current.instanceMatrix.needsUpdate = true;
  }, [fencePositions]);

  return (
    <group>
      {/* Gravel access road and compacted wheel lines. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.395, -6.95]} receiveShadow>
        <planeGeometry args={[34, 1.65]} />
        <meshStandardMaterial color="#565956" roughness={1} />
      </mesh>
      {[-0.42, 0.42].map((offset) => (
        <mesh key={offset} position={[0, -0.376, -6.95 + offset]} receiveShadow>
          <boxGeometry args={[34, 0.025, 0.09]} />
          <meshStandardMaterial color="#2e302e" roughness={1} />
        </mesh>
      ))}

      {/* Working barn / packing shed. */}
      <group position={[6.1, -0.37, -8.15]}>
        <mesh geometry={barnGeometry} castShadow receiveShadow>
          <meshStandardMaterial color="#747874" roughness={0.86} metalness={0.08} />
        </mesh>
        <mesh position={[0, 0.48, 1.182]}>
          <planeGeometry args={[1.05, 0.92]} />
          <meshStandardMaterial color="#252725" roughness={0.94} />
        </mesh>
        <mesh position={[-0.92, 0.66, 1.19]}>
          <planeGeometry args={[0.34, 0.28]} />
          <meshStandardMaterial color="#b8bcb7" roughness={0.4} metalness={0.18} />
        </mesh>
        <mesh position={[0.92, 0.66, 1.19]}>
          <planeGeometry args={[0.34, 0.28]} />
          <meshStandardMaterial color="#b8bcb7" roughness={0.4} metalness={0.18} />
        </mesh>
      </group>

      {/* Grain / water storage beside the shed. */}
      {[8.15, 9.05].map((x, index) => (
        <group key={x} position={[x, -0.34, -8.1 - index * 0.18]}>
          <mesh position={[0, 0.68, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.39, 0.43, 1.35, 18]} />
            <meshStandardMaterial color={index ? "#858985" : "#9a9d99"} roughness={0.68} metalness={0.22} />
          </mesh>
          <mesh position={[0, 1.45, 0]} castShadow>
            <coneGeometry args={[0.43, 0.28, 18]} />
            <meshStandardMaterial color="#a7aaa5" roughness={0.72} metalness={0.18} />
          </mesh>
          {[-0.22, 0, 0.22].map((y) => (
            <mesh key={y} position={[0.405, 0.64 + y, 0]} rotation={[0, 0, Math.PI / 2]}>
              <torusGeometry args={[0.38, 0.012, 5, 24]} />
              <meshStandardMaterial color="#4b4e4b" roughness={0.8} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Main irrigation line and pump station. */}
      <mesh position={[0, 0.35, 5.15]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.055, 0.055, 17.2, 10]} />
        <meshStandardMaterial color="#a1a5a1" roughness={0.5} metalness={0.42} />
      </mesh>
      {Array.from({ length: 9 }, (_, index) => (
        <group key={index} position={[-7.8 + index * 1.95, 0.35, 5.15]}>
          <mesh position={[0, 0.18, 0]} castShadow>
            <cylinderGeometry args={[0.02, 0.025, 0.36, 7]} />
            <meshStandardMaterial color="#8e928e" roughness={0.55} metalness={0.35} />
          </mesh>
          <mesh position={[0, 0.38, 0]}>
            <sphereGeometry args={[0.055, 8, 6]} />
            <meshStandardMaterial color="#c0c3bf" roughness={0.45} metalness={0.28} />
          </mesh>
        </group>
      ))}
      <mesh position={[-8.4, 0.14, 5.15]} castShadow>
        <boxGeometry args={[0.55, 0.5, 0.62]} />
        <meshStandardMaterial color="#555955" roughness={0.8} metalness={0.18} />
      </mesh>

      {/* Perimeter fence gives the field a real physical boundary. */}
      <instancedMesh ref={posts} args={[undefined, undefined, fencePositions.length]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#676b67" roughness={0.88} />
      </instancedMesh>
      {[-5.82, 5.82].flatMap((z) =>
        [0.23, 0.48].map((y) => (
          <mesh key={`${z}-${y}`} position={[0, y, z]} castShadow>
            <boxGeometry args={[18.4, 0.025, 0.035]} />
            <meshStandardMaterial color="#555955" roughness={0.82} />
          </mesh>
        ))
      )}
      {[-9.2, 9.2].flatMap((x) =>
        [0.23, 0.48].map((y) => (
          <mesh key={`${x}-${y}`} position={[x, y, 0]} castShadow>
            <boxGeometry args={[0.035, 0.025, 11.64]} />
            <meshStandardMaterial color="#555955" roughness={0.82} />
          </mesh>
        ))
      )}
    </group>
  );
}

function CropRows() {
  return (
    <group>
      <CornRows />
      <SoybeanRows />
      <LeafyRows />
      <CropZoneLabels />
    </group>
  );
}

function CornRows() {
  const plants = useCropPositions(0, 3, 31);
  const stems = useRef<THREE.InstancedMesh>(null);
  const leaves = useRef<THREE.InstancedMesh>(null);
  const ears = useRef<THREE.InstancedMesh>(null);
  const tassels = useRef<THREE.InstancedMesh>(null);
  const leafGeometry = useCornLeafGeometry();

  useLayoutEffect(() => {
    const helper = new THREE.Object3D();
    const stemColors = [new THREE.Color("#59615b"), new THREE.Color("#697269"), new THREE.Color("#4c554e")];
    const leafColors = [new THREE.Color("#6d756e"), new THREE.Color("#7e877f"), new THREE.Color("#59625b")];
    plants.forEach((plant, index) => {
      const present = seeded(index, 39) > 0.035 ? 1 : 0.01;
      const height = (1.02 + seeded(index, 43) * 0.28) * present;

      helper.position.set(plant.x, plant.y + height / 2, plant.z);
      helper.rotation.set(0, 0, (seeded(index, 44) - 0.5) * 0.05);
      helper.scale.set(1, height, 1);
      helper.updateMatrix();
      stems.current?.setMatrixAt(index, helper.matrix);
      stems.current?.setColorAt(index, stemColors[index % stemColors.length]);

      for (let leaf = 0; leaf < 6; leaf += 1) {
        const instance = index * 6 + leaf;
        const angle = leaf * 2.3 + seeded(instance, 45) * 0.25;
        helper.position.set(plant.x, plant.y + 0.18 + leaf * 0.14 * present, plant.z);
        helper.rotation.set(-0.18 + seeded(instance, 46) * 0.18, angle, leaf % 2 ? 0.38 : -0.38);
        helper.scale.set(0.72 * present, (0.72 + seeded(instance, 47) * 0.2) * present, 0.72 * present);
        helper.updateMatrix();
        leaves.current?.setMatrixAt(instance, helper.matrix);
        leaves.current?.setColorAt(instance, leafColors[instance % leafColors.length]);
      }

      const earAngle = seeded(index, 48) * Math.PI * 2;
      helper.position.set(plant.x + Math.cos(earAngle) * 0.075, plant.y + height * 0.58, plant.z + Math.sin(earAngle) * 0.075);
      helper.rotation.set(0.25, -earAngle, 0.2);
      helper.scale.set(0.7 * present, 0.85 * present, 0.7 * present);
      helper.updateMatrix();
      ears.current?.setMatrixAt(index, helper.matrix);

      helper.position.set(plant.x, plant.y + height + 0.07, plant.z);
      helper.rotation.set(0, seeded(index, 49) * Math.PI, 0);
      helper.scale.set(0.65 * present, 0.9 * present, 0.65 * present);
      helper.updateMatrix();
      tassels.current?.setMatrixAt(index, helper.matrix);
    });
    [stems.current, leaves.current, ears.current, tassels.current].forEach((mesh) => {
      if (!mesh) return;
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    });
  }, [plants, leafGeometry]);

  return (
    <group>
      <instancedMesh ref={stems} args={[undefined, undefined, plants.length]} castShadow>
        <cylinderGeometry args={[0.025, 0.038, 1, 7]} />
        <meshStandardMaterial color="#636b64" roughness={0.86} />
      </instancedMesh>
      <instancedMesh ref={leaves} args={[leafGeometry, undefined, plants.length * 6]} castShadow receiveShadow>
        <meshStandardMaterial color="#747d75" roughness={0.78} side={THREE.DoubleSide} />
      </instancedMesh>
      <instancedMesh ref={ears} args={[undefined, undefined, plants.length]} castShadow>
        <capsuleGeometry args={[0.045, 0.15, 4, 8]} />
        <meshStandardMaterial color="#9a9d91" roughness={0.86} />
      </instancedMesh>
      <instancedMesh ref={tassels} args={[undefined, undefined, plants.length]} castShadow>
        <coneGeometry args={[0.065, 0.2, 6]} />
        <meshStandardMaterial color="#aeb1a7" roughness={0.9} />
      </instancedMesh>
    </group>
  );
}

function SoybeanRows() {
  const plants = useCropPositions(3, 3, 52);
  const stems = useRef<THREE.InstancedMesh>(null);
  const leaves = useRef<THREE.InstancedMesh>(null);
  const pods = useRef<THREE.InstancedMesh>(null);
  const leafGeometry = useLeafGeometry();

  useLayoutEffect(() => {
    const helper = new THREE.Object3D();
    const colors = [new THREE.Color("#747c74"), new THREE.Color("#858c84"), new THREE.Color("#626a63")];
    plants.forEach((plant, index) => {
      const present = seeded(index, 53) > 0.035 ? 1 : 0.01;
      const height = (0.48 + seeded(index, 54) * 0.13) * present;
      helper.position.set(plant.x, plant.y + height / 2, plant.z);
      helper.rotation.set(0, 0, (seeded(index, 55) - 0.5) * 0.12);
      helper.scale.set(1, height, 1);
      helper.updateMatrix();
      stems.current?.setMatrixAt(index, helper.matrix);

      for (let node = 0; node < 4; node += 1) {
        const baseAngle = node * 2.1 + seeded(index + node, 56) * 0.35;
        for (let leaflet = 0; leaflet < 3; leaflet += 1) {
          const instance = index * 12 + node * 3 + leaflet;
          const angle = baseAngle + (leaflet - 1) * 0.55;
          helper.position.set(
            plant.x + Math.cos(baseAngle) * node * 0.018,
            plant.y + 0.16 + node * 0.105 * present,
            plant.z + Math.sin(baseAngle) * node * 0.018
          );
          helper.rotation.set(-0.86 + seeded(instance, 57) * 0.13, angle, 0);
          helper.scale.set(0.42 * present, (0.46 + (leaflet === 1 ? 0.08 : 0)) * present, 0.42 * present);
          helper.updateMatrix();
          leaves.current?.setMatrixAt(instance, helper.matrix);
          leaves.current?.setColorAt(instance, colors[instance % colors.length]);
        }
      }

      helper.position.set(plant.x + 0.055, plant.y + height * 0.56, plant.z - 0.025);
      helper.rotation.set(0.3, seeded(index, 58) * Math.PI, 0.5);
      helper.scale.set(0.55 * present, 0.7 * present, 0.55 * present);
      helper.updateMatrix();
      pods.current?.setMatrixAt(index, helper.matrix);
    });
    [stems.current, leaves.current, pods.current].forEach((mesh) => {
      if (!mesh) return;
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    });
  }, [plants, leafGeometry]);

  return (
    <group>
      <instancedMesh ref={stems} args={[undefined, undefined, plants.length]} castShadow>
        <cylinderGeometry args={[0.022, 0.034, 1, 7]} />
        <meshStandardMaterial color="#5f675f" roughness={0.88} />
      </instancedMesh>
      <instancedMesh ref={leaves} args={[leafGeometry, undefined, plants.length * 12]} castShadow receiveShadow>
        <meshStandardMaterial color="#7c847c" roughness={0.79} side={THREE.DoubleSide} />
      </instancedMesh>
      <instancedMesh ref={pods} args={[undefined, undefined, plants.length]} castShadow>
        <capsuleGeometry args={[0.025, 0.095, 4, 7]} />
        <meshStandardMaterial color="#a0a49a" roughness={0.9} />
      </instancedMesh>
    </group>
  );
}

function LeafyRows() {
  const plants = useCropPositions(6, 3, 62);
  const leaves = useRef<THREE.InstancedMesh>(null);
  const leafGeometry = useLeafGeometry();

  useLayoutEffect(() => {
    const helper = new THREE.Object3D();
    const colors = [new THREE.Color("#777f77"), new THREE.Color("#8a9189"), new THREE.Color("#697169"), new THREE.Color("#969c94")];
    plants.forEach((plant, index) => {
      const present = seeded(index, 63) > 0.035 ? 1 : 0.01;
      const variation = 0.88 + seeded(index, 64) * 0.24;
      for (let leaf = 0; leaf < 10; leaf += 1) {
        const instance = index * 10 + leaf;
        const ring = leaf < 7 ? 0 : 1;
        const angle = leaf * 2.399 + seeded(instance, 65) * 0.16;
        helper.position.set(
          plant.x + Math.cos(angle) * (ring ? 0.025 : 0.065),
          plant.y + (ring ? 0.12 : 0.06),
          plant.z + Math.sin(angle) * (ring ? 0.025 : 0.065)
        );
        helper.rotation.set(ring ? -1.02 : -1.28, angle, (seeded(instance, 66) - 0.5) * 0.18);
        const scale = (ring ? 0.52 : 0.78) * variation * present;
        helper.scale.set(scale, scale * (ring ? 0.92 : 1.14), scale);
        helper.updateMatrix();
        leaves.current?.setMatrixAt(instance, helper.matrix);
        leaves.current?.setColorAt(instance, colors[instance % colors.length]);
      }
    });
    if (leaves.current) {
      leaves.current.instanceMatrix.needsUpdate = true;
      if (leaves.current.instanceColor) leaves.current.instanceColor.needsUpdate = true;
    }
  }, [plants, leafGeometry]);

  return (
    <instancedMesh ref={leaves} args={[leafGeometry, undefined, plants.length * 10]} castShadow receiveShadow>
      <meshStandardMaterial color="#7f877f" roughness={0.8} side={THREE.DoubleSide} />
    </instancedMesh>
  );
}

function CropZoneLabels() {
  const zones = [
    { name: "Corn · block A", z: -3 },
    { name: "Soybean · block B", z: 0 },
    { name: "Leafy greens · block C", z: 3 },
  ];
  return (
    <>
      {zones.map((zone) => (
        <Html key={zone.name} position={[-8.25, 0.36, zone.z]} center distanceFactor={15} style={{ pointerEvents: "none" }}>
          <div className="whitespace-nowrap border-l border-white/30 bg-black/35 px-2 py-1 font-mono text-[8px] uppercase tracking-[0.16em] text-white/60 backdrop-blur-sm">
            {zone.name}
          </div>
        </Html>
      ))}
    </>
  );
}

function ScanPointCloud() {
  const geometry = useMemo(() => {
    const count = 1600;
    const positions = new Float32Array(count * 3);
    for (let index = 0; index < count; index += 1) {
      const x = -8.5 + seeded(index, 71) * 17;
      const z = -5.1 + seeded(index, 72) * 10.2;
      const onRow = Math.abs(z - Math.round(z)) < 0.24;
      positions[index * 3] = x;
      positions[index * 3 + 1] = onRow
        ? 0.26 + seeded(index, 73) * 0.55
        : 0.16 + seeded(index, 74) * 0.08;
      positions[index * 3 + 2] = z;
    }
    const points = new THREE.BufferGeometry();
    points.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return points;
  }, []);

  return (
    <points geometry={geometry}>
      <pointsMaterial
        color="#c5c6c2"
        size={0.022}
        transparent
        opacity={0.34}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}

function ScanSweep({ active }: { active: boolean }) {
  const group = useRef<THREE.Group>(null);
  const material = useRef<THREE.MeshBasicMaterial>(null);

  useFrame(({ clock }, delta) => {
    if (!group.current || !material.current) return;
    const targetOpacity = active ? 0.52 : 0;
    material.current.opacity = THREE.MathUtils.damp(material.current.opacity, targetOpacity, 7, delta);
    group.current.position.x = active ? ((clock.elapsedTime * 2.6 + 9) % 18) - 9 : -9;
  });

  return (
    <group ref={group} position={[-9, 0, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.58, 0]}>
        <planeGeometry args={[0.24, 10.2]} />
        <meshBasicMaterial ref={material} color="#dcebd2" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[0.035, 0.65, 10.2]} />
        <meshBasicMaterial color="#f3f1ed" transparent opacity={0.72} />
      </mesh>
    </group>
  );
}

function WeedTarget({
  target,
  index,
  phase,
  selected,
  onSelect,
}: {
  target: (typeof TARGETS)[number];
  index: number;
  phase: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const plant = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  const ringMaterial = useRef<THREE.MeshBasicMaterial>(null);
  const consumed = useRef(0);
  const previousPhase = useRef(phase);
  const leafGeometry = useLeafGeometry();
  const isGrass = target.type.startsWith("Grass");

  useFrame(({ clock }, delta) => {
    if (phase !== previousPhase.current) {
      if (phase <= 2 && previousPhase.current > 2) consumed.current = 0;
      if (phase < 2) consumed.current = 0;
      if (phase === 3) consumed.current = 1;
      previousPhase.current = phase;
    }
    if (plant.current) {
      const cycle = (clock.elapsedTime * 0.11 + index * 0.24) % 1;
      const eating = phase === 2 && cycle >= 0.54 && cycle <= 0.84;
      if (eating) consumed.current = Math.min(1, consumed.current + delta * 1.35);
      const targetScale = phase >= 2 ? 1 - consumed.current * 0.94 : 1;
      const scale = THREE.MathUtils.damp(plant.current.scale.x, targetScale, 2.4 + index * 0.3, delta);
      plant.current.scale.setScalar(scale);
    }
    if (ring.current) {
      const pulse = 1 + Math.sin(clock.elapsedTime * 3 + index) * 0.12;
      ring.current.scale.setScalar(pulse);
    }
    if (ringMaterial.current) {
      const visible = phase === 1 || (selected && phase === 2);
      ringMaterial.current.opacity = THREE.MathUtils.damp(ringMaterial.current.opacity, visible ? (selected ? 1 : 0.55) : 0.08, 8, delta);
    }
  });

  return (
    <group position={target.position}>
      <group ref={plant}>
        {isGrass ? (
          Array.from({ length: 10 }, (_, blade) => {
            const angle = blade * 2.399;
            return (
              <mesh
                key={blade}
                position={[Math.cos(angle) * 0.045, 0.28, Math.sin(angle) * 0.045]}
                rotation={[Math.sin(angle) * 0.28, angle, Math.cos(angle) * 0.25]}
                castShadow
              >
                <boxGeometry args={[0.035, 0.58 + (blade % 3) * 0.08, 0.025]} />
                <meshStandardMaterial color={blade % 2 ? "#b4b8ad" : "#969c91"} roughness={0.86} />
              </mesh>
            );
          })
        ) : (
          <>
            <mesh position={[0, 0.24, 0]} castShadow>
              <cylinderGeometry args={[0.025, 0.045, 0.48, 7]} />
              <meshStandardMaterial color="#8b8f87" roughness={0.88} />
            </mesh>
            {Array.from({ length: 7 }, (_, leaf) => {
              const angle = leaf * ((Math.PI * 2) / 7);
              return (
                <mesh
                  key={leaf}
                  geometry={leafGeometry}
                  position={[Math.cos(angle) * 0.09, 0.26 + (leaf % 2) * 0.04, Math.sin(angle) * 0.09]}
                  rotation={[-0.82, angle, leaf % 2 ? 0.12 : -0.12]}
                  scale={[0.62, 0.76, 0.62]}
                  castShadow
                >
                  <meshStandardMaterial color={leaf % 2 ? "#bfc2b8" : "#a9aea3"} roughness={0.8} side={THREE.DoubleSide} />
                </mesh>
              );
            })}
            <mesh position={[0, 0.34, 0]} castShadow>
              <sphereGeometry args={[0.07, 9, 7]} />
              <meshStandardMaterial color="#c7c9c0" roughness={0.8} />
            </mesh>
          </>
        )}
      </group>

      <mesh
        ref={ring}
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, 0.05, 0]}
        onClick={(event) => {
          event.stopPropagation();
          onSelect();
        }}
      >
        <torusGeometry args={[0.5, 0.025, 8, 42]} />
        <meshBasicMaterial ref={ringMaterial} color={selected ? "#f3f1ed" : "#b8c66c"} transparent opacity={0.2} depthWrite={false} />
      </mesh>

      {(phase === 1 || (selected && phase === 2)) && (
        <Html center position={[0, 1.12, 0]} distanceFactor={11} style={{ pointerEvents: "none" }}>
          <div className={`hidden whitespace-nowrap border-l px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] backdrop-blur-sm sm:block ${selected ? "border-white text-white" : "border-white/30 text-white/65"}`}>
            target {target.id}
          </div>
        </Html>
      )}
      <WeedIntake active={phase === 2} index={index} />
    </group>
  );
}

function WeedIntake({ active, index }: { active: boolean; index: number }) {
  const particles = useRef<THREE.InstancedMesh>(null);
  const count = 12;

  useFrame(({ clock }) => {
    if (!particles.current) return;
    const helper = new THREE.Object3D();
    const biteCycle = (clock.elapsedTime * 0.11 + index * 0.24) % 1;
    const eating = active && biteCycle >= 0.54 && biteCycle <= 0.84;
    for (let particle = 0; particle < count; particle += 1) {
      const cycle = (clock.elapsedTime * 0.72 + particle / count + index * 0.17) % 1;
      const pull = smoothStep(cycle, 0.08, 0.92);
      const angle = particle * 2.399;
      const sourceRadius = 0.18 + (particle % 3) * 0.055;
      helper.position.set(
        Math.cos(angle) * sourceRadius * (1 - pull),
        THREE.MathUtils.lerp(0.3 + (particle % 4) * 0.095, 0.41, pull),
        Math.sin(angle) * sourceRadius * (1 - pull)
      );
      helper.rotation.set(angle, angle * 0.7, 0);
      helper.scale.setScalar(eating ? (0.032 + (particle % 3) * 0.01) * (1 - pull * 0.7) : 0.001);
      helper.updateMatrix();
      particles.current.setMatrixAt(particle, helper.matrix);
    }
    particles.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={particles} args={[undefined, undefined, count]}>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#b4b8ad" emissive="#78816e" emissiveIntensity={0.45} roughness={0.8} />
    </instancedMesh>
  );
}

const SURFACE_ROUTES = TARGETS.map((target, index) => {
  const direction = index % 2 === 0 ? -1 : 1;
  return [
    new THREE.Vector3(target.position.x - direction * 1.65, 0.4, target.position.z + 0.66),
    new THREE.Vector3(target.position.x - direction * 0.82, 0.4, target.position.z + 0.24),
    target.position.clone().setY(0.4),
  ];
});

function Route({ active }: { active: boolean }) {
  const materials = useRef<Array<THREE.MeshBasicMaterial | null>>([]);
  const geometries = useMemo(() => {
    return SURFACE_ROUTES.map((points) => {
      const curve = new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.2);
      return new THREE.TubeGeometry(curve, 72, 0.014, 5, false);
    });
  }, []);

  useFrame((_, delta) => {
    materials.current.forEach((material) => {
      if (!material) return;
      material.opacity = THREE.MathUtils.damp(material.opacity, active ? 0.48 : 0, 8, delta);
    });
  });

  return (
    <group>
      {geometries.map((geometry, index) => (
        <mesh key={index} geometry={geometry}>
          <meshBasicMaterial
            ref={(material) => {
              materials.current[index] = material;
            }}
            color="#f3f1ed"
            transparent
            opacity={0}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

function WigglerFleet({ phase }: { phase: number }) {
  return (
    <group>
      {TARGETS.map((target, index) => (
        <MiniWiggler key={target.id} index={index} phase={phase} />
      ))}
    </group>
  );
}

function MiniWiggler({ index, phase }: { index: number; phase: number }) {
  const group = useRef<THREE.Group>(null);
  const segments = useRef<THREE.Group>(null);
  const mouth = useRef<THREE.Group>(null);
  const descent = useRef(0);
  const previousPhase = useRef(phase);
  const surfaceCurve = useMemo(
    () => new THREE.CatmullRomCurve3(SURFACE_ROUTES[index], false, "catmullrom", 0.2),
    [index]
  );
  const undergroundCurve = useMemo(() => {
    const target = TARGETS[index].position;
    const endX = -5 + index * 3.5;
    return new THREE.CatmullRomCurve3(
      [
        target.clone().setY(0.38),
        new THREE.Vector3(target.x * 0.84, -0.08, target.z + 0.78),
        new THREE.Vector3(target.x * 0.56, -0.52, 4.72),
        new THREE.Vector3(endX, -0.6 + index * 0.25, 7.91),
      ],
      false,
      "catmullrom",
      0.18
    );
  }, [index]);
  const position = useMemo(() => new THREE.Vector3(), []);
  const tangent = useMemo(() => new THREE.Vector3(), []);
  const segmentGeometry = useWigglerSegmentGeometry(0.07, 0.038);
  const capGeometry = useWigglerSegmentGeometry(0.06, 0.034);

  useFrame(({ clock }, delta) => {
    if (!group.current) return;
    if (phase !== previousPhase.current) {
      if (phase === 3) descent.current = 0;
      previousPhase.current = phase;
    }

    let eating = false;
    if (phase === 3) {
      descent.current = Math.min(1, descent.current + delta * 0.36);
      const travel = smoothStep(descent.current, 0, 1);
      undergroundCurve.getPointAt(travel, position);
      undergroundCurve.getTangentAt(Math.min(0.995, travel), tangent);
      if (travel > 0.98) {
        position.x += Math.sin(clock.elapsedTime * 0.72 + index * 2.1) * 0.34;
        position.y += Math.sin(clock.elapsedTime * 1.4 + index) * 0.055;
      }
    } else {
      const cycle = (clock.elapsedTime * 0.11 + index * 0.24) % 1;
      eating = phase === 2 && cycle >= 0.54 && cycle <= 0.84;
      const progress = phase !== 2
        ? 0.03
        : cycle < 0.54
          ? smoothStep(cycle, 0, 0.54)
          : cycle <= 0.84
            ? 1
            : 1 - smoothStep(cycle, 0.84, 1);
      surfaceCurve.getPointAt(progress, position);
      surfaceCurve.getTangentAt(Math.min(0.995, progress), tangent);
    }

    group.current.position.lerp(position, 1 - Math.exp(-delta * 5.4));
    group.current.rotation.y = Math.atan2(tangent.x, tangent.z) - Math.PI / 2;
    group.current.rotation.z = THREE.MathUtils.damp(
      group.current.rotation.z,
      phase === 3 ? tangent.y * 0.9 : 0,
      5,
      delta
    );

    if (segments.current) {
      segments.current.children.forEach((child, index) => {
        const wave = Math.sin(clock.elapsedTime * 6.2 - index * 0.95);
        child.position.x = -index * 0.069;
        child.position.y = Math.max(0, wave) * 0.012;
        const bulge = 1 + Math.max(0, wave) * 0.16;
        child.scale.set(1, bulge, bulge);
      });
    }
    if (mouth.current) {
      const bite = eating ? (Math.sin(clock.elapsedTime * 13) + 1) * 0.5 : 0;
      mouth.current.children.forEach((jaw, jawIndex) => {
        const direction = jawIndex === 0 ? 1 : -1;
        jaw.position.z = direction * (0.012 + bite * 0.026);
        jaw.rotation.y = direction * (0.18 + bite * 0.34);
      });
    }
  });

  return (
    <group ref={group} position={SURFACE_ROUTES[index][0]} renderOrder={phase === 3 ? 7 : 0}>
      <group ref={segments}>
        {Array.from({ length: 6 }, (_, segmentIndex) => {
          const cap = segmentIndex === 0 || segmentIndex === 5;
          return (
            <group key={segmentIndex}>
              <mesh
                geometry={cap ? capGeometry : segmentGeometry}
                rotation={[0, 0, Math.PI / 2]}
                castShadow
                renderOrder={phase === 3 ? 9 : 0}
              >
                <meshPhysicalMaterial
                  color={cap ? "#d0cec7" : "#e7e4dc"}
                  roughness={0.38}
                  metalness={0.08}
                  clearcoat={0.32}
                  clearcoatRoughness={0.4}
                  depthTest={phase !== 3}
                  emissive={phase === 3 ? "#b8cd83" : "#000000"}
                  emissiveIntensity={phase === 3 ? 0.72 : 0}
                />
              </mesh>
              {segmentIndex < 5 && (
                <mesh
                  position={[-0.044, 0, 0]}
                  rotation={[0, 0, Math.PI / 2]}
                  renderOrder={phase === 3 ? 9 : 0}
                >
                  <cylinderGeometry args={[0.037, 0.037, 0.026, 10]} />
                  <meshStandardMaterial color="#302f2c" roughness={0.72} depthTest={phase !== 3} />
                </mesh>
              )}
            </group>
          );
        })}
      </group>
      <mesh position={[0.052, 0.01, 0]} rotation={[0, Math.PI / 2, 0]} renderOrder={phase === 3 ? 9 : 0}>
        <sphereGeometry args={[0.026, 12, 9]} />
        <meshPhysicalMaterial
          color="#101817"
          roughness={0.12}
          metalness={0.45}
          clearcoat={1}
          depthTest={phase !== 3}
          emissive={phase === 3 ? "#a8c56e" : "#000000"}
          emissiveIntensity={phase === 3 ? 1.1 : 0}
        />
      </mesh>
      <group ref={mouth} position={[0.095, 0.01, 0]}>
        {[1, -1].map((direction) => (
          <mesh key={direction} position={[0.025, 0, direction * 0.012]} rotation={[0, direction * 0.18, 0]} renderOrder={phase === 3 ? 9 : 0}>
            <boxGeometry args={[0.07, 0.018, 0.022]} />
            <meshStandardMaterial color="#171916" emissive="#a8c56e" emissiveIntensity={phase === 2 ? 0.5 : 0.12} roughness={0.6} depthTest={phase !== 3} />
          </mesh>
        ))}
      </group>
      {phase === 3 && (
        <mesh position={[-0.22, 0, -0.02]} renderOrder={6}>
          <sphereGeometry args={[0.18, 12, 9]} />
          <meshBasicMaterial color="#c7de8b" transparent opacity={0.1} depthWrite={false} depthTest={false} blending={THREE.AdditiveBlending} />
        </mesh>
      )}
      <pointLight position={[0.1, 0.08, 0]} intensity={1.1} distance={0.7} color="#d9f4cc" />
    </group>
  );
}

function SoilRegeneration({ active }: { active: boolean }) {
  const group = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!group.current) return;
    const target = active ? 1 : 0.001;
    group.current.scale.y = THREE.MathUtils.damp(group.current.scale.y, target, 5, delta);
    group.current.position.y = THREE.MathUtils.damp(group.current.position.y, active ? 0 : -0.7, 5, delta);
  });

  return (
    <group ref={group} position={[0, -0.7, 0]} scale={[1, 0.001, 1]}>
      <mesh position={[0, -1.18, 7.6]} receiveShadow>
        <boxGeometry args={[18.1, 2.35, 0.5]} />
        <meshStandardMaterial color="#665642" roughness={0.98} emissive="#2b2519" emissiveIntensity={0.72} />
      </mesh>
      <mesh position={[0, -0.03, 7.62]}>
        <boxGeometry args={[18.1, 0.09, 0.46]} />
        <meshStandardMaterial color="#aaa487" roughness={0.9} emissive="#4f5138" emissiveIntensity={0.32} />
      </mesh>
      <mesh position={[0, -1.18, 7.856]} renderOrder={3}>
        <planeGeometry args={[18.06, 2.28]} />
        <meshBasicMaterial color="#765d43" side={THREE.DoubleSide} depthTest={false} />
      </mesh>
      {[-0.52, -1.08, -1.66].map((y, index) => (
        <mesh key={y} position={[0, y, 7.866]} renderOrder={4}>
          <boxGeometry args={[17.9, 0.025, 0.018]} />
          <meshBasicMaterial color={index === 0 ? "#b9a16f" : index === 1 ? "#927555" : "#624d38"} transparent opacity={0.76} depthTest={false} />
        </mesh>
      ))}
      <RootNetwork />
    </group>
  );
}

function RootNetwork() {
  const roots = useMemo(() => {
    return Array.from({ length: 11 }, (_, index) => {
      const x = -7.5 + index * 1.5;
      const sway = (seeded(index, 121) - 0.5) * 0.34;
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(x, -0.04, 7.875),
        new THREE.Vector3(x + sway, -0.62, 7.885),
        new THREE.Vector3(x - sway * 0.65, -1.26, 7.895),
        new THREE.Vector3(x + sway * 0.35, -2.1, 7.905),
      ]);
      return new THREE.TubeGeometry(curve, 18, 0.018 + (index % 3) * 0.004, 5, false);
    });
  }, []);

  return (
    <group>
      {roots.map((geometry, index) => (
        <mesh key={index} geometry={geometry} renderOrder={5}>
          <meshStandardMaterial
            color={index % 2 ? "#e8dfb7" : "#d1c99c"}
            roughness={0.9}
            emissive="#777351"
            emissiveIntensity={0.18}
            depthTest={false}
          />
        </mesh>
      ))}
    </group>
  );
}
