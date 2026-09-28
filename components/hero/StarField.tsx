"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import vertexShader from "@/shaders/stars.vert.glsl";
import fragmentShader from "@/shaders/particle.frag.glsl";
import { createStarGeometry } from "@/lib/particles/stars";
import { PARTICLE_CONFIG } from "./particle-config";

interface StarFieldProps {
  count: number;
  pixelRatio: number;
  reducedMotion: boolean;
}

export function StarField({ count, pixelRatio, reducedMotion }: StarFieldProps) {
  const geometry = useMemo(() => createStarGeometry(count), [count]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uSize: { value: PARTICLE_CONFIG.starSize },
          uPixelRatio: { value: 1 },
          uMotion: { value: 1 },
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
    u.uMotion.value = reducedMotion ? PARTICLE_CONFIG.reducedMotionFactor : 1;
  }, [pixelRatio, reducedMotion]);

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);

  useFrame((_, delta) => {
    const u = uniforms();
    if (u) u.uTime.value += Math.min(delta, 1 / 20);
  });

  return <points ref={pointsRef} geometry={geometry} material={material} frustumCulled={false} />;
}
