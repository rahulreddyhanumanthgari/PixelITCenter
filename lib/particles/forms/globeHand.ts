import * as THREE from "three";
import {
  geometryEdgesToParticlePositions,
  geometryToParticlePositions,
  mergePositionGeometries,
  transformPositions,
} from "../geometryToParticles";
import { smoothstep, type Rand } from "../random";

/**
 * Staffing & Consulting — an open hand, palm up, holding a globe: "we've got
 * you". The globe has dotted continents on a faint shell inside a network
 * cage (glowing nodes joined by lines); the hand is a low-poly wireframe
 * reaching in from the lower left, with a few sparks rising between them.
 */

type V = [number, number, number];

const GLOBE = {
  center: [0.15, 0.6, 0] as V,
  radius: 0.95,
  cageRadius: 1.2,
  /** Spacing of the continent dot grid, radians. */
  dotStep: 0.058,
  dotJitter: 0.008,
  /** fbm threshold: higher = less land. */
  landLevel: 0.53,
} as const;

/** Share of particles per part (the hand gets the remainder). */
const SHARES = {
  land: 0.3,
  shell: 0.05,
  cageEdges: 0.14,
  cageNodes: 0.06,
  sparks: 0.02,
  arm: 0.07,
} as const;

const HAND = {
  fingerRadius: 0.09,
  thumbRadius: 0.1,
  armRadius: 0.3,
  edgeShare: 0.45,
  /** Palm centre; the hand is tilted about it. */
  pivot: [-0.35, -1.25, 0] as V,
  /** Tilts the palm toward the viewer (radians about X) so the fingers fan
   *  out on screen and the thumb points up, instead of an edge-on blob. */
  present: 0.95,
} as const;

/** Tilts a hand/arm part toward the viewer around the palm centre. */
function orient(g: THREE.BufferGeometry): THREE.BufferGeometry {
  const [px, py, pz] = HAND.pivot;
  return g.translate(-px, -py, -pz).rotateX(HAND.present).translate(px, py, pz);
}

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

// --- hand geometry -----------------------------------------------------------

function tube(points: V[], radius: number, segments = 10): THREE.BufferGeometry {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
  return new THREE.TubeGeometry(curve, segments, radius, 7, false);
}

function handParts(): THREE.BufferGeometry[] {
  const parts: THREE.BufferGeometry[] = [];
  // Palm: a flattened ellipsoid lying horizontal, facing up.
  parts.push(new THREE.SphereGeometry(1, 12, 8).scale(0.62, 0.14, 0.5).translate(-0.35, -1.25, 0));
  // Four fingers reaching right, tips curling up toward the globe.
  const lengths = [0.9, 1.0, 0.97, 0.82];
  for (let k = 0; k < 4; k++) {
    const z = -0.36 + k * 0.24;
    const l = lengths[k];
    parts.push(
      tube(
        // Fingers fan out slightly and curl up at the tips, cradling the globe.
        [
          [0.2, -1.22, z],
          [0.2 + 0.5 * l, -1.18, z * 1.12],
          [0.2 + 0.88 * l, -1.0, z * 1.22],
          [0.2 + 1.02 * l, -0.72, z * 1.26],
        ],
        HAND.fingerRadius,
      ),
    );
  }
  // Thumb: from the base of the palm, up and toward the viewer.
  parts.push(
    tube(
      [
        [-0.4, -1.15, 0.45],
        [-0.1, -0.98, 0.62],
        [0.18, -0.78, 0.58],
      ],
      HAND.thumbRadius,
      8,
    ),
  );
  return parts.map(orient);
}

function armGeometry(): THREE.BufferGeometry {
  // Tilted with the hand so it stays attached at the wrist.
  return orient(tube(
    [
      [-3.0, -2.35, 0.1],
      [-1.95, -1.78, 0.05],
      [-0.95, -1.36, 0],
    ],
    HAND.armRadius,
    14,
  ));
}

// --- form ---------------------------------------------------------------------

export function generateGlobeHandParticles(count: number, rand: Rand): Float32Array {
  const out = new Float32Array(count * 3);
  const [cx, cy, cz] = GLOBE.center;
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
  const land: V[] = [];
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
  const landCount = n(SHARES.land);
  for (let i = 0; i < landCount; i++) {
    const [x, y, z] = land[i % Math.max(land.length, 1)] ?? [0, 1, 0];
    const r = GLOBE.radius;
    const j = GLOBE.dotJitter;
    put(cx + x * r + (rand() - 0.5) * j * 2, cy + y * r + (rand() - 0.5) * j * 2, cz + z * r + (rand() - 0.5) * j * 2);
  }

  // Faint shell so the globe reads as a whole sphere, oceans included.
  for (let i = 0, m = n(SHARES.shell); i < m; i++) {
    const z = rand() * 2 - 1;
    const a = rand() * Math.PI * 2;
    const s = Math.sqrt(1 - z * z);
    const r = GLOBE.radius * (0.97 + rand() * 0.03);
    put(cx + Math.cos(a) * s * r, cy + Math.sin(a) * s * r, cz + z * r);
  }

  // Network cage: lines along a geodesic sphere's edges, plus bright nodes.
  const cage = new THREE.IcosahedronGeometry(GLOBE.cageRadius, 1).translate(cx, cy, cz);
  const edgeCount = n(SHARES.cageEdges);
  geometryEdgesToParticlePositions(cage, edgeCount, rand, out, w);
  w += edgeCount;
  const verts = cage.getAttribute("position").array as ArrayLike<number>;
  const vertCount = verts.length / 3;
  for (let i = 0, m = n(SHARES.cageNodes); i < m; i++) {
    const v = Math.floor(rand() * vertCount) * 3;
    const s = 0.025;
    put(verts[v] + (rand() - 0.5) * s, verts[v + 1] + (rand() - 0.5) * s, verts[v + 2] + (rand() - 0.5) * s);
  }
  cage.dispose();

  // Sparks drifting up from the palm toward the globe.
  for (let i = 0, m = n(SHARES.sparks); i < m; i++) {
    const t = rand();
    put(-0.5 + rand() * 1.6, -1.05 + t * 0.7, (rand() - 0.5) * 1.1);
  }

  // Arm: surface + wireframe, thinning out toward the canvas edge.
  const arm = armGeometry();
  const armNeeded = n(SHARES.arm);
  const pool = new Float32Array(armNeeded * 3 * 3);
  geometryToParticlePositions(arm, armNeeded, rand, pool, 0);
  geometryEdgesToParticlePositions(arm, armNeeded * 2, rand, pool, armNeeded);
  arm.dispose();
  for (let c = 0, kept = 0; c < armNeeded * 3 && kept < armNeeded; c++) {
    const x = pool[c * 3];
    if (rand() > 1 - smoothstep(-1.2, -3.0, x) * 0.85) continue;
    put(x, pool[c * 3 + 1], pool[c * 3 + 2]);
    kept++;
  }

  // Hand: the rest, split between surface and wireframe edges.
  const hand = mergePositionGeometries(handParts());
  const handCount = count - w;
  const handEdges = Math.floor(handCount * HAND.edgeShare);
  geometryToParticlePositions(hand, handCount - handEdges, rand, out, w);
  geometryEdgesToParticlePositions(hand, handEdges, rand, out, w + handCount - handEdges);
  hand.dispose();

  // Centre the composition and tip it slightly so the palm reads as open.
  for (let i = 0; i < count; i++) out[i * 3 + 1] += 0.35;
  return transformPositions(out, [0.3, -0.25, 0], 0.9);
}
