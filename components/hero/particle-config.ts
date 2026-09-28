// Every tunable number for the hero particles lives here, so the look can be
// adjusted without touching the scene code.

import type { DeviceTier } from "@/components/particles/hooks";
import type { ParticleLook } from "@/components/particles/ParticleSystem";

export { PALETTE } from "@/lib/particles/palette";
export { MORPH_SEQUENCE, MORPH_TIMELINE, HERO_SCROLL_VH_PER_TRANSITION } from "./morph-sequence";

export const HERO_LOOK: ParticleLook = {
  particleSize: 14,
  colors: "form",
  rotation: { mode: "spin", speed: 0.12, amount: 0 },
  wobbleAmount: 0.08,
  /** Leans the rocket so it points up and to the right. */
  baseTilt: [0.2, 0, -0.72],
  formNoise: 0.025,
  fieldNoise: 0.3,
  noiseScale: 1.3,
  curve: 0.9,
  mouseInfluence: 0.28,
  mouseRadius: 0.95,
  mouseTilt: 0.3,
  mouseParallax: 0.12,
  damping: 0.06,
  reducedMotionFactor: 0.15,
  cameraZ: 7.5,
};

export const HERO_CAMERA = { fov: 38, z: HERO_LOOK.cameraZ } as const;

export const HERO_STARS = { size: 7, desktop: 1_600, tablet: 1_100, mobile: 600 } as const;

export const HERO_BLOOM = { threshold: 0.2, smoothing: 0.4 } as const;

export interface HeroTierSettings {
  particleCount: number;
  starCount: number;
  bloomIntensity: number;
  maxDpr: number;
  scatter: number;
  offset: readonly [number, number, number];
  scale: number;
}

const TIERS: Record<DeviceTier, HeroTierSettings> = {
  desktop: {
    particleCount: 60_000,
    starCount: HERO_STARS.desktop,
    bloomIntensity: 0.85,
    maxDpr: 2,
    scatter: 1,
    // Sits right of the headline.
    offset: [1.6, 0.05, 0],
    scale: 0.78,
  },
  tablet: {
    particleCount: 34_000,
    starCount: HERO_STARS.tablet,
    bloomIntensity: 0.7,
    maxDpr: 1.75,
    scatter: 0.85,
    offset: [1.2, 0.1, 0],
    scale: 0.66,
  },
  mobile: {
    particleCount: 18_000,
    starCount: HERO_STARS.mobile,
    bloomIntensity: 0.5,
    maxDpr: 1.5,
    scatter: 0.7,
    offset: [0, 1.1, 0],
    scale: 0.44,
  },
};

export function getTierSettings(tier: DeviceTier): HeroTierSettings {
  return TIERS[tier];
}
