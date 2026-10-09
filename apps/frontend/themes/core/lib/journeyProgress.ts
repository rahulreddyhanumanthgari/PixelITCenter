import type { ProgressState } from "@/themes/core/components/particles/types";

/**
 * Where the particle journey actually is, as drawn: the morph position the
 * particle system renders each frame (0 = hero, 1 = Services fully formed,
 * 2 = Staffing … 5 = About's galaxy). Written by ParticleSystem every frame,
 * read by anything that must follow the particles exactly (the light
 * version's card entrance). A plain shared object, so nothing re-renders.
 */
export const journeyProgress: ProgressState = { value: 0 };

/** When journeyProgress was last written (performance.now()); 0 = never (no WebGL). */
export const journeyClock = { at: 0 };
