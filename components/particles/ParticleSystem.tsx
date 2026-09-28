"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import vertexShader from "@/shaders/particle.vert.glsl";
import fragmentShader from "@/shaders/particle.frag.glsl";
import {
  colorsForSequence,
  generateForm,
  monochromeColors,
  type FormName,
} from "@/lib/particles/generateTarget";
import { MorphController, createMorphGeometry, type MorphResolver } from "./MorphController";
import type { PointerState, ProgressState } from "./types";

/** How a particle system looks and moves. Every number is tunable. */
export interface ParticleLook {
  /** Point size in pixels for a particle 1 world unit from the camera. */
  particleSize: number;
  /** "form" = colours from the first form; "monochrome" = white/off-white. */
  colors: "form" | "monochrome";
  /** "spin" turns continuously; "sway" rocks gently so forms stay front-on. */
  rotation: { mode: "spin" | "sway"; speed: number; amount: number };
  wobbleAmount: number;
  /** Resting tilt of the whole system, radians. */
  baseTilt: readonly [number, number, number];
  formNoise: number;
  fieldNoise: number;
  noiseScale: number;
  curve: number;
  mouseInfluence: number;
  mouseRadius: number;
  mouseTilt: number;
  /** Small positional shift toward the pointer (world units). */
  mouseParallax: number;
  /** Fraction of the gap closed toward a target per frame at 60fps. */
  damping: number;
  /** Multiplier applied to motion, scatter and curves under reduced motion. */
  reducedMotionFactor: number;
  cameraZ: number;
}

interface ParticleSystemProps {
  forms: readonly FormName[];
  count: number;
  look: ParticleLook;
  resolve: MorphResolver;
  /** The driving value (scroll), written by GSAP, read here every frame. */
  progress: RefObject<ProgressState>;
  pointer: RefObject<PointerState>;
  offset: readonly [number, number, number];
  scale: number;
  scatter: number;
  pixelRatio: number;
  reducedMotion: boolean;
}

export interface MorphUniforms {
  [uniform: string]: THREE.IUniform;
  uTime: THREE.IUniform<number>;
  uProgress: THREE.IUniform<number>;
  uSize: THREE.IUniform<number>;
  uPixelRatio: THREE.IUniform<number>;
  uMotion: THREE.IUniform<number>;
  uScatter: THREE.IUniform<number>;
  uCurve: THREE.IUniform<number>;
  uFormNoise: THREE.IUniform<number>;
  uFieldNoise: THREE.IUniform<number>;
  uNoiseScale: THREE.IUniform<number>;
  uMouseInfluence: THREE.IUniform<number>;
  uMouseRadius: THREE.IUniform<number>;
  uFocusDepth: THREE.IUniform<number>;
  uMouse: THREE.IUniform<THREE.Vector3>;
}

/** Anywhere far from the particles, so the pointer push is off. */
const MOUSE_PARKED = new THREE.Vector3(100, 100, 100);

function uniformsOf(points: THREE.Points): MorphUniforms {
  return (points.material as THREE.ShaderMaterial).uniforms as MorphUniforms;
}

/** Frame-rate independent version of "close `damping` of the gap per frame". */
function dampFactor(damping: number, delta: number): number {
  return 1 - Math.pow(1 - damping, delta * 60);
}

/**
 * One THREE.Points whose particles physically morph between `forms`. All
 * per-particle motion is in the vertex shader; this component only feeds it
 * the morph progress, time, pointer and rotation.
 */
