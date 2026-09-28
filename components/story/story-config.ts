// Tunables for the section particle story (Services → Staffing → Why us →
// How we work). The particle engine itself is shared with the hero.

import type { DeviceTier } from "@/components/particles/hooks";
import type { ParticleLook } from "@/components/particles/ParticleSystem";
import type { FormName } from "@/lib/particles/generateTarget";

/**
 * One form per story section, in page order. Exactly four; the last one is
 * where the morph ends. Shapes live in lib/particles/forms/.
 */
export const STORY_FORMS: readonly FormName[] = ["services", "handshake", "segmentedRing", "process"];

/**
 * Where each transition happens: it runs while the *next* section's top edge
 * scrolls from `start` to `end` (ScrollTrigger syntax), so the new form
 * assembles as its section arrives.
 */
export const STORY_TRANSITION = { start: "top 92%", end: "top 22%", scrub: 0.6 } as const;

export const STORY_LOOK: ParticleLook = {
  // Small points: the forms are drawn by many fine dots, not big blobs.
  particleSize: 9,
  colors: "monochrome",
  // Sway, not spin, so the handshake and path stay facing the reader.
  rotation: { mode: "sway", speed: 0.16, amount: 0.32 },
  wobbleAmount: 0.05,
  baseTilt: [0, 0, 0],
  formNoise: 0.012,
  fieldNoise: 0.26,
  noiseScale: 1.5,
  curve: 0.75,
  // Pointer is a subtle extra: small tilt, gentle parallax, soft push.
  mouseInfluence: 0.14,
  mouseRadius: 0.7,
  mouseTilt: 0.12,
  mouseParallax: 0.06,
  damping: 0.07,
  reducedMotionFactor: 0.15,
  cameraZ: 7.5,
};

export const STORY_CAMERA = { fov: 38, z: STORY_LOOK.cameraZ } as const;

// High threshold + low intensity: only the brightest points glow, so the
// background around the forms is never lifted.
export const STORY_BLOOM = { threshold: 0.55, smoothing: 0.4 } as const;

export interface StoryTierSettings {
  particleCount: number;
  bloomIntensity: number;
  maxDpr: number;
  scatter: number;
  scale: number;
}

const TIERS: Record<DeviceTier, StoryTierSettings> = {
  desktop: { particleCount: 55_000, bloomIntensity: 0.35, maxDpr: 2, scatter: 0.8, scale: 0.8 },
  tablet: { particleCount: 30_000, bloomIntensity: 0.28, maxDpr: 1.75, scatter: 0.7, scale: 0.72 },
  // Phones show the forms in a short band at the top, so they sit larger.
  mobile: { particleCount: 14_000, bloomIntensity: 0.2, maxDpr: 1.5, scatter: 0.6, scale: 1.1 },
};

export function getStoryTier(tier: DeviceTier): StoryTierSettings {
  return TIERS[tier];
}
