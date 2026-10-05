"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useReducedMotion } from "@/themes/core/hooks/device";
import { cloud, rocket, satellite, settle, type Form } from "./forms";

/**
 * The light theme's one continuous 3D scene (after the owner's reference
 * video frames): glossy beads that form a rocket, burst into a floating cloud,
 * re-form as a satellite, and so on down the page. One THREE.Points draw call;
 * each bead is shaded as a small lit sphere and blurs with its distance from
 * the focal plane (a cheap depth of field). Scroll picks the stage: a form
 * holds while its section fills the screen, and across each section edge
 * every bead flies from its place in one form to its place in the next,
 * scattering through space on the way.
 */

/** Section anchors, in order, and the form each holds. */
const ANCHORS = [
  "[data-hero]",
  "#services",
  "#staffing",
  'section[aria-labelledby="why-title"]',
  'section[aria-labelledby="process-title"]',
  "#about",
  "#contact",
];

type Place =
  | { kind: "object"; shape: "rocket" | "satellite"; cx: number; cy: number; h: number; rot: [number, number, number]; idle: "bob" | "spin" }
  | { kind: "field"; shape: "cloud" | "settle"; seed: number; spread: number };

function stagePlaces(wide: boolean): Place[] {
  return [
    // Hero: the rocket on the right, nose up and to the left.
    wide
      ? { kind: "object", shape: "rocket", cx: 0.5, cy: -0.02, h: 0.8, rot: [0.2, -0.5, 0.55], idle: "bob" }
      : { kind: "object", shape: "rocket", cx: 0.05, cy: 0.42, h: 0.42, rot: [0.2, -0.5, 0.55], idle: "bob" },
    // Services: it bursts into a floating cloud of beads.
    { kind: "field", shape: "cloud", seed: 101, spread: 1 },
    // Staffing: a satellite forms at the right edge.
    wide
      ? { kind: "object", shape: "satellite", cx: 0.72, cy: 0.1, h: 0.62, rot: [0.35, -0.6, -0.25], idle: "spin" }
      : { kind: "object", shape: "satellite", cx: 0, cy: 0.5, h: 0.32, rot: [0.35, -0.6, -0.25], idle: "spin" },
    // Why: a looser cloud.
    { kind: "field", shape: "cloud", seed: 202, spread: 1.12 },
    // How we work: the satellite again, on the left.
    wide
      ? { kind: "object", shape: "satellite", cx: -0.8, cy: -0.1, h: 0.5, rot: [0.3, 0.7, 0.3], idle: "spin" }
      : { kind: "object", shape: "satellite", cx: 0, cy: 0.5, h: 0.32, rot: [0.3, 0.7, 0.3], idle: "spin" },
    // About: the rocket on the left, nose up and to the right.
    wide
      ? { kind: "object", shape: "rocket", cx: -0.9, cy: -0.05, h: 0.58, rot: [0.2, 0.5, -0.5], idle: "bob" }
      : { kind: "object", shape: "rocket", cx: -0.05, cy: 0.45, h: 0.38, rot: [0.2, 0.5, -0.5], idle: "bob" },
    // Contact: the beads come to rest along the bottom.
    { kind: "field", shape: "settle", seed: 0, spread: 1 },
  ];
}

const MORPH_BAND = 0.25;

// Scratch objects for the per-frame maths (one scene, so module scope is safe).
const TMP = { va: new THREE.Vector3(), vb: new THREE.Vector3(), m: new THREE.Matrix4(), e: new THREE.Euler() };
const smooth = (t: number) => t * t * (3 - 2 * t);
const easeIO = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp01 = (x: number) => Math.min(Math.max(x, 0), 1);

/** Where the page is in the stage sequence: 2.4 = 40% of the way from stage 2 to 3. */
function readStage(anchors: (HTMLElement | null)[], vh: number): number {
  const centre = vh / 2;
  for (let i = 0; i < anchors.length - 1; i++) {
    const a = anchors[i];
    const b = anchors[i + 1];
    if (!a || !b) continue;
    const start = a.getBoundingClientRect().bottom - MORPH_BAND * vh;
    const end = b.getBoundingClientRect().top + MORPH_BAND * vh;
    const p = (start - centre) / (start - end);
    if (p < 1) return i + Math.max(0, p);
  }
  return anchors.length - 1;
}

