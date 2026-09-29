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

// One layer of ink stars: one per cell at a random spot, most tiny, a few
// larger with a soft halo; each twinkles slowly. Returns (alpha, tint).
vec2 stars(vec2 px, float cellSize, float seed, float drift) {
  vec2 p = px + vec2(0.0, uTime * drift);
  vec2 cell = floor(p / cellSize);
  vec2 pos = (cell + 0.15 + 0.7 * hash2(cell + seed)) * cellSize;
  float r = hash(cell + seed * 1.7);
  if (r < 0.35) return vec2(0.0);                       // empty cells: irregular sky
  float size = mix(0.8, 2.0, pow(hash(cell + seed * 2.3), 3.0));
  float d = length(p - pos);
  float coreA = 1.0 - smoothstep(size * 0.55, size * 1.25, d);
  float halo = (1.0 - smoothstep(0.0, size * 5.0, d)) * step(0.93, r) * 0.25;
  float tw = 0.65 + 0.35 * sin(uTime * (0.4 + r) + r * 40.0);
  return vec2(max(coreA, halo) * tw, hash(cell + seed * 3.1));
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  vec2 px = gl_FragCoord.xy / uPixelRatio;

  // Cool sky, a breath of warmth low down, deeper toward the edges.
  vec3 col = mix(vec3(0.945, 0.935, 0.93), vec3(0.905, 0.925, 0.965), uv.y);
  float rim = length((uv - 0.5) * vec2(1.25, 1.0));
  col = mix(col, vec3(0.835, 0.865, 0.925), smoothstep(0.3, 0.95, rim));

  // Faint nebula: slow pale-blue and peach clouds.
  vec2 q = px / 520.0 + vec2(uTime * 0.004, -uTime * 0.003);
  float n = noise(q) * 0.6 + noise(q * 2.1 + 7.3) * 0.4;
  float m = noise(q * 0.8 - 3.7);
  col = mix(col, vec3(0.8, 0.86, 0.97), smoothstep(0.55, 0.85, n) * 0.35);
  col = mix(col, vec3(0.98, 0.9, 0.84), smoothstep(0.6, 0.9, m) * 0.25);

  // Three layers of ink stars (slow parallax drift).
  vec2 s1 = stars(px, 38.0, 1.0, 1.2);
  vec2 s2 = stars(px, 70.0, 7.0, 2.2);
  vec2 s3 = stars(px, 140.0, 13.0, 3.5);
  vec3 slate = vec3(0.16, 0.2, 0.3);
  vec3 blue = vec3(0.15, 0.3, 0.75);
  vec3 warm = vec3(0.85, 0.42, 0.15);
  vec3 tint1 = mix(slate, blue, step(0.7, s1.y));
  vec3 tint2 = mix(mix(slate, blue, step(0.55, s2.y)), warm, step(0.93, s2.y));
  vec3 tint3 = mix(blue, warm, step(0.8, s3.y));
  col = mix(col, tint1, s1.x * 0.5);
  col = mix(col, tint2, s2.x * 0.7);
  col = mix(col, tint3, s3.x * 0.8);

  gl_FragColor = vec4(toLinear(col), 1.0);
}
`;

/**
 * Light-theme backdrop for the particle layer, the counterpart of the dark
 * star field: a cool sky, deeper at the rim, with faint pale-blue and peach
 * nebula clouds and three layers of twinkling ink stars drifting slowly. The
 * tint gives the particles' orange and blue something to stand against.
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
