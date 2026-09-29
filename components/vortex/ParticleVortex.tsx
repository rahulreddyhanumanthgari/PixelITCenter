"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import vertexShader from "@/shaders/vortex.vert.glsl";
import fragmentShader from "@/shaders/particle.frag.glsl";
import { gsap } from "@/lib/gsap";
import { VORTEX, createVortexGeometry } from "@/lib/particles/vortex";
import type { PointerState } from "@/components/particles/types";
import { STORY_LOOK } from "@/components/journey/journey-config";

/**
 * Every tunable number for the About Us galaxy. Particle size matches the
 * journey particles; the spiral's shape and colours live in
 * lib/particles/vortex.ts and shaders/vortex.vert.glsl.
 */
export const VORTEX_CONFIG = {
  /** Outer radius on screen: the larger of these fractions of width/height. */
  reach: { width: 0.52, height: 0.64 },
  /** Disc orientation: almost face-on (π/2 would be exactly face-on), so the
   * spiral reads like the reference while keeping a little depth. */
  tilt: [1.38, 0, 0.16] as const,
  /** Pointer: max extra tilt (radians) and parallax (fraction of radius). */
  pointer: { tilt: 0.06, parallax: 0.02, damping: 0.03 },
  /** Brightness left behind the text (desktop / narrow screens). */
  protectFloor: { wide: 0.3, narrow: 0.42 },
  /** Entrance: the field forms as the About section scrolls in. */
  enter: { start: "top 90%", end: "top 15%", scrub: 0.8 },
} as const;

interface ParticleVortexProps {
  count: number;
  pointer: RefObject<PointerState>;
  pixelRatio: number;
  reducedMotion: boolean;
  cameraZ: number;
  cameraFov: number;
  /**
   * Called every frame with the gravity strength (0..1) and its centre in
   * world units, so the shared star field can bend around About too.
   */
  onGravity: (strength: number, x: number, y: number) => void;
}

interface Layout {
  /** Section centre and size (CSS px). */
  x: number;
  y: number;
  visible: boolean;
  /** 1 while About fills the view, easing to 0 as it scrolls away. */
  presence: number;
  /** Content box in NDC: centre, half-size. */
  protect: [number, number, number, number];
}

const damp = (d: number, delta: number) => 1 - Math.pow(1 - d, delta * 60);

/**
 * About Us: a particle spiral galaxy drawn in the shared journey canvas,
 * centred on the section behind the centred content. Scroll brings it in;
 * it then turns and streams inward on its own. The pointer adds only a
 * slight tilt.
 */
