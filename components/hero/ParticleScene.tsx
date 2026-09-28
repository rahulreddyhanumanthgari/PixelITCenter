"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { gsap } from "@/lib/gsap";
import { ParticleSculpture } from "./ParticleSculpture";
import { StarField } from "./StarField";
import {
  PALETTE,
  PARTICLE_CONFIG,
  SCENE_LAYOUT,
  getTierSettings,
  type DeviceTier,
} from "./particle-config";
import type { PointerState, ScrollState } from "./types";

function detectTier(): DeviceTier {
  const narrow = window.innerWidth < PARTICLE_CONFIG.mobileBreakpoint;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  // Few cores usually means a low-power device; keep it on the light tier.
  const weak = (navigator.hardwareConcurrency ?? 8) <= 4;
  return narrow || (coarse && weak) ? "mobile" : "desktop";
}

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);
  return matches;
}

/** True when the browser can actually create a WebGL context. */
function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
    return gl !== null;
  } catch {
    return false;
  }
}

/**
 * Entry point, loaded through HeroCanvasLoader with ssr: false so it only
 * ever runs in the browser. Without WebGL the hero is just the HTML content
 * on the dark background.
 */
export default function ParticleSceneGate() {
  const [supported] = useState(hasWebGL);
  return supported ? <ParticleScene /> : null;
}

/** The whole WebGL layer of the hero. */
function ParticleScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const pointer = useRef<PointerState>({ x: 0, y: 0, active: false });
  const scroll = useRef<ScrollState>({ progress: 0 });

  const [tier, setTier] = useState<DeviceTier>(detectTier);
  const [visible, setVisible] = useState(true);
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  const settings = getTierSettings(tier);
  const dpr = Math.min(window.devicePixelRatio || 1, settings.maxDpr);

  // Re-evaluate the tier when the window crosses the breakpoint.
  useEffect(() => {
    const onResize = () => setTier(detectTier());
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Pointer is tracked on the window because the HTML layer sits on top of
  // the canvas. Values go into a ref; React never re-renders for them.
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
      pointer.current.active = true;
    };
    const onLeave = () => {
      pointer.current.active = false;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  // Scroll: GSAP scrubs a plain number from 0 to 1 across the hero; the
  // sculpture reads it each frame.
  useEffect(() => {
    const hero = containerRef.current?.closest<HTMLElement>("[data-hero]");
    if (!hero) return;
    const state = scroll.current;
    const ctx = gsap.context(() => {
      gsap.to(state, {
        progress: 1,
        ease: "none",
        scrollTrigger: {
          trigger: hero,
          start: "top top",
          end: "bottom top",
          scrub: 0.8,
        },
      });
    });
    return () => {
      ctx.revert();
      state.progress = 0;
    };
  }, []);

  // Stop rendering entirely while the hero is off-screen.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      rootMargin: "100px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0" aria-hidden="true">
      <Canvas
        dpr={dpr}
        frameloop={visible ? "always" : "never"}
        camera={{
          fov: SCENE_LAYOUT.cameraFov,
          position: [0, 0, SCENE_LAYOUT.cameraZ],
          near: 0.1,
          far: 60,
        }}
        gl={{ antialias: false, alpha: false, powerPreference: "high-performance" }}
        fallback={null}
        style={{ pointerEvents: "none" }}
      >
        <color attach="background" args={[PALETTE.background]} />
        <StarField count={settings.starCount} pixelRatio={dpr} reducedMotion={reducedMotion} />
        <ParticleSculpture
          key={tier}
          count={settings.particleCount}
          offset={settings.offset}
          scale={settings.scale}
          pixelRatio={dpr}
          reducedMotion={reducedMotion}
          pointer={pointer}
          scroll={scroll}
        />
        <EffectComposer multisampling={0}>
          <Bloom
            mipmapBlur
            intensity={settings.bloomIntensity}
            luminanceThreshold={PARTICLE_CONFIG.bloomThreshold}
            luminanceSmoothing={PARTICLE_CONFIG.bloomSmoothing}
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
