import * as THREE from "three";
import { geometryEdgesToParticlePositions, transformPositions } from "../geometryToParticles";
import { smoothstep, type Rand } from "../random";

/**
 * Staffing & Consulting — a large connected globe: dotted continents on a
 * faint sphere, wrapped in a network cage of glowing nodes joined by lines.
 */
const GLOBE = {
  radius: 1.55,
  cageRadius: 1.95,
  /** Spacing of the continent dot grid, radians. */
  dotStep: 0.045,
  dotJitter: 0.009,
  /** fbm threshold: higher = less land. */
  landLevel: 0.53,
} as const;

/** Share of particles per part (the cage lines get the remainder). */
const SHARES = {
  land: 0.5,
  shell: 0.12,
  cageNodes: 0.1,
} as const;

// --- small smooth 3D value noise for procedural continents -----------------

function hash3(x: number, y: number, z: number): number {
  const h = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453123;
  return h - Math.floor(h);
}

function valueNoise(x: number, y: number, z: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const zi = Math.floor(z);
  const xf = x - xi;
  const yf = y - yi;
  const zf = z - zi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const w = zf * zf * (3 - 2 * zf);
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const c = (dx: number, dy: number, dz: number) => hash3(xi + dx, yi + dy, zi + dz);
  return lerp(
    lerp(lerp(c(0, 0, 0), c(1, 0, 0), u), lerp(c(0, 1, 0), c(1, 1, 0), u), v),
    lerp(lerp(c(0, 0, 1), c(1, 0, 1), u), lerp(c(0, 1, 1), c(1, 1, 1), u), v),
    w,
  );
}

function fbm(x: number, y: number, z: number): number {
  return valueNoise(x, y, z) * 0.55 + valueNoise(x * 2.1, y * 2.1, z * 2.1) * 0.3 + valueNoise(x * 4.3, y * 4.3, z * 4.3) * 0.15;
}

// --- form ---------------------------------------------------------------------

export function generateGlobeParticles(count: number, rand: Rand): Float32Array {
  const out = new Float32Array(count * 3);
  let w = 0;
  const put = (x: number, y: number, z: number) => {
    out[w * 3] = x;
    out[w * 3 + 1] = y;
    out[w * 3 + 2] = z;
    w++;
  };
  const n = (share: number) => Math.floor(count * share);

  // Continents: a lat/long dot grid (evenly spaced on the sphere), keeping
  // only dots where the noise says "land" — the dotted-map look.
  const land: [number, number, number][] = [];
  for (let lat = -Math.PI / 2 + GLOBE.dotStep; lat < Math.PI / 2; lat += GLOBE.dotStep) {
    const ring = Math.max(1, Math.round((Math.PI * 2 * Math.cos(lat)) / GLOBE.dotStep));
    for (let i = 0; i < ring; i++) {
      const lon = (i / ring) * Math.PI * 2;
      const x = Math.cos(lat) * Math.cos(lon);
      const y = Math.sin(lat);
      const z = Math.cos(lat) * Math.sin(lon);
      // Fewer landmasses toward the poles, like a real map.
      const level = GLOBE.landLevel + smoothstep(0.75, 1, Math.abs(y)) * 0.12;
      if (fbm(x * 1.6 + 5, y * 1.6 + 1, z * 1.6 + 9) > level) land.push([x, y, z]);
    }
  }
  for (let i = 0, m = n(SHARES.land); i < m; i++) {
    const [x, y, z] = land[i % Math.max(land.length, 1)] ?? [0, 1, 0];
    const r = GLOBE.radius;
    const j = GLOBE.dotJitter;
    put(x * r + (rand() - 0.5) * j * 2, y * r + (rand() - 0.5) * j * 2, z * r + (rand() - 0.5) * j * 2);
  }

  // Faint shell so the globe reads as a whole sphere, oceans included.
  for (let i = 0, m = n(SHARES.shell); i < m; i++) {
    const z = rand() * 2 - 1;
    const a = rand() * Math.PI * 2;
    const s = Math.sqrt(1 - z * z);
    const r = GLOBE.radius * (0.97 + rand() * 0.03);
    put(Math.cos(a) * s * r, Math.sin(a) * s * r, z * r);
  }

  // Network cage: bright nodes at a geodesic sphere's vertices…
  const cage = new THREE.IcosahedronGeometry(GLOBE.cageRadius, 1);
  const verts = cage.getAttribute("position").array as ArrayLike<number>;
  const vertCount = verts.length / 3;
  for (let i = 0, m = n(SHARES.cageNodes); i < m; i++) {
    const v = Math.floor(rand() * vertCount) * 3;
    const s = 0.03;
    put(verts[v] + (rand() - 0.5) * s, verts[v + 1] + (rand() - 0.5) * s, verts[v + 2] + (rand() - 0.5) * s);
  }
  // …joined by fine lines along its edges (the rest of the particles).
  geometryEdgesToParticlePositions(cage, count - w, rand, out, w);
  cage.dispose();

  // Tipped slightly toward the viewer so the depth reads as it sways.
  return transformPositions(out, [0.25, -0.2, 0], 1);
}
