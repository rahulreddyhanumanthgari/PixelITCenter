"use client";

import { useEffect } from "react";
import { gsap } from "@/themes/core/lib/gsap";

/**
 * Light hero, scroll transition (owner's reference): as the orange takeover
 * grows from the orb (LightSky), the hero text drifts up and fades, scrubbed
 * to scroll. Reduced motion: it only fades. Renders nothing.
 */
export function HeroExit() {
  useEffect(() => {
    const hero = document.querySelector<HTMLElement>("[data-hero]");
    const content = hero?.querySelector<HTMLElement>("[data-hero-exit]");
    if (!hero || !content) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        content,
        { y: 0, opacity: 1 },
        {
          y: reduced ? 0 : -140,
          opacity: 0,
          ease: "power1.in",
          scrollTrigger: { trigger: hero, start: "top top", end: "75% top", scrub: 0.4 },
        },
      );
    });
    return () => ctx.revert();
  }, []);
  return null;
}
