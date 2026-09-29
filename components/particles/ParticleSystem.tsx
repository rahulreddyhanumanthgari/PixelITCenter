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
  stageDataFor,
  type FormName,
} from "@/lib/particles/generateTarget";
import { MorphController, createMorphGeometry, resolveFormPosition } from "./MorphController";
import { PALETTE_LINEAR } from "@/lib/particles/palette";
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

export interface Placement {
  x: number;
  y: number;
  scale: number;
}

/**
 * Where the system sits, written by the scene (from page layout) and read
 * here every frame. `from` applies before the handoff, `to` after it; the
 * system glides between them during the handoff transition.
 */
export interface LayoutState {
  from: Placement;
  to: Placement;
  /**
   * Optional alternating composition after the handoff: world x of the left
   * and right slots, and which slot (0 = left, 1 = right) each form after the
   * handoff uses. The system glides between slots during each transition.
   * Null = always `to.x`.
   */
  sides: { left: number; right: number; byForm: readonly number[] } | null;
  /**
   * Hero text box in NDC (centre x/y, half-size x/y); particles behind it are
   * dimmed to `protectFloor` while the hero field is showing.
   */
  protect: [number, number, number, number];
  protectFloor: number;
  /** Services content box in NDC; particles behind it dim on the ring stream. */
  protect2: [number, number, number, number];
  /** Staffing content box in NDC; Earth particles behind it dim. */
  protect3: [number, number, number, number];
  /** Extra display scale for the Staffing Earth (larger on desktop). */
  earthScale: number;
  /** Why content box in NDC; node-symbol particles behind it dim. */
  protect4: [number, number, number, number];
}

interface ParticleSystemProps {
  forms: readonly FormName[];
  count: number;
  /** Look before the handoff… */
  look: ParticleLook;
  /** …and after it (defaults to `look`). */
  lookTo?: ParticleLook;
  /** Form position where the handoff transition starts (it lasts one form). */
  handoffAt: number;
  layout: RefObject<LayoutState>;
  /** Form position (0 = first form, 1 = second…), written by GSAP. */
  progress: RefObject<ProgressState>;
  pointer: RefObject<PointerState>;
  scatter: number;
  pixelRatio: number;
  reducedMotion: boolean;
  /** Called every frame with the handoff blend (0 = `look`, 1 = `lookTo`). */
  onBlend?: (blend: number, field: number) => void;
  /**
   * Step progress for a stepped form (the process path): 0 = first step
   * active … N = all steps done. Written by the section's scroll triggers.
   */
  stage?: RefObject<ProgressState>;
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
  uStage: THREE.IUniform<number>;
  uStageMix: THREE.IUniform<number>;
  uAccent: THREE.IUniform<THREE.Color>;
  uHeroField: THREE.IUniform<number>;
  uFlowFrom: THREE.IUniform<number>;
  uFlowTo: THREE.IUniform<number>;
  uProtect2: THREE.IUniform<THREE.Vector4>;
  uProtect3: THREE.IUniform<THREE.Vector4>;
  uEarthScale: THREE.IUniform<number>;
  uProtect4: THREE.IUniform<THREE.Vector4>;
  uProtect: THREE.IUniform<THREE.Vector4>;
  uProtectFloor: THREE.IUniform<number>;
}

/** Anywhere far from the particles, so the pointer push is off. */
const MOUSE_PARKED = new THREE.Vector3(100, 100, 100);
const TAU = Math.PI * 2;

function uniformsOf(points: THREE.Points): MorphUniforms {
  return (points.material as THREE.ShaderMaterial).uniforms as MorphUniforms;
}

/** Frame-rate independent version of "close `damping` of the gap per frame". */
function dampFactor(damping: number, delta: number): number {
  return 1 - Math.pow(1 - damping, delta * 60);
}

const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (t: number) => t * t * (3 - 2 * t);

/**
 * One THREE.Points whose particles physically morph between `forms`. All
 * per-particle motion is in the vertex shader; this component only feeds it
 * the morph progress, time, pointer, placement and rotation.
 */
