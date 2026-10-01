"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { EARTH, generateEarthParticles } from "@/themes/core/lib/particles/forms/earth";
import { mulberry32 } from "@/themes/core/lib/particles/random";
import { useReducedMotion } from "@/themes/core/hooks/device";

/**
 * The light hero's central object (Light Theme pack: "large particle sphere /
 * Earth / orbital object", the white sculpted globe of the atmospheric
 * reference). The site's own particle Earth (themes/core earth form: real
 * continents, coastlines, haze, dotted orbital shell) drawn in daylight:
 * navy / blue / electric-blue dots with a little orange, no glow, over a
 * soft white sphere that gives it body. The Earth turns one way and the
 * orbital shell the other; scroll adds a slow extra turn and a slight lift.
 */

const BODY_RADIUS = EARTH.radius * 0.975;

const pointsVertex = /* glsl */ `
uniform float uSpin;
uniform float uShellSpin;
uniform float uSize;
uniform float uPixelRatio;
attribute float aSeed;
varying vec3 vColor;
varying float vAlpha;

mat3 rotY(float a) { float c = cos(a), s = sin(a); return mat3(c, 0.0, -s, 0.0, 1.0, 0.0, s, 0.0, c); }
mat3 rotZ(float a) { float c = cos(a), s = sin(a); return mat3(c, s, 0.0, -s, c, 0.0, 0.0, 0.0, 1.0); }
mat3 rotX(float a) { float c = cos(a), s = sin(a); return mat3(1.0, 0.0, 0.0, 0.0, c, s, 0.0, -s, c); }

void main() {
  float r = length(position);
  bool shell = r > ${EARTH.split.toFixed(3)};
  // Earth clockwise seen from above (negative turn about +y); shell the other way.
  vec3 p = rotY(shell ? uShellSpin : -uSpin) * position;
  p = rotX(0.32) * rotZ(0.41) * p;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vec3 n = normalize(mat3(modelViewMatrix) * p);
  float facing = n.z; // 1 = towards the viewer, 0 = the limb

  float R = ${EARTH.radius.toFixed(3)};
  vec3 navy = vec3(0.043, 0.106, 0.2);       // #0B1B33
  vec3 blue = vec3(0.086, 0.467, 1.0);       // #1677FF
  vec3 electric = vec3(0.24, 0.6, 1.0);
  vec3 orange = vec3(1.0, 0.42, 0.1);        // #FF6B1A
  vec3 soft = vec3(0.72, 0.78, 0.86);        // soft white/gray-blue

  float size = 1.0;
  if (shell) {
    vColor = aSeed < 0.18 ? orange : mix(blue, electric, aSeed);
    vAlpha = 0.55;
    size = 0.9;
  } else if (r < R * 0.995) {            // ocean
    vColor = soft;
    vAlpha = 0.35;
    size = 0.8;
  } else if (r < R * 1.004) {            // land
    vColor = aSeed < 0.07 ? orange : mix(navy, blue, smoothstep(-0.25, 0.8, aSeed));
    vAlpha = 0.95;
  } else if (r < R * 1.012) {            // coastline
    vColor = electric;
    vAlpha = 0.9;
  } else {                               // haze
    vColor = soft;
    vAlpha = 0.22;
    size = 0.8;
  }
  // The far side fades out behind the body; the limb softens.
  vAlpha *= shell ? mix(0.35, 1.0, smoothstep(-0.4, 0.3, facing)) : smoothstep(-0.05, 0.35, facing);

  gl_Position = projectionMatrix * mv;
  gl_PointSize = uSize * size * uPixelRatio * (8.0 / -mv.z);
}
`;

const pointsFragment = /* glsl */ `
uniform float uFade;
varying vec3 vColor;
varying float vAlpha;
void main() {
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  gl_FragColor = vec4(vColor, uFade * vAlpha * (1.0 - smoothstep(0.3, 0.5, d)));
}
`;

/**
 * "Orb" variant (the Contact section's one calm large object): only the
 * dotted orbital shell, the same latitude rows and soft gaps as the Earth's
 * shell, without the Earth inside.
 */
