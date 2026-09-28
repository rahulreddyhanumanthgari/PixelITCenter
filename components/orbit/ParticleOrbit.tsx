"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import vertexShader from "@/shaders/orbit.vert.glsl";
import fragmentShader from "@/shaders/particle.frag.glsl";
import { gsap } from "@/lib/gsap";
import { ORBIT, createOrbitGeometry } from "@/lib/particles/orbit";
import type { PointerState } from "@/components/particles/types";

/** Every tunable number for the About Us orbit. */
export const ORBIT_CONFIG = {
  particleSize: 11,
  /** Ring diameter as a fraction of its slot's width (can overhang a little). */
  fill: 0.98,
  /** Resting orientation: tipped back and turned so it reads as a 3D portal. */
  tilt: [1.02, 0.28, -0.18] as const,
  /** Slow drift of the whole structure (radians/s) and its amplitude. */
  drift: { speed: 0.07, amount: 0.12 },
  /** Pointer: max extra tilt (radians) and parallax (fraction of slot). */
  pointer: { tilt: 0.1, parallax: 0.02, damping: 0.035 },
  /** Entrance: the orbit forms as the About section scrolls in. */
  enter: { start: "top 85%", end: "top 20%", scrub: 0.8 },
} as const;

interface ParticleOrbitProps {
  count: number;
  pointer: RefObject<PointerState>;
  pixelRatio: number;
  reducedMotion: boolean;
  cameraZ: number;
  cameraFov: number;
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
  visible: boolean;
}

const damp = (d: number, delta: number) => 1 - Math.pow(1 - d, delta * 60);

/**
 * About Us: a 3D orbital particle structure drawn in the shared journey
 * canvas over the empty [data-orbit-anchor] slot. Scroll forms it; the
 * pointer only adds a little tilt and parallax.
 */
export function ParticleOrbit({ count, pointer, pixelRatio, reducedMotion, cameraZ, cameraFov }: ParticleOrbitProps) {
  const rootRef = useRef<THREE.Group>(null);
  const pointsRef = useRef<THREE.Points>(null);
  const rect = useRef<Rect>({ x: 0, y: 0, w: 0, h: 0, visible: false });
  const enter = useRef({ v: 0 });

  const geometry = useMemo(() => createOrbitGeometry(count), [count]);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uEnter: { value: 0 },
          uSize: { value: ORBIT_CONFIG.particleSize },
          uPixelRatio: { value: 1 },
          uMotion: { value: 1 },
          uFocusDepth: { value: cameraZ },
          uPointer: { value: new THREE.Vector2() },
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

  // Slot position on screen (CSS px), refreshed on scroll/resize.
  useEffect(() => {
    const anchor = document.querySelector<HTMLElement>("[data-orbit-anchor]");
    if (!anchor) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const r = anchor.getBoundingClientRect();
      rect.current = {
        x: r.left + r.width / 2,
        y: r.top + r.height / 2,
        w: r.width,
        h: r.height,
        visible: r.bottom > -200 && r.top < window.innerHeight + 200,
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

  // Entrance, scrubbed by scroll (reversible).
  useEffect(() => {
    const about = document.querySelector<HTMLElement>("[data-about]");
    if (!about) return;
    const state = enter.current;
    const ctx = gsap.context(() => {
      gsap.to(state, { v: 1, ease: "none", scrollTrigger: { trigger: about, ...ORBIT_CONFIG.enter } });
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
    const R = rect.current;
    const delta = Math.min(rawDelta, 1 / 20);
    const time = (u.uTime.value += delta);
    const motion = reducedMotion ? 0.15 : 1;

    S.enter += (enter.current.v - S.enter) * damp(0.08, delta);
    u.uEnter.value = S.enter;
    root.visible = R.visible && S.enter > 0.002;
    if (!root.visible) return;

    const p = pointer.current;
    const k = damp(ORBIT_CONFIG.pointer.damping, delta);
    const tx = p.active && !reducedMotion ? p.x : 0;
    const ty = p.active && !reducedMotion ? p.y : 0;
    S.pointer.x += (tx - S.pointer.x) * k;
    S.pointer.y += (ty - S.pointer.y) * k;
    (u.uPointer.value as THREE.Vector2).copy(S.pointer);

    // Placement over the slot.
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const wpp = (2 * cameraZ * Math.tan(((cameraFov / 2) * Math.PI) / 180)) / vh;
    const diameter = 2 * ORBIT.radius * 1.1;
    const scale = (Math.min(R.w, R.h * 1.2) * ORBIT_CONFIG.fill * wpp) / diameter;
    const par = ORBIT_CONFIG.pointer.parallax * R.w * wpp;
    root.position.set((R.x - vw / 2) * wpp + S.pointer.x * par, -(R.y - vh / 2) * wpp + S.pointer.y * par, 0);
    root.scale.setScalar(scale);

    const [bx, by, bz] = ORBIT_CONFIG.tilt;
    const d = ORBIT_CONFIG.drift;
    root.rotation.set(
      bx + Math.sin(time * d.speed) * d.amount * motion - S.pointer.y * ORBIT_CONFIG.pointer.tilt,
      by + Math.cos(time * d.speed * 0.8) * d.amount * motion + S.pointer.x * ORBIT_CONFIG.pointer.tilt,
      bz,
    );
  });

  return (
    <group ref={rootRef} visible={false}>
      <points ref={pointsRef} geometry={geometry} material={material} frustumCulled={false} />
    </group>
  );
}