export function ParticleSystem({
  forms: formNames,
  count,
  look,
  lookTo = look,
  handoffAt,
  layout,
  progress,
  pointer,
  scatter,
  pixelRatio,
  reducedMotion,
  onBlend,
  stage,
}: ParticleSystemProps) {
  const rootRef = useRef<THREE.Group>(null);
  const tiltRef = useRef<THREE.Group>(null);
  const pointsRef = useRef<THREE.Points>(null);

  const motion = reducedMotion ? look.reducedMotionFactor : 1;

  // Every form is sampled once per mount with the same particle count.
  const { geometry, forms, stagedForm } = useMemo(() => {
    const forms = formNames.map((name, i) => generateForm(name, count, 101 + i * 7919));
    const colors = look.colors === "monochrome" ? monochromeColors(count) : colorsForSequence(formNames[0], forms[0]);
    const staged = stageDataFor(formNames, forms);
    return {
      geometry: createMorphGeometry(forms, colors, staged?.data),
      forms,
      stagedForm: staged?.index ?? -1,
    };
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
      uStage: { value: 0 },
      uStageMix: { value: 0 },
      uAccent: { value: PALETTE_LINEAR.orange.clone() },
      uHeroField: { value: 0 },
      uFlowFrom: { value: 0 },
      uFlowTo: { value: 0 },
      uProtect2: { value: new THREE.Vector4(0, 0, 0.001, 0.001) },
      uProtect3: { value: new THREE.Vector4(0, 0, 0.001, 0.001) },
      uEarthScale: { value: 1 },
      uProtect4: { value: new THREE.Vector4(0, 0, 0.001, 0.001) },
      uProtect: { value: new THREE.Vector4(0, 0, 0.001, 0.001) },
      uProtectFloor: { value: 1 },
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
    controllerRef.current = new MorphController(geometry, forms, resolveFormPosition);
    return () => {
      controllerRef.current = null;
    };
  }, [geometry, forms]);

  // Settings that change rarely go into uniforms here, reached through the
  // ref so React never sees a hook value being mutated.
  useEffect(() => {
    const points = pointsRef.current;
    if (!points) return;
    const u = uniformsOf(points);
    u.uPixelRatio.value = pixelRatio;
    u.uMotion.value = motion;
    u.uScatter.value = scatter * (reducedMotion ? 0.35 : 1);
  }, [pixelRatio, motion, scatter, reducedMotion]);

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
    smoothProgress: -1,
    smoothStage: -1,
    spin: 0,
    anchor: 0,
  });

  useFrame((state, rawDelta) => {
    const root = rootRef.current;
    const tilt = tiltRef.current;
    const points = pointsRef.current;
    const controller = controllerRef.current;
    if (!root || !tilt || !points || !controller) return;
    const s0 = scratch.current;
    const L = layout.current;

    // Clamp so a long tab-switch pause doesn't cause a jump.
    const delta = Math.min(rawDelta, 1 / 20);
    const u = uniformsOf(points);
    u.uTime.value += delta;
    const time = u.uTime.value;
    const k = dampFactor(look.damping, delta);

    // --- morph: form position → (form pair, transition progress) ----------
    // Eased again on top of GSAP's scrub so fast wheel flicks stay smooth.
    // (Starts at -1 so a page loaded mid-scroll snaps straight into place.)
    const target = progress.current.value;
    s0.smoothProgress = s0.smoothProgress < 0 ? target : s0.smoothProgress + (target - s0.smoothProgress) * k;
    u.uProgress.value = controller.update(s0.smoothProgress);
    // The hero gravity field is live while it is the form being left/held.
    u.uHeroField.value = formNames[0] === "heroField" && controller.fromIndex === 0 ? 1 : 0;
    // Flowing torus (Why): live whether it is being left or arrived at.
    // Live flowing forms: 1 = torus (Why), 2 = ring stream (Services).
    // 3 = Earth (Staffing), 4 = node symbol (Why).
    const liveKind = (name: FormName | undefined) =>
      name === "torusFlow" ? 1 : name === "ringStream" ? 2 : name === "earth" ? 3 : name === "logoNode" ? 4 : 0;
    const fromKind = liveKind(formNames[controller.fromIndex]);
    const toKind = liveKind(formNames[controller.toIndex]);
    u.uFlowFrom.value = fromKind;
    u.uFlowTo.value = toKind;
    // The ring stream's particles do the moving; keep the whole structure
    // anchored (no sway/wobble) while it is on screen.
    const tt = u.uProgress.value;
    s0.anchor = (fromKind >= 2 ? 1 - tt : 0) + (toKind >= 2 ? tt : 0);
    u.uProtect2.value.set(...L.protect2);
    u.uProtect3.value.set(...L.protect3);
    u.uEarthScale.value = L.earthScale;
    u.uProtect4.value.set(...L.protect4);
    u.uProtect.value.set(...L.protect);
    u.uProtectFloor.value = L.protectFloor;

    // --- stepped form: stage effects fade in as the form lands -------------
    if (stagedForm >= 0) {
      const p0 = s0.smoothProgress;
      const landing = Math.min(Math.max((p0 - (stagedForm - 0.3)) / 0.3, 0), 1);
      u.uStageMix.value = smooth(landing);
      const targetStage = stage?.current.value ?? 0;
      s0.smoothStage = s0.smoothStage < 0 ? targetStage : s0.smoothStage + (targetStage - s0.smoothStage) * k;
      u.uStage.value = s0.smoothStage;
    }

    // --- handoff blend: placement + look glide across one transition ------
    const b = smooth(Math.min(Math.max(s0.smoothProgress - handoffAt, 0), 1));
    // How scattered the particles are right now (0 = a form, 1 = mid-field).
    const frac = s0.smoothProgress - Math.floor(s0.smoothProgress);
    const field = Math.min(Math.max(4 * frac * (1 - frac), 0), 1);
    onBlend?.(b, field);

    // Alternating composition: which slot the current/next form uses.
    let toX = L.to.x;
    if (L.sides) {
      const s = Math.max(s0.smoothProgress - (handoffAt + 1), 0);
      const i = Math.min(Math.floor(s), L.sides.byForm.length - 1);
      const j = Math.min(i + 1, L.sides.byForm.length - 1);
      const side = mix(L.sides.byForm[i] ?? 1, L.sides.byForm[j] ?? 1, smooth(Math.min(s - i, 1)));
      toX = mix(L.sides.left, L.sides.right, side);
    }
    const rf = reducedMotion ? 0.2 : 1;
    u.uSize.value = mix(look.particleSize, lookTo.particleSize, b);
    u.uFormNoise.value = mix(look.formNoise, lookTo.formNoise, b);
    u.uFieldNoise.value = mix(look.fieldNoise, lookTo.fieldNoise, b);
    u.uNoiseScale.value = mix(look.noiseScale, lookTo.noiseScale, b);
    u.uCurve.value = mix(look.curve, lookTo.curve, b) * rf;
    u.uMouseRadius.value = mix(look.mouseRadius, lookTo.mouseRadius, b);
    u.uMouseInfluence.value = reducedMotion ? 0 : mix(look.mouseInfluence, lookTo.mouseInfluence, b);

    // --- pointer: eased tilt/parallax, never mapped 1:1 -------------------
    const p = pointer.current;
    s0.smoothNdc.x += ((p.active ? p.x : 0) - s0.smoothNdc.x) * k;
    s0.smoothNdc.y += ((p.active ? p.y : 0) - s0.smoothNdc.y) * k;
    const tiltAmount = mix(look.mouseTilt, lookTo.mouseTilt, b) * (reducedMotion ? 0.25 : 1);
    tilt.rotation.set(
      mix(look.baseTilt[0], lookTo.baseTilt[0], b) - s0.smoothNdc.y * tiltAmount,
      mix(look.baseTilt[1], lookTo.baseTilt[1], b) + s0.smoothNdc.x * tiltAmount,
      mix(look.baseTilt[2], lookTo.baseTilt[2], b),
    );
    const parallax = mix(look.mouseParallax, lookTo.mouseParallax, b) * motion;
    root.position.set(
      mix(L.from.x, toX, b) + s0.smoothNdc.x * parallax,
      mix(L.from.y, L.to.y, b) + s0.smoothNdc.y * parallax * 0.7,
      0,
    );
    root.scale.setScalar(mix(L.from.scale, L.to.scale, b));

    // --- rotation ---------------------------------------------------------
    // A "spin" look turns continuously; as it hands over to a "sway" look the
    // spin slows and settles on the nearest full turn (so the next forms face
    // front), and the sway fades in.
    const spinOf = (lk: ParticleLook) => (lk.rotation.mode === "spin" ? lk.rotation.speed : 0);
    const spinSpeed = mix(spinOf(look), spinOf(lookTo), b);
    s0.spin += delta * spinSpeed * motion;
    const settle = (look.rotation.mode === "spin" ? b : 0) * (lookTo.rotation.mode === "sway" ? 1 : 0);
    if (settle > 0) s0.spin += (Math.round(s0.spin / TAU) * TAU - s0.spin) * k * settle;
    const swayOf = (lk: ParticleLook) =>
      lk.rotation.mode === "sway" ? Math.sin(time * lk.rotation.speed) * lk.rotation.amount : 0;
    const calm = 1 - s0.anchor;
    const yaw = s0.spin + mix(swayOf(look), swayOf(lookTo), b) * motion * calm;
    const wobble = mix(look.wobbleAmount, lookTo.wobbleAmount, b) * motion * calm;
    points.rotation.set(Math.sin(time * 0.13) * wobble, yaw, Math.cos(time * 0.11) * wobble * 0.6);

    // --- pointer position in the particles' own space ---------------------
    if (p.active && !reducedMotion && u.uMouseInfluence.value > 0) {
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
    <group ref={rootRef}>
      <group ref={tiltRef}>
        <points ref={pointsRef} geometry={geometry} material={material} frustumCulled={false} />
      </group>
    </group>
  );
}
