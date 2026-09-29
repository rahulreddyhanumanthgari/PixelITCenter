import type { Rand } from "../random";

/**
 * Why Pixel IT Center, second form — the Pixel IT node symbol (the graphic
 * mark only, no wordmark), built from particles: dense spherical nodes,
 * particle-trail spokes from the hub to each outer node, and a sparse field
 * around it. Geometry measured from public/brand/pixel-it-center-logo.webp
 * (the symbol occupies x 0–86, y 40–132 px of the 482×162 logo).
 *
 * Keep NODES in sync with LOGO_NODE_* in particle.vert.glsl.
 */
const PX = { cx: 43, cy: 86, unit: 0.052 } as const;

/** [x px, y px, radius px] from the logo; index 0 is the hub. */
export const LOGO_NODES_PX: readonly (readonly [number, number, number])[] = [
  [44, 83, 11.2],
  [75, 51, 11.2],
  [15, 57, 7.3],
  [75, 106, 7.2],
  [11, 118, 11.3],
  [48, 123, 8.9],
];

const SHARES = { nodes: 0.55, spokes: 0.33, halo: 0.05 } as const; // remainder: field
/** Spoke thickness in px (the logo's lines are ~3px; a little thicker reads better). */
const SPOKE_R_PX = 2.2;

/** Nodes in local units (y up). */
export const LOGO_NODES = LOGO_NODES_PX.map(([x, y, r]) => [(x - PX.cx) * PX.unit, -(y - PX.cy) * PX.unit, r * PX.unit] as const);

export function generateLogoNodeParticles(count: number, rand: Rand): Float32Array {
  const out = new Float32Array(count * 3);
  let w = 0;
  const put = (x: number, y: number, z: number) => {
    out[w * 3] = x;
    out[w * 3 + 1] = y;
    out[w * 3 + 2] = z;
    w++;
  };
  const gauss = () => (rand() + rand() + rand() - 1.5) / 1.5;
  const unitDir = () => {
    const z = rand() * 2 - 1;
    const a = rand() * Math.PI * 2;
    const s = Math.sqrt(1 - z * z);
    return [Math.cos(a) * s, Math.sin(a) * s, z] as const;
  };
  const n = (share: number) => Math.floor(count * share);

  // Nodes: filled spheres, weighted by area, denser toward the surface so
  // each reads as a solid disc of light with a crisp edge.
  const weights = LOGO_NODES.map(([, , r]) => r * r);
  const wSum = weights.reduce((s, v) => s + v, 0);
  const pickNode = () => {
    let p = rand() * wSum;
    let k = 0;
    while (p > weights[k] && k < weights.length - 1) p -= weights[k++];
    return LOGO_NODES[k];
  };
  for (let i = 0, m = n(SHARES.nodes); i < m; i++) {
    const [cx, cy, r] = pickNode();
    const [dx, dy, dz] = unitDir();
    const rr = r * Math.pow(rand(), 0.25);
    put(cx + dx * rr, cy + dy * rr, dz * rr);
  }

  // Spokes: hub → each outer node, a dense particle trail between the discs.
  const [hx, hy, hr] = LOGO_NODES[0];
  const spokes = LOGO_NODES.slice(1).map(([x, y, r]) => {
    const len = Math.hypot(x - hx, y - hy);
    return { x, y, r, len: Math.max(len - hr - r, 0.01) };
  });
  const totalLen = spokes.reduce((s, v) => s + v.len, 0);
  const sr = SPOKE_R_PX * PX.unit;
  for (let i = 0, m = n(SHARES.spokes); i < m; i++) {
    let p = rand() * totalLen;
    let k = 0;
    while (p > spokes[k].len && k < spokes.length - 1) p -= spokes[k++].len;
    const s = spokes[k];
    const dx = (s.x - hx) / Math.hypot(s.x - hx, s.y - hy);
    const dy = (s.y - hy) / Math.hypot(s.x - hx, s.y - hy);
    const along = hr + rand() * s.len;
    const a = rand() * Math.PI * 2;
    const rr = sr * Math.sqrt(rand());
    put(hx + dx * along - dy * Math.cos(a) * rr, hy + dy * along + dx * Math.cos(a) * rr, Math.sin(a) * rr);
  }

  // Halo: a soft glow of particles just around each node.
  for (let i = 0, m = n(SHARES.halo); i < m; i++) {
    const [cx, cy, r] = pickNode();
    const [dx, dy, dz] = unitDir();
    const rr = r * (1.1 + Math.abs(gauss()) * 0.6);
    put(cx + dx * rr, cy + dy * rr, dz * rr);
  }

  // Field: sparse particles around the symbol.
  while (w < count) {
    put(gauss() * 3.2, gauss() * 2.6, gauss() * 1.4);
  }
  return out;
}
