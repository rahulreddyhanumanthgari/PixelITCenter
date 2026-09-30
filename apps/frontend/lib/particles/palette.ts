import * as THREE from "three";

export const PALETTE = {
  orange: "#ff7a2e",
  gold: "#ffb45c",
  white: "#f2f6ff",
  offWhite: "#e5e7eb",
  blue: "#3b7cff",
  deepBlue: "#1f4fd6",
  background: "#05060a",
  /** Light theme page background (= --background in globals.css). */
  backgroundLight: "#f8fafc",
} as const;

/** THREE.Color converts hex to linear space, which is what the shader outputs. */
export const PALETTE_LINEAR = {
  orange: new THREE.Color(PALETTE.orange),
  gold: new THREE.Color(PALETTE.gold),
  white: new THREE.Color(PALETTE.white),
  offWhite: new THREE.Color(PALETTE.offWhite),
  blue: new THREE.Color(PALETTE.blue),
  deepBlue: new THREE.Color(PALETTE.deepBlue),
};

export function pushColor(out: Float32Array, i: number, c: THREE.Color, brightness: number): void {
  out[i * 3] = c.r * brightness;
  out[i * 3 + 1] = c.g * brightness;
  out[i * 3 + 2] = c.b * brightness;
}
