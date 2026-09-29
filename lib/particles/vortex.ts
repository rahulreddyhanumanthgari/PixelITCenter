import * as THREE from "three";
import { PALETTE_LINEAR, pushColor } from "./palette";
import { mulberry32 } from "./random";

/**
 * About Us — a gravitational particle vortex around an invisible centre.
 * Only static per-particle data lives here; every position is computed in
 * shaders/vortex.vert.glsl from time, so the flow never stops:
 * - "orbiters" circle on broad paths at their own radius and speed
 * - "infallers" spiral inward over a lifetime, accelerate, and vanish at the
 *   centre, then re-enter from the outer field (the life cycle wraps)
 */
export const VORTEX = {
  /** Outer radius of the field (local units). */
  outer: 3.5,
  /** Share of particles that spiral into the centre. */
  infallShare: 0.55,
  /** Share tinted with the rocket accents. */
  accentShare: 0.06,
} as const;

export function createVortexGeometry(count: number, seed = 57): THREE.BufferGeometry {
  const rand = mulberry32(seed);
  const r0 = new Float32Array(count);
  const angle = new Float32Array(count);
  const omega = new Float32Array(count);
  const rate = new Float32Array(count);
  const phase = new Float32Array(count);
  const height = new Float32Array(count);
  const randoms = new Float32Array(count);
  const scales = new Float32Array(count);
  const warm = new Float32Array(count);
  const colors = new Float32Array(count * 3);
  const { white, offWhite, orange, gold, blue } = PALETTE_LINEAR;
  const c = new THREE.Color();
  const gauss = () => (rand() + rand() + rand() - 1.5) / 1.5;

  for (let i = 0; i < count; i++) {
    const infall = rand() < VORTEX.infallShare;
    // Infallers start in the outer field. Most orbiters crowd a broad band
    // that runs around the content; the rest fill the disc more loosely.
    const band = rand() < 0.72;
    const r = infall ? 2.7 + rand() * 0.9 : band ? 2.95 + gauss() * 0.22 : 0.9 + Math.pow(rand(), 0.7) * 2.6;
    r0[i] = r;
    // Two soft spiral bands (log spiral), plus a uniform share, so density
    // hints at curved flow without drawing any line.
    angle[i] = rand() < 0.3 ? rand() * Math.PI * 2 : (rand() < 0.5 ? 0 : Math.PI) + gauss() * 0.5 + 1.3 * Math.log(r);
    // Kepler-ish: inner paths turn faster. Each particle its own speed.
    omega[i] = 0.2 * Math.pow(r / 2, -1.5) * (0.8 + rand() * 0.4);
    rate[i] = infall ? 1 / (35 + rand() * 55) : 0;
    phase[i] = rand();
    // A thin, slightly thick disc, with a few particles far above/below for depth.
    height[i] = gauss() * (rand() < 0.08 ? 0.9 : 0.22) * (r / VORTEX.outer + 0.3);
    randoms[i] = rand();
    const s = rand();
    scales[i] = s > 0.985 ? 1.8 : 0.45 + s * 0.7;
    warm[i] = rand() < 0.35 ? 1 : 0;

    c.copy(white).lerp(offWhite, rand() * 0.8);
    if (rand() < VORTEX.accentShare) {
      const pick = rand();
      c.copy(pick < 0.45 ? orange : pick < 0.7 ? gold : blue).lerp(white, 0.25);
    }
    // Outer field dimmer, inner brighter; rare sparkles.
    const b = (0.55 + rand() * 0.4) * (1 - ((r - 0.9) / 2.6) * 0.4) * (s > 0.97 ? 1.7 : 1);
    pushColor(colors, i, c, b);
  }

  const g = new THREE.BufferGeometry();
  // `position` is unused by the shader but lets three compute bounds.
  g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  g.setAttribute("aR0", new THREE.BufferAttribute(r0, 1));
  g.setAttribute("aAngle", new THREE.BufferAttribute(angle, 1));
  g.setAttribute("aOmega", new THREE.BufferAttribute(omega, 1));
  g.setAttribute("aRate", new THREE.BufferAttribute(rate, 1));
  g.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));
  g.setAttribute("aHeight", new THREE.BufferAttribute(height, 1));
  g.setAttribute("aRandom", new THREE.BufferAttribute(randoms, 1));
  g.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));
  g.setAttribute("aWarm", new THREE.BufferAttribute(warm, 1));
  g.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
  return g;
}
