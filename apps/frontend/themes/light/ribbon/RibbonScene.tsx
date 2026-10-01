"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { useReducedMotion } from "@/themes/core/hooks/device";
import { EYE, FORMS, type Vec3 } from "./forms";

/**
 * The light design's one object, drawn once for the whole page: a blue
 * ribbed square duct of thin rounded-square slats (one InstancedMesh, one draw call). Scroll
 * picks the form: each section anchor holds its form while it is on screen,
 * and the gap between two anchors morphs one form into the next (every fin
 * glides from its place in one shape to its place in the other, with a
 * slight swell toward the camera mid-way). The fins also slide slowly along
 * the tube, and the whole object leans with the pointer.
 */

/** Section anchors, in the same order as FORMS. */
const ANCHORS = [
  "[data-hero]",
  "#services",
  "#staffing",
  'section[aria-labelledby="why-title"]',
  'section[aria-labelledby="process-title"]',
  "#about",
  "#contact",
];

/** Fraction of the viewport over which one form morphs into the next, either side of a section edge. */
const MORPH_BAND = 0.35;

/** How large each square slat is relative to the tube radius of its form. */
const SLAT = 1.25;

const smooth = (t: number) => t * t * (3 - 2 * t);
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Where the page is in the form sequence: 2.4 = 40% of the way from form 2 to form 3. */
function readStage(anchors: (HTMLElement | null)[], vh: number): number {
  const centre = vh / 2;
  for (let i = 0; i < anchors.length - 1; i++) {
    const a = anchors[i];
    const b = anchors[i + 1];
    if (!a || !b) continue;
    const start = a.getBoundingClientRect().bottom - MORPH_BAND * vh;
    const end = b.getBoundingClientRect().top + MORPH_BAND * vh;
    // Scrolling moves both edges up past the screen centre.
    const p = (start - centre) / (start - end);
    if (p < 1) return i + Math.max(0, p);
  }
  return anchors.length - 1;
}

