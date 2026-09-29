// Every tunable number for the particle journey lives here: the one particle
// system that runs from the landing hero's gravity field down to How We Work.

import type { DeviceTier } from "@/components/particles/hooks";
import type { ParticleLook } from "@/components/particles/ParticleSystem";
import type { FormName } from "@/lib/particles/generateTarget";

/**
 * The whole journey, in scroll order. The first is the landing hero's
 * full-screen gravity field (moving particles, not a shape); the other four
 * belong to the story sections, one per section.
 * Shapes live in lib/particles/ — see FORMS in generateTarget.ts.
 */
export const JOURNEY_FORMS: readonly FormName[] = [
  "heroField",
  "services",
  "globe",
  "segmentedRing",
  "process",
];

/** Form position at which the particles leave the hero for the story column. */
export const STORY_HANDOFF = 0;

/**
 * Landing hero gravity field. Radius on screen is the larger of these
 * fractions of the viewport width/height, so the field runs past the edges.
 * `outer` must match HERO_FIELD_OUTER in particle.vert.glsl.
 */
export const HERO_FIELD = {
  reach: { width: 0.6, height: 0.8 },
  outer: 4,
  /** Brightness left for particles behind the hero text. */
  protectFloor: 0.35,
} as const;

/**
 * Desktop composition for each story form (0 = particles left, text right;
 * 1 = particles right, text left), in JOURNEY_FORMS order after the handoff.
 * Services continues from the hero on the right, then the story alternates.
 * Keep in sync with the `side` of each section in components/sections.
 */
export const STORY_SIDES: readonly number[] = [1, 0, 1, 0];

/** Where the particles sit inside the story area, as a fraction of its width. */
export const STORY_SLOTS = { left: 0.24, right: 0.76 } as const;

/** Subtle camera: pointer drift and a small pull-back while particles scatter. */
export const CAMERA_MOTION = { pointerX: 0.14, pointerY: 0.09, fieldPullBack: 0.35, damping: 0.03 } as const;

/**
 * Scroll windows for each transition (ScrollTrigger syntax): each runs while
 * the section that owns the *next* form scrolls into view.
 */
export const TRANSITIONS = {
  intoStory: { desktop: { start: "top 96%", end: "top 18%" }, mobile: { start: "top 100%", end: "top 50%" } },
  story: { start: "top 96%", end: "top 14%" },
  scrub: 0.8,
} as const;

/** Colours for every form come from the rocket (orange / blue / white). */
const SHARED = {
  colors: "form" as const,
  noiseScale: 1.4,
  damping: 0.06,
  reducedMotionFactor: 0.15,
  cameraZ: 7.5,
};

/**
 * The hero look: the gravity field's disc seen at an angle (its bright band
 * reads as an ellipse framing the headline), barely
 * swaying (the field turns on its own), with a light pointer response.
 */
export const HERO_LOOK: ParticleLook = {
  ...SHARED,
  particleSize: 16,
  rotation: { mode: "sway", speed: 0.08, amount: 0.04 },
  wobbleAmount: 0.02,
  baseTilt: [0.78, 0, 0.1],
  formNoise: 0.02,
  fieldNoise: 0.3,
  curve: 0.9,
  mouseInfluence: 0.15,
  mouseRadius: 0.9,
  mouseTilt: 0.06,
  mouseParallax: 0.08,
};

/**
 * The story look: finer points, and a gentle sway instead of a spin so the
 * globe and the process path always face the reader. The system blends from
 * HERO_LOOK to this while the hero field becomes the Services ring.
 */
export const STORY_LOOK: ParticleLook = {
  ...SHARED,
  particleSize: 10,
  rotation: { mode: "sway", speed: 0.16, amount: 0.32 },
  wobbleAmount: 0.05,
  baseTilt: [0, 0, 0],
  formNoise: 0.012,
  fieldNoise: 0.26,
  curve: 0.8,
  mouseInfluence: 0.14,
  mouseRadius: 0.7,
  mouseTilt: 0.12,
  mouseParallax: 0.06,
};

export const JOURNEY_CAMERA = { fov: 38, z: SHARED.cameraZ } as const;

export const JOURNEY_STARS = { size: 7 } as const;

export const JOURNEY_BLOOM = { threshold: 0.2, smoothing: 0.4 } as const;

export interface JourneyTier {
  particleCount: number;
  starCount: number;
  maxDpr: number;
  scatter: number;
  /** Bloom while in the hero, then in the story sections. */
  bloom: { hero: number; story: number };
  /** Story scale relative to the pinned story column/band height. */
  storyScale: number;
  /** Particles in the About Us vortex. */
  vortexCount: number;
}

const TIERS: Record<DeviceTier, JourneyTier> = {
  desktop: {
    particleCount: 60_000,
    starCount: 3_200,
    maxDpr: 2,
    scatter: 1,
    bloom: { hero: 0.85, story: 0.55 },
    storyScale: 0.8,
    vortexCount: 26_000,
  },
  tablet: {
    particleCount: 34_000,
    starCount: 2_000,
    maxDpr: 1.75,
    scatter: 0.85,
    bloom: { hero: 0.7, story: 0.45 },
    storyScale: 0.72,
    vortexCount: 16_000,
  },
  mobile: {
    particleCount: 18_000,
    starCount: 800,
    maxDpr: 1.5,
    scatter: 0.7,
    bloom: { hero: 0.5, story: 0.35 },
    storyScale: 1.1,
    vortexCount: 10_000,
  },
};

export function getJourneyTier(tier: DeviceTier): JourneyTier {
  return TIERS[tier];
}
