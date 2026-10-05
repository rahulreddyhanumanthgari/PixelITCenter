/**
 * The light theme's bead forms (after the owner's reference video frames): a
 * rocket built from small glossy beads, a floating cloud of beads in depth,
 * and a satellite with bead wireframe panels. Every form fills the same N
 * beads; beads a shape doesn't need float around it as loose ambient beads,
 * so any form can morph into any other.
 *
 * Shapes are built in unit space (height ~1) and placed by the scene.
 */

export type RGB = [number, number, number];

/** The reference palette: warm orange, sunny yellow, soft teal, charcoal, cream. */
export const BEAD = {
  orange: [0.95, 0.5, 0.17] as RGB,
  orangeDeep: [0.9, 0.38, 0.12] as RGB,
  yellow: [0.97, 0.78, 0.25] as RGB,
  teal: [0.36, 0.74, 0.67] as RGB,
  tealDeep: [0.25, 0.6, 0.55] as RGB,
  charcoal: [0.2, 0.22, 0.26] as RGB,
  cream: [0.97, 0.94, 0.88] as RGB,
};

export interface Form {
  /** Unit-space positions (x right, y up, z toward the viewer). */
  pos: Float32Array;
  col: Float32Array;
  /** Bead radius, in unit space. */
  size: Float32Array;
  /** Number of beads that belong to the shape (the rest are ambient). */
  core: number;
}

function rng(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Bead = { p: [number, number, number]; c: RGB; s: number };

function pack(beads: Bead[], n: number, seed: number, ambient: (r: () => number) => Bead): Form {
  const r = rng(seed);
  // Shuffle so subsampling keeps the shape evenly.
  for (let i = beads.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [beads[i], beads[j]] = [beads[j], beads[i]];
  }
  const core = Math.min(beads.length, n);
  const pos = new Float32Array(n * 3);
  const col = new Float32Array(n * 3);
  const size = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const b = i < core ? beads[i] : ambient(r);
    pos.set(b.p, i * 3);
    col.set(b.c, i * 3);
    size[i] = b.s;
  }
  return { pos, col, size, core };
}

/** Loose beads drifting around an object, sparse and mostly behind it. */
function looseAround(radius: number) {
  return (r: () => number): Bead => {
    const a = r() * Math.PI * 2;
    const d = radius * (0.8 + r() * 1.6);
    const palette = [BEAD.teal, BEAD.yellow, BEAD.orange, BEAD.charcoal, BEAD.cream];
    return {
      p: [Math.cos(a) * d, (r() - 0.5) * radius * 2.2, -0.3 - r() * 1.8],
      c: palette[Math.floor(r() * palette.length)],
      s: 0.006 + r() * 0.016,
    };
  };
}

/** A crocheted bead rocket, nose up, height 1 (flame included). */
export function rocket(n: number): Form {
  const beads: Bead[] = [];
  const d = 0.026; // bead spacing
  const bodyR = (y: number) => {
    if (y > 0.62) return 0.17 * Math.sqrt(Math.max(0, 1 - ((y - 0.62) / 0.36) ** 2));
    if (y > 0.2) return 0.17;
    return 0.12 + (0.05 * (y - 0.06)) / 0.14;
  };
  for (let y = 0.06; y <= 0.98; y += d * 0.86) {
    const R = bodyR(y);
    if (R < 0.01) continue;
    const count = Math.max(4, Math.round((2 * Math.PI * R) / d));
    const off = (Math.round(y / d) % 2) * 0.5;
    for (let k = 0; k < count; k++) {
      const a = ((k + off) / count) * Math.PI * 2;
      const p: [number, number, number] = [Math.sin(a) * R, y, Math.cos(a) * R];
      // Window: a teal ring with a cream centre, facing the viewer.
      const wx = p[0], wy = y - 0.5;
      const wd = Math.hypot(wx, wy);
      let c: RGB = BEAD.cream;
      if (y > 0.74) c = BEAD.orange;
      else if (y > 0.7) c = BEAD.yellow;
      else if (y < 0.24) c = BEAD.orange;
      else if (y < 0.28) c = BEAD.yellow;
      if (p[2] > 0.08 && wd < 0.085) c = wd > 0.058 ? BEAD.teal : BEAD.cream;
      if (p[2] > 0.08 && wd < 0.03) c = BEAD.tealDeep;
      beads.push({ p, c, s: d * 0.56 });
    }
  }
  // Three teal fins, flat triangles from the tail.
  for (const fa of [Math.PI / 2, (7 * Math.PI) / 6, (11 * Math.PI) / 6]) {
    for (let y = 0.02; y <= 0.32; y += d * 0.9) {
      const reach = 0.13 + 0.17 * (1 - (y - 0.02) / 0.3);
      for (let rr = 0.15; rr <= 0.15 + reach * 0.9; rr += d * 0.9) {
        beads.push({
          p: [Math.sin(fa) * rr, y, Math.cos(fa) * rr],
          c: rr > 0.15 + reach * 0.7 ? BEAD.tealDeep : BEAD.teal,
          s: d * 0.55,
        });
      }
    }
  }
  // Flame: a yellow core and orange outer cone below the tail.
  for (let y = 0.05; y >= -0.2; y -= d * 0.8) {
    const t = (0.05 - y) / 0.25;
    const R = 0.11 * (1 - t * 0.8);
    const count = Math.max(3, Math.round((2 * Math.PI * R) / d));
    for (let k = 0; k < count; k++) {
      const a = (k / count) * Math.PI * 2 + t * 2;
      for (const f of [1, 0.5]) {
        beads.push({
          p: [Math.sin(a) * R * f, y, Math.cos(a) * R * f],
          c: f < 1 ? BEAD.yellow : t > 0.5 ? BEAD.yellow : BEAD.orange,
          s: d * (0.6 - t * 0.25),
        });
      }
    }
  }
  return pack(beads, n, 11, looseAround(0.55));
}

