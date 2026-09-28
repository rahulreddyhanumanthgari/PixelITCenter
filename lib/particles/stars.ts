import * as THREE from "three";
import { PALETTE_LINEAR } from "./palette";
import { mulberry32 } from "./random";

/** A shell of faint background stars, mostly behind the scene. */
export function createStarGeometry(count: number, seed = 13): THREE.BufferGeometry {
  const rand = mulberry32(seed);
  const positions = new Float32Array(count * 3);
  const randoms = new Float32Array(count);
  const scales = new Float32Array(count);
  const colors = new Float32Array(count * 3);
  const { white, blue, gold } = PALETTE_LINEAR;
  const c = new THREE.Color();

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (rand() - 0.5) * 30;
    positions[i * 3 + 1] = (rand() - 0.5) * 18;
    positions[i * 3 + 2] = -3 - rand() * 14;
    randoms[i] = rand();
    scales[i] = 0.4 + rand() * rand() * 1.6;

    const tint = rand();
    c.copy(white).lerp(tint < 0.5 ? blue : gold, tint < 0.5 ? tint * 0.6 : (tint - 0.5) * 0.5);
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
  return geometry;
}
