// Every tunable number for the hero sculpture lives here, so the look can be
// adjusted without touching the scene code.

export type DeviceTier = "desktop" | "mobile";

export interface ParticleConfig {
  desktopParticleCount: number;
  mobileParticleCount: number;
  desktopStarCount: number;
  mobileStarCount: number;
  /** Point size in pixels for a particle 1 world unit from the camera. */
  particleSize: number;
  starSize: number;
  /** Radians per second of the slow self-rotation around Y. */
  rotationSpeed: number;
  /** Amplitude of the secondary wobble around X/Z, in radians. */
  wobbleAmount: number;
  /** How far (world units) noise can push a particle off its base position. */
  noiseStrength: number;
  noiseScale: number;
  /** How far (world units) the pointer pushes particles inside its radius. */
  mouseInfluence: number;
  mouseRadius: number;
  /** Max sculpture tilt (radians) driven by the pointer. */
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
  /** Multiplier applied to all motion when prefers-reduced-motion is set. */
  reducedMotionFactor: number;
}

export const PARTICLE_CONFIG: ParticleConfig = {
  desktopParticleCount: 48_000,
  mobileParticleCount: 14_000,
  desktopStarCount: 1_600,
  mobileStarCount: 600,
  particleSize: 15,
  starSize: 7,
  rotationSpeed: 0.07,
  wobbleAmount: 0.1,
  noiseStrength: 0.07,
  noiseScale: 1.4,
  mouseInfluence: 0.28,
  mouseRadius: 0.95,
  mouseTilt: 0.32,
  damping: 0.05,
  bloomIntensity: 0.85,
  mobileBloomIntensity: 0.5,
  bloomThreshold: 0.2,
  bloomSmoothing: 0.4,
  maxDpr: 2,
  mobileMaxDpr: 1.5,
  mobileBreakpoint: 768,
  reducedMotionFactor: 0.12,
};

/** Shape of the twisted torus the particles are sampled from. */
export const SCULPTURE_SHAPE = {
  majorRadius: 1.6,
  tubeRadius: 0.58,
  /** Half-turns the ribbon cross-section makes around the ring. */
  twists: 3,
  /** Cross-section is squashed into a ribbon; 1 = round tube. */
  ribbonAspect: 0.38,
  /** Fraction of particles scattered inside the tube instead of on its skin. */
  volumeFraction: 0.2,
  /** Fraction of particles forming the loose halo around the ring. */
  haloFraction: 0.04,
} as const;

/** Where the sculpture sits and how scroll moves it. */
export const SCENE_LAYOUT = {
  cameraFov: 38,
  cameraZ: 7.5,
  /** Sculpture offset (world units) so it sits right of the headline. */
  desktopOffset: [1.5, 0.0, 0] as const,
  mobileOffset: [0, 1.2, 0] as const,
  desktopScale: 0.84,
  mobileScale: 0.52,
  /** Resting tilt so the ring reads as 3D even before the user moves. */
  baseTilt: [0.55, 0, -0.35] as const,
  scroll: {
    rotateY: 0.8,
    moveX: 0.3,
    moveY: 0.5,
    pushZ: -1.8,
    scaleTo: 0.85,
  },
} as const;

export const PALETTE = {
  orange: "#ff7a2e",
  gold: "#ffb45c",
  white: "#f2f6ff",
  blue: "#3b7cff",
  deepBlue: "#1f4fd6",
  background: "#05060a",
} as const;

export interface TierSettings {
  particleCount: number;
  starCount: number;
  bloomIntensity: number;
  maxDpr: number;
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
        offset: SCENE_LAYOUT.mobileOffset,
        scale: SCENE_LAYOUT.mobileScale,
      }
    : {
        particleCount: c.desktopParticleCount,
        starCount: c.desktopStarCount,
        bloomIntensity: c.bloomIntensity,
        maxDpr: c.maxDpr,
        offset: SCENE_LAYOUT.desktopOffset,
        scale: SCENE_LAYOUT.desktopScale,
      };
}
