import * as THREE from "three";
import { mulberry32 } from "./random";

/**
 * About Us — a spiral galaxy seen almost face-on, framing the centred
 * content: a bright core, two main arms (and two fainter ones) winding out
 * from it, and a sparse field between them. Positions and colours are
 * computed in shaders/vortex.vert.glsl from time:
 * - arm particles stream inward along their arm and are consumed at the core,
 *   then start again at the rim (the life cycle wraps); fine strands across
 *   each arm give the streaky look
 * - core particles orbit fast in a dense, bright disc
 * - field particles drift slowly between the arms.
 *
 * Keep VORTEX.outer in sync with OUTER in vortex.vert.glsl.
 */
export const VORTEX = {
  /** Outer radius of the field (local units). */
  outer: 3.9,
  /** Particle shares; the remainder is the sparse field. */
  shares: { arms: 0.7, core: 0.12 },
  /** Share of arm particles on the two fainter secondary arms. */
  secondary: 0.28,
} as const;

const KIND = { arm: 0, core: 1, field: 2 } as const;

export function createVortexGeometry(count: number, seed = 57): THREE.BufferGeometry {
  const rand = mulberry32(seed);
  const kind = new Float32Array(count);
  const arm = new Float32Array(count);
  const lane = new Float32Array(count);
  const rate = new Float32Array(count);
  const phase = new Float32Array(count);
  const height = new Float32Array(count);
  const randoms = new Float32Array(count);
  const scales = new Float32Array(count);
  const gauss = () => (rand() + rand() + rand() - 1.5) / 1.5;
  const arms = Math.floor(count * VORTEX.shares.arms);
  const core = Math.floor(count * VORTEX.shares.core);

  for (let i = 0; i < count; i++) {
    const k = i < arms ? KIND.arm : i < arms + core ? KIND.core : KIND.field;
    kind[i] = k;
    if (k === KIND.arm) {
      // Two main arms half a turn apart; the fainter pair sits between them.
      const secondary = rand() < VORTEX.secondary;
      arm[i] = (rand() < 0.5 ? 0 : Math.PI) + (secondary ? Math.PI / 2 + 0.35 : 0);
      // Fine strands (the streaks) plus a softer diffuse share.
      lane[i] = rand() < 0.72 ? (Math.floor(rand() * 7) - 3) / 3 + gauss() * 0.06 : gauss() * 1.6;
      if (secondary) lane[i] *= 1.3;
      // Each particle takes 40–100 s to fall from the rim to the core.
      rate[i] = 1 / (40 + rand() * 60);
    } else {
      arm[i] = rand() * Math.PI * 2;
    }
    phase[i] = rand();
    height[i] = gauss() * (k === KIND.core ? 0.04 : 0.08);
    randoms[i] = rand();
    // Same size spread as the journey particles (MorphController).
    const s = rand();
    scales[i] = s > 0.985 ? 1.8 + rand() * 0.8 : 0.45 + s * 0.75;
  }

  const g = new THREE.BufferGeometry();
  // `position` is unused by the shader but lets three compute bounds.
  g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  g.setAttribute("aKind", new THREE.BufferAttribute(kind, 1));
  g.setAttribute("aArm", new THREE.BufferAttribute(arm, 1));
  g.setAttribute("aLane", new THREE.BufferAttribute(lane, 1));
  g.setAttribute("aRate", new THREE.BufferAttribute(rate, 1));
  g.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));
  g.setAttribute("aHeight", new THREE.BufferAttribute(height, 1));
  g.setAttribute("aRandom", new THREE.BufferAttribute(randoms, 1));
  g.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));
  return g;
}
