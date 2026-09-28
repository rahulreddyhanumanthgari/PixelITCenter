"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import type { BloomEffect } from "postprocessing";
import { gsap } from "@/lib/gsap";
import { ParticleCanvas } from "@/components/particles/ParticleCanvas";
import { ParticleSystem, type LayoutState } from "@/components/particles/ParticleSystem";
import { StarField, type Atmosphere } from "@/components/particles/StarField";
import { useDeviceTier, usePointer, useReducedMotion } from "@/components/particles/hooks";
import type { PointerState, ProgressState } from "@/components/particles/types";
import { PALETTE } from "@/lib/particles/palette";
import { processProgress } from "@/lib/processProgress";
import {
  HERO_LOOK,
  JOURNEY_BLOOM,
  JOURNEY_CAMERA,
  JOURNEY_FORMS,
  CAMERA_MOTION,
  STORY_HANDOFF,
  STORY_LOOK,
  STORY_SIDES,
  STORY_SLOTS,
  TRANSITIONS,
  getJourneyTier,
} from "./journey-config";

/** World units per CSS pixel at the focal plane, for the full-screen camera. */
function worldPerPx(): number {
  const visibleHeight = 2 * JOURNEY_CAMERA.z * Math.tan(((JOURNEY_CAMERA.fov / 2) * Math.PI) / 180);
  return visibleHeight / window.innerHeight;
}

/** Desktop column layout vs the phone/tablet band (matches the lg: breakpoint). */
const isColumnLayout = () => window.matchMedia("(min-width: 1024px)").matches;

/**
 * Very subtle camera: drifts a touch with the pointer and eases back a little
 * while the main particles are scattered, so transitions gain a hint of depth.
 */
function CameraRig({
  pointer,
  atmosphere,
  strength,
}: {
  pointer: RefObject<PointerState>;
  atmosphere: RefObject<Atmosphere>;
  strength: number;
}) {
  useFrame((state, rawDelta) => {
    const cam = state.camera;
    const k = 1 - Math.pow(1 - CAMERA_MOTION.damping, Math.min(rawDelta, 1 / 20) * 60);
    const p = pointer.current;
    const tx = (p.active ? p.x : 0) * CAMERA_MOTION.pointerX * strength;
    const ty = (p.active ? p.y : 0) * CAMERA_MOTION.pointerY * strength;
    const tz = JOURNEY_CAMERA.z + atmosphere.current.field * CAMERA_MOTION.fieldPullBack * strength;
    cam.position.x += (tx - cam.position.x) * k;
    cam.position.y += (ty - cam.position.y) * k;
    cam.position.z += (tz - cam.position.z) * k;
  });
  return null;
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
    sides: null,
  });
  // How scattered the main particles are; drives the stars and camera.
  const atmosphere = useRef<Atmosphere>({ field: 0 });

  // Each frame: bloom eases from the hero's strength to the story's with the
  // handoff, and the scatter amount is shared with the stars and camera.
  const onBlend = useCallback(
    (blend: number, field: number) => {
      const effect = bloom.current;
      if (effect) effect.intensity = tier.bloom.hero + (tier.bloom.story - tier.bloom.hero) * blend;
      atmosphere.current.field = field;
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

      // Story placement, measured where the anchor sits once stuck.
      // Desktop: the anchor spans the story area and forms alternate between
      // its left and right slots. Phones/tablets: centre of the band.
      const L = layout.current;
      const columns = isColumnLayout();
      const xAt = (fraction: number) => (rect.left + rect.width * fraction - vw / 2) * wpp;
      L.sides = columns ? { left: xAt(STORY_SLOTS.left), right: xAt(STORY_SLOTS.right), byForm: STORY_SIDES } : null;
      L.to.x = columns ? xAt(STORY_SIDES[0] ? STORY_SLOTS.right : STORY_SLOTS.left) : xAt(0.5);
      L.to.y = -(stickyTop + rect.height / 2 - vh / 2) * wpp;
      L.to.scale = tier.storyScale * (rect.height / vh);
      L.from.x = tier.heroOffset[0];
      // In the band layout the hero form sits exactly where the band will be.
      L.from.y = columns ? tier.heroOffset[1] : L.to.y;
      L.from.scale = tier.heroScale;

      // Phones: once the band is stuck, the text scrolls under the band's
      // opaque background — so the canvas moves above the page and is clipped
      // to the band. Before that it stays behind the page, full screen.
      const banded = !columns && rect.top <= stickyTop + 1;
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
      <StarField
        count={tier.starCount}
        pixelRatio={dpr}
        reducedMotion={reducedMotion}
        pointer={pointer}
        atmosphere={atmosphere}
      />
      <CameraRig
        pointer={pointer}
        atmosphere={atmosphere}
        strength={reducedMotion ? 0 : tierName === "mobile" ? 0.5 : 1}
      />
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
