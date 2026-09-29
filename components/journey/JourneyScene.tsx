"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import type { BloomEffect } from "postprocessing";
import { gsap } from "@/lib/gsap";
import { ParticleCanvas } from "@/components/particles/ParticleCanvas";
import { ParticleSystem, type LayoutState } from "@/components/particles/ParticleSystem";
import { StarField, type Atmosphere } from "@/components/particles/StarField";
import { ParticleVortex } from "@/components/vortex/ParticleVortex";
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
  EARTH_VIEW,
  HERO_FIELD,
  STEP_SECTIONS,
  STEP_WINDOWS,
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
 * The one particle system for the whole journey — the landing hero's gravity
 * field → Services → Staffing → Why us → How we work. It lives in a fixed,
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
    from: { x: 0, y: 0, scale: 1 },
    to: { x: 0, y: 0, scale: tier.storyScale },
    sides: null,
    protect: [0, 0, 0.001, 0.001],
    protectFloor: HERO_FIELD.protectFloor.wide,
    protect2: [0, 0, 0.001, 0.001],
    protect3: [0, 0, 0.001, 0.001],
    protect4: [0, 0, 0.001, 0.001],
    earthScale: 1,
  });
  // How scattered the main particles are; drives the stars and camera.
  const atmosphere = useRef<Atmosphere>({ field: 0, gravity: 0, gravityX: 0, gravityY: 0 });

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
  const onGravity = useCallback((strength: number, x: number, y: number) => {
    const A = atmosphere.current;
    A.gravity = strength;
    A.gravityX = x;
    A.gravityY = y;
  }, []);

  // --- scroll → form position ---------------------------------------------
  // One scrubbed 0→1 value per transition; their sum is the form position
  // (0 = hero field … 4 = process). Two-way scrub makes every step reversible.
  useEffect(() => {
    const story = document.querySelector<HTMLElement>("[data-story]");
    if (!story) return;
    const sections = Array.from(story.querySelectorAll<HTMLElement>("[data-story-section]"));
    const steps = JOURNEY_FORMS.slice(1).map(() => ({ v: 0 }));
    const state = progress.current;
    const sum = () => {
      state.value = steps.reduce((s, t) => s + t.v, 0);
    };
    const intoStory = tierName === "mobile" ? TRANSITIONS.intoStory.mobile : TRANSITIONS.intoStory.desktop;

    const ctx = gsap.context(() => {
      steps.forEach((step, i) => {
        // Each form assembles as the section that owns it arrives; the first
        // step is the hero field breaking out into the Services ring.
        const windows = isColumnLayout() ? STEP_WINDOWS.columns : STEP_WINDOWS.band;
        const window = windows[i] ?? (i === 0 ? intoStory : TRANSITIONS.story);
        const trigger = { trigger: sections[STEP_SECTIONS[i] ?? i], ...window };
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
    const heroContent = document.querySelector<HTMLElement>("[data-hero-content]");
    const servicesContent = document.querySelector<HTMLElement>("[data-services-content]");
    const staffingContent = document.querySelector<HTMLElement>("[data-staffing-content]");
    const whyContent = document.querySelector<HTMLElement>("[data-why-content]");
    // The particle layer stays on through About Us (the vortex); after that the
    // opaque sections cover it.
    const lastLit = document.querySelector<HTMLElement>("[data-about]") ?? story;
    if (!story || !anchor || !layer || !lastLit) return;
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
      L.earthScale = columns ? EARTH_VIEW.scale : 1;
      L.to.x = columns ? xAt(STORY_SIDES[0] ? STORY_SLOTS.right : STORY_SLOTS.left) : xAt(0.5);
      // Pinned position while the anchor is stuck (or still arriving); once
      // the story ends, the form scrolls away with it. The release point is
      // measured from the story's end: on desktop the anchor's negative
      // margin would otherwise keep it stuck for an extra screen.
      const anchorTop = Math.min(rect.top, stickyTop, story.getBoundingClientRect().bottom - rect.height);
      L.to.y = -(anchorTop + rect.height / 2 - vh / 2) * wpp;
      L.to.scale = tier.storyScale * (rect.height / vh);
      // Desktop Earth: anchor it to the right edge so a fixed share of its
      // diameter is off-screen, whatever the window width.
      if (L.sides) {
        const earthPx = (2 * EARTH_VIEW.radius * EARTH_VIEW.scale * L.to.scale) / wpp;
        const xWorld = (vw - (0.5 - EARTH_VIEW.hiddenRight) * earthPx - vw / 2) * wpp;
        const byForm = [...STORY_SIDES];
        byForm[EARTH_VIEW.index] = (xWorld - L.sides.left) / (L.sides.right - L.sides.left);
        L.sides = { ...L.sides, byForm };
      }
      // Hero: the black hole is centred on the viewport; 1 local unit = the
      // void's radius in pixels (see HERO_FIELD).
      const V = HERO_FIELD.voidRadius;
      const voidPx = Math.min(Math.max(vw * V.width, vh * V.height), vw * V.maxWidth);
      L.from.x = 0;
      L.from.y = 0;
      L.from.scale = voidPx * wpp;
      L.protectFloor = vw < 768 ? HERO_FIELD.protectFloor.narrow : HERO_FIELD.protectFloor.wide;
      if (whyContent) {
        const c = whyContent.getBoundingClientRect();
        L.protect4 = [
          ((c.left + c.width / 2) / vw) * 2 - 1,
          -(((c.top + c.height / 2) / vh) * 2 - 1),
          (c.width / vw) * 1.02,
          (c.height / vh) * 1.02,
        ];
      }
      if (staffingContent) {
        const c = staffingContent.getBoundingClientRect();
        L.protect3 = [
          ((c.left + c.width / 2) / vw) * 2 - 1,
          -(((c.top + c.height / 2) / vh) * 2 - 1),
          (c.width / vw) * 1.02,
          (c.height / vh) * 1.02,
        ];
      }
      if (servicesContent) {
        const c = servicesContent.getBoundingClientRect();
        L.protect2 = [
          ((c.left + c.width / 2) / vw) * 2 - 1,
          -(((c.top + c.height / 2) / vh) * 2 - 1),
          (c.width / vw) * 1.02,
          (c.height / vh) * 1.02,
        ];
      }
      if (heroContent) {
        const c = heroContent.getBoundingClientRect();
        L.protect = [
          ((c.left + c.width / 2) / vw) * 2 - 1,
          -(((c.top + c.height / 2) / vh) * 2 - 1),
          (c.width / vw) * 1.04,
          (c.height / vh) * 1.04,
        ];
      }

      // Phones: once the band is stuck, the text scrolls under the band's
      // opaque background — so the canvas moves above the page and is clipped
      // to the band. Before that it stays behind the page, full screen.
      const banded = !columns && rect.top <= stickyTop + 1 && rect.bottom > stickyTop;
      // The band only turns opaque once pinned; while it scrolls into place
      // it stays see-through so the particles behind it never vanish.
      anchor.dataset.stuck = String(banded);
      layer.style.zIndex = banded ? "20" : "0";
      layer.style.clipPath = banded
        ? `inset(${Math.max(rect.top, 0)}px 0 ${Math.max(vh - rect.bottom, 0)}px 0)`
        : "none";

      // Past the story, the rest of the page covers the layer: stop drawing.
      const on = lastLit.getBoundingClientRect().bottom > 0;
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
      <ParticleVortex
        key={`vortex-${tierName}`}
        count={tier.vortexCount}
        pointer={pointer}
        pixelRatio={dpr}
        reducedMotion={reducedMotion}
        cameraZ={JOURNEY_CAMERA.z}
        cameraFov={JOURNEY_CAMERA.fov}
        onGravity={onGravity}
      />
    </ParticleCanvas>
  );
}
