import * as THREE from "three";
import { transformPositions } from "../geometryToParticles";
import type { Rand } from "../random";

/**
 * How We Work — one continuous process: a flowing 3D path drawn as a dotted
 * line with a faint particle stream around it, passing through four stage
 * nodes — Discover, Plan, Deliver, Support. Each node is a particle sphere
 * with a tilted orbit ring, growing slightly along the path.
 *
 * `annotateProcessStages` tells every particle where it sits on the process
 * (which stage node, or how far along the path), so the shader can light the
 * stages up as the visitor scrolls through the steps.
 */
const PROCESS = {
  nodes: [
    [-1.75, -1.15, 0.35],
    [-0.55, -0.3, -0.35],
    [0.6, 0.35, 0.3],
    [1.75, 1.2, -0.25],
  ] as [number, number, number][],
  nodeRadii: [0.24, 0.27, 0.3, 0.34],
  ringScale: 1.75,
  nodeShare: 0.46,
  dotShare: 0.3,
  // remaining share is the stream around the path
  dotSpacing: 0.055,
  dotJitter: 0.01,
  streamRadius: 0.09,
} as const;

/** Final placement of the whole form (applied to particles and annotations). */
const TRANSFORM = { rotation: [0.1, -0.25, 0] as const, scale: 0.78 };

function buildPath() {
  const nodes = PROCESS.nodes.map((n) => new THREE.Vector3(...n));
  // Short lead-in and tail so the path clearly continues through the ends.
  const lead = nodes[0].clone().add(new THREE.Vector3(-0.45, -0.35, 0.1));
  const tail = nodes[3].clone().add(new THREE.Vector3(0.45, 0.3, -0.1));
  const curve = new THREE.CatmullRomCurve3([lead, ...nodes, tail], false, "centripetal");
  return { nodes, curve };
}

export function generateProcessParticles(count: number, rand: Rand): Float32Array {
  const { nodes, curve } = buildPath();
  const length = curve.getLength();

  const out = new Float32Array(count * 3);
  const nodeCount = Math.floor(count * PROCESS.nodeShare);
  const dotCount = Math.floor(count * PROCESS.dotShare);
  let w = 0;
  const put = (x: number, y: number, z: number) => {
    out[w * 3] = x;
    out[w * 3 + 1] = y;
    out[w * 3 + 2] = z;
    w++;
  };

  // Nodes: 65% sphere shell, 35% orbit ring, weighted toward bigger nodes.
  const weights = PROCESS.nodeRadii.map((r) => r * r);
  const wSum = weights.reduce((s, x) => s + x, 0);
  const tmp = new THREE.Vector3();
  for (let i = 0; i < nodeCount; i++) {
    let pick = rand() * wSum;
    let n = 0;
    while (pick > weights[n] && n < 3) pick -= weights[n++];
    const c = nodes[n];
    const r = PROCESS.nodeRadii[n];
    if (rand() < 0.65) {
      // Shell with a little thickness.
      const z = rand() * 2 - 1;
      const a = rand() * Math.PI * 2;
      const s = Math.sqrt(1 - z * z);
      const rr = r * (0.92 + rand() * 0.08);
      put(c.x + Math.cos(a) * s * rr, c.y + Math.sin(a) * s * rr, c.z + z * rr);
    } else {
      // Orbit ring, tilted differently per node.
      const a = rand() * Math.PI * 2;
      const rr = r * PROCESS.ringScale * (0.98 + rand() * 0.04);
      tmp.set(Math.cos(a) * rr, Math.sin(a) * rr * 0.28, Math.sin(a) * rr);
      tmp.applyAxisAngle(new THREE.Vector3(0, 0, 1), 0.5 + n * 0.35);
      put(c.x + tmp.x, c.y + tmp.y, c.z + tmp.z);
    }
  }

  // Dotted line: evenly spaced dots along the path (tight clusters).
  const dotSlots = Math.max(1, Math.floor(length / PROCESS.dotSpacing));
  const p = new THREE.Vector3();
  for (let i = 0; i < dotCount; i++) {
    const u = (i % dotSlots) / dotSlots;
    curve.getPointAt(u, p);
    const j = PROCESS.dotJitter;
    put(p.x + (rand() - 0.5) * j * 2, p.y + (rand() - 0.5) * j * 2, p.z + (rand() - 0.5) * j * 2);
  }

  // Stream: a faint tube of particles flowing along the path.
  while (w < count) {
    curve.getPointAt(rand(), p);
    const a = rand() * Math.PI * 2;
    const rr = PROCESS.streamRadius * Math.sqrt(rand());
    put(p.x + Math.cos(a) * rr, p.y + Math.sin(a) * rr, p.z + (rand() - 0.5) * rr * 2);
  }

  return transformPositions(out, TRANSFORM.rotation, TRANSFORM.scale);
}

