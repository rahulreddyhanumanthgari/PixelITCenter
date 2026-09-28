import * as THREE from "three";
import {
  geometryEdgesToParticlePositions,
  geometryToParticlePositions,
  mergePositionGeometries,
  transformPositions,
} from "../geometryToParticles";
import { smoothstep, type Rand } from "../random";

/**
 * Staffing & Consulting — a 3D handshake as a point-cloud wireframe. One arm
 * reaches in from the lower left, the other from the upper right; the right
 * hand's fingers curl around the back of the left hand (the row of knuckles
 * at the front), both thumbs cross the top, and the left hand's fingertips
 * show past the right palm. Low-poly parts sampled on surfaces *and* along
 * triangle edges give the wireframe character.
 */

type V = [number, number, number];

const HAND = {
  fingerRadius: 0.085,
  thumbRadius: 0.092,
  armRadius: 0.34,
  palmRadii: [0.62, 0.42, 0.17] as V,
  /** Share of particles on the hands (rest go to the arms). */
  handShare: 0.72,
  /** Of the hand particles, share drawn along edges (wireframe). */
  edgeShare: 0.45,
  scale: 0.88,
} as const;

function tube(points: V[], radius: number, segments = 10): THREE.BufferGeometry {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
  return new THREE.TubeGeometry(curve, segments, radius, 7, false);
}

function palm(center: V, rotationZ: number): THREE.BufferGeometry {
  const [rx, ry, rz] = HAND.palmRadii;
  return new THREE.SphereGeometry(1, 12, 8)
    .scale(rx, ry, rz)
    .rotateZ(rotationZ)
    .translate(center[0], center[1], center[2]);
}

function handParts(): THREE.BufferGeometry[] {
  const parts: THREE.BufferGeometry[] = [];

  // Left hand: palm behind, fingers running right behind the other palm.
  parts.push(palm([-0.45, -0.05, -0.08], 0.25));
  for (let k = 0; k < 4; k++) {
    const y = 0.22 - k * 0.15;
    const reach = k === 0 || k === 3 ? 0.92 : 1.0;
    parts.push(
      tube(
        [
          [0.1, y, -0.12],
          [0.6 * reach, y + 0.04, -0.2],
          [1.0 * reach, y + 0.02, -0.12],
          [1.22 * reach, y - 0.05, 0.02],
        ],
        HAND.fingerRadius,
      ),
    );
  }
  parts.push(
    tube(
      [
        [-0.35, 0.3, 0.02],
        [0.0, 0.5, 0.12],
        [0.32, 0.58, 0.18],
      ],
      HAND.thumbRadius,
      8,
    ),
  );

  // Right hand: palm in front, fingers curling down around the left hand.
  parts.push(palm([0.45, 0.2, 0.2], 0.35));
  for (let k = 0; k < 4; k++) {
    const x = -k * 0.25;
    parts.push(
      tube(
        [
          [x + 0.1, 0.02, 0.3],
          [x - 0.05, -0.34, 0.44],
          [x - 0.12, -0.62, 0.24],
          [x - 0.1, -0.62, -0.05],
        ],
        HAND.fingerRadius + 0.012,
      ),
    );
  }
  parts.push(
    tube(
      [
        [0.15, 0.42, 0.26],
        [-0.25, 0.53, 0.3],
        [-0.65, 0.43, 0.24],
      ],
      HAND.thumbRadius,
      8,
    ),
  );
  return parts;
}

function armParts(): THREE.BufferGeometry[] {
  return [
    tube(
      [
        [-2.8, -0.95, 0],
        [-1.9, -0.62, 0],
        [-1.0, -0.25, -0.02],
      ],
      HAND.armRadius,
      14,
    ),
    tube(
      [
        [2.8, 1.08, 0.05],
        [1.95, 0.78, 0.08],
        [1.05, 0.45, 0.14],
      ],
      HAND.armRadius,
      14,
    ),
  ];
}

export function generateHandshakeParticles(count: number, rand: Rand): Float32Array {
  const out = new Float32Array(count * 3);
  const handCount = Math.floor(count * HAND.handShare);
  const edgeCount = Math.floor(handCount * HAND.edgeShare);
  const surfaceCount = handCount - edgeCount;

  const hands = mergePositionGeometries(handParts());
  geometryToParticlePositions(hands, surfaceCount, rand, out, 0);
  geometryEdgesToParticlePositions(hands, edgeCount, rand, out, surfaceCount);
  hands.dispose();

  // Arms: half surface, half wireframe, thinning out toward the canvas edge
  // (rejection sampling) so the hands stay the focus.
  const arms = mergePositionGeometries(armParts());
  const armNeeded = count - handCount;
  const pool = armNeeded * 3;
  const candidates = new Float32Array(pool * 3);
  geometryToParticlePositions(arms, Math.floor(pool / 2), rand, candidates, 0);
  geometryEdgesToParticlePositions(arms, pool - Math.floor(pool / 2), rand, candidates, Math.floor(pool / 2));
  arms.dispose();

  // Visit candidates alternately from the surface half and the edge half so
  // both kinds survive evenly.
  const half = Math.floor(pool / 2);
  let written = handCount;
  for (let c = 0; c < pool && written < count; c++) {
    const idx = c % 2 === 0 ? c / 2 : half + (c - 1) / 2;
    if (idx >= pool) continue;
    const x = candidates[idx * 3];
    const keep = 1 - smoothstep(1.0, 2.8, Math.abs(x)) * 0.85;
    if (rand() > keep) continue;
    out[written * 3] = x;
    out[written * 3 + 1] = candidates[idx * 3 + 1];
    out[written * 3 + 2] = candidates[idx * 3 + 2];
    written++;
  }
  // Rejection keeps ~60%, so a 3× pool is ample; if it ever falls short,
  // reuse random hand particles rather than leaving zeros at the origin.
  for (; written < count; written++) {
    const j = Math.floor(rand() * handCount) * 3;
    out[written * 3] = out[j];
    out[written * 3 + 1] = out[j + 1];
    out[written * 3 + 2] = out[j + 2];
  }

  return transformPositions(out, [0.12, -0.28, 0], HAND.scale);
}
