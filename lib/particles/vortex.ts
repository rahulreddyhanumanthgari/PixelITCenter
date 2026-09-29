import * as THREE from "three";
import { colorsForSequence, generateForm } from "./generateTarget";
import { mulberry32 } from "./random";

/**
 * About Us — the same particle language, under gravity. These particles are
 * built exactly like the journey particles (same rocket colour mix, same
 * size spread); only their motion differs. Positions are computed in
 * shaders/vortex.vert.glsl from time:
 * - orbiters circle an invisible centre on their own tilted orbits
 * - infallers arrive from deep space, join the flow, spiral inward and are
 *   consumed at the centre, then arrive again (the life cycle wraps)
 */
export const VORTEX = {
  /** Outer radius of the field (local units). */
  outer: 3.9,
  /** Share of particles that fall into the centre. */
  infallShare: 0.5,
} as const;

export function createVortexGeometry(count: number, seed = 57): THREE.BufferGeometry {
  const rand = mulberry32(seed);
  const r0 = new Float32Array(count);
  const angle = new Float32Array(count);
  const omega = new Float32Array(count);
  const rate = new Float32Array(count);
  const phase = new Float32Array(count);
  const height = new Float32Array(count);
  const incline = new Float32Array(count);
  const node = new Float32Array(count);
  const randoms = new Float32Array(count);
  const scales = new Float32Array(count);
  const gauss = () => (rand() + rand() + rand() - 1.5) / 1.5;

  for (let i = 0; i < count; i++) {
    const infall = rand() < VORTEX.infallShare;
    // A continuous spread of orbits (no designed bands), thinning toward the
    // centre; infallers start at the rim.
    const r = infall ? 3.1 + rand() * 0.8 : 1.0 + Math.pow(rand(), 0.6) * 2.9;
    r0[i] = r;
    angle[i] = rand() * Math.PI * 2;
    // Kepler-ish: inner orbits turn faster; each particle its own speed.
    omega[i] = 0.2 * Math.pow(r / 2, -1.5) * (0.75 + rand() * 0.5);
    rate[i] = infall ? 1 / (35 + rand() * 55) : 0;
    phase[i] = rand();
    height[i] = gauss() * (rand() < 0.1 ? 0.8 : 0.2) * (r / VORTEX.outer + 0.3);
    // Every orbit slightly tilted its own way → one overlapping 3D field.
    incline[i] = gauss() * 0.22;
    node[i] = rand() * Math.PI * 2;
    randoms[i] = rand();
    // Same size spread as the journey particles (MorphController).
    const s = rand();
    scales[i] = s > 0.985 ? 1.8 + rand() * 0.8 : 0.45 + s * 0.75;
  }

  // Same colours as the journey particles: the rocket colour mix, sampled
  // the same way. Order doesn't matter — every attribute above is random
  // per particle.
  const colors = colorsForSequence("rocket", generateForm("rocket", count, seed));

  const g = new THREE.BufferGeometry();
  // `position` is unused by the shader but lets three compute bounds.
  g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  g.setAttribute("aR0", new THREE.BufferAttribute(r0, 1));
  g.setAttribute("aAngle", new THREE.BufferAttribute(angle, 1));
  g.setAttribute("aOmega", new THREE.BufferAttribute(omega, 1));
  g.setAttribute("aRate", new THREE.BufferAttribute(rate, 1));
  g.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));
  g.setAttribute("aHeight", new THREE.BufferAttribute(height, 1));
  g.setAttribute("aIncline", new THREE.BufferAttribute(incline, 1));
  g.setAttribute("aNode", new THREE.BufferAttribute(node, 1));
  g.setAttribute("aRandom", new THREE.BufferAttribute(randoms, 1));
  g.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));
  g.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
  return g;
}
