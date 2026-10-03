"use client";

import { useMemo, useRef, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { HERO_FIELD } from "@/themes/core/components/journey/journey-config";
import type { Atmosphere } from "@/themes/core/components/particles/StarField";

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
uniform vec2 uSun;        // sun centre, device px (y up)
uniform float uSunR;      // sun disc radius, device px
uniform float uSunDisc;   // 1 = the disc is shown (hero) … 0 = risen out of view

vec3 toLinear(vec3 c) { return pow(c, vec3(2.2)); }

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
vec2 hash2(vec2 p) { return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453); }

float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + 1.0), u.x), u.y);
}
float noise1(float x) {
  float i = floor(x), f = fract(x);
  return mix(hash(vec2(i, 0.0)), hash(vec2(i + 1.0, 0.0)), f * f * (3.0 - 2.0 * f));
}

// Fine sunlit dust motes: one per cell, tiny, twinkling slowly. (alpha, tint)
vec2 dust(vec2 px, float cellSize, float seed, float drift) {
  vec2 p = px + vec2(0.0, uTime * drift);
  vec2 cell = floor(p / cellSize);
  vec2 pos = (cell + 0.15 + 0.7 * hash2(cell + seed)) * cellSize;
  float r = hash(cell + seed * 1.7);
  if (r < 0.5) return vec2(0.0);
  float size = mix(0.6, 1.3, pow(hash(cell + seed * 2.3), 3.0));
  float d = length(p - pos);
  float a = 1.0 - smoothstep(size * 0.5, size * 1.2, d);
  float tw = 0.6 + 0.4 * sin(uTime * (0.4 + r) + r * 40.0);
  return vec2(a * tw, hash(cell + seed * 3.1));
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  vec2 px = gl_FragCoord.xy / uPixelRatio;
  float H = uResolution.y;

  // Sunlit sky: warm cream, a little more golden toward the bottom.
  vec3 col = mix(vec3(1.0, 0.937, 0.86), vec3(1.0, 0.976, 0.937), uv.y);

  vec2 dv = gl_FragCoord.xy - uSun;
  float d = length(dv);
  float R = max(uSunR, 1.0);
  float a = atan(dv.y, dv.x);

  // Warm light spreading from the sun across the whole sky.
  float spread = exp(-d / (H * 0.55));
  col = mix(col, vec3(1.0, 0.87, 0.55), spread * 0.55);

  // Sun rays: soft beams turning very slowly, longest near the sun.
  float t = uTime * 0.02;
  float beams = noise1(a * 6.0 + t * 3.0) * 0.6 + noise1(a * 13.0 - t * 5.0) * 0.4;
  beams = smoothstep(0.45, 0.95, beams);
  float reach = exp(-max(d - R, 0.0) / (H * 0.7));
  col = mix(col, vec3(1.0, 0.95, 0.75), beams * reach * 0.55);

  // Corona: a golden-orange glow hugging the disc.
  float corona = exp(-max(d - R, 0.0) / (R * 0.35));
  col = mix(col, vec3(1.0, 0.72, 0.25), corona * 0.75 * uSunDisc);

  // The disc: near-white at the centre (the hero text sits on it), warming
  // to sun yellow and a hot orange limb, with a soft edge.
  float r = d / R;
  vec3 disc = mix(vec3(1.0, 0.996, 0.95), vec3(1.0, 0.95, 0.68), smoothstep(0.25, 0.85, r));
  disc = mix(disc, vec3(1.0, 0.78, 0.25), smoothstep(0.82, 1.0, r));
  // Slow surface shimmer (granulation), very faint.
  disc *= 1.0 - 0.025 * noise(gl_FragCoord.xy / (R * 0.06) + uTime * 0.05) * smoothstep(0.3, 1.0, r);
  col = mix(col, disc, (1.0 - smoothstep(0.97, 1.03, r)) * uSunDisc);

  // Sunlit dust motes: gold and orange.
  vec2 s1 = dust(px, 52.0, 1.0, 1.0);
  vec2 s2 = dust(px, 104.0, 7.0, 2.0);
  vec3 gold = vec3(1.0, 0.76, 0.2);
  vec3 ember = vec3(1.0, 0.45, 0.2);
  col = mix(col, mix(gold, ember, step(0.6, s1.y)), s1.x * 0.35);
  col = mix(col, mix(gold, ember, step(0.4, s2.y)), s2.x * 0.45);

  gl_FragColor = vec4(toLinear(col), 1.0);
}
`;

/**
 * Light-theme backdrop for the particle layer: the sun. In the landing hero
 * a glowing sun disc fills the black hole's centre, so the particle ring
 * around it reads as its corona; as the story begins the sun rises above the
 * screen, and its warm light, rays and golden motes stay over every section.
 * The particles draw on top as solid dots (see particle.frag.glsl).
 */
export function LightSky({
  pixelRatio,
  reducedMotion = false,
  atmosphere,
}: {
  pixelRatio: number;
  reducedMotion?: boolean;
  atmosphere?: RefObject<Atmosphere>;
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
          uSun: { value: new THREE.Vector2() },
          uSunR: { value: 100 },
          uSunDisc: { value: 1 },
        },
        vertexShader,
        fragmentShader,
        depthTest: false,
        depthWrite: false,
      }),
    [],
  );
  const eased = useRef(0);

  useFrame((_, delta) => {
    const u = (meshRef.current?.material as THREE.ShaderMaterial | undefined)?.uniforms;
    if (!u) return;
    const dt = Math.min(delta, 1 / 20);
    u.uTime.value += dt * (reducedMotion ? 0.15 : 1);
    const w = size.width;
    const h = size.height;
    (u.uResolution.value as THREE.Vector2).set(w * pixelRatio, h * pixelRatio);
    u.uPixelRatio.value = pixelRatio;

    // The sun sits in the black hole's centre (same size as its void).
    const V = HERO_FIELD.voidRadius;
    const voidPx = Math.min(Math.max(w * V.width, h * V.height), w * V.maxWidth);
    const target = atmosphere?.current.heroBlend ?? 0;
    eased.current += (target - eased.current) * (1 - Math.pow(0.88, dt * 60));
    const b = eased.current;
    // As the story begins it rises above the screen; its light stays.
    const cy = h * (0.5 + 0.95 * b); // y up: 0.5 = centre … above the top
    (u.uSun.value as THREE.Vector2).set((w / 2) * pixelRatio, cy * pixelRatio);
    u.uSunR.value = voidPx * 0.92 * pixelRatio;
    u.uSunDisc.value = 1 - b;
  });

  return (
    <mesh ref={meshRef} renderOrder={-10} frustumCulled={false} material={material}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  );
}
