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

// One layer of fine atmospheric dust: one point per cell at a random spot,
// tiny and faint, twinkling slowly. Returns (alpha, tint).
vec2 dust(vec2 px, float cellSize, float seed, float drift) {
  vec2 p = px + vec2(0.0, uTime * drift);
  vec2 cell = floor(p / cellSize);
  vec2 pos = (cell + 0.15 + 0.7 * hash2(cell + seed)) * cellSize;
  float r = hash(cell + seed * 1.7);
  if (r < 0.45) return vec2(0.0);
  float size = mix(0.6, 1.3, pow(hash(cell + seed * 2.3), 3.0));
  float d = length(p - pos);
  float a = 1.0 - smoothstep(size * 0.5, size * 1.2, d);
  float tw = 0.6 + 0.4 * sin(uTime * (0.4 + r) + r * 40.0);
  return vec2(a * tw, hash(cell + seed * 3.1));
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  vec2 px = gl_FragCoord.xy / uPixelRatio;

  // White environment (after the reference): pure white at the top easing to
  // #F8FAFC, a faint warm light from the upper left and a cool shade toward
  // the lower right, so the scene has atmosphere without colour.
  vec3 col = mix(vec3(0.973, 0.98, 0.988), vec3(1.0), smoothstep(0.0, 0.9, uv.y));
  float warm = exp(-dot((uv - vec2(0.15, 0.95)) * vec2(1.2, 1.6), (uv - vec2(0.15, 0.95)) * vec2(1.2, 1.6)) * 2.0);
  col = mix(col, vec3(1.0, 0.975, 0.95), warm * 0.6);
  float cool = exp(-dot((uv - vec2(0.9, 0.05)) * vec2(1.3, 1.5), (uv - vec2(0.9, 0.05)) * vec2(1.3, 1.5)) * 2.2);
  col = mix(col, vec3(0.93, 0.945, 0.96), cool * 0.7);

  // Very fine charcoal dust, barely there, drifting slowly (depth cue).
  vec2 s1 = dust(px, 52.0, 1.0, 1.2);
  vec2 s2 = dust(px, 110.0, 7.0, 2.4);
  vec3 ink = vec3(0.2, 0.24, 0.3);
  col = mix(col, ink, s1.x * 0.12);
  col = mix(col, ink, s2.x * 0.18);

  gl_FragColor = vec4(toLinear(col), 1.0);
}
`;

/**
 * Light-theme backdrop for the particle layer: a white environment with a
 * faint warm light upper left, a cool shade lower right and barely-there
 * charcoal dust. The particles draw on top in the light material (see
 * particle.frag.glsl).
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
