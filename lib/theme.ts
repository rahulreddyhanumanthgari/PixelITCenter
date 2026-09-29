"use client";

import { useSyncExternalStore } from "react";
import { THEME_KEY } from "./theme-script";

/**
 * Site colour theme. Dark is the default; light is opt-in via the header
 * toggle and remembered in localStorage. The choice lives on <html> as
 * `data-theme` (both themes are dark-surfaced for shadcn, so `.dark` stays), set
 * before first paint by THEME_SCRIPT (lib/theme-script.ts) in app/layout.tsx.
 */
export type Theme = "dark" | "light";

export function getTheme(): Theme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

export function setTheme(theme: Theme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Storage unavailable (private mode): the theme still applies for this visit.
  }
}

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

/** The current theme, re-rendering when it changes. "dark" on the server. */
export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, getTheme, () => "dark");
}
