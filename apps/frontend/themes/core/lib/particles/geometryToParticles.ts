import * as THREE from "three";
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler.js";
import type { Rand } from "./random";

type SeedableSampler = MeshSurfaceSampler & {
  setRandomGenerator(random: () => number): MeshSurfaceSampler;
};

/**
 * Samples `count` points spread evenly (by area) over a geometry's surface.
 * Works for any vertex count, so every form can use the same particle count.
 *
 * Pass `out` + `offset` to write into part of a larger array (used when a form
 * is built from several pieces). Returns the array written to.
 */
export function geometryToParticlePositions(
  geometry: THREE.BufferGeometry,
  count: number,
  rand: Rand = Math.random,
  out: Float32Array = new Float32Array(count * 3),
  offset = 0,
): Float32Array {
  const mesh = new THREE.Mesh(geometry);
  // setRandomGenerator exists in three's source but is missing from
  // @types/three; it makes sampling deterministic (same shape every load).
  const sampler = new MeshSurfaceSampler(mesh) as SeedableSampler;
  sampler.setRandomGenerator(rand);
  sampler.build();
  const p = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    sampler.sample(p);
    const j = (offset + i) * 3;
    out[j] = p.x;
    out[j + 1] = p.y;
    out[j + 2] = p.z;
  }
  return out;
}

/**
 * Samples `count` points along a geometry's triangle edges (weighted by edge
 * length). On a low-poly geometry this reads as a wireframe drawn in points.
 */
export function geometryEdgesToParticlePositions(
  geometry: THREE.BufferGeometry,
  count: number,
  rand: Rand = Math.random,
  out: Float32Array = new Float32Array(count * 3),
  offset = 0,
): Float32Array {
  const g = geometry.index ? geometry.toNonIndexed() : geometry;
  const pos = g.getAttribute("position").array as ArrayLike<number>;
  const triCount = pos.length / 9;

  // Every triangle contributes its three edges; shared edges simply get
  // sampled a little more, which is invisible at particle scale.
  const edgeCount = triCount * 3;
  const cumulative = new Float32Array(edgeCount);
  let total = 0;
  for (let t = 0; t < triCount; t++) {
    for (let e = 0; e < 3; e++) {
      const a = t * 9 + e * 3;
      const b = t * 9 + ((e + 1) % 3) * 3;
      total += Math.hypot(pos[b] - pos[a], pos[b + 1] - pos[a + 1], pos[b + 2] - pos[a + 2]);
      cumulative[t * 3 + e] = total;
    }
  }

  for (let i = 0; i < count; i++) {
    const r = rand() * total;
    let lo = 0;
    let hi = edgeCount - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (cumulative[mid] < r) lo = mid + 1;
      else hi = mid;
    }
    const t = Math.floor(lo / 3);
    const e = lo % 3;
    const a = t * 9 + e * 3;
    const b = t * 9 + ((e + 1) % 3) * 3;
    const f = rand();
    const j = (offset + i) * 3;
    out[j] = pos[a] + (pos[b] - pos[a]) * f;
    out[j + 1] = pos[a + 1] + (pos[b + 1] - pos[a + 1]) * f;
    out[j + 2] = pos[a + 2] + (pos[b + 2] - pos[a + 2]) * f;
  }
  if (g !== geometry) g.dispose();
  return out;
}

/** Joins position-only copies of several geometries into one. */
export function mergePositionGeometries(parts: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const arrays = parts.map((p) => {
    const g = p.index ? p.toNonIndexed() : p;
    return g.getAttribute("position").array as Float32Array;
  });
  const merged = new Float32Array(arrays.reduce((n, a) => n + a.length, 0));
  let o = 0;
  for (const a of arrays) {
    merged.set(a, o);
    o += a.length;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(merged, 3));
  return g;
}

/** Applies a rotation (radians, XYZ order) and scale to xyz positions in place. */
export function transformPositions(
  positions: Float32Array,
  rotation: readonly [number, number, number],
  scale = 1,
): Float32Array {
  const m = new THREE.Matrix4()
    .makeRotationFromEuler(new THREE.Euler(rotation[0], rotation[1], rotation[2]))
    .multiply(new THREE.Matrix4().makeScale(scale, scale, scale));
  const v = new THREE.Vector3();
  for (let i = 0; i < positions.length; i += 3) {
    v.set(positions[i], positions[i + 1], positions[i + 2]).applyMatrix4(m);
    positions[i] = v.x;
    positions[i + 1] = v.y;
    positions[i + 2] = v.z;
  }
  return positions;
}
