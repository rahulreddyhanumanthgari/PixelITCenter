import type { ProgressState } from "@/themes/dark/components/particles/types";

/**
 * How far the visitor has scrolled through the How We Work steps:
 * 0 = step 1 active, 1 = step 2 active … 4 = all four steps completed.
 *
 * Written by the step list's scroll triggers (ProcessProgress) and read by the
 * particle system every frame. A plain shared object, so neither side ever
 * re-renders for it — and the step list works even when WebGL is off.
 */
export const processProgress: ProgressState = { value: 0 };
