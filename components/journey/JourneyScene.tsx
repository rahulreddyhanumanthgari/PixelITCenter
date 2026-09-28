"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { BloomEffect } from "postprocessing";
import { gsap } from "@/lib/gsap";
import { ParticleCanvas } from "@/components/particles/ParticleCanvas";
import { ParticleSystem, type LayoutState } from "@/components/particles/ParticleSystem";
import { StarField } from "@/components/particles/StarField";
import { useDeviceTier, usePointer, useReducedMotion } from "@/components/particles/hooks";
import type { ProgressState } from "@/components/particles/types";
import { PALETTE } from "@/lib/particles/palette";
import { processProgress } from "@/lib/processProgress";
import {
  HERO_LOOK,
  JOURNEY_BLOOM,
  JOURNEY_CAMERA,
  JOURNEY_FORMS,
  STORY_HANDOFF,
  STORY_LOOK,
  TRANSITIONS,
  getJourneyTier,
} from "./journey-config";

/** World units per CSS pixel at the focal plane, for the full-screen camera. */
function worldPerPx(): number {
  const visibleHeight = 2 * JOURNEY_CAMERA.z * Math.tan(((JOURNEY_CAMERA.fov / 2) * Math.PI) / 180);
  return visibleHeight / window.innerHeight;
}

/**
 * The one particle system for the whole journey — hero rocket → sphere →
 * Services → Staffing → Why us → How we work. It lives in a fixed,
 * full-screen layer behind the page (JourneyLayer) and is loaded with
 * ssr: false, so it only runs in the browser.
 */
export default function JourneyScene() {
  const pointer = usePointer();
  const progress = useRef<ProgressState>({ value: 0 });
  // How We Work step progress, written by the section's own scroll triggers.
  const stage = useRef<ProgressState>(processProgress);
  const bloom = useRef<BloomEffect>(null);
  const tierName = useDeviceTier();
  const reducedMotion = useReducedMotion();
  const tier = getJourneyTier(tierName);
  const dpr = Math.min(window.devicePixelRatio || 1, tier.maxDpr);
  const [active, setActive] = useState(true);

  const layout = useRef<LayoutState>({
    from: { x: tier.heroOffset[0], y: tier.heroOffset[1], scale: tier.heroScale },
    to: { x: 0, y: 0, scale: tier.storyScale },
  });

  // Bloom eases from the hero's strength to the story's with the handoff.
  const onBlend = useCallback(
    (blend: number) => {
      const effect = bloom.current;
      if (effect) effect.intensity = tier.bloom.hero + (tier.bloom.story - tier.bloom.hero) * blend;
    },
    [tier],
  );

  // --- scroll → form position ---------------------------------------------
  // One scrubbed 0→1 value per transition; their sum is the form position
  // (0 = rocket … 5 = process). Two-way scrub makes every step reversible.
  useEffect(() => {
    const hero = document.querySelector<HTMLElement>("[data-hero]");
    const story = document.querySelector<HTMLElement>("[data-story]");
    if (!hero || !story) return;
    const sections = Array.from(story.querySelectorAll<HTMLElement>("[data-story-section]"));
    const steps = JOURNEY_FORMS.slice(1).map(() => ({ v: 0 }));
    const state = progress.current;
    const sum = () => {
      state.value = steps.reduce((s, t) => s + t.v, 0);
    };
    const pinned = () => hero.offsetHeight - window.innerHeight;
    const intoStory = tierName === "mobile" ? TRANSITIONS.intoStory.mobile : TRANSITIONS.intoStory.desktop;

    const ctx = gsap.context(() => {
      steps.forEach((step, i) => {
        const trigger =
          i === 0
            ? {
                // Rocket → sphere while the hero is pinned.
                trigger: hero,
                start: () => `top+=${pinned() * TRANSITIONS.hero.from} top`,
                end: () => `top+=${pinned() * TRANSITIONS.hero.to} top`,
              }
            : {
                // Each later form assembles as the section that owns it arrives.
                trigger: sections[i - 1],
                ...(i === 1 ? intoStory : TRANSITIONS.story),
              };
        gsap.to(step, {
          v: 1,
          ease: "none",
          onUpdate: sum,
          scrollTrigger: { ...trigger, scrub: TRANSITIONS.scrub, invalidateOnRefresh: true },
        });
      });
    });
    return () => {
      ctx.revert();
      state.value = 0;
    };
  }, [tierName]);

  // --- page layout → placement, phone band clipping, on/off -----------------
  useEffect(() => {
    const story = document.querySelector<HTMLElement>("[data-story]");
    const anchor = story?.querySelector<HTMLElement>("[data-story-anchor]");
    const layer = document.querySelector<HTMLElement>("[data-journey-layer]");
    if (!story || !anchor || !layer) return;
    let frame = 0;

    const measure = () => {
      frame = 0;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const wpp = worldPerPx();
      const rect = anchor.getBoundingClientRect();
      const stickyTop = parseFloat(getComputedStyle(anchor).top) || 0;

      // Story placement: centre of the pinned column (desktop) or band
      // (phone), measured where it sits once stuck.
      const L = layout.current;
      L.to.x = (rect.left + rect.width / 2 - vw / 2) * wpp;
      L.to.y = -(stickyTop + rect.height / 2 - vh / 2) * wpp;
      L.to.scale = tier.storyScale * (rect.height / vh);
      L.from.x = tier.heroOffset[0];
      // On phones the hero form sits exactly where the band will be.
      L.from.y = tierName === "mobile" ? L.to.y : tier.heroOffset[1];
      L.from.scale = tier.heroScale;

      // Phones: once the band is stuck, the text scrolls under the band's
      // opaque background — so the canvas moves above the page and is clipped
      // to the band. Before that it stays behind the page, full screen.
      const banded = tierName === "mobile" && rect.top <= stickyTop + 1;
      // The band only turns opaque once pinned; while it scrolls into place
      // it stays see-through so the particles behind it never vanish.
      anchor.dataset.stuck = String(banded);
      layer.style.zIndex = banded ? "20" : "0";
      layer.style.clipPath = banded
        ? `inset(${Math.max(rect.top, 0)}px 0 ${Math.max(vh - rect.bottom, 0)}px 0)`
        : "none";

      // Past the story, the rest of the page covers the layer: stop drawing.
      const on = story.getBoundingClientRect().bottom > 0;
      layer.style.visibility = on ? "visible" : "hidden";
      setActive(on);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      cancelAnimationFrame(frame);
      layer.style.zIndex = "";
      layer.style.clipPath = "";
      layer.style.visibility = "";
    };
  }, [tier, tierName]);

  return (
    <ParticleCanvas
      active={active}
      bloomRef={bloom}
      settings={{
        cameraFov: JOURNEY_CAMERA.fov,
        cameraZ: JOURNEY_CAMERA.z,
        background: PALETTE.background,
        dpr,
        bloom: { intensity: tier.bloom.hero, ...JOURNEY_BLOOM },
      }}
    >
      <StarField count={tier.starCount} pixelRatio={dpr} reducedMotion={reducedMotion} />
      <ParticleSystem
        key={tierName}
        forms={JOURNEY_FORMS}
        count={tier.particleCount}
        look={HERO_LOOK}
        lookTo={STORY_LOOK}
        handoffAt={STORY_HANDOFF}
        layout={layout}
        progress={progress}
        pointer={pointer}
        scatter={tier.scatter}
        pixelRatio={dpr}
        reducedMotion={reducedMotion}
        onBlend={onBlend}
        stage={stage}
      />
    </ParticleCanvas>
  );
}
