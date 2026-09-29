// Server-safe theme constants (no React), shared by app/layout.tsx and
// lib/theme.ts.

export const THEME_KEY = "pixelit-theme";

/** Runs in <head> before paint, so a saved light theme never flashes dark. */
export const THEME_SCRIPT = `try{var t=localStorage.getItem("${THEME_KEY}");if(t==="light"){document.documentElement.dataset.theme="light"}}catch(e){}`;
