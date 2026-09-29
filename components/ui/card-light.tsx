"use client";

import { useEffect } from "react";

/**
 * Feeds the cards' faint cursor light: one delegated pointer listener sets
 * --mx / --my on the card under the pointer (read by `.card::after`).
 * Mouse/pen only, one style write per event. Renders nothing.
 */
export function CardLight() {
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const card = (e.target as Element | null)?.closest?.<HTMLElement>(".card");
      if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - r.left}px`);
      card.style.setProperty("--my", `${e.clientY - r.top}px`);
    };
    document.addEventListener("pointermove", onMove, { passive: true });
    return () => document.removeEventListener("pointermove", onMove);
  }, []);
  return null;
}
