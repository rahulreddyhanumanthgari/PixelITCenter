/** Pointer position in normalised device coordinates (-1..1), written by a
 *  window listener and read inside useFrame — never React state. */
export interface PointerState {
  x: number;
  y: number;
  active: boolean;
}

/** 0 at the top of the hero, 1 once the hero has scrolled out. Driven by GSAP. */
export interface ScrollState {
  progress: number;
}
