import type { Rand } from "../random";

/**
 * How We Work — a particle solar system: four planets (01 Discover …
 * 04 Support), each with its own size, ring and atmosphere, joined by curved
 * particle trails, in sparse cosmic dust.
 *
 * Live form: the shader (solarSystem in particle.vert.glsl) places every
 * particle each frame — planets spin, rings turn, trails flow — from the
 * per-particle parameters built here, `[stage, role, a, b, c]`:
 * - planet body / ring / atmosphere (role 1 / 2 / 3): stage = planet index,
 *   abc = place in the planet's own frame, in planet radii (y = spin axis)
 * - trail (role 0): stage = place along the path in stage units
 *   (-1…0 lead-in, k…k+1 from planet k to k+1, 3…4 lead-out),
 *   abc = (across, depth, seed)
 * - dust (role 4): abc = its place in space.
 *
 * The positions the generator returns are only approximate places (desktop
 * layout), used for the morph's particle order and timing.
 */
export const SOLAR = {
  /** Desktop planet centre xyz + radius (approximate; the shader's SOLAR_DESK is exact). */
  planets: [
    [-3.75, 1.45, 0.2, 0.58],
    [-2.7, -1.85, -0.4, 0.44],
    [2.75, -1.6, 0.15, 0.74],
    [3.95, 1.55, -0.3, 0.5],
  ],
  /** Ring bands per planet, in planet radii. Deliver (2) has two, with a gap. */
  rings: [
    [[1.45, 2.0]],
    [[1.55, 1.75]],
    [
      [1.35, 1.75],
      [1.9, 2.35],
    ],
    [[1.5, 1.85]],
  ],
  /** Where the trail enters and leaves the screen (desktop, approximate). */
  lead: { in: [-6.8, 3.9, -0.5], out: [6.8, 3.9, -0.5] },
  shares: { bodies: 0.45, rings: 0.17, atmospheres: 0.09, trails: 0.22 }, // remainder: dust
  /** Trail particles per segment: lead-in, three between planets, lead-out. */
  segments: [0.12, 0.26, 0.24, 0.26, 0.12],
  dust: { x: 6.8, y: 3.8, zMin: -2.5, zMax: 1 },
} as const;

const ROLE = { trail: 0, body: 1, ring: 2, atmosphere: 3, dust: 4 } as const;

/** Parameters of the last generated system, matched back after alignment. */
let stash: { positions: Float32Array; params: Float32Array } | null = null;

function weights(values: readonly number[]): number[] {
  const sum = values.reduce((a, b) => a + b, 0);
  return values.map((v) => v / sum);
}

function pick(w: readonly number[], r: number): number {
  let acc = 0;
  for (let i = 0; i < w.length; i++) {
    acc += w[i];
    if (r < acc) return i;
  }
  return w.length - 1;
}

