"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import vertexShader from "@/shaders/particle.vert.glsl";
import fragmentShader from "@/shaders/particle.frag.glsl";
import { createSculptureGeometry } from "./geometry";
import { PARTICLE_CONFIG, SCENE_LAYOUT } from "./particle-config";
import type { PointerState, ScrollState } from "./types";

export interface SculptureUniforms {
  [uniform: string]: THREE.IUniform;
  uTime: THREE.IUniform<number>;
  uSize: THREE.IUniform<number>;
  uPixelRatio: THREE.IUniform<number>;
  uNoiseStrength: THREE.IUniform<number>;
  uNoiseScale: THREE.IUniform<number>;
  uMotion: THREE.IUniform<number>;
  uMouseInfluence: THREE.IUniform<number>;
  uMouseRadius: THREE.IUniform<number>;
  uFocusDepth: THREE.IUniform<number>;
  uMouse: THREE.IUniform<THREE.Vector3>;
}

interface ParticleSculptureProps {
  count: number;
  offset: readonly [number, number, number];
  scale: number;
  pixelRatio: number;
  reducedMotion: boolean;
  pointer: RefObject<PointerState>;
  scroll: RefObject<ScrollState>;
}

/** Anywhere far from the sculpture, so the pointer push is off. */
const MOUSE_PARKED = new THREE.Vector3(100, 100, 100);

function uniformsOf(points: THREE.Points): SculptureUniforms {
  return (points.material as THREE.ShaderMaterial).uniforms as SculptureUniforms;
}

/** Frame-rate independent version of "close `damping` of the gap per frame". */
function dampFactor(damping: number, delta: number): number {
  return 1 - Math.pow(1 - damping, delta * 60);
}

export function ParticleSculpture({
  count,
  offset,
  scale,
  pixelRatio,
  reducedMotion,
  pointer,
  scroll,
}: ParticleSculptureProps) {
  const rootRef = useRef<THREE.Group>(null);
  const tiltRef = useRef<THREE.Group>(null);
  const pointsRef = useRef<THREE.Points>(null);

  const motion = reducedMotion ? PARTICLE_CONFIG.reducedMotionFactor : 1;

  const geometry = useMemo(() => createSculptureGeometry(count), [count]);

  const material = useMemo(() => {
    const uniforms: SculptureUniforms = {
      uTime: { value: 0 },
      uSize: { value: PARTICLE_CONFIG.particleSize },
      uPixelRatio: { value: 1 },
      uNoiseStrength: { value: PARTICLE_CONFIG.noiseStrength },
      uNoiseScale: { value: PARTICLE_CONFIG.noiseScale },
      uMotion: { value: 1 },
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

  // Settings that change rarely are pushed into uniforms here, not per frame.
  // Uniforms are reached through the ref (not the memoised material) so React
  // never sees a hook value being mutated.
  useEffect(() => {
    const points = pointsRef.current;
    if (!points) return;
    const u = uniformsOf(points);
    u.uPixelRatio.value = pixelRatio;
    u.uMotion.value = motion;
    u.uMouseInfluence.value = reducedMotion ? 0 : PARTICLE_CONFIG.mouseInfluence;
  }, [pixelRatio, motion, reducedMotion]);

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
    if (!root || !tilt || !points) return;
    const s0 = scratch.current;

    // Clamp so a long tab-switch pause doesn't cause a jump.
    const delta = Math.min(rawDelta, 1 / 20);
    const u = uniformsOf(points);
    u.uTime.value += delta;

    const k = dampFactor(PARTICLE_CONFIG.damping, delta);
    const p = pointer.current;
    const s = scroll.current;

    // --- pointer: eased, never mapped 1:1 --------------------------------
    const targetX = p.active ? p.x : 0;
    const targetY = p.active ? p.y : 0;
    s0.smoothNdc.x += (targetX - s0.smoothNdc.x) * k;
    s0.smoothNdc.y += (targetY - s0.smoothNdc.y) * k;

    const tiltAmount = PARTICLE_CONFIG.mouseTilt * (reducedMotion ? 0.25 : 1);
    tilt.rotation.x = SCENE_LAYOUT.baseTilt[0] - s0.smoothNdc.y * tiltAmount;
    tilt.rotation.y = SCENE_LAYOUT.baseTilt[1] + s0.smoothNdc.x * tiltAmount;
    tilt.rotation.z = SCENE_LAYOUT.baseTilt[2];

    // --- scroll: eased again on top of GSAP's scrub for extra softness ----
    s0.smoothScroll += (s.progress - s0.smoothScroll) * k;
    const sp = s0.smoothScroll * (reducedMotion ? 0.3 : 1);
    const sc = SCENE_LAYOUT.scroll;
    root.position.set(
      offset[0] + sc.moveX * sp,
      offset[1] + sc.moveY * sp,
      offset[2] + sc.pushZ * sp,
    );
    root.scale.setScalar(scale * (1 + (sc.scaleTo - 1) * sp));

    // --- self rotation: very slow spin plus a faint secondary wobble ------
    s0.spin += delta * PARTICLE_CONFIG.rotationSpeed * motion;
    const time = u.uTime.value;
    const wobble = PARTICLE_CONFIG.wobbleAmount * motion;
    points.rotation.set(
      Math.sin(time * 0.13) * wobble,
      s0.spin + sc.rotateY * sp,
      Math.cos(time * 0.11) * wobble * 0.6,
    );

    // --- pointer position in the sculpture's own space --------------------
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
