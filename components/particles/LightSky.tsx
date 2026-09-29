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

vec3 toLinear(vec3 c) { return pow(c, vec3(2.2)); }

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  vec2 px = gl_FragCoord.xy / uPixelRatio;

  // Cool at the top, a breath of warmth low down; darker toward the edges
  // (like black does on dark, the tint gives the particle colours contrast).
  vec3 top = vec3(0.925, 0.941, 0.972);
  vec3 bottom = vec3(0.957, 0.949, 0.945);
  vec3 col = mix(bottom, top, uv.y);
  float r = length((uv - 0.5) * vec2(1.25, 1.0));
  col = mix(col, vec3(0.86, 0.885, 0.93), smoothstep(0.35, 0.95, r));

  // The light-mode sky: a fine dot grid, faint ink, a little stronger near
  // the edges and softer in the middle where the content sits.
  vec2 cell = mod(px, 26.0) - 13.0;
  float dotMask = 1.0 - smoothstep(0.55, 1.25, length(cell));
  col = mix(col, vec3(0.2, 0.25, 0.36), dotMask * mix(0.1, 0.2, smoothstep(0.2, 0.8, r)));

  gl_FragColor = vec4(toLinear(col), 1.0);
}
`;

/**
 * Light-theme backdrop for the particle layer: a soft cool gradient with a
 * darker rim and a fine dot-grid "sky" — the counterpart of the dark star
 * field, so the particles' orange and blue have something to stand against.
 */
export function LightSky({ pixelRatio }: { pixelRatio: number }) {
  const size = useThree((s) => s.size);
  const meshRef = useRef<THREE.Mesh>(null);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uResolution: { value: new THREE.Vector2(1, 1) }, uPixelRatio: { value: 1 } },
        vertexShader,
        fragmentShader,
        depthTest: false,
        depthWrite: false,
      }),
    [],
  );

  useFrame(() => {
    const u = (meshRef.current?.material as THREE.ShaderMaterial | undefined)?.uniforms;
    if (!u) return;
    (u.uResolution.value as THREE.Vector2).set(size.width * pixelRatio, size.height * pixelRatio);
    u.uPixelRatio.value = pixelRatio;
  });

  return (
    <mesh ref={meshRef} renderOrder={-10} frustumCulled={false} material={material}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  );
}
