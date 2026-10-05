"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { orbView } from "@/themes/core/components/journey/journey-config";

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
uniform float uSunDisc;   // 1 = the orb, its stage and halo are shown … 0 = gone
uniform float uTake;      // hero scroll progress 0..1: the orange takeover
uniform float uField;     // strength of the orange field (rises with uTake, fades as Services arrives)
uniform float uMotion;    // 0 = reduced motion

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

  // Cool grey studio backdrop (after the owner's reference): light at the
  // top, a soft lavender-grey toward the sides and a darker band at the very
  // bottom where the stage's shadow falls.
  vec3 col = mix(vec3(0.902, 0.906, 0.925), vec3(0.945, 0.949, 0.961), smoothstep(0.0, 0.85, uv.y));
  float side = smoothstep(0.25, 0.5, abs(uv.x - 0.5));
  col = mix(col, vec3(0.86, 0.865, 0.89), side * 0.35);

  vec2 dv = gl_FragCoord.xy - uSun;
  float d = length(dv);
  float R = max(uSunR, 1.0);
  float r1 = d / R;

  // Warm light around the orb, and a soft white halo hugging it.
  // As scrolling starts the orb's light swells first (the takeover begins here).
  float boost = smoothstep(0.0, 0.25, uTake);
  col = mix(col, vec3(0.99, 0.9, 0.82), exp(-max(d - R, 0.0) / (R * (0.9 + 0.9 * boost))) * (0.45 + 0.4 * boost) * uSunDisc);
  col = mix(col, vec3(1.0, 0.985, 0.97), exp(-max(d - R, 0.0) / (R * 0.12)) * 0.7 * uSunDisc);

  // The stage: a flat pale ellipse under the orb, its rim catching the light,
  // and the shadow falling below it.
  vec2 stageC = uSun - vec2(0.0, R * 1.32);
  vec2 se = (gl_FragCoord.xy - stageC) / vec2(R * 1.65, R * 0.13);
  float stage = 1.0 - smoothstep(0.85, 1.0, length(se));
  col = mix(col, vec3(0.965, 0.965, 0.975), stage * 0.75 * uSunDisc);
  float rim = exp(-abs(length(se) - 0.92) * 9.0) * step(0.0, se.y);
  col = mix(col, vec3(1.0), rim * 0.35 * uSunDisc);
  vec2 sh = (gl_FragCoord.xy - (stageC - vec2(0.0, R * 0.05))) / vec2(R * 1.15, R * 0.07);
  col = mix(col, vec3(0.62, 0.63, 0.68), exp(-dot(sh, sh)) * 0.45 * uSunDisc);
  vec2 fl = (gl_FragCoord.xy - (stageC - vec2(0.0, R * 0.55))) / vec2(R * 2.0, R * 0.5);
  col = mix(col, vec3(0.7, 0.71, 0.76), exp(-dot(fl, fl)) * 0.35 * uSunDisc);

  // The orb: frosted glass glowing from inside. A warm orange core a little
  // below centre, peach toward the edge, a bright soft white rim, fine grain.
  if (r1 < 1.02) {
    vec2 n = dv / R;
    float rc = length(n - vec2(0.0, -0.15)) / 1.0;
    vec3 orb = mix(vec3(0.98, 0.62, 0.3), vec3(0.99, 0.86, 0.76), smoothstep(0.0, 0.75 - 0.25 * boost, rc));
    orb = mix(orb, vec3(1.0, 0.975, 0.96), smoothstep(0.72, 0.99, r1));
    // A crisp frosted rim.
    orb = mix(orb, vec3(1.0), smoothstep(0.94, 0.995, r1) * 0.8);
    float grain = hash(floor(gl_FragCoord.xy)) - 0.5;
    orb += grain * 0.035;
    col = mix(col, orb, (1.0 - smoothstep(0.995, 1.005, r1)) * uSunDisc);
  }

  // --- The orange takeover (scroll-driven, from the orb outward) ----------
  // ORB -> GLOW -> FIELD: a soft-fronted radial field grows from the orb's
  // centre until it covers the viewport, with depth (warm radial bands, a
  // hot front, slow volumetric noise, pale light from above), grain and
  // motes streaming outward. Colours are the orb's own: core #FA9E4C, brand
  // #FF7E2E, deep #F97316, pale peach #FCDBC2.
  if (uField > 0.001) {
    float diag = length(uResolution);
    float grow = 1.0 - pow(1.0 - smoothstep(0.15, 0.95, uTake), 2.0); // responsive start, slower takeover
    grow = mix(1.0, grow, uMotion);
    float FR = mix(R * 1.05, diag * 1.15, grow);
    float n = noise(gl_FragCoord.xy / (R * 0.45) + uTime * 0.03) * 0.6 + noise(gl_FragCoord.xy / (R * 0.14) - uTime * 0.05) * 0.4;
    float soft = FR * 0.4;
    float inside = 1.0 - smoothstep(FR - soft * (0.8 + 0.6 * n), FR + soft * 0.25, d);
    float rr = d / max(FR, 1.0);
    vec3 pale = vec3(0.99, 0.86, 0.76);
    vec3 core = vec3(0.98, 0.62, 0.3);
    vec3 brand = vec3(1.0, 0.494, 0.18);
    vec3 deep = vec3(0.976, 0.451, 0.086);
    vec3 field = mix(core, brand, smoothstep(0.05, 0.6, rr));
    field = mix(field, deep, smoothstep(0.55, 1.0, rr) * 0.7);
    // The hot moving front, strongest while it travels.
    field = mix(field, deep, exp(-abs(d - FR * 0.82) / (soft * 0.35)) * 0.35 * (1.0 - grow * 0.7));
    // Volume: slow light and shade drifting through it, pale light from above.
    field *= 0.9 + 0.16 * n;
    vec2 top = (uv - vec2(0.5, 1.15)) * vec2(1.0, 1.4);
    field = mix(field, pale, exp(-dot(top, top) * 2.2) * 0.45);
    // Grain.
    field += (hash(floor(gl_FragCoord.xy) + floor(uTime * 12.0)) - 0.5) * 0.035;
    col = mix(col, field, inside * uField);

    // Motes streaming outward from the orb: short bright streaks.
    float ang = atan(dv.y, dv.x);
    vec2 pc = vec2(ang * 64.0 / 6.2831853, log(max(d, 1.0)) * 10.0 - uTime * 1.6 * uMotion);
    vec2 cell = floor(pc);
    vec2 f = fract(pc) - 0.5;
    float hm = hash(cell);
    float mote = step(0.82, hm) * (1.0 - smoothstep(0.0, 0.18, length(f * vec2(3.0, 1.0))));
    col = mix(col, vec3(1.0, 0.95, 0.88), mote * inside * uField * smoothstep(R, R * 1.6, d) * 0.55);
  }

  gl_FragColor = vec4(toLinear(col), 1.0);
}
`;

/**
 * Light-theme backdrop for the particle layer: a cool grey studio, and in the
 * hero a frosted orb glowing from inside on its stage. Scrolling the hero
 * drives an orange takeover from the orb (owner's scroll-transition
 * reference): its light swells, then a soft radial orange field with depth,
 * grain and outward motes grows from it until it fills the screen, and it
 * dissolves as Services comes up. The particles draw on top as solid dots
 * (see particle.frag.glsl).
 */
export function LightSky({ pixelRatio, reducedMotion = false }: { pixelRatio: number; reducedMotion?: boolean }) {
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
          uTake: { value: 0 },
          uField: { value: 0 },
          uMotion: { value: 1 },
        },
        vertexShader,
        fragmentShader,
        depthTest: false,
        depthWrite: false,
      }),
    [],
  );
  const eased = useRef(0);
  // The hero and Services, read every frame for the takeover's progress.
  const anchors = useRef<{ hero: HTMLElement | null; services: HTMLElement | null }>({ hero: null, services: null });
  useEffect(() => {
    anchors.current = {
      hero: document.querySelector<HTMLElement>("[data-hero]"),
      services: document.querySelector<HTMLElement>("#services"),
    };
  }, []);

  useFrame((_, delta) => {
    const u = (meshRef.current?.material as THREE.ShaderMaterial | undefined)?.uniforms;
    if (!u) return;
    const dt = Math.min(delta, 1 / 20);
    u.uTime.value += dt * (reducedMotion ? 0.15 : 1);
    const w = size.width;
    const h = size.height;
    (u.uResolution.value as THREE.Vector2).set(w * pixelRatio, h * pixelRatio);
    u.uPixelRatio.value = pixelRatio;

    // The orb stays where it is; scrolling the hero drives the orange
    // takeover from it, and the field dissolves as Services comes up.
    const o = orbView(w, h);
    (u.uSun.value as THREE.Vector2).set((w / 2 + o.dx) * pixelRatio, (h / 2 - o.dy) * pixelRatio);
    u.uSunR.value = o.r * pixelRatio;
    const heroRect = anchors.current.hero?.getBoundingClientRect();
    const servicesTop = anchors.current.services?.getBoundingClientRect().top ?? h;
    // Hero progress: 0 at the top, 1 once a full screen has scrolled.
    const take = heroRect ? Math.min(Math.max(-heroRect.top / h, 0), 1) : 0;
    eased.current += (take - eased.current) * (1 - Math.pow(0.85, dt * 60));
    const p = eased.current;
    const smooth = (a: number, b: number, x: number) => {
      const t = Math.min(Math.max((x - a) / (b - a), 0), 1);
      return t * t * (3 - 2 * t);
    };
    u.uTake.value = p;
    // Full orange until Services' top reaches 35% of the screen, gone by -10%.
    u.uField.value = smooth(0.1, 0.55, p) * smooth(-0.1, 0.35, servicesTop / h);
    u.uSunDisc.value = 1 - smooth(0.45, 0.9, p);
    u.uMotion.value = reducedMotion ? 0 : 1;
  });

  return (
    <mesh ref={meshRef} renderOrder={-10} frustumCulled={false} material={material}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  );
}
