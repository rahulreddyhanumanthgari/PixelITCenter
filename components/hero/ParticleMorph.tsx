"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import vertexShader from "@/shaders/particle.vert.glsl";
import fragmentShader from "@/shaders/particle.frag.glsl";
import { colorsForSequence, generateForm } from "@/lib/particles/generateTarget";
import { ParticleController, createMorphGeometry } from "./ParticleController";
import { MORPH_SEQUENCE, MORPH_TIMELINE, PARTICLE_CONFIG, SCENE_LAYOUT } from "./particle-config";
import type { PointerState, ScrollState } from "./types";

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

interface ParticleMorphProps {
  count: number;
  offset: readonly [number, number, number];
  scale: number;
  scatter: number;
  pixelRatio: number;
  reducedMotion: boolean;
  pointer: RefObject<PointerState>;
  scroll: RefObject<ScrollState>;
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
 * One THREE.Points whose particles morph between the forms in MORPH_SEQUENCE
 * as the hero is scrolled. All particle motion is in the vertex shader; this
 * component only feeds it progress, time, pointer and rotation.
 */
export function ParticleMorph({
  count,
  offset,
  scale,
  scatter,
  pixelRatio,
  reducedMotion,
  pointer,
  scroll,
}: ParticleMorphProps) {
  const rootRef = useRef<THREE.Group>(null);
  const tiltRef = useRef<THREE.Group>(null);
  const pointsRef = useRef<THREE.Points>(null);

  const motion = reducedMotion ? PARTICLE_CONFIG.reducedMotionFactor : 1;

  // Every form is sampled once per mount with the same particle count.
  const { geometry, forms } = useMemo(() => {
    const forms = MORPH_SEQUENCE.map((name, i) => generateForm(name, count, 101 + i * 7919));
    const colors = colorsForSequence(MORPH_SEQUENCE[0], forms[0]);
    return { geometry: createMorphGeometry(forms, colors), forms };
  }, [count]);

  const material = useMemo(() => {
    const uniforms: MorphUniforms = {
      uTime: { value: 0 },
      uProgress: { value: 0 },
      uSize: { value: PARTICLE_CONFIG.particleSize },
      uPixelRatio: { value: 1 },
      uMotion: { value: 1 },
      uScatter: { value: 1 },
      uCurve: { value: PARTICLE_CONFIG.curve },
      uFormNoise: { value: PARTICLE_CONFIG.formNoise },
      uFieldNoise: { value: PARTICLE_CONFIG.fieldNoise },
      uNoiseScale: { value: PARTICLE_CONFIG.noiseScale },
      uMouseInfluence: { value: PARTICLE_CONFIG.mouseInfluence },
      uMouseRadius: { value: PARTICLE_CONFIG.mouseRadius },
      uFocusDepth: { value: SCENE_LAYOUT.cameraZ },
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
  }, []);

  // Plain object held in a ref: the controller mutates geometry attributes.
  const controllerRef = useRef<ParticleController | null>(null);
  useEffect(() => {
    controllerRef.current = new ParticleController(geometry, forms, MORPH_TIMELINE);
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
    u.uCurve.value = PARTICLE_CONFIG.curve * (reducedMotion ? 0.2 : 1);
    u.uMouseInfluence.value = reducedMotion ? 0 : PARTICLE_CONFIG.mouseInfluence;
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
    smoothScroll: 0,
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

    const k = dampFactor(PARTICLE_CONFIG.damping, delta);

    // --- morph: scroll progress → (form pair, transition progress) --------
    // Eased again on top of GSAP's scrub so fast wheel flicks stay smooth.
    s0.smoothScroll += (scroll.current.progress - s0.smoothScroll) * k;
    u.uProgress.value = controller.update(s0.smoothScroll);

    // --- pointer: eased tilt/parallax, never mapped 1:1 -------------------
    const p = pointer.current;
    s0.smoothNdc.x += ((p.active ? p.x : 0) - s0.smoothNdc.x) * k;
    s0.smoothNdc.y += ((p.active ? p.y : 0) - s0.smoothNdc.y) * k;
    const tiltAmount = PARTICLE_CONFIG.mouseTilt * (reducedMotion ? 0.25 : 1);
    tilt.rotation.set(
      SCENE_LAYOUT.baseTilt[0] - s0.smoothNdc.y * tiltAmount,
      SCENE_LAYOUT.baseTilt[1] + s0.smoothNdc.x * tiltAmount,
      SCENE_LAYOUT.baseTilt[2],
    );
    root.position.set(
      offset[0] + s0.smoothNdc.x * 0.12 * motion,
      offset[1] + s0.smoothNdc.y * 0.08 * motion,
      offset[2],
    );

    // --- slow spin around the form's own axis + faint wobble --------------
    s0.spin += delta * PARTICLE_CONFIG.rotationSpeed * motion;
    const time = u.uTime.value;
    const wobble = PARTICLE_CONFIG.wobbleAmount * motion;
    points.rotation.set(Math.sin(time * 0.13) * wobble, s0.spin, Math.cos(time * 0.11) * wobble * 0.6);

    // --- pointer position in the particles' own space ---------------------
    if (p.active && !reducedMotion) {
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
      <group ref={tiltRef} rotation={[SCENE_LAYOUT.baseTilt[0], SCENE_LAYOUT.baseTilt[1], SCENE_LAYOUT.baseTilt[2]]}>
        <points ref={pointsRef} geometry={geometry} material={material} frustumCulled={false} />
      </group>
    </group>
  );
}
