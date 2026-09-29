import type { Rand } from "../random";

/**
 * Why Pixel IT Center — a thick 3D torus of particles laid out as an even
 * dot lattice (denser on the inner side, like the reference), plus an inner
 * volume for depth. It is generated flat around the Y axis and untilted:
 * shaders/particle.vert.glsl (torusFlow) recovers each particle's torus
 * coordinates, flows it around the ring and the tube, and applies the tilt.
 *
 * Sized so its opening holds the centred Why content (≈400px hole radius
 * on desktop at the story scale): R − r ≈ 2.9 local units.
 *
 * Keep R in sync with TORUS_R in particle.vert.glsl.
 */
export const TORUS_FLOW = { R: 3.65, r: 0.78, surfaceShare: 0.9, perDot: 2 } as const;

export function generateTorusFlowParticles(count: number, rand: Rand): Float32Array {
  const { R, r, surfaceShare, perDot } = TORUS_FLOW;
  const out = new Float32Array(count * 3);
  // Each lattice dot is a tight cluster of a few particles, so the rows of
  // distinct dots read clearly (like the reference) while staying dense.
  const surface = Math.floor((count * surfaceShare) / perDot);
  // Lattice: rings around the tube (v) × points around the ring (u), spaced
  // by the two circumferences so dots are evenly apart on the outer side.
  const nU = Math.max(8, Math.round(Math.sqrt((surface * R) / r)));
  const nV = Math.max(4, Math.floor(surface / nU));
  const TAU = Math.PI * 2;

  for (let i = 0; i < count; i++) {
    let u: number;
    let v: number;
    let rt: number;
    if (i < nU * nV * perDot) {
      const site = Math.floor(i / perDot);
      const iu = site % nU;
      const iv = Math.floor(site / nU);
      // Alternate rings are offset half a step → a tighter, hex-like weave.
      u = ((iu + (iv % 2) * 0.5) / nU) * TAU + (rand() - 0.5) * 0.006;
      v = (iv / nV) * TAU + (rand() - 0.5) * 0.012;
      rt = r * (1 + (rand() - 0.5) * 0.012);
    } else {
      // Inner volume: gives the form real thickness as it turns.
      u = rand() * TAU;
      v = rand() * TAU;
      rt = r * Math.sqrt(rand()) * 0.92;
    }
    const d = R + rt * Math.cos(v);
    out[i * 3] = Math.cos(u) * d;
    out[i * 3 + 1] = Math.sin(v) * rt;
    out[i * 3 + 2] = Math.sin(u) * d;
  }
  return out;
}
