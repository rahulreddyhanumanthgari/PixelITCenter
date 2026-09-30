import * as THREE from "three";
import { PALETTE_LINEAR } from "./palette";
import { mulberry32 } from "./random";

/** Ambient "digital space" behind the main particles. */
const SPACE = {
  /** Depth range (world z) — always behind the main particle object at z 0. */
  near: -2.5,
  far: -26,
  /** Visible half-extent per unit of camera distance (fov 38 → ~0.35), padded. */
  spreadY: 0.42,
  spreadX: 0.8,
  cameraZ: 7.5,
} as const;

/**
 * A volume of faint points filling the camera's view at every depth. Mostly
 * far and tiny; fewer near ones. White/off-white with a rare, very faint
 * brand tint. `aDepth` (0 near … 1 far) lets the shader dim far points and
 * give near ones more parallax.
 */
export function createStarGeometry(count: number, seed = 13): THREE.BufferGeometry {
  const rand = mulberry32(seed);
  const positions = new Float32Array(count * 3);
  const randoms = new Float32Array(count);
  const scales = new Float32Array(count);
  const depths = new Float32Array(count);
  // A couple of points are "travellers": now and then one drifts in from
  // depth, passes by and recedes (see stars.vert.glsl).
  const travelers = new Float32Array(count);
  const colors = new Float32Array(count * 3);
  const { white, offWhite, orange } = PALETTE_LINEAR;
  const c = new THREE.Color();

  for (let i = 0; i < count; i++) {
    // Bias toward the far range: most points are distant dust.
    const d = 1 - Math.pow(rand(), 2.1);
    const z = SPACE.near + (SPACE.far - SPACE.near) * d;
    const dist = SPACE.cameraZ - z;
    positions[i * 3] = (rand() - 0.5) * 2 * dist * SPACE.spreadX;
    positions[i * 3 + 1] = (rand() - 0.5) * 2 * dist * SPACE.spreadY;
    positions[i * 3 + 2] = z;
    depths[i] = d;
    travelers[i] = i < 2 ? 1 + i : 0;
    randoms[i] = rand();
    // Near points a touch larger in their own right, on top of perspective.
    scales[i] = (0.45 + rand() * rand() * 1.2) * (1.25 - d * 0.45);

    c.copy(white).lerp(offWhite, rand() * 0.9);
    if (rand() < 0.03) c.lerp(orange, 0.18);
    const dim = 0.3 + rand() * 0.4;
    colors[i * 3] = c.r * dim;
    colors[i * 3 + 1] = c.g * dim;
    colors[i * 3 + 2] = c.b * dim;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aRandom", new THREE.BufferAttribute(randoms, 1));
  geometry.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));
  geometry.setAttribute("aDepth", new THREE.BufferAttribute(depths, 1));
  geometry.setAttribute("aTraveler", new THREE.BufferAttribute(travelers, 1));
  geometry.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
  return geometry;
}
