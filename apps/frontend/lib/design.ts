// Which design a visitor sees while the team compares them: the shared
// particle site (themes/core) in dark (themes/dark) or in daylight
// (themes/light). Server-safe: also imported by next.config.ts.
//
// The choice is a cookie. next.config.ts rewrites "/" to "/light" when it is
// "light", so both designs stay statically prerendered and the right one is
// served on first paint with no flash. Once a design is chosen: delete the
// other theme folder, its route group, this file, the rewrite and
// components/DesignSwitch.tsx (see the README).

export type Design = "dark" | "light";

export const DESIGN_COOKIE = "pixelit-design";

/** Set NEXT_PUBLIC_DESIGN_SWITCH=off to hide the switch (e.g. in production). */
export const SHOW_DESIGN_SWITCH = process.env.NEXT_PUBLIC_DESIGN_SWITCH !== "off";

/**
 * Browser only. Saves the choice and loads "/" again from the server, which
 * serves the chosen design. A full load, not a client navigation: the two
 * designs have different root layouts and stylesheets.
 */
export function chooseDesign(design: Design) {
  document.cookie = `${DESIGN_COOKIE}=${design}; path=/; max-age=31536000; samesite=lax`;
  // A navigation, not reload(): a reload restores the old page's scroll
  // position, which lands the other design part-way down.
  window.location.replace(window.location.origin);
}
