// Every tunable number for the particle journey lives here: the one particle
// system that runs from the hero rocket down to the How We Work section.

import type { DeviceTier } from "@/components/particles/hooks";
import type { ParticleLook } from "@/components/particles/ParticleSystem";
import type { FormName } from "@/lib/particles/generateTarget";

/**
 * The whole journey, in scroll order. The first two play while the hero is
 * pinned; the other four belong to the story sections (one per section).
 * Shapes live in lib/particles/ — see FORMS in generateTarget.ts.
 */
export const JOURNEY_FORMS: readonly FormName[] = [
  "rocket",
  "sphere",
  "services",
  "globeHand",
  "segmentedRing",
  "process",
];

/** Form position at which the particles leave the hero for the story column. */
export const STORY_HANDOFF = 1;

/**
 * Scroll windows for each transition (ScrollTrigger syntax). The hero one is
 * a fraction of the hero's pinned scroll; the story ones run while the
 * section that owns the *next* form scrolls into view.
 */
export const TRANSITIONS = {
  hero: { from: 0.18, to: 0.82 },
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

/** The hero look: bigger points, continuous spin, rocket leaning right. */
export const HERO_LOOK: ParticleLook = {
  ...SHARED,
  particleSize: 14,
  rotation: { mode: "spin", speed: 0.12, amount: 0 },
  wobbleAmount: 0.08,
  baseTilt: [0.2, 0, -0.72],
  formNoise: 0.025,
  fieldNoise: 0.3,
  curve: 0.9,
  mouseInfluence: 0.28,
  mouseRadius: 0.95,
  mouseTilt: 0.3,
  mouseParallax: 0.12,
};

/**
 * The story look: finer points, and a gentle sway instead of a spin so the
 * hand-and-globe and the process path always face the reader. The system blends from
 * HERO_LOOK to this while the sphere becomes the Services ring.
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
  /** Hero placement in world units (camera at z 7.5). */
  heroOffset: readonly [number, number];
  heroScale: number;
  /** Story scale relative to the pinned story column/band height. */
  storyScale: number;
}

const TIERS: Record<DeviceTier, JourneyTier> = {
  desktop: {
    particleCount: 60_000,
    starCount: 1_600,
    maxDpr: 2,
    scatter: 1,
    bloom: { hero: 0.85, story: 0.55 },
    heroOffset: [1.6, 0.05],
    heroScale: 0.78,
    storyScale: 0.8,
  },
  tablet: {
    particleCount: 34_000,
    starCount: 1_100,
    maxDpr: 1.75,
    scatter: 0.85,
    bloom: { hero: 0.7, story: 0.45 },
    heroOffset: [1.2, 0.1],
    heroScale: 0.66,
    storyScale: 0.72,
  },
  mobile: {
    particleCount: 18_000,
    starCount: 600,
    maxDpr: 1.5,
    scatter: 0.7,
    bloom: { hero: 0.5, story: 0.35 },
    // Mobile hero y is replaced at runtime by the story band's centre, so the
    // form sits in the same spot before and after the handoff.
    heroOffset: [0, 1.1],
    heroScale: 0.44,
    storyScale: 1.1,
  },
};

export function getJourneyTier(tier: DeviceTier): JourneyTier {
  return TIERS[tier];
}