export function generateSolarSystemParticles(
  count: number,
  rand: Rand,
): Float32Array {
  const out = new Float32Array(count * 3);
  const params = new Float32Array(count * 5);
  let w = 0;
  const put = (
    x: number,
    y: number,
    z: number,
    stage: number,
    role: number,
    a: number,
    b: number,
    c: number,
  ) => {
    out[w * 3] = x;
    out[w * 3 + 1] = y;
    out[w * 3 + 2] = z;
    params.set([stage, role, a, b, c], w * 5);
    w++;
  };
  const gauss = () => (rand() + rand() + rand() - 1.5) / 1.5;
  const n = (share: number) => Math.floor(count * share);
  const unit = (): [number, number, number] => {
    const z = rand() * 2 - 1;
    const a = rand() * Math.PI * 2;
    const s = Math.sqrt(1 - z * z);
    return [Math.cos(a) * s, z, Math.sin(a) * s];
  };
  // Shares by planet: bodies and atmospheres by surface area, rings by width.
  const area = weights(SOLAR.planets.map((p) => p[3] * p[3]));
  const ringShare = weights([0.28, 0.14, 0.38, 0.2]);
  const planetAt = (
    k: number,
    lx: number,
    ly: number,
    lz: number,
    role: number,
  ) => {
    const [cx, cy, cz, r] = SOLAR.planets[k];
    put(cx + lx * r, cy + ly * r, cz + lz * r, k, role, lx, ly, lz);
  };

  // Bodies: a dense surface over a lighter filled core.
  for (let i = 0, m = n(SOLAR.shares.bodies); i < m; i++) {
    const k = pick(area, rand());
    const [x, y, z] = unit();
    const r = rand() < 0.72 ? 0.975 + rand() * 0.025 : Math.cbrt(rand()) * 0.97;
    planetAt(k, x * r, y * r, z * r, ROLE.body);
  }

  // Rings: thin, clumped along the orbit so their turning is visible.
  for (let i = 0, m = n(SOLAR.shares.rings); i < m; i++) {
    const k = pick(ringShare, rand());
    const bands = SOLAR.rings[k];
    const [inner, outer] = bands[Math.floor(rand() * bands.length)];
    let a = 0;
    do a = rand() * Math.PI * 2;
    while (rand() > 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(a * 3 + k * 1.7)));
    const r = inner + (outer - inner) * Math.pow(rand(), 1.3);
    planetAt(k, Math.cos(a) * r, gauss() * 0.02, Math.sin(a) * r, ROLE.ring);
  }

  // Atmospheres: sparse, thinning out with height.
  for (let i = 0, m = n(SOLAR.shares.atmospheres); i < m; i++) {
    const k = pick(area, rand());
    const [x, y, z] = unit();
    const r = 1.03 + 0.5 * Math.pow(rand(), 2.4);
    planetAt(k, x * r, y * r, z * r, ROLE.atmosphere);
  }

  // Trails: braided strands (plus a soft haze) along each path segment.
  const knots = [
    SOLAR.lead.in,
    ...SOLAR.planets.map((p) => [p[0], p[1], p[2]]),
    SOLAR.lead.out,
  ];
  const segShare = weights(SOLAR.segments);
  for (let i = 0, m = n(SOLAR.shares.trails); i < m; i++) {
    const j = pick(segShare, rand());
    const t = 0.002 + rand() * 0.996;
    const strand =
      rand() < 0.7
        ? (Math.floor(rand() * 5) - 2) * 0.5 + gauss() * 0.08
        : gauss() * 1.4;
    const [a, b] = [knots[j], knots[j + 1]];
    put(
      a[0] + (b[0] - a[0]) * t,
      a[1] + (b[1] - a[1]) * t,
      a[2] + (b[2] - a[2]) * t,
      j - 1 + t,
      ROLE.trail,
      strand,
      gauss() * 0.6,
      rand(),
    );
  }

  // Dust: sparse points through the whole scene.
  const D = SOLAR.dust;
  while (w < count) {
    const x = (rand() * 2 - 1) * D.x;
    const y = (rand() * 2 - 1) * D.y;
    const z = D.zMin + rand() * (D.zMax - D.zMin);
    put(x, y, z, -9, ROLE.dust, x, y, z);
  }

  stash = { positions: out.slice(), params };
  return out;
}

const keyOf = (a: Float32Array, i: number) =>
  `${a[i * 3]},${a[i * 3 + 1]},${a[i * 3 + 2]}`;

/**
 * The per-particle `[stage, role, a, b, c]` parameters (see above) for the
 * final, aligned positions: alignment reorders particles, so each one is
 * matched back to the particle it was generated as.
 */
export function annotateSolarSystem(positions: Float32Array): Float32Array {
  const count = positions.length / 3;
  const out = new Float32Array(count * 5);
  if (!stash || stash.positions.length !== positions.length) return out;
  const index = new Map<string, number>();
  for (let i = 0; i < count; i++) index.set(keyOf(stash.positions, i), i);
  for (let i = 0; i < count; i++) {
    const j = index.get(keyOf(positions, i));
    if (j !== undefined)
      out.set(stash.params.subarray(j * 5, j * 5 + 5), i * 5);
  }
  return out;
}
