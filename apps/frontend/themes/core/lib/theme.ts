"use client";

/**
 * Which design the page is: "dark" or "light". Each design's root layout
 * (app/(dark), app/(light)) sets it on <html> as `data-theme`, so it is fixed
 * for the life of the page; the Design switch loads the other design as a
 * new page (lib/design.ts). Components read it to pick the particle
 * treatment (glow on dark, ink dots and the light sky on light).
 */
export type Theme = "dark" | "light";

export function useTheme(): Theme {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}
