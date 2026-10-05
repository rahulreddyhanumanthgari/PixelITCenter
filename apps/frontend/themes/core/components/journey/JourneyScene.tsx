"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import type { BloomEffect } from "postprocessing";
import { gsap } from "@/themes/core/lib/gsap";
import { ParticleCanvas } from "@/themes/core/components/particles/ParticleCanvas";
import { ParticleSystem, type LayoutState } from "@/themes/core/components/particles/ParticleSystem";
import { StarField, type Atmosphere } from "@/themes/core/components/particles/StarField";
import { LightSky } from "@/themes/light/LightSky";
import { useDeviceTier, usePointer, useReducedMotion } from "@/themes/core/hooks/device";
import type { PointerState, ProgressState } from "@/themes/core/components/particles/types";
import { PALETTE } from "@/themes/core/lib/particles/palette";
import { smoothstep } from "@/themes/core/lib/particles/random";
import { processProgress } from "@/themes/core/lib/processProgress";
import { useTheme } from "@/themes/core/lib/theme";
import {
  HERO_LOOK,
  JOURNEY_BLOOM,
  JOURNEY_CAMERA,
  JOURNEY_FORMS,
  CAMERA_MOTION,
  EARTH_VIEW,
  GALAXY_VIEW,
  HERO_FIELD,
  orbView,
  STORY_FLIGHT,
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
 * field → Services → Staffing → Why us → How we work → About's galaxy. It lives in a fixed,
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
  // Light theme: a bright atmosphere (LightSky), no bloom, particles drawn
  // as ink dots in the light palette.
  const light = useTheme() === "light";
  const lightRef = useRef(light);
  useEffect(() => {
    lightRef.current = light;
  }, [light]);
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
    torusScale: 1,
    solarPhone: 0,
    protect5: [0, 0, 0.001, 0.001],
    galaxy: null,
    galaxyCollapse: 0,
    earthScale: 1,
  });
  // How scattered the main particles are; drives the stars and camera.
  const atmosphere = useRef<Atmosphere>({ field: 0, gravity: 0, gravityX: 0, gravityY: 0 });

  // Each frame: bloom eases from the hero's strength to the story's with the
  // handoff, and the scatter amount is shared with the stars and camera.
  const onBlend = useCallback(
    (blend: number, field: number) => {
      const effect = bloom.current;
      if (effect) effect.intensity = lightRef.current ? 0 : tier.bloom.hero + (tier.bloom.story - tier.bloom.hero) * blend;
      atmosphere.current.field = field;
      atmosphere.current.heroBlend = blend;
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
  // (0 = hero field … 4 = solar system). Two-way scrub makes every step reversible.
  useEffect(() => {
    const story = document.querySelector<HTMLElement>("[data-story]");
    if (!story) return;
    // The story sections, then About (its galaxy is the last form).
    const about = document.querySelector<HTMLElement>("[data-about]");
    const sections = [
      ...Array.from(story.querySelectorAll<HTMLElement>("[data-story-section]")),
      ...(about ? [about] : []),
    ];
    const steps = JOURNEY_FORMS.slice(1).map(() => ({ v: 0 }));
    const state = progress.current;
    const sum = () => {
      state.value = steps.reduce((s, t) => s + t.v, 0);
    };
    const intoStory = tierName === "mobile" ? TRANSITIONS.intoStory.mobile : TRANSITIONS.intoStory.desktop;
    const intoAbout = isColumnLayout() ? TRANSITIONS.intoAbout.desktop : TRANSITIONS.intoAbout.mobile;

    const ctx = gsap.context(() => {
      steps.forEach((step, i) => {
        // Each form assembles as the section that owns it arrives; the first
        // step is the hero field breaking out into the Services ring.
        const span = i === 0 ? intoStory : sections[i] === about ? intoAbout : TRANSITIONS.story;
        const trigger = { trigger: sections[i], ...span };
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
    const processContent = document.querySelector<HTMLElement>("[data-process-content]");
    const galaxyAnchor = document.querySelector<HTMLElement>("[data-galaxy-anchor]");
    const galaxyOutro = document.querySelector<HTMLElement>("[data-galaxy-outro]");
    const galaxyRegion = document.querySelector<HTMLElement>("[data-galaxy-region]");
    // The particle layer stays on through the galaxy area (About → Contact);
    // after that the opaque footer covers it.
    const lastLit = document.querySelector<HTMLElement>("[data-galaxy-region]") ?? story;
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
      // The Why halo is sized to frame desktop content; in the phone band the
      // whole ring must fit instead.
      L.torusScale = columns ? 1 : 0.4;
      // How We Work: planets around the centred content on desktop; a compact
      // wave in the phone band.
      L.solarPhone = columns ? 0 : 1;
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
      // Light theme: the hero is a glowing particle orb. The particles centre
      // on it, and 1 local unit = twice its radius (the shader's sphere has
      // radius 0.5).
      if (lightRef.current) {
        const o = orbView(vw, vh);
        L.from.x = o.dx * wpp;
        L.from.y = -o.dy * wpp;
        L.from.scale = o.r * 2 * wpp;
      }
      L.protectFloor = vw < 768 ? HERO_FIELD.protectFloor.narrow : HERO_FIELD.protectFloor.wide;
      // About's galaxy: centred on its pinned anchor, rim past the screen.
      if (galaxyAnchor) {
        const a = galaxyAnchor.getBoundingClientRect();
        const cy = a.top + a.height / 2;
        const reachPx = Math.max(vw * GALAXY_VIEW.reach.width, vh * GALAXY_VIEW.reach.height);
        L.galaxy = {
          x: (a.left + a.width / 2 - vw / 2) * wpp,
          y: -(cy - vh / 2) * wpp,
          scale: (reachPx * wpp) / GALAXY_VIEW.outer,
          // Gravity is strongest while About's centre is near the screen's.
          presence: 1 - smoothstep(0.45, 1.1, Math.abs(cy - vh / 2) / vh),
          // The footer's top edge (the region's end): the ending's horizon.
          horizon: galaxyRegion ? -(galaxyRegion.getBoundingClientRect().bottom - vh / 2) * wpp : 0,
        };
      }
      // Ending: the empty stretch after Contact scrubs the collapse, from its
      // top entering the screen (0) to the galaxy's release (1).
      if (galaxyOutro) {
        const o = galaxyOutro.getBoundingClientRect();
        L.galaxyCollapse = Math.min(Math.max((vh - o.top) / Math.max(o.height, 1), 0), 1);
      }
      if (processContent) {
        const c = processContent.getBoundingClientRect();
        L.protect5 = [
          ((c.left + c.width / 2) / vw) * 2 - 1,
          -(((c.top + c.height / 2) / vh) * 2 - 1),
          (c.width / vw) * 1.02,
          (c.height / vh) * 1.02,
        ];
      }
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
        background: light ? PALETTE.backgroundLight : PALETTE.background,
        dpr,
        bloom: { intensity: tier.bloom.hero, ...JOURNEY_BLOOM },
      }}
    >
      {light && <LightSky pixelRatio={dpr} reducedMotion={reducedMotion} atmosphere={atmosphere} />}
      <StarField
        // Fewer loose background points on white, where they read as noise.
        count={Math.round(tier.starCount * (light ? 0.08 : 1))}
        pixelRatio={dpr}
        reducedMotion={reducedMotion}
        pointer={pointer}
        atmosphere={atmosphere}
        light={light}
      />
      <CameraRig
        pointer={pointer}
        atmosphere={atmosphere}
        strength={reducedMotion ? 0 : tierName === "mobile" ? 0.5 : 1}
      />
      <ParticleSystem
        key={`${tierName}-${light}`}
        forms={JOURNEY_FORMS}
        // Light theme: more particles, so each shape reads as a dense, solid
        // form on white instead of a scattered spray.
        count={Math.round(tier.particleCount * (light ? 1.6 : 1))}
        look={HERO_LOOK}
        lookTo={STORY_LOOK}
        handoffAt={STORY_HANDOFF}
        flight={STORY_FLIGHT.swell}
        layout={layout}
        progress={progress}
        pointer={pointer}
        scatter={tier.scatter}
        pixelRatio={dpr}
        reducedMotion={reducedMotion}
        onBlend={onBlend}
        onGravity={onGravity}
        stage={stage}
        light={light}
      />
    </ParticleCanvas>
  );
}