export function ParticleVortex({
  count,
  pointer,
  pixelRatio,
  reducedMotion,
  cameraZ,
  cameraFov,
  onGravity,
}: ParticleVortexProps) {
  const rootRef = useRef<THREE.Group>(null);
  const pointsRef = useRef<THREE.Points>(null);
  const layout = useRef<Layout>({ x: 0, y: 0, visible: false, presence: 0, protect: [0, 0, 0.001, 0.001] });
  const enter = useRef({ v: 0 });

  const geometry = useMemo(() => createVortexGeometry(count), [count]);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uEnter: { value: 0 },
          uSize: { value: STORY_LOOK.particleSize },
          uPixelRatio: { value: 1 },
          uMotion: { value: 1 },
          uFocusDepth: { value: cameraZ },
          uPointer: { value: new THREE.Vector2() },
          uProtect: { value: new THREE.Vector4(0, 0, 0.001, 0.001) },
          uProtectFloor: { value: VORTEX_CONFIG.protectFloor.wide },
        },
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [cameraZ],
  );

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);

  useEffect(() => {
    const u = (pointsRef.current?.material as THREE.ShaderMaterial | undefined)?.uniforms;
    if (!u) return;
    u.uPixelRatio.value = pixelRatio;
    u.uMotion.value = reducedMotion ? 0.15 : 1;
  }, [pixelRatio, reducedMotion]);

  // Section centre + content box, refreshed on scroll/resize.
  useEffect(() => {
    const anchor = document.querySelector<HTMLElement>("[data-vortex-anchor]");
    const content = document.querySelector<HTMLElement>("[data-about-content]");
    if (!anchor || !content) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const a = anchor.getBoundingClientRect();
      const c = content.getBoundingClientRect();
      layout.current = {
        x: a.left + a.width / 2,
        y: a.top + a.height / 2,
        visible: a.bottom > -200 && a.top < vh + 200,
        // Gravity is strongest while About's centre is near the screen's.
        presence: 1 - THREE.MathUtils.smoothstep(Math.abs(a.top + a.height / 2 - vh / 2) / vh, 0.45, 1.1),
        protect: [
          ((c.left + c.width / 2) / vw) * 2 - 1,
          -(((c.top + c.height / 2) / vh) * 2 - 1),
          (c.width / vw) * 1.04,
          (c.height / vh) * 1.04,
        ],
      };
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
    };
  }, []);

  // Entrance, scrubbed by scroll (reversible). The flow itself is autonomous.
  useEffect(() => {
    const about = document.querySelector<HTMLElement>("[data-about]");
    if (!about) return;
    const state = enter.current;
    const ctx = gsap.context(() => {
      gsap.to(state, { v: 1, ease: "none", scrollTrigger: { trigger: about, ...VORTEX_CONFIG.enter } });
    });
    return () => {
      ctx.revert();
      state.v = 0;
    };
  }, []);

  const s = useRef({ enter: 0, pointer: new THREE.Vector2() });

  useFrame((_, rawDelta) => {
    const root = rootRef.current;
    const points = pointsRef.current;
    if (!root || !points) return;
    const u = (points.material as THREE.ShaderMaterial).uniforms;
    const S = s.current;
    const L = layout.current;
    const delta = Math.min(rawDelta, 1 / 20);
    u.uTime.value += delta;

    S.enter += (enter.current.v - S.enter) * damp(0.08, delta);
    u.uEnter.value = S.enter;

    // Tell the shared star field where gravity is and how strong, so the
    // same space visibly bends around About (and relaxes as it leaves).
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const wpp = (2 * cameraZ * Math.tan(((cameraFov / 2) * Math.PI) / 180)) / vh;
    onGravity(L.visible ? S.enter * L.presence : 0, (L.x - vw / 2) * wpp, -(L.y - vh / 2) * wpp);

    root.visible = L.visible && S.enter > 0.002;
    if (!root.visible) return;

    const p = pointer.current;
    const k = damp(VORTEX_CONFIG.pointer.damping, delta);
    S.pointer.x += ((p.active && !reducedMotion ? p.x : 0) - S.pointer.x) * k;
    S.pointer.y += ((p.active && !reducedMotion ? p.y : 0) - S.pointer.y) * k;
    (u.uPointer.value as THREE.Vector2).copy(S.pointer);
    (u.uProtect.value as THREE.Vector4).set(...L.protect);

    u.uProtectFloor.value = vw < 1024 ? VORTEX_CONFIG.protectFloor.narrow : VORTEX_CONFIG.protectFloor.wide;
    const radiusPx = Math.max(vw * VORTEX_CONFIG.reach.width, vh * VORTEX_CONFIG.reach.height);
    const scale = (radiusPx * wpp) / VORTEX.outer;
    const par = VORTEX_CONFIG.pointer.parallax * radiusPx * wpp;
    root.position.set((L.x - vw / 2) * wpp + S.pointer.x * par, -(L.y - vh / 2) * wpp + S.pointer.y * par, 0);
    root.scale.setScalar(scale);

    const [bx, by, bz] = VORTEX_CONFIG.tilt;
    const t = VORTEX_CONFIG.pointer.tilt;
    root.rotation.set(bx - S.pointer.y * t, by + S.pointer.x * t, bz);
  });

  return (
    <group ref={rootRef} visible={false}>
      <points ref={pointsRef} geometry={geometry} material={material} frustumCulled={false} />
    </group>
  );
}
