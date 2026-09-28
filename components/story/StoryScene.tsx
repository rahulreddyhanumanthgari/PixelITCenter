"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { ParticleCanvas } from "@/components/particles/ParticleCanvas";
import { ParticleSystem } from "@/components/particles/ParticleSystem";
import { resolveFormPosition } from "@/components/particles/MorphController";
import { useDeviceTier, usePointer, useReducedMotion } from "@/components/particles/hooks";
import type { ProgressState } from "@/components/particles/types";
import { PALETTE } from "@/lib/particles/palette";
import {
  STORY_BLOOM,
  STORY_CAMERA,
  STORY_FORMS,
  STORY_LOOK,
  STORY_TRANSITION,
  getStoryTier,
} from "./story-config";

const CENTER: readonly [number, number, number] = [0, 0, 0];

/**
 * The one persistent particle system beside the four story sections. Loaded
 * through StoryCanvasLoader with ssr: false, so it only runs in the browser.
 *
 * Scroll wiring: one ScrollTrigger per transition (3 for 4 forms). Each
 * scrubs its own 0→1 value as the next section arrives; their sum is the
 * "form position" (0 = Services … 3 = How we work) the particles follow.
 * Scrub is two-way, so scrolling up reverses every transition.
 */
export default function StoryScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const pointer = usePointer(containerRef);
  const position = useRef<ProgressState>({ value: 0 });
  const tier = useDeviceTier();
  const reducedMotion = useReducedMotion();

  const settings = getStoryTier(tier);
  const dpr = Math.min(window.devicePixelRatio || 1, settings.maxDpr);

  useEffect(() => {
    const story = containerRef.current?.closest<HTMLElement>("[data-story]");
    if (!story) return;
    const sections = Array.from(story.querySelectorAll<HTMLElement>("[data-story-section]"));
    const transitions = sections.slice(1, STORY_FORMS.length).map(() => ({ v: 0 }));
    const state = position.current;
    const sum = () => {
      state.value = transitions.reduce((s, t) => s + t.v, 0);
    };

    const ctx = gsap.context(() => {
      transitions.forEach((t, i) => {
        gsap.to(t, {
          v: 1,
          ease: "none",
          onUpdate: sum,
          scrollTrigger: {
            trigger: sections[i + 1],
            start: STORY_TRANSITION.start,
            end: STORY_TRANSITION.end,
            scrub: STORY_TRANSITION.scrub,
          },
        });
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
        cameraFov: STORY_CAMERA.fov,
        cameraZ: STORY_CAMERA.z,
        background: PALETTE.background,
        dpr,
        bloom: { intensity: settings.bloomIntensity, ...STORY_BLOOM },
      }}
    >
      <ParticleSystem
        key={tier}
        forms={STORY_FORMS}
        count={settings.particleCount}
        look={STORY_LOOK}
        resolve={resolveFormPosition}
        progress={position}
        pointer={pointer}
        offset={CENTER}
        scale={settings.scale}
        scatter={settings.scatter}
        pixelRatio={dpr}
        reducedMotion={reducedMotion}
      />
    </ParticleCanvas>
  );
}
