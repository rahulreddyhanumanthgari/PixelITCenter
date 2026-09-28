import * as THREE from "three";
import { PALETTE, SCULPTURE_SHAPE } from "./particle-config";

const TAU = Math.PI * 2;

/** Small deterministic PRNG so the sculpture looks the same on every load. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1);
  return t * t * (3 - 2 * t);
}

/** Cheap smooth 2D "noise" made of layered sines; enough to break up bands. */
function softNoise(u: number, v: number): number {
  return (
    0.5 * Math.sin(u * 3.1 + v * 1.7) +
    0.3 * Math.sin(u * 5.3 - v * 2.9 + 1.3) +
    0.2 * Math.sin(u * 9.7 + v * 4.1 + 2.1)
  );
}

interface SurfacePoint {
  position: THREE.Vector3;
  /** Signed distance across the ribbon, -1..1 (0 = centre line). */
  across: number;
}

/**
 * Point on a torus whose tube cross-section is a squashed ellipse that twists
 * `twists` half-turns around the ring. `fill` < 1 places the point inside.
 */
function twistedTorusPoint(u: number, v: number, fill: number): SurfacePoint {
  const { majorRadius, tubeRadius, twists, ribbonAspect } = SCULPTURE_SHAPE;

  // Gentle radius variation so the ring isn't a perfect circle.
  const R = majorRadius * (1 + 0.07 * Math.sin(2 * u + 0.6) + 0.03 * Math.sin(5 * u));
  const a = tubeRadius * (1 + 0.18 * Math.sin(3 * u + 1.1));
  const b = a * ribbonAspect;

  const cx = a * Math.cos(v) * fill;
  const cy = b * Math.sin(v) * fill;

  const theta = (twists * u) / 2;
  const cosT = Math.cos(theta);
  const sinT = Math.sin(theta);
  const rx = cx * cosT - cy * sinT;
  const ry = cx * sinT + cy * cosT;

  const radial = R + rx;
  return {
    position: new THREE.Vector3(radial * Math.cos(u), ry, radial * Math.sin(u)),
    across: Math.cos(v) * fill,
  };
}

/**
 * Samples the twisted torus into a point cloud and attaches every per-particle
 * attribute the vertex shader needs. Runs once per mount, never per frame.
 */
