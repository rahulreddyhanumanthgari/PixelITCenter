"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const vertexShader = /* glsl */ `
void main() {
  // A full-screen quad, drawn behind everything.
  gl_Position = vec4(position.xy, 0.9999, 1.0);
}
`;

const fragmentShader = /* glsl */ `
uniform vec2 uResolution;
uniform float uPixelRatio;
uniform float uTime;

vec3 toLinear(vec3 c) { return pow(c, vec3(2.2)); }

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;

  // White environment (the landing-page reference): clean white at the top
  // (#FCFCFD) easing to a faint cool grey at the bottom (#F6F8FC), a little
  // cooler toward the lower right. No warm cast, no dust.
  vec3 col = mix(vec3(0.965, 0.973, 0.988), vec3(0.988, 0.988, 0.992), smoothstep(0.0, 0.75, uv.y));
  float cool = exp(-dot((uv - vec2(0.9, 0.05)) * vec2(1.3, 1.5), (uv - vec2(0.9, 0.05)) * vec2(1.3, 1.5)) * 2.2);
  col = mix(col, vec3(0.945, 0.957, 0.976), cool * 0.5);

  gl_FragColor = vec4(toLinear(col), 1.0);
}
`;

/**
 * Light-theme backdrop for the particle layer: the landing-page reference's
 * clean white, easing to a faint cool grey at the bottom and lower right.
 * The particles draw on top in the light material (see
 * particle.frag.glsl).
 */
export function LightSky({
  pixelRatio,
  reducedMotion = false,
}: {
  pixelRatio: number;
  reducedMotion?: boolean;
}) {
  const size = useThree((s) => s.size);
  const meshRef = useRef<THREE.Mesh>(null);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uResolution: { value: new THREE.Vector2(1, 1) },
          uPixelRatio: { value: 1 },
          uTime: { value: 0 },
        },
        vertexShader,
        fragmentShader,
        depthTest: false,
        depthWrite: false,
      }),
    [],
  );

  useFrame((_, delta) => {
    const u = (meshRef.current?.material as THREE.ShaderMaterial | undefined)
      ?.uniforms;
    if (!u) return;
    u.uTime.value += Math.min(delta, 1 / 20) * (reducedMotion ? 0.15 : 1);
    (u.uResolution.value as THREE.Vector2).set(
      size.width * pixelRatio,
      size.height * pixelRatio,
    );
    u.uPixelRatio.value = pixelRatio;
  });

  return (
    <mesh
      ref={meshRef}
      renderOrder={-10}
      frustumCulled={false}
      material={material}
    >
      <planeGeometry args={[2, 2]} />
    </mesh>
  );
}