function orbParticles(count: number): Float32Array {
  const rand = mulberry32(5150);
  const out = new Float32Array(count * 3);
  const rows = 56;
  const perRow = Math.max(1, Math.round(count / (rows * 0.7)));
  let w = 0;
  while (w < count) {
    const row = Math.floor(rand() * rows);
    const lat = -Math.PI / 2 + ((row + 0.5) / rows) * Math.PI;
    const slots = Math.max(6, Math.round(perRow * Math.cos(lat)));
    const lon = (Math.floor(rand() * slots) / slots) * Math.PI * 2 - Math.PI + (row % 2) * (Math.PI / slots);
    const gap = Math.sin(lon * 2 + lat * 3 + 1.2) * Math.cos(lon * 1.3 - lat * 2.1) > 0.45;
    if (gap && rand() < 0.9) continue;
    const c = Math.cos(lat);
    const r = EARTH.shell * (1 + (rand() - 0.5) * 0.01);
    out[w * 3] = Math.cos(lon) * c * r;
    out[w * 3 + 1] = Math.sin(lat) * r;
    out[w * 3 + 2] = -Math.sin(lon) * c * r;
    w++;
  }
  return out;
}

// The globe's body: soft white with a cool shadow side and a pale-blue rim,
// lit from the upper left, so the object feels physically present.
const bodyVertex = /* glsl */ `
varying vec3 vNormal;
void main() {
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;
const bodyFragment = /* glsl */ `
varying vec3 vNormal;
void main() {
  vec3 L = normalize(vec3(-0.55, 0.6, 0.6));
  float diff = clamp(dot(vNormal, L) * 0.5 + 0.5, 0.0, 1.0);
  vec3 lit = vec3(1.0);
  vec3 shade = vec3(0.86, 0.9, 0.96);
  vec3 col = mix(shade, lit, smoothstep(0.15, 0.85, diff));
  float rim = pow(1.0 - clamp(vNormal.z, 0.0, 1.0), 2.5);
  col = mix(col, vec3(0.8, 0.87, 0.98), rim * 0.7);
  gl_FragColor = vec4(col, 1.0);
}
`;

interface GlobeProps {
  count: number;
  /** 0 at the top of the hero → 1 when it has scrolled away. */
  scroll: React.RefObject<number>;
  reducedMotion: boolean;
  /** "earth" (hero): the particle Earth on a white body. "orb" (Contact): the dotted shell alone, calmer. */
  variant?: "earth" | "orb";
}

function Globe({ count, scroll, reducedMotion, variant = "earth" }: GlobeProps) {
  const orb = variant === "orb";
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const positions = orb ? orbParticles(count) : generateEarthParticles(count, mulberry32(20261001));
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const rand = mulberry32(7);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) seeds[i] = rand();
    g.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    return g;
  }, [count, orb]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uSpin: { value: 0 },
          uShellSpin: { value: 0 },
          uSize: { value: orb ? 2.8 : 2.5 },
          uFade: { value: orb ? 0.7 : 1 },
          uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) },
        },
        vertexShader: pointsVertex,
        fragmentShader: pointsFragment,
        transparent: true,
        depthWrite: false,
      }),
    [orb],
  );
  const bodyMaterial = useMemo(
    () => new THREE.ShaderMaterial({ vertexShader: bodyVertex, fragmentShader: bodyFragment }),
    [],
  );

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);
  useEffect(() => () => bodyMaterial.dispose(), [bodyMaterial]);

  const group = useRef<THREE.Group>(null);
  const points = useRef<THREE.Points>(null);
  const time = useRef(0);
  const eased = useRef(0);

  useFrame((_, delta) => {
    time.current += reducedMotion ? 0 : Math.min(delta, 1 / 20);
    // Ease toward the scroll position so the extra turn never jumps.
    eased.current += (scroll.current - eased.current) * (1 - Math.pow(0.9, Math.min(delta, 1 / 20) * 60));
    const s = eased.current;
    const u = (points.current?.material as THREE.ShaderMaterial | undefined)?.uniforms;
    if (u) {
      u.uSpin.value = time.current * 0.07 + s * 0.9;
      u.uShellSpin.value = time.current * (orb ? 0.025 : 0.035) + s * 0.45;
    }
    if (group.current && !orb) {
      group.current.position.y = s * 0.45;
      group.current.scale.setScalar(1 + s * 0.06);
    }
  });

  return (
    <group ref={group}>
      {!orb && (
        <mesh material={bodyMaterial}>
          <sphereGeometry args={[BODY_RADIUS, 96, 96]} />
        </mesh>
      )}
      <points ref={points} geometry={geometry} material={material} />
    </group>
  );
}

export default function GlobeScene(props: Omit<GlobeProps, "reducedMotion"> & { active: boolean }) {
  const reducedMotion = useReducedMotion();
  return (
    <Canvas
      flat
      linear
      frameloop={props.active ? "always" : "never"}
      dpr={[1, 2]}
      camera={{ fov: 30, position: [0, 0, 10.2] }}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      style={{ background: "transparent" }}
    >
      <Globe count={props.count} scroll={props.scroll} reducedMotion={reducedMotion} variant={props.variant} />
    </Canvas>
  );
}
