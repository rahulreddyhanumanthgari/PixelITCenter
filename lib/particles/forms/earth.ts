import { LAND_MASK } from "../landMask";
import type { Rand } from "../random";

/**
 * Staffing & Consulting — a particle Earth inside a dotted atmospheric shell.
 * Real continents (Natural Earth land mask), bright coastlines, faint oceans,
 * a thin haze, and an outer shell of dotted latitude rows with a few gaps.
 * Generated north-up and unrotated: shaders/particle.vert.glsl (earthSpin)
 * spins the Earth one way and the shell the other, and tilts both.
 *
 * Each layer sits at its own radius band (relative to `radius`) so the
 * shader can colour it: ocean 0.99, land 0.998–1.002, coast 1.008,
 * haze 1.02–1.18, shell = `shell`. Keep EARTH_* in particle.vert.glsl in sync.
 */
export const EARTH = {
  radius: 1.65,
  shell: 2.35,
  /** Radius separating Earth (+ haze) from the shell. */
  split: 2.1,
  shares: { land: 0.54, coast: 0.17, ocean: 0.08, haze: 0.05 }, // remainder: shell
} as const;

const TAU = Math.PI * 2;

/** Decodes the run-length mask into one byte per cell (1 = land). */
function decodeMask(): Uint8Array {
  const { width, height, rows } = LAND_MASK;
  const grid = new Uint8Array(width * height);
  rows.split("|").forEach((row, y) => {
    let x = 0;
    let land = 0;
    for (const run of row.split(".")) {
      const n = parseInt(run, 36);
      if (land) grid.fill(1, y * width + x, y * width + x + n);
      x += n;
      land ^= 1;
    }
  });
  return grid;
}

/** Cell lists weighted by true area (cos latitude), for fast sampling. */
function cellSampler(cells: number[], width: number, height: number, rand: Rand) {
  const cum = new Float32Array(cells.length);
  let total = 0;
  cells.forEach((c, i) => {
    const lat = Math.PI / 2 - ((Math.floor(c / width) + 0.5) / height) * Math.PI;
    total += Math.cos(lat);
    cum[i] = total;
  });
  return () => {
    const r = rand() * total;
    let lo = 0;
    let hi = cells.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (cum[mid] < r) lo = mid + 1;
      else hi = mid;
    }
    const c = cells[lo];
    const lon = ((c % width) + rand()) / width * TAU - Math.PI;
    const lat = Math.PI / 2 - ((Math.floor(c / width) + rand()) / height) * Math.PI;
    return [lat, lon] as const;
  };
}

export function generateEarthParticles(count: number, rand: Rand): Float32Array {
  const { width: W, height: H } = LAND_MASK;
  const grid = decodeMask();
  const land: number[] = [];
  const coast: number[] = [];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (!grid[i]) continue;
      land.push(i);
      const n = (dx: number, dy: number) => grid[Math.min(H - 1, Math.max(0, y + dy)) * W + ((x + dx + W) % W)];
      if (!n(1, 0) || !n(-1, 0) || !n(0, 1) || !n(0, -1)) coast.push(i);
    }
  }
  const sampleLand = cellSampler(land, W, H, rand);
  const sampleCoast = cellSampler(coast, W, H, rand);

  const out = new Float32Array(count * 3);
  let w = 0;
  const put = (lat: number, lon: number, r: number) => {
    const c = Math.cos(lat);
    out[w * 3] = Math.cos(lon) * c * r;
    out[w * 3 + 1] = Math.sin(lat) * r;
    out[w * 3 + 2] = -Math.sin(lon) * c * r;
    w++;
  };
  const randomLatLon = () => [Math.asin(rand() * 2 - 1), rand() * TAU - Math.PI] as const;
  const n = (share: number) => Math.floor(count * share);
  const R = EARTH.radius;

  for (let i = 0, m = n(EARTH.shares.land); i < m; i++) {
    const [lat, lon] = sampleLand();
    put(lat, lon, R * (1 + (rand() - 0.5) * 0.004));
  }
  for (let i = 0, m = n(EARTH.shares.coast); i < m; i++) {
    const [lat, lon] = sampleCoast();
    put(lat, lon, R * 1.008);
  }
  for (let i = 0, m = n(EARTH.shares.ocean); i < m; i++) {
    const [lat, lon] = randomLatLon();
    put(lat, lon, R * 0.99);
  }
  for (let i = 0, m = n(EARTH.shares.haze); i < m; i++) {
    const [lat, lon] = randomLatLon();
    put(lat, lon, R * (1.02 + Math.pow(rand(), 2) * 0.16));
  }

  // Shell: dotted latitude rows, with a few soft gaps (like the reference).
  const shellCount = count - w;
  const rows = 64;
  const perRow = Math.max(1, Math.round(shellCount / (rows * 0.7)));
  while (w < count) {
    const row = Math.floor(rand() * rows);
    const lat = -Math.PI / 2 + ((row + 0.5) / rows) * Math.PI;
    const slots = Math.max(6, Math.round(perRow * Math.cos(lat)));
    const lon = (Math.floor(rand() * slots) / slots) * TAU - Math.PI + (row % 2) * (Math.PI / slots);
    const gap = Math.sin(lon * 2 + lat * 3 + 1.2) * Math.cos(lon * 1.3 - lat * 2.1) > 0.45;
    if (gap && rand() < 0.9) continue;
    put(lat + (rand() - 0.5) * 0.004, lon, EARTH.shell * (1 + (rand() - 0.5) * 0.01));
  }
  return out;
}
