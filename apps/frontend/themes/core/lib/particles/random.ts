/** Small deterministic PRNG so every form looks the same on every load. */
export function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Rand = () => number;

/** Uniform random point on the unit sphere, written into `out` at `i * 3`. */
export function randomUnitVector(
  rand: Rand,
  out: Float32Array,
  i: number,
): void {
  const z = rand() * 2 - 1;
  const a = rand() * Math.PI * 2;
  const r = Math.sqrt(1 - z * z);
  out[i * 3] = r * Math.cos(a);
  out[i * 3 + 1] = r * Math.sin(a);
  out[i * 3 + 2] = z;
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1);
  return t * t * (3 - 2 * t);
}