/**
 * For each particle of the (final, aligned) process form, returns
 * `[stage, isNode]`:
 * - node particles: `stage` = the node index (0 Discover … 3 Support), isNode 1
 * - path particles: `stage` = position along the process in stage units —
 *   between node k and k+1 it runs k → k+1; the lead-in is -0.5 → 0 and the
 *   tail 3 → 3.5 — isNode 0.
 */
export function annotateProcessStages(positions: Float32Array): Float32Array {
  const { nodes, curve } = buildPath();
  const count = positions.length / 3;
  const out = new Float32Array(count * 2);

  // Put the path into the same space as the particles.
  const place = (v: THREE.Vector3) =>
    v.applyMatrix4(
      new THREE.Matrix4()
        .makeRotationFromEuler(new THREE.Euler(...TRANSFORM.rotation))
        .multiply(new THREE.Matrix4().makeScale(TRANSFORM.scale, TRANSFORM.scale, TRANSFORM.scale)),
    );
  const centers = nodes.map((n) => place(n.clone()));
  const nodeReach = PROCESS.nodeRadii.map((r) => r * PROCESS.ringScale * 1.15 * TRANSFORM.scale);

  // Dense samples along the path, each with its arc-length parameter u.
  const SAMPLES = 240;
  const samples = Array.from({ length: SAMPLES + 1 }, (_, i) => place(curve.getPointAt(i / SAMPLES)));
  const uOfNearest = (x: number, y: number, z: number) => {
    let best = 0;
    let bestD = Infinity;
    for (let i = 0; i <= SAMPLES; i++) {
      const s = samples[i];
      const d = (s.x - x) ** 2 + (s.y - y) ** 2 + (s.z - z) ** 2;
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    return best / SAMPLES;
  };
  const nodeU = centers.map((c) => uOfNearest(c.x, c.y, c.z));
  const stageOfU = (u: number) => {
    if (u <= nodeU[0]) return -0.5 + 0.5 * (u / Math.max(nodeU[0], 1e-6));
    for (let k = 0; k < 3; k++) {
      if (u <= nodeU[k + 1]) return k + (u - nodeU[k]) / Math.max(nodeU[k + 1] - nodeU[k], 1e-6);
    }
    return 3 + 0.5 * ((u - nodeU[3]) / Math.max(1 - nodeU[3], 1e-6));
  };

  for (let i = 0; i < count; i++) {
    const x = positions[i * 3];
    const y = positions[i * 3 + 1];
    const z = positions[i * 3 + 2];
    let node = -1;
    for (let k = 0; k < 4; k++) {
      const c = centers[k];
      if ((c.x - x) ** 2 + (c.y - y) ** 2 + (c.z - z) ** 2 < nodeReach[k] ** 2) {
        node = k;
        break;
      }
    }
    out[i * 2] = node >= 0 ? node : stageOfU(uOfNearest(x, y, z));
    out[i * 2 + 1] = node >= 0 ? 1 : 0;
  }
  return out;
}
