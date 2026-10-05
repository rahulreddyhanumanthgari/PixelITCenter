"use client";

import { useMemo, useRef, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { orbView } from "@/themes/core/components/journey/journey-config";
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

  // Soft studio backdrop: warm off-white, a touch lighter at the top.
  vec3 col = mix(vec3(0.925, 0.918, 0.906), vec3(0.965, 0.961, 0.953), uv.y);

  vec2 dv = gl_FragCoord.xy - uSun;
  float d = length(dv);
  float R = max(uSunR, 1.0);

  // The orb's light: a wide peach bloom and a bright white-gold core glow.
  float bloom = exp(-d / (R * 1.1));
  col = mix(col, vec3(1.0, 0.84, 0.72), bloom * 0.6 * uSunDisc);
  float core = exp(-d / (R * 0.6));
  col = mix(col, vec3(1.0, 0.985, 0.95), core * 0.95 * uSunDisc);

  // Its soft shadow on the floor below.
  vec2 sd = (gl_FragCoord.xy - (uSun - vec2(0.0, R * 1.55))) / vec2(R * 0.95, R * 0.11);
  float shadow = exp(-dot(sd, sd));
  col = mix(col, vec3(0.78, 0.76, 0.74), shadow * 0.45 * uSunDisc);

  gl_FragColor = vec4(toLinear(col), 1.0);
}
`;

/**
 * Light-theme backdrop for the particle layer: a soft warm off-white studio
 * backdrop. In the landing hero a peach glow and a white-gold core light the
 * particle orb from behind, and a soft shadow sits on the floor below it;
 * as the story begins the orb rises away and the glow fades. The particles
 * draw on top as solid dots (see particle.frag.glsl).
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

    // The orb's centre (see orbView); as the story begins it rises away and
    // its glow fades.
    const o = orbView(w, h);
    const target = atmosphere?.current.heroBlend ?? 0;
    eased.current += (target - eased.current) * (1 - Math.pow(0.88, dt * 60));
    const b = eased.current;
    const cy = h / 2 - o.dy + b * (h + 2 * o.r); // y up
    (u.uSun.value as THREE.Vector2).set((w / 2 + o.dx) * pixelRatio, cy * pixelRatio);
    u.uSunR.value = o.r * pixelRatio;
    u.uSunDisc.value = 1 - b;
  });

  return (
    <mesh ref={meshRef} renderOrder={-10} frustumCulled={false} material={material}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  );
}
