"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { ParticleCanvas } from "@/components/particles/ParticleCanvas";
import { ParticleSystem } from "@/components/particles/ParticleSystem";
import { resolveMorph, type MorphResolver } from "@/components/particles/MorphController";
import { usePointer, useDeviceTier, useReducedMotion } from "@/components/particles/hooks";
import type { ProgressState } from "@/components/particles/types";
import { StarField } from "./StarField";
import {
  HERO_BLOOM,
  HERO_CAMERA,
  HERO_LOOK,
  MORPH_SEQUENCE,
  MORPH_TIMELINE,
  PALETTE,
  getTierSettings,
} from "./particle-config";

// Hero timeline: hold rocket · rocket → sphere · hold sphere.
const resolveHero: MorphResolver = (value, count) => resolveMorph(value, count, MORPH_TIMELINE);

/**
 * The hero's WebGL layer. Loaded through HeroCanvasLoader with ssr: false so
 * it only ever runs in the browser.
 */
export default function ParticleScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const pointer = usePointer();
  const scroll = useRef<ProgressState>({ value: 0 });
  const tier = useDeviceTier();
  const reducedMotion = useReducedMotion();

  const settings = getTierSettings(tier);
  const dpr = Math.min(window.devicePixelRatio || 1, settings.maxDpr);

  // Scroll: the hero is a tall section with a sticky viewport inside. GSAP
  // scrubs a plain number from 0 to 1 while that viewport is pinned; the
  // morph reads it each frame. Scrub is two-way, so scrolling back up
  // replays the morph in reverse.
  useEffect(() => {
    const hero = containerRef.current?.closest<HTMLElement>("[data-hero]");
    if (!hero) return;
    const state = scroll.current;
    const ctx = gsap.context(() => {
      gsap.to(state, {
        value: 1,
        ease: "none",
        scrollTrigger: { trigger: hero, start: "top top", end: "bottom bottom", scrub: 0.8 },
      });
    });
    return () => {
      ctx.revert();
      state.value = 0;
    };
  }, []);

  return (
    <ParticleCanvas
      containerRef={containerRef}
      settings={{
        cameraFov: HERO_CAMERA.fov,
        cameraZ: HERO_CAMERA.z,
        background: PALETTE.background,
        dpr,
        bloom: { intensity: settings.bloomIntensity, ...HERO_BLOOM },
      }}
    >
      <StarField count={settings.starCount} pixelRatio={dpr} reducedMotion={reducedMotion} />
      <ParticleSystem
        key={tier}
        forms={MORPH_SEQUENCE}
        count={settings.particleCount}
        look={HERO_LOOK}
        resolve={resolveHero}
        progress={scroll}
        pointer={pointer}
        offset={settings.offset}
        scale={settings.scale}
        scatter={settings.scatter}
        pixelRatio={dpr}
        reducedMotion={reducedMotion}
      />
    </ParticleCanvas>
  );
}
