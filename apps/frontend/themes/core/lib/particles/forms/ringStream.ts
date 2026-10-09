import type { Rand } from "../random";

/**
 * Services — a huge ring of particle streams whose centre sits off-screen to
 * the left, so only its arc sweeps through the view (like the reference).
 * Generated flat (lanes around the Y axis, centred at RING_STREAM.cx) and
 * untilted; shaders/particle.vert.glsl (ringStream) flows every particle
 * along its lane, tilts the ring, and colours it by lane.
 *
 * Keep the numbers in sync with RING_* in particle.vert.glsl.
 */
export const RING_STREAM = {
  /** Ring centre x, local units (left of the form's slot). */
  cx: -3.4,
  inner: 2.0,
  // Narrow band: the same particles packed ~2× denser.
  outer: 4.3,
  /** Share of particles flung off the lanes as scattered sparks. */
  sparkShare: 0.025,
} as const;

export function generateRingStreamParticles(count: number, rand: Rand): Float32Array {
  const { cx, inner, outer, sparkShare } = RING_STREAM;
  const out = new Float32Array(count * 3);
  const gauss = () => (rand() + rand() + rand() - 1.5) / 1.5;
  for (let i = 0; i < count; i++) {
    const a = rand() * Math.PI * 2;
    let r: number;
    let y: number;
    if (rand() < sparkShare) {
      // Sparks: loose points above and around the streams.
      r = inner + rand() * (outer - inner) * 1.1;
      y = 0.35 + Math.abs(gauss()) * 1.6;
    } else {
      // Lanes: many thin streams with uneven density (dense bands, gaps).
      const s = Math.floor(rand() * 90) / 90;
      const bandDensity = 0.35 + 0.65 * Math.abs(Math.sin(s * 11.3 + 0.7) * Math.cos(s * 4.1));
      r = inner + (outer - inner) * (rand() < bandDensity ? s : rand());
      r += gauss() * 0.012;
      y = gauss() * 0.05;
    }
    out[i * 3] = cx + Math.cos(a) * r;
    out[i * 3 + 1] = y;
    out[i * 3 + 2] = Math.sin(a) * r;
  }
  return out;
}
