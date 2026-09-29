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

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
vec2 hash2(vec2 p) { return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453); }

float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + 1.0), u.x), u.y);
}

// One layer of stars: one per cell at a random spot, most tiny, a few
// larger with a soft glow; each twinkles slowly. Returns (alpha, big).
vec2 stars(vec2 px, float cellSize, float seed, float drift) {
  vec2 p = px + vec2(0.0, uTime * drift);
  vec2 cell = floor(p / cellSize);
  vec2 pos = (cell + 0.15 + 0.7 * hash2(cell + seed)) * cellSize;
  float r = hash(cell + seed * 1.7);
  if (r < 0.4) return vec2(0.0);                        // empty cells: irregular sky
  float big = step(0.9, r);
  float size = mix(0.7, 1.5, pow(hash(cell + seed * 2.3), 3.0)) + big * 1.6;
  float d = length(p - pos);
  float coreA = 1.0 - smoothstep(size * 0.5, size * 1.2, d);
  float halo = (1.0 - smoothstep(0.0, size * 4.5, d)) * big * 0.35;
  float tw = 0.6 + 0.4 * sin(uTime * (0.4 + r) + r * 40.0);
  return vec2(max(coreA, halo) * tw, big);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  vec2 px = gl_FragCoord.xy / uPixelRatio;

  // Daytime-blue sky: a little deeper at the top and toward the edges.
  vec3 col = mix(vec3(0.19, 0.46, 0.58), vec3(0.155, 0.4, 0.52), uv.y);
  float rim = length((uv - 0.5) * vec2(1.25, 1.0));
  col = mix(col, vec3(0.12, 0.34, 0.46), smoothstep(0.35, 1.0, rim));

  // Soft lighter patches drifting slowly.
  vec2 q = px / 560.0 + vec2(uTime * 0.004, -uTime * 0.003);
  float n = noise(q) * 0.6 + noise(q * 2.1 + 7.3) * 0.4;
  col = mix(col, vec3(0.24, 0.53, 0.65), smoothstep(0.55, 0.85, n) * 0.4);

  // White stars (plus a few bigger warm-cream ones with a soft glow), in
  // three layers drifting slowly at different speeds.
  vec2 s1 = stars(px, 42.0, 1.0, 1.2);
  vec2 s2 = stars(px, 80.0, 7.0, 2.2);
  vec2 s3 = stars(px, 160.0, 13.0, 3.5);
  vec3 white = vec3(0.95, 0.98, 1.0);
  vec3 cream = vec3(1.0, 0.93, 0.72);
  col = mix(col, mix(white, cream, s1.y), s1.x * 0.55);
  col = mix(col, mix(white, cream, s2.y), s2.x * 0.75);
  col = mix(col, mix(white, cream, s3.y), s3.x * 0.9);

  gl_FragColor = vec4(toLinear(col), 1.0);
}
`;

/**
 * Light-theme backdrop for the particle layer: a daytime-blue sky, deeper at
 * the rim, with soft lighter patches and three layers of twinkling white
 * stars (a few bigger, warm-cream and glowing) drifting slowly. The glowing
 * particles draw on top exactly as in the dark theme.
 */
export function LightSky({ pixelRatio, reducedMotion = false }: { pixelRatio: number; reducedMotion?: boolean }) {
  const size = useThree((s) => s.size);
  const meshRef = useRef<THREE.Mesh>(null);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uResolution: { value: new THREE.Vector2(1, 1) }, uPixelRatio: { value: 1 }, uTime: { value: 0 } },
        vertexShader,
        fragmentShader,
        depthTest: false,
        depthWrite: false,
      }),
    [],
  );

  useFrame((_, delta) => {
    const u = (meshRef.current?.material as THREE.ShaderMaterial | undefined)?.uniforms;
    if (!u) return;
    u.uTime.value += Math.min(delta, 1 / 20) * (reducedMotion ? 0.15 : 1);
    (u.uResolution.value as THREE.Vector2).set(size.width * pixelRatio, size.height * pixelRatio);
    u.uPixelRatio.value = pixelRatio;
  });

  return (
    <mesh ref={meshRef} renderOrder={-10} frustumCulled={false} material={material}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  );
}
