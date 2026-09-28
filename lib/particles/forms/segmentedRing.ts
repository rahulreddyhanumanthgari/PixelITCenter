import * as THREE from "three";
import { geometryToParticlePositions, transformPositions } from "../geometryToParticles";
import type { Rand } from "../random";

/**
 * Why Pixel IT Center — a large ring built from separate block segments
 * (annular sectors with real thickness), tilted in space. Particles are
 * scattered unevenly over each block's faces, fine dotted lines trace every
 * block's edges, and a little stray dust drifts around the ring.
 */
const RING = {
  segments: 12,
  innerRadius: 1.25,
  outerRadius: 2.0,
  depth: 0.55,
  /** Gap between neighbouring blocks, radians. */
  gap: 0.05,
  surfaceShare: 0.68,
  edgeShare: 0.26,
  // remaining share is loose dust
  scale: 0.95,
} as const;

interface Block {
  a0: number;
  a1: number;
  inner: number;
  outer: number;
  z0: number;
  z1: number;
  weight: number;
}

function blockGeometry(b: Block): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(Math.cos(b.a0) * b.outer, Math.sin(b.a0) * b.outer);
  shape.absarc(0, 0, b.outer, b.a0, b.a1, false);
  shape.lineTo(Math.cos(b.a1) * b.inner, Math.sin(b.a1) * b.inner);
  shape.absarc(0, 0, b.inner, b.a1, b.a0, true);
  shape.closePath();
  const g = new THREE.ExtrudeGeometry(shape, { depth: b.z1 - b.z0, bevelEnabled: false, curveSegments: 16 });
  g.translate(0, 0, b.z0);
  return g;
}

/** A point on one of a block's 12 edges, picked by edge length. */
function blockEdgePoint(b: Block, rand: Rand, out: Float32Array, j: number): void {
  const arcOuter = (b.a1 - b.a0) * b.outer;
  const arcInner = (b.a1 - b.a0) * b.inner;
  const radial = b.outer - b.inner;
  const depth = b.z1 - b.z0;
  // 4 arcs (outer/inner × front/back), 4 radial lines, 4 depth lines.
  const lengths = [arcOuter, arcOuter, arcInner, arcInner, radial, radial, radial, radial, depth, depth, depth, depth];
  const total = lengths.reduce((s, l) => s + l, 0);
  let r = rand() * total;
  let e = 0;
  while (r > lengths[e] && e < lengths.length - 1) r -= lengths[e++];
  const f = rand();
  let angle: number;
  let radius: number;
  let z: number;
  if (e < 4) {
    angle = b.a0 + (b.a1 - b.a0) * f;
    radius = e < 2 ? b.outer : b.inner;
    z = e % 2 === 0 ? b.z0 : b.z1;
  } else if (e < 8) {
    angle = e < 6 ? b.a0 : b.a1;
    radius = b.inner + radial * f;
    z = e % 2 === 0 ? b.z0 : b.z1;
  } else {
    angle = e < 10 ? b.a0 : b.a1;
    radius = e % 2 === 0 ? b.inner : b.outer;
    z = b.z0 + depth * f;
  }
  out[j] = Math.cos(angle) * radius;
  out[j + 1] = Math.sin(angle) * radius;
  out[j + 2] = z;
}

export function generateSegmentedRingParticles(count: number, rand: Rand): Float32Array {
  const step = (Math.PI * 2) / RING.segments;
  const blocks: Block[] = [];
  for (let s = 0; s < RING.segments; s++) {
    // Slight per-block variation keeps it engineered but not sterile.
    const push = (rand() - 0.5) * 0.06;
    const zShift = (rand() - 0.5) * 0.08;
    blocks.push({
      a0: s * step + RING.gap / 2,
      a1: (s + 1) * step - RING.gap / 2,
      inner: RING.innerRadius + push,
      outer: RING.outerRadius + push,
      z0: -RING.depth / 2 + zShift,
      z1: RING.depth / 2 + zShift,
      weight: 0.6 + rand() * 0.8,
    });
  }
  const totalWeight = blocks.reduce((s, b) => s + b.weight, 0);

  const out = new Float32Array(count * 3);
  const surfaceCount = Math.floor(count * RING.surfaceShare);
  const edgeCount = Math.floor(count * RING.edgeShare);
  let written = 0;

  // Surfaces: irregular density — each block gets its own share, and a part
  // of each share is gathered into small clumps.
  blocks.forEach((b, i) => {
    const n =
      i === blocks.length - 1
        ? surfaceCount - written
        : Math.floor((surfaceCount * b.weight) / totalWeight);
    const g = blockGeometry(b);
    geometryToParticlePositions(g, n, rand, out, written);
    g.dispose();
    const clumped = Math.floor(n * 0.18);
    for (let k = 0; k < clumped; k++) {
      const src = (written + Math.floor(rand() * n)) * 3;
      const dst = (written + k) * 3;
      out[dst] = out[src] + (rand() - 0.5) * 0.06;
      out[dst + 1] = out[src + 1] + (rand() - 0.5) * 0.06;
      out[dst + 2] = out[src + 2] + (rand() - 0.5) * 0.06;
    }
    written += n;
  });

  for (let k = 0; k < edgeCount; k++, written++) {
    const b = blocks[Math.floor(rand() * blocks.length)];
    blockEdgePoint(b, rand, out, written * 3);
    // Hair-thin lines: tiny jitter only.
    out[written * 3] += (rand() - 0.5) * 0.008;
    out[written * 3 + 1] += (rand() - 0.5) * 0.008;
  }

  // Loose dust around the ring.
  for (; written < count; written++) {
    const a = rand() * Math.PI * 2;
    const r = RING.innerRadius - 0.2 + rand() * (RING.outerRadius - RING.innerRadius + 0.5);
    out[written * 3] = Math.cos(a) * r;
    out[written * 3 + 1] = Math.sin(a) * r;
    out[written * 3 + 2] = (rand() - 0.5) * RING.depth * 2;
  }

  // Tilt so it reads as a ring seen at an angle, like an object in space.
  return transformPositions(out, [0.95, 0.3, -0.62], RING.scale);
}