export function ParticleSystem({
  forms: formNames,
  count,
  look,
  resolve,
  progress,
  pointer,
  offset,
  scale,
  scatter,
  pixelRatio,
  reducedMotion,
}: ParticleSystemProps) {
  const rootRef = useRef<THREE.Group>(null);
  const tiltRef = useRef<THREE.Group>(null);
  const pointsRef = useRef<THREE.Points>(null);

  const motion = reducedMotion ? look.reducedMotionFactor : 1;

  // Every form is sampled once per mount with the same particle count.
  const { geometry, forms } = useMemo(() => {
    const forms = formNames.map((name, i) => generateForm(name, count, 101 + i * 7919));
    const colors = look.colors === "monochrome" ? monochromeColors(count) : colorsForSequence(formNames[0], forms[0]);
    return { geometry: createMorphGeometry(forms, colors), forms };
  }, [formNames, count, look.colors]);

  const material = useMemo(() => {
    const uniforms: MorphUniforms = {
      uTime: { value: 0 },
      uProgress: { value: 0 },
      uSize: { value: look.particleSize },
      uPixelRatio: { value: 1 },
      uMotion: { value: 1 },
      uScatter: { value: 1 },
      uCurve: { value: look.curve },
      uFormNoise: { value: look.formNoise },
      uFieldNoise: { value: look.fieldNoise },
      uNoiseScale: { value: look.noiseScale },
      uMouseInfluence: { value: look.mouseInfluence },
      uMouseRadius: { value: look.mouseRadius },
      uFocusDepth: { value: look.cameraZ },
      uMouse: { value: MOUSE_PARKED.clone() },
    };
    return new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, [look]);

  // Plain object held in a ref: the controller mutates geometry attributes.
  const controllerRef = useRef<MorphController | null>(null);
  useEffect(() => {
    controllerRef.current = new MorphController(geometry, forms, resolve);
    return () => {
      controllerRef.current = null;
    };
  }, [geometry, forms, resolve]);

  // Settings that change rarely go into uniforms here, reached through the
  // ref so React never sees a hook value being mutated.
  useEffect(() => {
    const points = pointsRef.current;
    if (!points) return;
    const u = uniformsOf(points);
    u.uPixelRatio.value = pixelRatio;
    u.uMotion.value = motion;
    u.uScatter.value = scatter * (reducedMotion ? 0.35 : 1);
    u.uCurve.value = look.curve * (reducedMotion ? 0.2 : 1);
    u.uMouseInfluence.value = reducedMotion ? 0 : look.mouseInfluence;
  }, [pixelRatio, motion, scatter, reducedMotion, look]);

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);

  // Scratch objects reused every frame so the loop allocates nothing.
  const scratch = useRef({
    ndc: new THREE.Vector2(),
    smoothNdc: new THREE.Vector2(),
    raycaster: new THREE.Raycaster(),
    plane: new THREE.Plane(new THREE.Vector3(0, 0, 1), 0),
    hit: new THREE.Vector3(),
    center: new THREE.Vector3(),
    smoothProgress: 0,
    spin: 0,
  });

  useFrame((state, rawDelta) => {
    const root = rootRef.current;
    const tilt = tiltRef.current;
    const points = pointsRef.current;
    const controller = controllerRef.current;
    if (!root || !tilt || !points || !controller) return;
    const s0 = scratch.current;

    // Clamp so a long tab-switch pause doesn't cause a jump.
    const delta = Math.min(rawDelta, 1 / 20);
    const u = uniformsOf(points);
    u.uTime.value += delta;
    const time = u.uTime.value;

    const k = dampFactor(look.damping, delta);

    // --- morph: driving value → (form pair, transition progress) ----------
    // Eased again on top of GSAP's scrub so fast wheel flicks stay smooth.
    s0.smoothProgress += (progress.current.value - s0.smoothProgress) * k;
    u.uProgress.value = controller.update(s0.smoothProgress);

    // --- pointer: eased tilt/parallax, never mapped 1:1 -------------------
    const p = pointer.current;
    s0.smoothNdc.x += ((p.active ? p.x : 0) - s0.smoothNdc.x) * k;
    s0.smoothNdc.y += ((p.active ? p.y : 0) - s0.smoothNdc.y) * k;
    const tiltAmount = look.mouseTilt * (reducedMotion ? 0.25 : 1);
    tilt.rotation.set(
      look.baseTilt[0] - s0.smoothNdc.y * tiltAmount,
      look.baseTilt[1] + s0.smoothNdc.x * tiltAmount,
      look.baseTilt[2],
    );
    root.position.set(
      offset[0] + s0.smoothNdc.x * look.mouseParallax * motion,
      offset[1] + s0.smoothNdc.y * look.mouseParallax * 0.7 * motion,
      offset[2],
    );

    // --- rotation: continuous spin, or a gentle sway that keeps forms ----
    // --- facing the viewer; plus a faint wobble ---------------------------
    const wobble = look.wobbleAmount * motion;
    let yaw: number;
    if (look.rotation.mode === "spin") {
      s0.spin += delta * look.rotation.speed * motion;
      yaw = s0.spin;
    } else {
      yaw = Math.sin(time * look.rotation.speed) * look.rotation.amount * motion;
    }
    points.rotation.set(Math.sin(time * 0.13) * wobble, yaw, Math.cos(time * 0.11) * wobble * 0.6);

    // --- pointer position in the particles' own space ---------------------
    if (p.active && !reducedMotion && look.mouseInfluence > 0) {
      root.getWorldPosition(s0.center);
      s0.plane.constant = -s0.center.z;
      s0.ndc.set(s0.smoothNdc.x, s0.smoothNdc.y);
      s0.raycaster.setFromCamera(s0.ndc, state.camera);
      if (s0.raycaster.ray.intersectPlane(s0.plane, s0.hit)) {
        u.uMouse.value.copy(points.worldToLocal(s0.hit));
      }
    } else {
      u.uMouse.value.copy(MOUSE_PARKED);
    }
  });

  return (
    <group ref={rootRef} position={[offset[0], offset[1], offset[2]]} scale={scale}>
      <group ref={tiltRef} rotation={[look.baseTilt[0], look.baseTilt[1], look.baseTilt[2]]}>
        <points ref={pointsRef} geometry={geometry} material={material} frustumCulled={false} />
      </group>
    </group>
  );
}