const vertexShader = /* glsl */ `
uniform float uScale;      // px per world unit at distance 1
uniform float uFocus;      // focal distance
uniform float uDof;        // blur per unit of distance from focus
attribute float aSize;     // bead radius (world)
attribute vec3 aColor;
varying vec3 vColor;
varying float vCore;       // 1 = in focus … small = blurred
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  float dist = max(-mv.z, 0.1);
  float blur = clamp(abs(dist - uFocus) * uDof, 0.0, 3.0);
  vCore = 1.0 / (1.0 + blur);
  vColor = aColor;
  gl_PointSize = max(2.0 * aSize * uScale / dist * (1.0 + blur), 1.0);
  gl_Position = projectionMatrix * mv;
}
`;

const fragmentShader = /* glsl */ `
varying vec3 vColor;
varying float vCore;
void main() {
  vec2 pc = gl_PointCoord * 2.0 - 1.0;
  pc.y = -pc.y;
  float r = length(pc);
  if (r > 1.0) discard;
  // The bead fills vCore of the sprite; the rest is its blur.
  float k = vCore;
  vec2 n2 = pc / max(k, 0.001);
  float rr = min(dot(n2, n2), 1.0);
  vec3 n = vec3(n2, sqrt(1.0 - rr));
  vec3 L = normalize(vec3(-0.5, 0.65, 0.6));
  float diff = max(dot(n, L), 0.0);
  float spec = pow(max(dot(reflect(-L, n), vec3(0.0, 0.0, 1.0)), 0.0), 28.0);
  vec3 col = vColor * (0.5 + 0.62 * diff) + vec3(1.0) * spec * 0.4;
  // Blurred beads lose their shading and become soft discs.
  col = mix(vColor * 0.95, col, k * k);
  float soft = 0.04 + 0.95 * (1.0 - k);
  float alpha = 1.0 - smoothstep(max(k - soft, 0.0), min(k + soft, 1.0), r);
  alpha *= mix(0.5, 1.0, k);
  gl_FragColor = vec4(col, alpha);
}
`;

// A soft shadow on the "page" under an object.
const shadowVert = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;
const shadowFrag = /* glsl */ `
uniform float uOpacity;
varying vec2 vUv;
void main() {
  vec2 p = vUv * 2.0 - 1.0;
  float a = exp(-dot(p, p) * 3.2) * uOpacity;
  gl_FragColor = vec4(0.06, 0.09, 0.16, a);
}
`;

