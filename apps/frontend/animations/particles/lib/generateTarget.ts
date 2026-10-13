import * as THREE from "three";
import {
  colorRocketParticles,
  generateRocketParticles,
} from "./generateRocketParticles";
import { PALETTE_LINEAR, pushColor } from "./palette";
import { mulberry32, smoothstep, type Rand } from "./random";
import { generateRingStreamParticles } from "./forms/ringStream";
import { generateEarthParticles } from "./forms/earth";
import { generateTorusFlowParticles } from "./forms/torusFlow";
import {
  annotateSolarSystem,
  generateSolarSystemParticles,
} from "./forms/solarSystem";

/**
 * Every form the particles can assemble into. To add one: write a generator
 * that returns `count` xyz positions (roughly within a radius of ~2.5 units)
 * and add it here; then list it in MORPH_SEQUENCE (particle-config.ts).
 */
export type FormName =
  | "rocket"
  | "heroField"
  | "ringStream"
  | "earth"
  | "torusFlow"
  | "solarSystem"
  | "galaxy";

interface FormDefinition {
  generate: (count: number, rand: Rand) => Float32Array;
  /** Optional colouring used when this form is the first in the sequence. */
  colorize?: (positions: Float32Array) => Float32Array;
  /**
   * Optional per-particle `[stage, role, a, b, c]` data for a form whose
   * parts light up in steps (the How We Work solar system). Computed on the
   * final aligned positions.
   */
  annotate?: (positions: Float32Array) => Float32Array;
}

export const FORMS: Record<FormName, FormDefinition> = {
  rocket: {
    generate: (count, rand) =>
      generateRocketParticles(count, Math.floor(rand() * 1e9)),
    colorize: (positions) => colorRocketParticles(positions),
  },
  // Landing hero: the journey particles as a full-screen gravity field. The
  // shader computes their live positions (heroField in particle.vert.glsl);
  // this flat disc only sets the shared particle order, and the colours are
  // the rocket's, so the palette is unchanged.
  heroField: {
    generate: (count, rand) => {
      const out = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        const r = 4 * Math.sqrt(rand());
        const a = rand() * Math.PI * 2;
        out[i * 3] = Math.cos(a) * r;
        out[i * 3 + 1] = Math.sin(a) * r;
        out[i * 3 + 2] = (rand() - 0.5) * 0.4;
      }
      return out;
    },
    // Exactly the colours the rocket used to give each particle (same seed,
    // same height order), so every later form keeps its colour layout.
    colorize: (positions) =>
      colorRocketParticles(generateForm("rocket", positions.length / 3, 101)),
  },
  // Section story forms (Services → Staffing → Why us → How we work).
  // Live flowing form: the shader moves these particles (ringStream).
  ringStream: { generate: generateRingStreamParticles },
  // Live form: the shader spins the Earth and its shell (earthSpin).
  earth: { generate: generateEarthParticles },
  // Live flowing form: the shader moves these particles (torusFlow).
  torusFlow: { generate: generateTorusFlowParticles },
  // Live form: the shader places planets, rings and trails (solarSystem).
  solarSystem: {
    generate: generateSolarSystemParticles,
    annotate: annotateSolarSystem,
  },
  // Live form: About's spiral galaxy, placed by the shader (galaxy). This
  // flat disc only sets the particle order and arrival timing.
  galaxy: {
    generate: (count, rand) => {
      const out = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        const r = 3.9 * Math.sqrt(rand());
        const a = rand() * Math.PI * 2;
        out[i * 3] = Math.cos(a) * r;
        out[i * 3 + 1] = Math.sin(a) * r;
      }
      return out;
    },
  },
};

/**
 * Reorders a form's points by height (with a little jitter). Applied to every
 * form, this makes particle i sit at a similar relative height in each one —
 * so a particle's colour stays in the same region as it travels (the rocket's
 * orange plume becomes the bottom of the sphere, its nose the top) and the
 * viewer can follow the material between forms.
 */
function alignByHeight(positions: Float32Array, rand: Rand): Float32Array {
  const count = positions.length / 3;
  let minY = Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < count; i++) {
    const y = positions[i * 3 + 1];
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  const range = Math.max(maxY - minY, 1e-6);
  const keys = new Float32Array(count);
  const order = new Uint32Array(count);
  for (let i = 0; i < count; i++) {
    keys[i] = (positions[i * 3 + 1] - minY) / range + (rand() - 0.5) * 0.18;
    order[i] = i;
  }
  order.sort((a, b) => keys[a] - keys[b]);

  const sorted = new Float32Array(positions.length);
  for (let k = 0; k < count; k++) {
    const i = order[k];
    sorted[k * 3] = positions[i * 3];
    sorted[k * 3 + 1] = positions[i * 3 + 1];
    sorted[k * 3 + 2] = positions[i * 3 + 2];
  }
  return sorted;
}

/** Positions for a named form, aligned so every form shares a particle order. */
export function generateForm(
  name: FormName,
  count: number,
  seed: number,
): Float32Array {
  const rand = mulberry32(seed);
  return alignByHeight(FORMS[name].generate(count, rand), rand);
}

/**
 * Per-particle colours, fixed for the whole sequence: each particle carries
 * its colour from form to form. Uses the first form's own colouring if it has
 * one, otherwise a soft blue → white → orange blend with noise.
 */
export function colorsForSequence(
  firstForm: FormName,
  positions: Float32Array,
  seed = 3,
): Float32Array {
  const custom = FORMS[firstForm].colorize;
  if (custom) return custom(positions);

  const rand = mulberry32(seed);
  const count = positions.length / 3;
  const colors = new Float32Array(count * 3);
  const c = new THREE.Color();
  const { orange, gold, white, blue, deepBlue } = PALETTE_LINEAR;
  for (let i = 0; i < count; i++) {
    const x = positions[i * 3];
    const y = positions[i * 3 + 1];
    const n =
      Math.sin(x * 2.1 + y * 1.3) * 0.5 + Math.sin(y * 3.7 - x * 1.9) * 0.3;
    const warmth = smoothstep(-0.6, 0.6, -y * 0.6 + n * 0.5);
    c.copy(blue)
      .lerp(deepBlue, rand() * 0.5)
      .lerp(orange, warmth)
      .lerp(gold, warmth * rand() * 0.4);
    c.lerp(white, smoothstep(0.3, 1, n) * 0.6);
    const s = rand();
    pushColor(
      colors,
      i,
      c,
      s > 0.97 ? 1.7 : s < 0.22 ? 0.5 : 0.8 + rand() * 0.3,
    );
  }
  return colors;
}

/**
 * Stage data for the (single) form in a sequence that has an `annotate`
 * function, plus its index — or null when no form in the sequence has one.
 */
export function stageDataFor(
  names: readonly FormName[],
  forms: Float32Array[],
): { index: number; data: Float32Array } | null {
  const index = names.findIndex((n) => FORMS[n].annotate);
  if (index < 0) return null;
  const annotate = FORMS[names[index]].annotate;
  return annotate ? { index, data: annotate(forms[index]) } : null;
}
