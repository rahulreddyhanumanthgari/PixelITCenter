import * as THREE from "three";
import { geometryToParticlePositions } from "./geometryToParticles";
import { colorRocketParticles, generateRocketParticles } from "./generateRocketParticles";
import { PALETTE_LINEAR, pushColor } from "./palette";
import { mulberry32, smoothstep, type Rand } from "./random";
import { generateServicesParticles } from "./forms/services";
import { generateGlobeParticles } from "./forms/globe";
import { generateTorusFlowParticles } from "./forms/torusFlow";
import { annotateProcessStages, generateProcessParticles } from "./forms/process";

/**
 * Every form the particles can assemble into. To add one: write a generator
 * that returns `count` xyz positions (roughly within a radius of ~2.5 units)
 * and add it here; then list it in MORPH_SEQUENCE (particle-config.ts).
 */
export type FormName =
  | "rocket"
  | "sphere"
  | "heroField"
  | "torus"
  | "sculpture"
  | "services"
  | "globe"
  | "torusFlow"
  | "process";

interface FormDefinition {
  generate: (count: number, rand: Rand) => Float32Array;
  /** Optional colouring used when this form is the first in the sequence. */
  colorize?: (positions: Float32Array) => Float32Array;
  /**
   * Optional per-particle `[stage, isNode, cx, cy, cz]` data for a form whose
   * parts light up in steps (the process path). Computed on the final
   * aligned positions.
   */
  annotate?: (positions: Float32Array) => Float32Array;
}

/** Sample a surface, then push a share of points slightly inside for depth. */
function sampleWithDepth(geometry: THREE.BufferGeometry, count: number, rand: Rand, depth: number): Float32Array {
  const out = geometryToParticlePositions(geometry, count, rand);
  geometry.dispose();
  for (let i = 0; i < count; i++) {
    if (rand() > 0.2) continue;
    const k = 1 - rand() * depth;
    out[i * 3] *= k;
    out[i * 3 + 1] *= k;
    out[i * 3 + 2] *= k;
  }
  return out;
}

export const FORMS: Record<FormName, FormDefinition> = {
  rocket: {
    generate: (count, rand) => generateRocketParticles(count, Math.floor(rand() * 1e9)),
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
    colorize: (positions) => colorRocketParticles(generateForm("rocket", positions.length / 3, 101)),
  },
  sphere: {
    generate: (count, rand) => sampleWithDepth(new THREE.SphereGeometry(1.75, 96, 64), count, rand, 0.35),
  },
  torus: {
    generate: (count, rand) =>
      sampleWithDepth(new THREE.TorusGeometry(1.6, 0.55, 48, 160).rotateX(Math.PI / 2.4), count, rand, 0.15),
  },
  sculpture: {
    generate: (count, rand) => sampleWithDepth(new THREE.TorusKnotGeometry(1.25, 0.34, 320, 32, 2, 3), count, rand, 0.1),
  },
  // Section story forms (Services → Staffing → Why us → How we work).
  services: { generate: generateServicesParticles },
  globe: { generate: generateGlobeParticles },
  // Live flowing form: the shader moves these particles (torusFlow).
  torusFlow: { generate: generateTorusFlowParticles },
  process: { generate: generateProcessParticles, annotate: annotateProcessStages },
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
export function generateForm(name: FormName, count: number, seed: number): Float32Array {
  const rand = mulberry32(seed);
  return alignByHeight(FORMS[name].generate(count, rand), rand);
}

/**
 * Per-particle colours, fixed for the whole sequence: each particle carries
 * its colour from form to form. Uses the first form's own colouring if it has
 * one, otherwise a soft blue → white → orange blend with noise.
 */
export function colorsForSequence(firstForm: FormName, positions: Float32Array, seed = 3): Float32Array {
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
    const n = Math.sin(x * 2.1 + y * 1.3) * 0.5 + Math.sin(y * 3.7 - x * 1.9) * 0.3;
    const warmth = smoothstep(-0.6, 0.6, -y * 0.6 + n * 0.5);
    c.copy(blue).lerp(deepBlue, rand() * 0.5).lerp(orange, warmth).lerp(gold, warmth * rand() * 0.4);
    c.lerp(white, smoothstep(0.3, 1, n) * 0.6);
    const s = rand();
    pushColor(colors, i, c, s > 0.97 ? 1.7 : s < 0.22 ? 0.5 : 0.8 + rand() * 0.3);
  }
  return colors;
}


/**
 * Monochrome colours for the section story: white and off-white points with
 * a spread of brightness, and a very faint brand tint on a few percent of
 * particles (the site's orange/blue accents, barely perceptible).
 */
export function monochromeColors(count: number, seed = 9): Float32Array {
  const rand = mulberry32(seed);
  const colors = new Float32Array(count * 3);
  const c = new THREE.Color();
  const { white, offWhite, orange, blue } = PALETTE_LINEAR;
  for (let i = 0; i < count; i++) {
    c.copy(white).lerp(offWhite, rand() * 0.8);
    const tint = rand();
    if (tint < 0.025) c.lerp(orange, 0.22);
    else if (tint < 0.05) c.lerp(blue, 0.22);
    const s = rand();
    pushColor(colors, i, c, s > 0.97 ? 1.6 : s < 0.25 ? 0.45 : 0.7 + rand() * 0.35);
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