function Beads({ count, reducedMotion }: { count: number; reducedMotion: boolean }) {
  const { viewport, size } = useThree();
  const W = viewport.width;
  const H = viewport.height;
  const wide = size.width >= 1024;

  const places = useMemo(() => stagePlaces(wide), [wide]);
  const forms = useMemo(() => {
    const cache: Partial<Record<string, Form>> = {};
    return places.map((pl) => {
      const key = pl.kind === "object" ? pl.shape : `${pl.shape}-${pl.seed}-${pl.spread}`;
      if (!cache[key]) {
        cache[key] =
          pl.kind === "object"
            ? pl.shape === "rocket"
              ? rocket(count)
              : satellite(count)
            : pl.shape === "settle"
              ? settle(count)
              : cloud(count, pl.seed, pl.spread);
      }
      return cache[key]!;
    });
  }, [places, count]);

  // Per-bead randomness: morph delay, scatter direction, idle drift phase.
  const rand = useMemo(() => {
    const delay = new Float32Array(count);
    const dir = new Float32Array(count * 3);
    const phase = new Float32Array(count);
    let s = 9;
    const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < count; i++) {
      delay[i] = r() * 0.45;
      const z = r() * 2 - 1;
      const a = r() * Math.PI * 2;
      const q = Math.sqrt(1 - z * z);
      dir.set([q * Math.cos(a), q * Math.sin(a), z], i * 3);
      phase[i] = r() * Math.PI * 2;
    }
    return { delay, dir, phase };
  }, [count]);

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute("aColor", new THREE.BufferAttribute(new Float32Array(count * 3), 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute("aSize", new THREE.BufferAttribute(new Float32Array(count), 1).setUsage(THREE.DynamicDrawUsage));
    const index = new Uint32Array(count);
    for (let i = 0; i < count; i++) index[i] = i;
    g.setIndex(new THREE.BufferAttribute(index, 1).setUsage(THREE.DynamicDrawUsage));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e4);
    return g;
  }, [count]);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uScale: { value: 1 }, uFocus: { value: 14 }, uDof: { value: 0.32 } },
        vertexShader,
        fragmentShader,
        transparent: true,
        depthTest: false,
        depthWrite: false,
      }),
    [],
  );
  const shadowMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uOpacity: { value: 0 } },
        vertexShader: shadowVert,
        fragmentShader: shadowFrag,
        transparent: true,
        depthTest: false,
        depthWrite: false,
      }),
    [],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);
  useEffect(() => () => shadowMat.dispose(), [shadowMat]);

  const anchors = useRef<(HTMLElement | null)[]>([]);
  useEffect(() => {
    anchors.current = ANCHORS.map((sel) => document.querySelector<HTMLElement>(sel));
  }, []);
  const pointer = useRef(new THREE.Vector2());
  useEffect(() => {
    const onMove = (e: PointerEvent) =>
      pointer.current.set((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1));
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  const stage = useRef(-1);
  const time = useRef(0);
  const shadow = useRef<THREE.Mesh>(null);
  // Depth keys for sorting, kept per frame (resized with the bead count).
  const depthKeys = useRef<Float32Array | null>(null);

  /** World position of bead i in place `pl` (form f) at time t, written to out. */
  const place = (pl: Place, f: Form, i: number, t: number, out: THREE.Vector3) => {
    const o = i * 3;
    if (pl.kind === "field") {
      const ph = rand.phase[i];
      const drift = reducedMotion ? 0 : 1;
      out.set(
        f.pos[o] * (W / 2) + Math.sin(t * 0.22 + ph) * 0.12 * drift,
        f.pos[o + 1] * (H / 2) + Math.cos(t * 0.18 + ph * 1.3) * 0.15 * drift,
        f.pos[o + 2],
      );
      return (H / 7.6) * f.size[i];
    }
    const sc = pl.h * H;
    const idle = reducedMotion ? 0 : 1;
    const spin = pl.idle === "spin" ? t * 0.18 * idle : Math.sin(t * 0.5) * 0.08 * idle;
    TMP.e.set(pl.rot[0] + Math.sin(t * 0.3) * 0.04 * idle, pl.rot[1] + spin, pl.rot[2]);
    TMP.m.makeRotationFromEuler(TMP.e);
    out.set(f.pos[o], f.pos[o + 1] - 0.4, f.pos[o + 2]).applyMatrix4(TMP.m).multiplyScalar(sc);
    out.x += pl.cx * (W / 2);
    out.y += pl.cy * (H / 2) + (pl.idle === "bob" ? Math.sin(t * 0.8) * 0.06 * idle : 0);
    return sc * f.size[i];
  };

  const points = useRef<THREE.Points>(null);

  useFrame((state, raw) => {
    const pts = points.current;
    const shadowMesh = shadow.current;
    if (!pts || !shadowMesh) return;
    const geo = pts.geometry;
    const mat = pts.material as THREE.ShaderMaterial;
    const sMat = shadowMesh.material as THREE.ShaderMaterial;
    const dt = Math.min(raw, 1 / 20);
    time.current += dt;
    const t = time.current;

    const target = readStage(anchors.current, size.height);
    stage.current = stage.current < 0 ? target : stage.current + (target - stage.current) * (1 - Math.pow(0.9, dt * 60));
    const s = stage.current;
    const a = Math.min(Math.floor(s), places.length - 1);
    const b = Math.min(a + 1, places.length - 1);
    const m = smooth(clamp01(s - a));
    const A = places[a], B = places[b];
    const FA = forms[a], FB = forms[b];

    const pos = geo.attributes.position.array as Float32Array;
    const col = geo.attributes.aColor.array as Float32Array;
    const siz = geo.attributes.aSize.array as Float32Array;
    const va = TMP.va;
    const vb = TMP.vb;
    if (!depthKeys.current || depthKeys.current.length !== count) depthKeys.current = new Float32Array(count);
    const z = depthKeys.current;
    const scatter = reducedMotion ? 0.4 : 1.7;
    for (let i = 0; i < count; i++) {
      const ra = place(A, FA, i, t, va);
      const rb = place(B, FB, i, t, vb);
      const e = easeIO(clamp01((m - rand.delay[i]) / 0.55));
      const fly = Math.sin(Math.PI * e) * scatter;
      const o = i * 3;
      pos[o] = va.x + (vb.x - va.x) * e + rand.dir[o] * fly;
      pos[o + 1] = va.y + (vb.y - va.y) * e + rand.dir[o + 1] * fly;
      pos[o + 2] = va.z + (vb.z - va.z) * e + rand.dir[o + 2] * fly * 1.4 + fly * 0.6;
      col[o] = FA.col[o] + (FB.col[o] - FA.col[o]) * e;
      col[o + 1] = FA.col[o + 1] + (FB.col[o + 1] - FA.col[o + 1]) * e;
      col[o + 2] = FA.col[o + 2] + (FB.col[o + 2] - FA.col[o + 2]) * e;
      siz[i] = ra + (rb - ra) * e;
      z[i] = pos[o + 2];
    }
    // Far beads first, so near ones always cover them.
    const index = geo.index!.array as Uint32Array;
    Array.prototype.sort.call(index, (p: number, q: number) => z[p] - z[q]);
    geo.index!.needsUpdate = true;
    geo.attributes.position.needsUpdate = true;
    geo.attributes.aColor.needsUpdate = true;
    geo.attributes.aSize.needsUpdate = true;

    // Camera: a slow push-in through each transition and a light pointer lean.
    const cam = state.camera as THREE.PerspectiveCamera;
    const frac = s - Math.floor(s);
    const p = reducedMotion ? new THREE.Vector2() : pointer.current;
    const k = 1 - Math.pow(0.95, dt * 60);
    cam.position.x += (p.x * 0.35 - cam.position.x) * k;
    cam.position.y += (p.y * 0.22 - cam.position.y) * k;
    cam.position.z = 12 - (reducedMotion ? 0 : Math.sin(Math.PI * frac) * 0.9);
    cam.lookAt(0, 0, 0);
    mat.uniforms.uScale.value = (size.height * Math.min(window.devicePixelRatio || 1, 1.75)) / (2 * Math.tan((cam.fov * Math.PI) / 360));
    mat.uniforms.uFocus.value = cam.position.z;

    // The object's shadow on the page.
    const objA = A.kind === "object" ? 1 - m : 0;
    const objB = B.kind === "object" ? m : 0;
    const host = objA >= objB ? A : B;
    if (host.kind === "object") {
      shadowMesh.position.set(host.cx * (W / 2) + host.h * H * 0.12, host.cy * (H / 2) - host.h * H * 0.55, -1.5);
      shadowMesh.scale.set(host.h * H * 0.9, host.h * H * 0.22, 1);
    }
    sMat.uniforms.uOpacity.value = 0.12 * Math.max(objA, objB) ** 2;
  });

  return (
    <>
      <mesh ref={shadow} material={shadowMat} renderOrder={-1}>
        <planeGeometry args={[1, 1]} />
      </mesh>
      <points ref={points} geometry={geometry} material={material} frustumCulled={false} />
    </>
  );
}

export default function BeadScene() {
  const reducedMotion = useReducedMotion();
  const count = useMemo(() => {
    if (typeof window === "undefined") return 3000;
    const w = window.innerWidth;
    return w < 640 ? 1800 : w < 1024 ? 2800 : 4200;
  }, []);
  return (
    <Canvas
      flat
      linear
      dpr={[1, 1.75]}
      camera={{ fov: 35, position: [0, 0, 12] }}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      style={{ background: "transparent" }}
    >
      <Beads count={count} reducedMotion={reducedMotion} />
    </Canvas>
  );
}