export function createSculptureGeometry(count: number, seed = 7): THREE.BufferGeometry {
  const rand = mulberry32(seed);
  const { volumeFraction, haloFraction } = SCULPTURE_SHAPE;

  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const randoms = new Float32Array(count);
  const scales = new Float32Array(count);
  const offsets = new Float32Array(count * 3);

  const orange = new THREE.Color(PALETTE.orange);
  const gold = new THREE.Color(PALETTE.gold);
  const white = new THREE.Color(PALETTE.white);
  const blue = new THREE.Color(PALETTE.blue);
  const deepBlue = new THREE.Color(PALETTE.deepBlue);
  const color = new THREE.Color();
  const tmp = new THREE.Color();

  for (let i = 0; i < count; i++) {
    const u = rand() * TAU;
    const v = rand() * TAU;
    const kind = rand();

    let point: SurfacePoint;
    let brightness = 1;

    if (kind < haloFraction) {
      // Loose dust drifting just outside the ribbon.
      point = twistedTorusPoint(u, v, 1.25 + rand() * 0.9);
      brightness = 0.35 + rand() * 0.3;
    } else if (kind < haloFraction + volumeFraction) {
      // Interior fill: gives the ribbon body and depth when it turns edge-on.
      point = twistedTorusPoint(u, v, Math.sqrt(rand()) * 0.95);
      brightness = 0.45 + rand() * 0.35;
    } else {
      // Skin: the bulk of the particles, with a little jitter off the surface.
      point = twistedTorusPoint(u, v, 1 + (rand() - 0.5) * 0.06);
    }

    const { position, across } = point;
    positions[i * 3] = position.x;
    positions[i * 3 + 1] = position.y;
    positions[i * 3 + 2] = position.z;

    // --- colour -----------------------------------------------------------
    // Warm on one arc of the ring, cool on the opposite arc, with soft noise
    // bending the border so there are no hard bands.
    const n = softNoise(u, v);
    const warmth = smoothstep(-0.35, 0.35, Math.cos(u - 0.4) + n * 0.45);
    color.copy(blue).lerp(deepBlue, rand() * 0.5);
    tmp.copy(orange).lerp(gold, rand() * 0.6);
    color.lerp(tmp, warmth);

    // White highlights along the outer edge of the ribbon and in a bright
    // "core" region between the warm and cool sides.
    const edge = smoothstep(0.55, 1, Math.abs(across));
    const core = smoothstep(0.35, 0.95, Math.cos(u + 1.9) + n * 0.25);
    const whiteMix = Math.min(1, edge * 0.55 + core * 0.85) * (0.65 + rand() * 0.35);
    color.lerp(white, whiteMix);
    brightness *= 1 + core * 0.45;

    // A thin streak of hot light running along the ribbon centre.
    const streak =
      (1 - smoothstep(0.02, 0.14, Math.abs(across))) *
      smoothstep(0.2, 0.8, Math.sin(u * 1 + 0.9) + 0.3);
    if (streak > 0) {
      color.lerp(gold, streak * 0.8);
      brightness *= 1 + streak * 0.8;
    }

    // Per-particle brightness spread: most mid, a few very bright, some dim.
    const sparkle = rand();
    brightness *= sparkle > 0.97 ? 1.8 : sparkle < 0.25 ? 0.45 : 0.75 + rand() * 0.35;

    colors[i * 3] = color.r * brightness;
    colors[i * 3 + 1] = color.g * brightness;
    colors[i * 3 + 2] = color.b * brightness;

    randoms[i] = rand();
    const s = rand();
    scales[i] = s > 0.985 ? 1.8 + rand() * 0.8 : 0.45 + s * 0.75;

    offsets[i * 3] = rand() * TAU;
    offsets[i * 3 + 1] = rand() * TAU;
    offsets[i * 3 + 2] = rand() * TAU;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute("aRandom", new THREE.BufferAttribute(randoms, 1));
  geometry.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));
  geometry.setAttribute("aRandomOffset", new THREE.BufferAttribute(offsets, 3));
  // Particles move a little in the shader; pad the bounds so culling never
  // clips the sculpture.
  geometry.computeBoundingSphere();
  if (geometry.boundingSphere) geometry.boundingSphere.radius *= 1.3;
  return geometry;
}

/** A shell of faint background stars around (and mostly behind) the scene. */
export function createStarGeometry(count: number, seed = 13): THREE.BufferGeometry {
  const rand = mulberry32(seed);
  const positions = new Float32Array(count * 3);
  const randoms = new Float32Array(count);
  const scales = new Float32Array(count);
  const colors = new Float32Array(count * 3);
  const white = new THREE.Color(PALETTE.white);
  const blue = new THREE.Color(PALETTE.blue);
  const orange = new THREE.Color(PALETTE.gold);
  const c = new THREE.Color();

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (rand() - 0.5) * 30;
    positions[i * 3 + 1] = (rand() - 0.5) * 18;
    positions[i * 3 + 2] = -3 - rand() * 14;
    randoms[i] = rand();
    scales[i] = 0.4 + rand() * rand() * 1.6;

    const tint = rand();
    c.copy(white).lerp(tint < 0.5 ? blue : orange, tint < 0.5 ? tint * 0.6 : (tint - 0.5) * 0.5);
    const dim = 0.25 + rand() * 0.45;
    colors[i * 3] = c.r * dim;
    colors[i * 3 + 1] = c.g * dim;
    colors[i * 3 + 2] = c.b * dim;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aRandom", new THREE.BufferAttribute(randoms, 1));
  geometry.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));
  geometry.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
  geometry.computeBoundingSphere();
  return geometry;
}
