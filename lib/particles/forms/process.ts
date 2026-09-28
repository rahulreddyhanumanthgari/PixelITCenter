import * as THREE from "three";
import type { Rand } from "../random";

/**
 * How We Work — one straight particle path with exactly four checkpoints:
 *
 *   01 ──────── 02 ──────── 03 ──────── 04
 *
 * A dotted spine, a soft particle stream around it and two faint parallel
 * rails, with a small dense cluster + thin ring at each checkpoint. Tipped a
 * little in 3D so it has depth as it sways.
 *
 * `annotateProcessStages` gives each particle its place on the process
 * (checkpoint index, or position along the path in stage units) so the
 * shader can light checkpoints up as the visitor scrolls the steps.
 */
const PATH = {
  /** Checkpoint x positions (local units). */
  first: -1.95,
  spacing: 1.3,
  /** The path runs a little past the first/last checkpoint. */
  overhang: 0.45,
  core: 0.1,
  ring: 0.22,
  railOffset: 0.2,
  dotSpacing: 0.045,
  shares: { nodes: 0.34, dots: 0.34, stream: 0.22 }, // remainder: rails
} as const;

/** Final placement of the whole form (applied to particles and annotations). */
const TRANSFORM = { rotation: [0.32, -0.42, 0.02] as const, scale: 0.74 };

const nodeX = (k: number) => PATH.first + k * PATH.spacing;
const START = nodeX(0) - PATH.overhang;
const END = nodeX(3) + PATH.overhang;

function placement(): THREE.Matrix4 {
  return new THREE.Matrix4()
    .makeRotationFromEuler(new THREE.Euler(...TRANSFORM.rotation))
    .multiply(new THREE.Matrix4().makeScale(TRANSFORM.scale, TRANSFORM.scale, TRANSFORM.scale));
}

export function generateProcessParticles(count: number, rand: Rand): Float32Array {
  const out = new Float32Array(count * 3);
  let w = 0;
  const put = (x: number, y: number, z: number) => {
    out[w * 3] = x;
    out[w * 3 + 1] = y;
    out[w * 3 + 2] = z;
    w++;
  };
  const gauss = () => (rand() + rand() + rand() - 1.5) / 1.5;
  const n = (share: number) => Math.floor(count * share);

  // Checkpoints: 60% dense core shell, 40% thin ring facing the viewer.
  for (let i = 0, m = n(PATH.shares.nodes); i < m; i++) {
    const x0 = nodeX(i % 4);
    if (rand() < 0.6) {
      const z = rand() * 2 - 1;
      const a = rand() * Math.PI * 2;
      const s = Math.sqrt(1 - z * z);
      const r = PATH.core * (0.75 + rand() * 0.25);
      put(x0 + Math.cos(a) * s * r, Math.sin(a) * s * r, z * r);
    } else {
      const a = rand() * Math.PI * 2;
      const r = PATH.ring * (0.98 + rand() * 0.04);
      put(x0 + Math.cos(a) * r * 0.35, Math.sin(a) * r, Math.cos(a) * r);
    }
  }

  // Dotted spine: evenly spaced tight dots along the straight path.
  const slots = Math.max(1, Math.floor((END - START) / PATH.dotSpacing));
  for (let i = 0, m = n(PATH.shares.dots); i < m; i++) {
    const x = START + ((i % slots) / slots) * (END - START);
    put(x + gauss() * 0.004, gauss() * 0.006, gauss() * 0.006);
  }

  // Stream: a soft band of particles flowing around the spine.
  for (let i = 0, m = n(PATH.shares.stream); i < m; i++) {
    put(START + rand() * (END - START), gauss() * 0.05, gauss() * 0.05);
  }

  // Two faint parallel rails.
  while (w < count) {
    const side = rand() < 0.5 ? -1 : 1;
    put(START + rand() * (END - START), side * PATH.railOffset + gauss() * 0.01, gauss() * 0.02);
  }

  const m = placement();
  const v = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    v.set(out[i * 3], out[i * 3 + 1], out[i * 3 + 2]).applyMatrix4(m);
    out[i * 3] = v.x;
    out[i * 3 + 1] = v.y;
    out[i * 3 + 2] = v.z;
  }
  return out;
}

/**
 * For each particle of the (final, aligned) process form, returns
 * `[stage, isNode, cx, cy, cz]` — c = its checkpoint's centre (nodes only):
 * - checkpoint particles: `stage` = checkpoint index (0 Discover … 3 Support), isNode 1
 * - path particles: `stage` = position along the path in stage units
 *   (-0.35 at the start … 3.35 at the end), isNode 0.
 */
export function annotateProcessStages(positions: Float32Array): Float32Array {
  const count = positions.length / 3;
  const out = new Float32Array(count * 5);
  const m = placement();
  const inverse = m.clone().invert();
  const centers = [0, 1, 2, 3].map((k) => new THREE.Vector3(nodeX(k), 0, 0).applyMatrix4(m));
  const v = new THREE.Vector3();
  const reach = PATH.ring * 1.35;

  for (let i = 0; i < count; i++) {
    v.set(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]).applyMatrix4(inverse);
    const stage = (v.x - PATH.first) / PATH.spacing;
    const k = Math.round(stage);
    const onRail = Math.abs(Math.abs(v.y) - PATH.railOffset) < 0.06;
    const isNode = k >= 0 && k <= 3 && !onRail && Math.hypot(v.x - nodeX(k), v.y, v.z) < reach;
    out[i * 5] = isNode ? k : stage;
    out[i * 5 + 1] = isNode ? 1 : 0;
    if (isNode) {
      out[i * 5 + 2] = centers[k].x;
      out[i * 5 + 3] = centers[k].y;
      out[i * 5 + 4] = centers[k].z;
    }
  }
  return out;
}
