/** Pointer position in normalised device coordinates (-1..1), written by a
 *  window listener and read inside useFrame — never React state. */
export interface PointerState {
  x: number;
  y: number;
  active: boolean;
}

/** A scroll-driven value written by GSAP and read inside useFrame. */
export interface ProgressState {
  value: number;
}

export interface MorphState {
  from: number;
  to: number;
  /** 0 = fully `from`, 1 = fully `to`. Fed to the shader as uProgress. */
  t: number;
}
