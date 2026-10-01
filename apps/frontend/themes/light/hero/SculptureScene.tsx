"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Float, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import { useReducedMotion } from "@/themes/core/hooks/device";

/**
 * The light hero's 3D objects, placed as in the owner's reference: the white
 * spiral "shell" sculpture in the middle standing on the lake with its
 * reflection, a small second shell at the upper left, and glossy droplets
 * drifting between them. Solid 3D, not particles.
 *
 * The shell: thin, equal discs (fins) evenly spaced round a closed ring,
 * each with a slight turbine twist. Mouse: it tilts toward the pointer
 * anywhere on the page; hovering it fans the fins further open in a wave and
 * speeds its turn; leaving lets it settle. Reduced motion keeps it still
 * unless hovered.
 */

const FINS = 36;
const TURN = Math.PI * 2; // a full, closed ring: no start or end
const THICKNESS = 0.04; // thick enough to show the bright fin edges of the reference

interface Fin {
  angle: number;
  radius: number;
  dist: number;
  t: number;
}

interface Motion {
  rx: number;
  ry: number;
  spin: number;
  open: number;
}

function buildFins() {
  const fins: Fin[] = [];
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (let i = 0; i < FINS; i++) {
    const t = i / FINS; // 0 … just under 1: evenly round the ring
    const angle = t * TURN;
    const radius = 0.78; // every fin the same size
    const dist = 0.98; // so the ring keeps a small open centre
    fins.push({ angle, radius, dist, t });
    const x = Math.cos(angle) * dist;
    const y = Math.sin(angle) * dist;
    minX = Math.min(minX, x - radius * Math.abs(Math.cos(angle)));
    maxX = Math.max(maxX, x + radius * Math.abs(Math.cos(angle)));
    minY = Math.min(minY, y - radius * Math.abs(Math.sin(angle)));
    maxY = Math.max(maxY, y + radius * Math.abs(Math.sin(angle)));
  }
  return { fins, center: new THREE.Vector2((minX + maxX) / 2, (minY + maxY) / 2), extent: Math.max(maxX - minX, maxY - minY) };
}

interface ShellProps {
  motion: React.RefObject<Motion>;
  /** Width in world units. */
  size: number;
  material: THREE.Material;
  onHover?: (hovered: boolean) => void;
}

/** One shell, posed every frame from a shared motion state (so a reflection can mirror it exactly). */
function Shell({ motion, size, material, onHover }: ShellProps) {
  const { fins, center, extent } = useMemo(() => buildFins(), []);
  const disc = useMemo(() => new THREE.CylinderGeometry(1, 1, THICKNESS, 72, 1), []);
  useEffect(() => () => disc.dispose(), [disc]);

  const tilt = useRef<THREE.Group>(null);
  const spin = useRef<THREE.Group>(null);
  const finRefs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame(() => {
    const m = motion.current;
    if (tilt.current) tilt.current.rotation.set(m.rx, m.ry, 0);
    if (spin.current) spin.current.rotation.z = m.spin;
    fins.forEach((f, i) => {
      const mesh = finRefs.current[i];
      if (mesh) mesh.rotation.x = 0.55 + 0.25 * Math.min(1, Math.max(0, m.open * 1.6 - f.t * 0.6));
    });
  });

  return (
    <group ref={tilt}>
      <group scale={size / extent}>
        <group ref={spin}>
          <group
            position={[-center.x, -center.y, 0]}
            onPointerOver={
              onHover
                ? (e) => {
                    e.stopPropagation();
                    onHover(true);
                  }
                : undefined
            }
            onPointerOut={onHover ? () => onHover(false) : undefined}
          >
            {fins.map((f, i) => (
              <group key={i} position={[Math.cos(f.angle) * f.dist, Math.sin(f.angle) * f.dist, 0]} rotation={[0, 0, f.angle]}>
                <mesh
                  ref={(mesh) => {
                    finRefs.current[i] = mesh;
                  }}
                  geometry={disc}
                  material={material}
                  scale={[f.radius, 1, f.radius]}
                />
              </group>
            ))}
          </group>
        </group>
      </group>
    </group>
  );
}

/** Droplets as in the reference: a few near the small shell, a loose trail toward the big one. [x%, y%, radius as a share of the height] */
const DROPS: [number, number, number][] = [
  [0.135, 0.125, 0.007],
  [0.152, 0.15, 0.005],
  [0.122, 0.162, 0.004],
  [0.165, 0.118, 0.004],
  [0.282, 0.372, 0.011],
  [0.31, 0.405, 0.006],
  [0.332, 0.44, 0.008],
  [0.364, 0.468, 0.013],
  [0.3, 0.5, 0.006],
  [0.382, 0.528, 0.007],
];

