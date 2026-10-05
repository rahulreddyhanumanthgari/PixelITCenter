"use client";

/**
 * Which design the page is: each design's root layout (app/(dark),
 * app/(light)) sets `data-theme` on <html>, and it never changes during a
 * page's life. The particle engine reads it to pick its material: additive
 * glowing light on dark, the light material layer on white.
 */
export type Theme = "dark" | "light";

export function useTheme(): Theme {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}
