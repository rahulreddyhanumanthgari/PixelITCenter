import * as THREE from "three";
import { mulberry32, randomUnitVector } from "@/lib/particles/random";
import type { MorphState } from "./types";

export type { MorphState };

/** Turns a driving value into the (from, to, t) the shader needs. */
export type MorphResolver = (value: number, formCount: number) => MorphState;

/**
 * Resolver for a "form position": 0 = first form, 1 = second, 2.5 = halfway
 * between the third and fourth… Each scroll trigger drives one transition
 * 0→1 and their values are added up, so this is a pure function of scroll —
 * scrubbing backwards retraces it exactly, and stopping midway holds midway.
 */
export function resolveFormPosition(position: number, formCount: number): MorphState {
  const last = formCount - 1;
  if (last <= 0) return { from: 0, to: 0, t: 0 };
  const p = Math.min(Math.max(position, 0), last);
  const from = Math.min(Math.floor(p), last - 1);
  return { from, to: from + 1, t: p - from };
}

/**
 * Builds the one BufferGeometry every form shares. `position` holds the
 * current form and `aTarget` the next; the rest are fixed per-particle
 * attributes (colour, delays, scatter direction…) that never change, which is
 * why a particle keeps its colour and character from form to form.
 */
export function createMorphGeometry(forms: Float32Array[], colors: Float32Array, seed = 21): THREE.BufferGeometry {
  const count = forms[0].length / 3;
  const rand = mulberry32(seed);

  const randoms = new Float32Array(count);
  const delays = new Float32Array(count);
  const scatterDirs = new Float32Array(count * 3);
  const scatterDistances = new Float32Array(count);
  const noiseOffsets = new Float32Array(count * 3);
  const scales = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    randoms[i] = rand();
    delays[i] = rand();
    randomUnitVector(rand, scatterDirs, i);
    // Most particles spread moderately, a few fly far — gives the field depth.
    scatterDistances[i] = 1.1 + Math.pow(rand(), 0.85) * 2.8;
    noiseOffsets[i * 3] = rand() * Math.PI * 2;
    noiseOffsets[i * 3 + 1] = rand() * Math.PI * 2;
    noiseOffsets[i * 3 + 2] = rand() * Math.PI * 2;
    const s = rand();
    scales[i] = s > 0.985 ? 1.8 + rand() * 0.8 : 0.45 + s * 0.75;
  }

  const geometry = new THREE.BufferGeometry();
  const position = new THREE.BufferAttribute(new Float32Array(forms[0]), 3);
  const target = new THREE.BufferAttribute(new Float32Array(forms[1] ?? forms[0]), 3);
  position.setUsage(THREE.DynamicDrawUsage);
  target.setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute("position", position);
  geometry.setAttribute("aTarget", target);
  geometry.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute("aRandom", new THREE.BufferAttribute(randoms, 1));
  geometry.setAttribute("aDelay", new THREE.BufferAttribute(delays, 1));
  geometry.setAttribute("aScatterDir", new THREE.BufferAttribute(scatterDirs, 3));
  geometry.setAttribute("aScatterDistance", new THREE.BufferAttribute(scatterDistances, 1));
  geometry.setAttribute("aNoiseOffset", new THREE.BufferAttribute(noiseOffsets, 3));
  geometry.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));
  return geometry;
}

/**
 * Keeps the geometry's (from, to) pair in step with the timeline. Uploads new
 * form data only when the pair changes — i.e. once per transition boundary,
 * where from and to are visually identical, so the swap is invisible.
 */
export class MorphController {
  private from = 0;
  private to = 1;

  constructor(
    private readonly geometry: THREE.BufferGeometry,
    private readonly forms: Float32Array[],
    private readonly resolve: MorphResolver,
  ) {
    this.to = Math.min(1, forms.length - 1);
  }

  /** Returns the shader progress for this driving value. */
  update(value: number): number {
    const state = this.resolve(value, this.forms.length);
    if (state.from !== this.from || state.to !== this.to) {
      this.from = state.from;
      this.to = state.to;
      const position = this.geometry.getAttribute("position") as THREE.BufferAttribute;
      const target = this.geometry.getAttribute("aTarget") as THREE.BufferAttribute;
      (position.array as Float32Array).set(this.forms[this.from]);
      (target.array as Float32Array).set(this.forms[this.to]);
      position.needsUpdate = true;
      target.needsUpdate = true;
    }
    return state.t;
  }
}
