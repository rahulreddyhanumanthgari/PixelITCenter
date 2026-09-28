import * as THREE from "three";
import { PALETTE_LINEAR, pushColor } from "./palette";
import { mulberry32, randomUnitVector } from "./random";

/**
 * About Us — a large 3D orbital structure of particles: a slightly organic
 * ring (uneven density, gentle warps out of its plane, a soft halo) that the
 * shader keeps in slow motion. Everything here is static per-particle data;
 * all movement happens in shaders/orbit.vert.glsl.
 */
export const ORBIT = {
  radius: 1.9,
  /** Share of particles in the loose halo around the ring. */
  haloShare: 0.24,
  /** Share of particles that occasionally leave the ring toward the viewer. */
  travelerShare: 0.004,
  /** Share of particles tinted with the rocket accents. */
  accentShare: 0.07,
} as const;

export function createOrbitGeometry(count: number, seed = 31): THREE.BufferGeometry {
  const rand = mulberry32(seed);
  const angle = new Float32Array(count);
  const radius = new Float32Array(count);
  const height = new Float32Array(count);
  const speed = new Float32Array(count);
  const randoms = new Float32Array(count);
  const scales = new Float32Array(count);
  const travel = new Float32Array(count);
  const colors = new Float32Array(count * 3);
  const scatter = new Float32Array(count * 3);
  const { white, offWhite, orange, gold, blue } = PALETTE_LINEAR;
  const c = new THREE.Color();
  const gauss = () => (rand() + rand() + rand() - 1.5) / 1.5;

  for (let i = 0; i < count; i++) {
    // Uneven density around the ring: accept angles by a soft wave.
    let th = 0;
    for (let tries = 0; tries < 8; tries++) {
      th = rand() * Math.PI * 2;
      const density = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(3 * th + 1.3) * Math.cos(1.7 * th));
      if (rand() < density) break;
    }
    const halo = rand() < ORBIT.haloShare;
    angle[i] = th;
    radius[i] = ORBIT.radius * (1 + gauss() * (halo ? 0.22 : 0.06));
    height[i] = gauss() * (halo ? 0.3 : 0.09);
    // Most drift slowly; a few travel noticeably faster along the ring.
    const fast = rand() < 0.06;
    speed[i] = (fast ? 0.18 + rand() * 0.2 : 0.02 + rand() * 0.05) * (rand() < 0.08 ? -1 : 1);
    randoms[i] = rand();
    const s = rand();
    scales[i] = (s > 0.985 ? 1.8 : 0.45 + s * 0.7) * (halo ? 0.8 : 1);
    travel[i] = rand() < ORBIT.travelerShare ? 1 : 0;

    c.copy(white).lerp(offWhite, rand() * 0.8);
    if (rand() < ORBIT.accentShare) {
      const pick = rand();
      c.copy(pick < 0.45 ? orange : pick < 0.7 ? gold : blue).lerp(white, 0.25);
    }
    const b = (halo ? 0.6 : 1.0) * (s > 0.97 ? 1.7 : 0.7 + rand() * 0.5);
    pushColor(colors, i, c, b);

    // Entrance: each particle starts deeper in space (view-space offset).
    randomUnitVector(rand, scatter, i);
    scatter[i * 3] *= 2.2;
    scatter[i * 3 + 1] *= 1.6;
    scatter[i * 3 + 2] = -(5 + rand() * 12);
  }

  const g = new THREE.BufferGeometry();
  // `position` is unused by the shader but lets three compute bounds.
  g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  g.setAttribute("aAngle", new THREE.BufferAttribute(angle, 1));
  g.setAttribute("aRadius", new THREE.BufferAttribute(radius, 1));
  g.setAttribute("aHeight", new THREE.BufferAttribute(height, 1));
  g.setAttribute("aSpeed", new THREE.BufferAttribute(speed, 1));
  g.setAttribute("aRandom", new THREE.BufferAttribute(randoms, 1));
  g.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));
  g.setAttribute("aTravel", new THREE.BufferAttribute(travel, 1));
  g.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
  g.setAttribute("aScatter", new THREE.BufferAttribute(scatter, 3));
  return g;
}