function Stage({ pointer, reducedMotion }: { pointer: React.RefObject<THREE.Vector2>; reducedMotion: boolean }) {
  const viewport = useThree((s) => s.viewport);
  const W = viewport.width;
  const H = viewport.height;
  const x = (pct: number) => (pct - 0.5) * W;
  const y = (pct: number) => (0.5 - pct) * H;
  const wide = W / H > 0.9;

  // Composition from the reference: the shell is centred, a little below the
  // middle, about two-fifths of the height across; it stands on the water.
  const size = Math.min(H * 0.48, W * 0.84);
  const cy = y(0.565);
  const water = cy - size * 0.44; // the ring's visible base under its tilt

  // Let the page lay the water's veil exactly at the shell's waterline.
  useEffect(() => {
    const hero = document.querySelector<HTMLElement>("[data-hero]");
    hero?.style.setProperty("--water", `${((0.5 - water / H) * 100).toFixed(2)}%`);
  }, [water, H]);

  const materials = useMemo(() => {
    const solid = new THREE.MeshPhysicalMaterial({
      color: "#e8f1fb", // near-white with a breath of blue; the blue lives in the shading
      roughness: 0.22,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.12,
      envMapIntensity: 1.6,
    });
    const reflection = solid.clone();
    reflection.transparent = true;
    reflection.opacity = 0.32;
    reflection.depthWrite = false;
    return { solid, reflection };
  }, []);
  useEffect(
    () => () => {
      materials.solid.dispose();
      materials.reflection.dispose();
    },
    [materials],
  );

  const main = useRef<Motion>({ rx: -0.26, ry: 0.32, spin: 0, open: 0 });
  const mini = useRef<Motion>({ rx: -0.3, ry: 0.62, spin: 0, open: 0 });
  const hovered = useRef(false);

  useFrame((_, raw) => {
    const dt = Math.min(raw, 1 / 20);
    const k = 1 - Math.pow(0.92, dt * 60);
    const p = pointer.current;
    const m = main.current;
    m.rx += (-0.26 - p.y * 0.2 - m.rx) * k;
    m.ry += (0.32 + p.x * 0.32 - m.ry) * k;
    if (!reducedMotion || hovered.current) m.spin -= dt * (hovered.current ? 0.22 : 0.06);
    m.open += ((hovered.current ? 1 : 0) - m.open) * (1 - Math.pow(0.94, dt * 60));
    if (!reducedMotion) mini.current.spin -= dt * 0.04;
  });

  return (
    <>
      <group position={[0, cy, 0]}>
        <Shell motion={main} size={size} material={materials.solid} onHover={(v) => (hovered.current = v)} />
      </group>
      {/* Its reflection in the lake: the same pose, mirrored about the waterline. */}
      <group position={[0, 2 * water - cy, 0]} scale={[1, -1, 1]}>
        <Shell motion={main} size={size} material={materials.reflection} />
      </group>
      {/* The small shell and its droplets need a landscape screen; on phones
          they would sit behind the headline. */}
      {wide && (
        <group position={[x(0.175), y(0.19), -0.6]}>
          <Shell motion={mini} size={size * 0.27} material={materials.solid} />
        </group>
      )}
      {DROPS.slice(wide ? 0 : 4).map(([px, py, r], i) => (
        <Float key={i} speed={reducedMotion ? 0 : 0.9 + i * 0.12} floatIntensity={reducedMotion ? 0 : 0.25} rotationIntensity={0}>
          <mesh position={[x(px), y(py), 0.2]}>
            <sphereGeometry args={[r * H, 32, 32]} />
            <meshPhysicalMaterial color="#eaf2fc" roughness={0.08} clearcoat={1} envMapIntensity={1.6} />
          </mesh>
        </Float>
      ))}
    </>
  );
}

export default function SculptureScene({ active }: { active: boolean }) {
  const reducedMotion = useReducedMotion();
  // Pointer anywhere on the page, in -1..1, so the tilt answers the whole hero.
  const pointer = useRef(new THREE.Vector2());
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current.set((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1));
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={[1, 2]}
      camera={{ fov: 32, position: [0, 0, 7] }}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance", toneMapping: THREE.NeutralToneMapping }}
      style={{ background: "transparent" }}
    >
      {/* Dawn light, matched to the reference. Sky-blue from above, deeper blue bouncing up from the lake: the blue shading between the fins. */}
      <hemisphereLight args={["#ffffff", "#9fbde2", 1.15]} />
      <directionalLight position={[0, 1, 6]} intensity={1.2} color="#ffffff" />
      {/* The low sunrise behind, upper left: peach on the fins' edges and inner faces. */}
      <directionalLight position={[-1.5, 1.5, -3]} intensity={3.4} color="#ffc6a2" />
      <directionalLight position={[4, 3, 3]} intensity={1.45} color="#ffffff" />
      <directionalLight position={[-4, 1.5, 2]} intensity={1.0} color="#b3d0f0" />
      <Environment resolution={256}>
        <Lightformer form="rect" intensity={2.2} position={[0, 4, 2]} scale={[8, 2, 1]} color="#ffffff" />
        <Lightformer form="rect" intensity={0.9} position={[0, -3, 2]} scale={[10, 3, 1]} color="#a9c6e6" />
        <Lightformer form="rect" intensity={2.4} position={[-2, 1.5, -4]} scale={[4, 3, 1]} color="#ffcbaa" />
        <Lightformer form="rect" intensity={1.4} position={[-5, 0, 1]} scale={[2, 6, 1]} color="#b7d3f3" />
        <Lightformer form="rect" intensity={1.1} position={[5, 0, 1]} scale={[2, 6, 1]} color="#dbe9f8" />
      </Environment>
      <Stage pointer={pointer} reducedMotion={reducedMotion} />
    </Canvas>
  );
}
