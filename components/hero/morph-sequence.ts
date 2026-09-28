// Kept free of runtime three.js imports so the server-rendered Hero can read
// it (to size the pinned scroll area) without pulling three into the server.

import type { FormName } from "@/lib/particles/generateTarget";
import type { MorphTimeline } from "./ParticleController";

/**
 * The forms the particles move through as the visitor scrolls the hero.
 * Available: "rocket", "sphere", "torus", "sculpture" (lib/particles/generateTarget.ts).
 */
export const MORPH_SEQUENCE: readonly FormName[] = ["rocket", "sphere"];

/** Relative lengths of a hold vs a full transition on the scroll timeline. */
export const MORPH_TIMELINE: MorphTimeline = { hold: 0.35, transition: 1 };

/** Extra scroll distance (in viewport heights) the hero stays pinned per transition. */
export const HERO_SCROLL_VH_PER_TRANSITION = 180;