function Tube({ count, reducedMotion }: { count: number; reducedMotion: boolean }) {
  const { viewport, size } = useThree();
  const W = viewport.width;
  const H = viewport.height;
  const wide = size.width / size.height > 0.9;

  const mesh = useRef<THREE.InstancedMesh>(null);
  const sphere = useRef<THREE.Mesh>(null);
  const group = useRef<THREE.Group>(null);

  // Each fin is a flat square slat with softly rounded corners (as in the
  // reference), 2 × 2 across and 1 thick before scaling.
  const geometry = useMemo(() => new RoundedBoxGeometry(2, 1, 2, 4, 0.3), []);
  const material = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#ffffff", // tinted per fin by instance colours
        roughness: 0.3,
        metalness: 0.05,
        clearcoat: 0.6,
        clearcoatRoughness: 0.25,
        envMapIntensity: 1.1,
      }),
    [],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);

  // Fin colours: a refined, light blue range along the tube (the PDF's #2563EB … #60A5FA, lifted).
  useEffect(() => {
    const m = mesh.current;
    if (!m) return;
    const deep = new THREE.Color("#2f6fe6");
    const mid = new THREE.Color("#4b8df5");
    const light = new THREE.Color("#7fb3fa");
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const t = 0.5 + 0.5 * Math.sin((i / count) * Math.PI * 4);
      c.copy(deep).lerp(mid, Math.min(1, t * 2)).lerp(light, Math.max(0, t * 2 - 1));
      m.setColorAt(i, c);
    }
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [count]);

  // Fin thickness per form: about half the gap between fins on that form.
  const thickness = useMemo(
    () =>
      FORMS.map((f) => {
        let len = 0;
        let prev = f.at(0, W, H, wide);
        for (let k = 1; k <= 200; k++) {
          const p = f.at(k / 200, W, H, wide);
          len += Math.hypot(p[0] - prev[0], p[1] - prev[1], p[2] - prev[2]);
          prev = p;
        }
        return Math.min(Math.max((len / count) * 0.5, 0.003 * H), 0.05 * H);
      }),
    [W, H, wide, count],
  );

  const anchors = useRef<(HTMLElement | null)[]>([]);
  useEffect(() => {
    anchors.current = ANCHORS.map((s) => document.querySelector<HTMLElement>(s));
  }, []);

  const pointer = useRef(new THREE.Vector2());
  useEffect(() => {
    const onMove = (e: PointerEvent) =>
      pointer.current.set((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1));
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  const stage = useRef(-1);
  const flow = useRef(0);
  const spin = useRef(0);
  const tmp = useMemo(
    () => ({
      m: new THREE.Matrix4(),
      q: new THREE.Quaternion(),
      p: new THREE.Vector3(),
      s: new THREE.Vector3(),
      t: new THREE.Vector3(),
      x: new THREE.Vector3(),
      x2: new THREE.Vector3(),
      z: new THREE.Vector3(),
      view: new THREE.Vector3(0, 0, 1),
      basis: new THREE.Matrix4(),
    }),
    [],
  );

  useFrame((_, raw) => {
    const m = mesh.current;
    if (!m) return;
    const dt = Math.min(raw, 1 / 20);

    // Scroll → stage, eased so a fast scroll still glides.
    const target = readStage(anchors.current, size.height);
    stage.current = stage.current < 0 ? target : stage.current + (target - stage.current) * (1 - Math.pow(0.9, dt * 60));
    const s = stage.current;
    const a = Math.min(Math.floor(s), FORMS.length - 1);
    const b = Math.min(a + 1, FORMS.length - 1);
    const e = ease(smooth(s - a));
    const A = FORMS[a];
    const B = FORMS[b];
    const swell = Math.sin(Math.PI * e) * 1.4; // mid-morph, the tube drifts toward the camera
    const R = A.radius(W, H, wide) * (1 - e) + B.radius(W, H, wide) * e;
    const T = thickness[a] * (1 - e) + thickness[b] * e;

    if (!reducedMotion) flow.current = (flow.current + dt * 0.006) % 1;
    // Constant rotation of the square slats about the tube's own axis (as in
    // the reference), a little faster while the page is scrolling.
    if (!reducedMotion) spin.current += dt * (0.45 + Math.min(2, Math.abs(target - s) * 6));
    const pt = (u: number, out: Vec3) => {
      const pa = A.at(u, W, H, wide);
      const pb = B.at(u, W, H, wide);
      out[0] = pa[0] + (pb[0] - pa[0]) * e;
      out[1] = pa[1] + (pb[1] - pa[1]) * e;
      out[2] = pa[2] + (pb[2] - pa[2]) * e + swell;
      return out;
    };
    const p0: Vec3 = [0, 0, 0];
    const p1: Vec3 = [0, 0, 0];
    const p2: Vec3 = [0, 0, 0];
    const d = 0.5 / count;

    for (let i = 0; i < count; i++) {
      const u = (i / count + flow.current) % 1;
      pt(u, p0);
      pt(Math.max(0, u - d), p1);
      pt(Math.min(1, u + d), p2);
      tmp.t.set(p2[0] - p1[0], p2[1] - p1[1], p2[2] - p1[2]).normalize();
      // Square frame: the slat's thickness runs along the tube; it starts
      // with a flat side to the viewer and then spins (below).
      tmp.x.crossVectors(tmp.t, tmp.view);
      if (tmp.x.lengthSq() < 1e-6) tmp.x.set(1, 0, 0);
      tmp.x.normalize();
      tmp.z.crossVectors(tmp.x, tmp.t).normalize();
      // Spin each slat about the tangent; the phase steps along the tube so
      // the rotation ripples down it.
      const ang = spin.current + u * Math.PI * 3;
      const c = Math.cos(ang);
      const sn = Math.sin(ang);
      tmp.x2.copy(tmp.x).multiplyScalar(c).addScaledVector(tmp.z, sn);
      tmp.z.multiplyScalar(c).addScaledVector(tmp.x, -sn);
      tmp.basis.makeBasis(tmp.x2, tmp.t, tmp.z);
      tmp.q.setFromRotationMatrix(tmp.basis);
      // The ends taper to nothing, so a fin wrapping from one end to the other is never seen.
      const end = smooth(Math.min(1, u / 0.05)) * smooth(Math.min(1, (1 - u) / 0.05));
      // Slats a little larger than the tube path needs (owner: "square a bit bigger").
      tmp.s.set(R * SLAT * end, T * end, R * SLAT * end);
      tmp.p.set(p0[0], p0[1], p0[2]);
      tmp.m.compose(tmp.p, tmp.q, tmp.s);
      m.setMatrixAt(i, tmp.m);
    }
    m.instanceMatrix.needsUpdate = true;

    // The Contact eye's glass sphere grows in with the eye.
    const eyeW = a === EYE ? 1 : b === EYE ? e : 0;
    if (sphere.current) {
      sphere.current.visible = eyeW > 0.01;
      sphere.current.scale.setScalar(Math.max(0.001, eyeW) * 0.06 * H);
    }

    // Camera-like lean toward the pointer.
    if (group.current && !reducedMotion) {
      const k = 1 - Math.pow(0.95, dt * 60);
      group.current.rotation.y += (pointer.current.x * 0.06 - group.current.rotation.y) * k;
      group.current.rotation.x += (-pointer.current.y * 0.04 - group.current.rotation.x) * k;
    }
  });

  return (
    <group ref={group}>
      <instancedMesh ref={mesh} args={[geometry, material, count]} frustumCulled={false} />
      <mesh ref={sphere} position={[0, 0.02 * H, -6]} visible={false}>
        <sphereGeometry args={[1, 48, 48]} />
        <meshPhysicalMaterial color="#dbeafe" roughness={0.05} clearcoat={1} envMapIntensity={1.6} />
      </mesh>
    </group>
  );
}

export default function RibbonScene() {
  const reducedMotion = useReducedMotion();
  // Fewer fins on small screens.
  const count = useMemo(() => (typeof window !== "undefined" && window.innerWidth < 768 ? 110 : 180), []);
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ fov: 35, position: [0, 0, 10] }}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance", toneMapping: THREE.NeutralToneMapping }}
      style={{ background: "transparent" }}
    >
      {/* Daylight: soft white from above, a cool blue bounce from below, a
          key from the upper left and a rim from behind for the slat highlights. */}
      <hemisphereLight args={["#ffffff", "#bcd3f5", 1.1]} />
      <directionalLight position={[-4, 5, 6]} intensity={1.6} color="#ffffff" />
      <directionalLight position={[3, 2, -5]} intensity={1.3} color="#e6f0ff" />
      <Environment resolution={256}>
        <Lightformer form="rect" intensity={2.4} position={[0, 5, 3]} scale={[10, 2, 1]} color="#ffffff" />
        <Lightformer form="rect" intensity={1.2} position={[-6, 0, 2]} scale={[2, 8, 1]} color="#dbeafe" />
        <Lightformer form="rect" intensity={1.2} position={[6, 0, 2]} scale={[2, 8, 1]} color="#ffffff" />
        <Lightformer form="rect" intensity={0.8} position={[0, -5, 2]} scale={[10, 2, 1]} color="#93c5fd" />
      </Environment>
      <Tube count={count} reducedMotion={reducedMotion} />
    </Canvas>
  );
}
