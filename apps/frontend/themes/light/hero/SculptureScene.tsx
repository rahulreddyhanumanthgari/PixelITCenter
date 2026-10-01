"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Float, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import { useReducedMotion } from "@/themes/core/hooks/device";

/**
 * The light hero's central object: a white spiral "shell" sculpture built
 * from thin fins (after the owner's reference image). Each fin is a thin
 * disc standing on a nautilus spiral, small at the start and growing as the
 * spiral turns, so together they read as one sculpted, sliced shell.
 *
 * Mouse: the sculpture slowly tilts toward the pointer anywhere on the page;
 * hovering it fans the fins open in a wave and speeds its turn a little;
 * leaving lets it settle back. Reduced motion keeps it still unless hovered.
 */

const FINS = 34;
const TURN = Math.PI * 2 * 0.97; // nearly a full turn, so the last fins meet the first, like the reference
const THICKNESS = 0.022;

interface Fin {
  angle: number;
  radius: number; // fin (disc) radius
  dist: number; // distance of the fin's centre from the spiral's axis
  t: number; // 0 first … 1 last fin
}

function buildFins(): { fins: Fin[]; center: THREE.Vector2; size: number } {
  const fins: Fin[] = [];
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (let i = 0; i < FINS; i++) {
    const t = i / (FINS - 1);
    const angle = t * TURN;
    const radius = 0.42 + 0.78 * Math.pow(t, 1.1);
    const dist = 0.18 + radius * 0.92;
    fins.push({ angle, radius, dist, t });
    const x = Math.cos(angle) * dist;
    const y = Math.sin(angle) * dist;
    minX = Math.min(minX, x - radius * Math.abs(Math.cos(angle)));
    maxX = Math.max(maxX, x + radius * Math.abs(Math.cos(angle)));
    minY = Math.min(minY, y - radius * Math.abs(Math.sin(angle)));
    maxY = Math.max(maxY, y + radius * Math.abs(Math.sin(angle)));
  }
  return {
    fins,
    center: new THREE.Vector2((minX + maxX) / 2, (minY + maxY) / 2),
    size: Math.max(maxX - minX, maxY - minY),
  };
}

function Shell({ pointer, reducedMotion }: { pointer: React.RefObject<THREE.Vector2>; reducedMotion: boolean }) {
  const { fins, center, size } = useMemo(() => buildFins(), []);
  const disc = useMemo(() => new THREE.CylinderGeometry(1, 1, THICKNESS, 72, 1), []);
  const material = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#e8f0fa",
        roughness: 0.36,
        envMapIntensity: 1.25,
        metalness: 0,
        clearcoat: 0.5,
        clearcoatRoughness: 0.25,
      }),
    [],
  );
  useEffect(() => () => disc.dispose(), [disc]);
  useEffect(() => () => material.dispose(), [material]);

  const tilt = useRef<THREE.Group>(null);
  const spin = useRef<THREE.Group>(null);
  const finRefs = useRef<(THREE.Mesh | null)[]>([]);
  const [hovered, setHovered] = useState(false);
  const open = useRef(0);

  useFrame((_, raw) => {
    const dt = Math.min(raw, 1 / 20);
    const k = 1 - Math.pow(0.92, dt * 60);
    // Tilt toward the pointer (eased), from a three-quarter view.
    const p = pointer.current;
    if (tilt.current) {
      tilt.current.rotation.x += (-0.26 - p.y * 0.2 - tilt.current.rotation.x) * k;
      tilt.current.rotation.y += (0.32 + p.x * 0.32 - tilt.current.rotation.y) * k;
    }
    // A slow turn about the spiral's own axis; faster while hovered.
    if (spin.current && (!reducedMotion || hovered)) spin.current.rotation.z -= dt * (hovered ? 0.22 : 0.06);
    // Fins fan open in a wave from the first to the last.
    open.current += ((hovered ? 1 : 0) - open.current) * (1 - Math.pow(0.94, dt * 60));
    fins.forEach((f, i) => {
      const m = finRefs.current[i];
      // A slight turbine twist at rest (as in the reference), more when open.
      if (m) m.rotation.x = 0.55 + 0.25 * Math.min(1, Math.max(0, open.current * 1.6 - f.t * 0.6));
    });
  });

  const scale = 3.1 / size;
  return (
    <group ref={tilt}>
      <group scale={scale}>
        <group ref={spin}>
          <group
            position={[-center.x, -center.y, 0]}
            onPointerOver={(e) => {
              e.stopPropagation();
              setHovered(true);
            }}
            onPointerOut={() => setHovered(false)}
          >
            {fins.map((f, i) => (
              // Outer group: on the spiral, local x = radial, local y = tangent.
              <group key={i} position={[Math.cos(f.angle) * f.dist, Math.sin(f.angle) * f.dist, 0]} rotation={[0, 0, f.angle]}>
                {/* The disc's axis is local y (the tangent), so its face holds the radial and z axes. */}
                <mesh
                  ref={(m) => {
                    finRefs.current[i] = m;
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

/** A few small glossy spheres drifting near the sculpture, as in the reference. */
function Droplets({ reducedMotion }: { reducedMotion: boolean }) {
  const drops: [number, number, number, number][] = [
    [-1.9, 1.05, 0.2, 0.07],
    [-1.55, 0.7, -0.3, 0.045],
    [-2.25, 0.45, 0.1, 0.035],
    [-1.25, 1.35, -0.1, 0.03],
    [1.95, 0.95, -0.2, 0.05],
    [2.2, 0.5, 0.3, 0.03],
  ];
  return (
    <>
      {drops.map(([x, y, z, r], i) => (
        <Float key={i} speed={reducedMotion ? 0 : 1 + i * 0.15} floatIntensity={reducedMotion ? 0 : 0.6} rotationIntensity={0}>
          <mesh position={[x, y, z]}>
            <sphereGeometry args={[r, 32, 32]} />
            <meshPhysicalMaterial color="#e7eef8" roughness={0.12} clearcoat={1} />
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
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      style={{ background: "transparent" }}
    >
      {/* Soft daylight: a warm sunrise key from the right, cool blue fill. */}
      <hemisphereLight args={["#eef5ff", "#cfdcee", 1.15]} />
      <directionalLight position={[0, 1, 6]} intensity={1.3} color="#ffffff" />
      <directionalLight position={[4, 3, 3]} intensity={1.8} color="#ffe4c8" />
      <directionalLight position={[-4, 1.5, 2]} intensity={1.3} color="#c6dbff" />
      <Environment resolution={256}>
        <Lightformer form="rect" intensity={2} position={[0, 4, 2]} scale={[8, 2, 1]} color="#ffffff" />
        <Lightformer form="rect" intensity={1.4} position={[5, 0, 1]} scale={[2, 6, 1]} color="#ffd9b8" />
        <Lightformer form="rect" intensity={1.2} position={[-5, 0, 1]} scale={[2, 6, 1]} color="#cfe1ff" />
      </Environment>

      <Shell pointer={pointer} reducedMotion={reducedMotion} />
      <Droplets reducedMotion={reducedMotion} />
      <ContactShadows position={[0, -1.75, 0]} opacity={0.22} scale={7} blur={2.8} far={3} color="#0b1b33" />
    </Canvas>
  );
}
