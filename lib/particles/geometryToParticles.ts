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
