// Every tunable number for the hero particles lives here, so the look can be
// adjusted without touching the scene code.

export { PALETTE } from "@/lib/particles/palette";
export { MORPH_SEQUENCE, MORPH_TIMELINE, HERO_SCROLL_VH_PER_TRANSITION } from "./morph-sequence";

export type DeviceTier = "desktop" | "mobile";

export interface ParticleConfig {
  desktopParticleCount: number;
  mobileParticleCount: number;
  desktopStarCount: number;
  mobileStarCount: number;
  /** Point size in pixels for a particle 1 world unit from the camera. */
  particleSize: number;
  starSize: number;
  /** Radians per second the form spins around its own axis. */
  rotationSpeed: number;
  /** Amplitude of the secondary wobble, in radians. */
  wobbleAmount: number;
  /** Idle shimmer (world units) while a form holds. */
  formNoise: number;
  /** Extra drift (world units) while particles are in flight. */
  fieldNoise: number;
  noiseScale: number;
  /** How far the scatter cloud spreads (1 = full). */
  scatter: number;
  mobileScatter: number;
  /** Strength of the curved flight paths, world units. */
  curve: number;
  /** How far (world units) the pointer pushes particles inside its radius. */
  mouseInfluence: number;
  mouseRadius: number;
  /** Max tilt (radians) driven by the pointer. */
  mouseTilt: number;
  /** Fraction of the gap closed toward a target per frame at 60fps. */
  damping: number;
  bloomIntensity: number;
  mobileBloomIntensity: number;
  bloomThreshold: number;
  bloomSmoothing: number;
  maxDpr: number;
  mobileMaxDpr: number;
  /** Viewport width (px) below which the mobile tier is used. */
  mobileBreakpoint: number;
  /** Multiplier applied to motion, scatter and curves under reduced motion. */
  reducedMotionFactor: number;
}

export const PARTICLE_CONFIG: ParticleConfig = {
  desktopParticleCount: 60_000,
  mobileParticleCount: 18_000,
  desktopStarCount: 1_600,
  mobileStarCount: 600,
  particleSize: 14,
  starSize: 7,
  rotationSpeed: 0.12,
  wobbleAmount: 0.08,
  formNoise: 0.025,
  fieldNoise: 0.3,
  noiseScale: 1.3,
  scatter: 1,
  mobileScatter: 0.7,
  curve: 0.9,
  mouseInfluence: 0.28,
  mouseRadius: 0.95,
  mouseTilt: 0.3,
  damping: 0.06,
  bloomIntensity: 0.85,
  mobileBloomIntensity: 0.5,
  bloomThreshold: 0.2,
  bloomSmoothing: 0.4,
  maxDpr: 2,
  mobileMaxDpr: 1.5,
  mobileBreakpoint: 768,
  reducedMotionFactor: 0.15,
};

/** Where the particle system sits in the scene. */
export const SCENE_LAYOUT = {
  cameraFov: 38,
  cameraZ: 7.5,
  /** Offset (world units) so the form sits right of the headline. */
  desktopOffset: [1.6, 0.05, 0] as const,
  mobileOffset: [0, 1.1, 0] as const,
  desktopScale: 0.78,
  mobileScale: 0.44,
  /** Resting tilt: leans the rocket so it points up and to the right. */
  baseTilt: [0.2, 0, -0.72] as const,
} as const;

export interface TierSettings {
  particleCount: number;
  starCount: number;
  bloomIntensity: number;
  maxDpr: number;
  scatter: number;
  offset: readonly [number, number, number];
  scale: number;
}

export function getTierSettings(tier: DeviceTier): TierSettings {
  const c = PARTICLE_CONFIG;
  return tier === "mobile"
    ? {
        particleCount: c.mobileParticleCount,
        starCount: c.mobileStarCount,
        bloomIntensity: c.mobileBloomIntensity,
        maxDpr: c.mobileMaxDpr,
        scatter: c.mobileScatter,
        offset: SCENE_LAYOUT.mobileOffset,
        scale: SCENE_LAYOUT.mobileScale,
      }
    : {
        particleCount: c.desktopParticleCount,
        starCount: c.desktopStarCount,
        bloomIntensity: c.bloomIntensity,
        maxDpr: c.maxDpr,
        scatter: c.scatter,
        offset: SCENE_LAYOUT.desktopOffset,
        scale: SCENE_LAYOUT.desktopScale,
      };
}