/** A satellite: a bead drum body, two wireframe solar panels and a dish. Unit size ~1 wide. */
export function satellite(n: number): Form {
  const beads: Bead[] = [];
  const d = 0.024;
  // Body: a drum, orange and yellow bands.
  for (let y = -0.17; y <= 0.17; y += d * 0.86) {
    const R = 0.11;
    const count = Math.round((2 * Math.PI * R) / d);
    for (let k = 0; k < count; k++) {
      const a = ((k + (Math.round(y / d) % 2) * 0.5) / count) * Math.PI * 2;
      const band = Math.floor((y + 0.17) / 0.07) % 2;
      beads.push({ p: [Math.sin(a) * R, y, Math.cos(a) * R], c: band ? BEAD.yellow : BEAD.orange, s: d * 0.56 });
    }
  }
  // Solar panels: wireframe grids on each side, teal frames, yellow ribs.
  const line = (a: [number, number, number], b: [number, number, number], c: RGB) => {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    const steps = Math.max(1, Math.round(len / d));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      beads.push({ p: [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t], c, s: d * 0.5 });
    }
  };
  for (const side of [-1, 1]) {
    const x0 = side * 0.16, x1 = side * 0.62;
    const ys = [-0.13, 0.13];
    // Frame.
    line([x0, ys[0], 0], [x1, ys[0], 0], BEAD.teal);
    line([x0, ys[1], 0], [x1, ys[1], 0], BEAD.teal);
    line([x0, ys[0], 0], [x0, ys[1], 0], BEAD.teal);
    line([x1, ys[0], 0], [x1, ys[1], 0], BEAD.teal);
    // Ribs.
    for (let k = 1; k < 5; k++) {
      const x = x0 + ((x1 - x0) * k) / 5;
      line([x, ys[0], 0], [x, ys[1], 0], BEAD.yellow);
    }
    line([x0, 0, 0], [x1, 0, 0], BEAD.yellow);
    // Strut to the body.
    line([side * 0.11, 0, 0], [x0, 0, 0], BEAD.charcoal);
  }
  // Dish: a ring and a cone on top, with an antenna.
  for (let t = 0; t <= 1; t += 0.12) {
    const R = 0.04 + t * 0.1;
    const y = 0.2 + t * 0.07;
    const count = Math.max(6, Math.round((2 * Math.PI * R) / d));
    for (let k = 0; k < count; k++) {
      const a = (k / count) * Math.PI * 2;
      beads.push({ p: [Math.sin(a) * R, y, Math.cos(a) * R], c: t > 0.8 ? BEAD.teal : BEAD.yellow, s: d * 0.5 });
    }
  }
  line([0, 0.2, 0], [0, 0.42, 0], BEAD.charcoal);
  beads.push({ p: [0, 0.44, 0], c: BEAD.orange, s: d * 0.9 });
  return pack(beads, n, 23, looseAround(0.6));
}

/**
 * A floating cloud of beads through depth (the reference's dissolve frame):
 * bigger, varied beads in teal, yellow, charcoal, orange and cream, sparse in
 * the middle column where the section text sits. Unit space is the viewport:
 * x, y in -1..1 of the half-width / half-height; z in world units.
 */
export function cloud(n: number, seed: number, spread = 1): Form {
  const r = rng(seed);
  const beads: Bead[] = [];
  const palette: [RGB, number][] = [
    [BEAD.teal, 0.34],
    [BEAD.yellow, 0.28],
    [BEAD.charcoal, 0.18],
    [BEAD.orange, 0.12],
    [BEAD.cream, 0.08],
  ];
  const pick = () => {
    let x = r();
    for (const [c, w] of palette) {
      if ((x -= w) <= 0) return c;
    }
    return BEAD.teal;
  };
  // A sparse, airy cloud: only part of the beads are visible in it; the rest
  // sit far behind the camera's view (out of frame), ready for the next form.
  const visible = Math.round(n * 0.32);
  for (let i = 0; i < n; i++) {
    if (i >= visible) {
      beads.push({ p: [(r() * 2 - 1) * 3, (r() * 2 - 1) * 3, -40 - r() * 20], c: pick(), s: 0.02 });
      continue;
    }
    let x = (r() * 2 - 1) * 1.15 * spread;
    const y = (r() * 2 - 1) * 1.1 * spread;
    const z = -6 + r() * 8.5;
    // Keep the text column clear: near beads go to the sides, far ones stay
    // small and soft.
    if (Math.abs(x) < 0.55 && z > -3.5) x = Math.sign(x || 1) * (0.55 + r() * 0.6);
    beads.push({ p: [x, y, z], c: pick(), s: 0.035 + Math.pow(r(), 2.2) * 0.17 });
  }
  return { pos: Float32Array.from(beads.flatMap((b) => b.p)), col: Float32Array.from(beads.flatMap((b) => b.c)), size: Float32Array.from(beads.map((b) => b.s)), core: n };
}

/** The Contact ending: beads come to rest in a low drift along the bottom. */
export function settle(n: number): Form {
  const r = rng(77);
  const base = cloud(n, 77, 1);
  for (let i = 0; i < n; i++) {
    base.pos[i * 3 + 1] = -0.25 - r() * 0.45;
    base.pos[i * 3 + 2] = -4 + r() * 5;
    base.size[i] *= 0.8;
  }
  return base;
}
