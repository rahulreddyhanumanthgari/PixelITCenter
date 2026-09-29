"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import vertexShader from "@/shaders/stars.vert.glsl";
import fragmentShader from "@/shaders/particle.frag.glsl";
import { createStarGeometry } from "@/lib/particles/stars";
import { JOURNEY_STARS, HERO_LOOK } from "@/components/journey/journey-config";
import type { PointerState } from "./types";

/** Shared scene mood, written each frame by the main system's callback. */
export interface Atmosphere {
  /** 0..1 — how scattered the main particles are right now. */
  field: number;
  /** 0..1 — strength of the About Us gravity well (written by the vortex). */
  gravity: number;
  /** Gravity centre in world units (focal plane). */
  gravityX: number;
  gravityY: number;
}

interface StarFieldProps {
  count: number;
  pixelRatio: number;
  reducedMotion: boolean;
  pointer: RefObject<PointerState>;
  atmosphere: RefObject<Atmosphere>;
}

/**
 * Secondary particle system: an ambient field of faint points in real depth
 * behind the main particles. One THREE.Points, all motion on the GPU; the
 * CPU only eases three uniforms per frame.
 */
export function StarField({ count, pixelRatio, reducedMotion, pointer, atmosphere }: StarFieldProps) {
  const geometry = useMemo(() => createStarGeometry(count), [count]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uSize: { value: JOURNEY_STARS.size },
          uPixelRatio: { value: 1 },
          uMotion: { value: 1 },
          uPointer: { value: new THREE.Vector2() },
          uField: { value: 0 },
          uGravity: { value: 0 },
          uGravityCenter: { value: new THREE.Vector2() },
          uSwirl: { value: 0 },
        },
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );

  const pointsRef = useRef<THREE.Points>(null);
  const uniforms = () => (pointsRef.current?.material as THREE.ShaderMaterial | undefined)?.uniforms;

  useEffect(() => {
    const u = uniforms();
    if (!u) return;
    u.uPixelRatio.value = pixelRatio;
    u.uMotion.value = reducedMotion ? HERO_LOOK.reducedMotionFactor : 1;
  }, [pixelRatio, reducedMotion]);

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);

  useFrame((_, rawDelta) => {
    const u = uniforms();
    if (!u) return;
    const delta = Math.min(rawDelta, 1 / 20);
    u.uTime.value += delta;
    // Heavily damped so the space never reacts sharply.
    const k = 1 - Math.pow(0.97, delta * 60);
    const p = pointer.current;
    const target = u.uPointer.value as THREE.Vector2;
    target.x += ((p.active ? p.x : 0) - target.x) * k;
    target.y += ((p.active ? p.y : 0) - target.y) * k;
    const A = atmosphere.current;
    u.uField.value += (A.field - u.uField.value) * k * 2;
    // Gravity eases in and out; the swirl angle only advances while it acts,
    // so the stars never jump when it switches on.
    u.uGravity.value += (A.gravity - u.uGravity.value) * k * 2;
    (u.uGravityCenter.value as THREE.Vector2).set(A.gravityX, A.gravityY);
    u.uSwirl.value += delta * u.uGravity.value * (reducedMotion ? 0.15 : 1);
  });

  return <points ref={pointsRef} geometry={geometry} material={material} frustumCulled={false} />;
}
