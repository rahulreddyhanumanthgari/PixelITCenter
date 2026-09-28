"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import vertexShader from "@/shaders/robot.vert.glsl";
import fragmentShader from "@/shaders/particle.frag.glsl";
import { gsap } from "@/lib/gsap";
import { mulberry32, randomUnitVector } from "@/lib/particles/random";
import { PALETTE_LINEAR } from "@/lib/particles/palette";
import { ROBOT_HEIGHT, ROBOT_PIVOTS, generateRobotParticles } from "@/lib/particles/robot";
import type { PointerState } from "@/components/particles/types";

/** Every tunable number for the robot. */
export const ROBOT_CONFIG = {
  particleSize: 9,
  /** Robot height as a fraction of its slot's height. */
  fill: 0.82,
  /** Resting pose: turned slightly toward the text, tipped a touch forward. */
  baseYaw: -0.32,
  baseTilt: 0.05,
  /** Max joint rotations (radians) at full cursor influence. */
  head: { yaw: THREE.MathUtils.degToRad(10), pitch: THREE.MathUtils.degToRad(6) },
  torso: { yaw: THREE.MathUtils.degToRad(3), pitch: THREE.MathUtils.degToRad(1.5) },
  arms: { swing: THREE.MathUtils.degToRad(3) },
  /** Eye glance in the face plane, robot units. */
  eyes: { x: 0.07, y: 0.05 },
  /** Cursor influence: full within `inner`, none beyond `outer` (× slot height). */
  proximity: { inner: 0.45, outer: 1.25 },
  /** Damping per 60fps frame: head leads, body follows more slowly. */
  damping: { head: 0.07, body: 0.04, eyes: 0.12, hover: 0.05 },
  idle: { float: 0.05, headYaw: THREE.MathUtils.degToRad(2), speed: 0.6 },
  /** Entrance: the robot gathers as the About section scrolls in. */
  enter: { start: "top 82%", end: "top 28%", scrub: 0.8 },
} as const;

interface ParticleRobotProps {
  count: number;
  pointer: RefObject<PointerState>;
  pixelRatio: number;
  reducedMotion: boolean;
  /** Camera distance, for pixel → world conversion. */
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
 * The About Us robot: one THREE.Points in the shared journey canvas, placed
 * over the empty [data-robot-anchor] slot in the About section. Scroll drives
 * its entrance; the cursor drives head/eye/body tracking.
 */
export function ParticleRobot({ count, pointer, pixelRatio, reducedMotion, cameraZ, cameraFov }: ParticleRobotProps) {
  const rootRef = useRef<THREE.Group>(null);
  const pointsRef = useRef<THREE.Points>(null);
  const rect = useRef<Rect>({ x: 0, y: 0, w: 0, h: 0, visible: false });
  const enter = useRef({ v: 0 });

  const geometry = useMemo(() => {
    const robot = generateRobotParticles(count);
    const rand = mulberry32(77);
    const randoms = new Float32Array(count);
    const scales = new Float32Array(count);
    const scatter = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      randoms[i] = rand();
      const s = rand();
      scales[i] = s > 0.985 ? 1.6 : 0.55 + s * 0.6;
      randomUnitVector(rand, scatter, i);
      const d = 0.8 + rand() * 2.2;
      scatter[i * 3] *= d;
      scatter[i * 3 + 1] = scatter[i * 3 + 1] * d + 0.6;
      scatter[i * 3 + 2] *= d;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(robot.positions, 3));
    g.setAttribute("aNormal", new THREE.BufferAttribute(robot.normals, 3));
    g.setAttribute("aPart", new THREE.BufferAttribute(robot.parts, 1));
    g.setAttribute("aBright", new THREE.BufferAttribute(robot.brightness, 1));
    g.setAttribute("aRandom", new THREE.BufferAttribute(randoms, 1));
    g.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));
    g.setAttribute("aScatter", new THREE.BufferAttribute(scatter, 3));
    return g;
  }, [count]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uPart: { value: Array.from({ length: 5 }, () => new THREE.Matrix4()) },
          uEyeOffset: { value: new THREE.Vector2() },
          uTime: { value: 0 },
          uEnter: { value: 0 },
          uSize: { value: ROBOT_CONFIG.particleSize },
          uPixelRatio: { value: 1 },
          uMotion: { value: 1 },
          uHover: { value: 0 },
          uCursor: { value: new THREE.Vector3(100, 100, 100) },
          uFocusDepth: { value: cameraZ },
          uAccent: { value: PALETTE_LINEAR.orange.clone() },
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
    const anchor = document.querySelector<HTMLElement>("[data-robot-anchor]");
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
        visible: r.bottom > -100 && r.top < window.innerHeight + 100,
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
      gsap.to(state, {
        v: 1,
        ease: "none",
        scrollTrigger: { trigger: about, ...ROBOT_CONFIG.enter },
      });
    });
    return () => {
      ctx.revert();
      state.v = 0;
    };
  }, []);

  // Scratch state reused every frame.
  const s = useRef({
    head: new THREE.Vector2(),
    torso: new THREE.Vector2(),
    eyes: new THREE.Vector2(),
    swing: 0,
    hover: 0,
    enter: 0,
    m: new THREE.Matrix4(),
    t: new THREE.Matrix4(),
    e: new THREE.Euler(),
    torsoM: new THREE.Matrix4(),
    ndc: new THREE.Vector2(),
    ray: new THREE.Raycaster(),
    plane: new THREE.Plane(new THREE.Vector3(0, 0, 1), 0),
    hit: new THREE.Vector3(),
  });

  useFrame((state, rawDelta) => {
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

    // --- placement over the slot ------------------------------------------
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const wpp = (2 * cameraZ * Math.tan(((cameraFov / 2) * Math.PI) / 180)) / vh;
    const scale = (R.h * ROBOT_CONFIG.fill * wpp) / ROBOT_HEIGHT;
    const float = Math.sin(time * ROBOT_CONFIG.idle.speed) * ROBOT_CONFIG.idle.float * motion;
    root.position.set((R.x - vw / 2) * wpp, -(R.y - vh / 2) * wpp + float * scale, 0);
    root.scale.setScalar(scale);
    root.rotation.set(ROBOT_CONFIG.baseTilt, ROBOT_CONFIG.baseYaw, 0);

    // --- cursor → influence -------------------------------------------------
    const p = pointer.current;
    let cx = 0;
    let cy = 0;
    let prox = 0;
    if (p.active && !reducedMotion) {
      const px = ((p.x + 1) / 2) * vw;
      const py = ((1 - p.y) / 2) * vh;
      cx = THREE.MathUtils.clamp((px - R.x) / (R.h * 0.6), -1, 1);
      cy = THREE.MathUtils.clamp((R.y - py) / (R.h * 0.5), -1, 1);
      const dist = Math.hypot(px - R.x, py - R.y) / R.h;
      const { inner, outer } = ROBOT_CONFIG.proximity;
      prox = 1 - THREE.MathUtils.smoothstep(dist, inner, outer);
    }
    // Idle: a slow glance side to side when nobody is steering.
    const idleYaw = Math.sin(time * 0.37) * ROBOT_CONFIG.idle.headYaw * motion;

    const { damping: D } = ROBOT_CONFIG;
    const kHead = damp(D.head, delta);
    const kBody = damp(D.body, delta);
    S.head.x += (cx * prox * ROBOT_CONFIG.head.yaw + idleYaw * (1 - prox) - S.head.x) * kHead;
    S.head.y += (-cy * prox * ROBOT_CONFIG.head.pitch - S.head.y) * kHead;
    S.torso.x += (cx * prox * ROBOT_CONFIG.torso.yaw - S.torso.x) * kBody;
    S.torso.y += (-cy * prox * ROBOT_CONFIG.torso.pitch - S.torso.y) * kBody;
    S.swing += (cx * prox * ROBOT_CONFIG.arms.swing - S.swing) * kBody;
    S.eyes.x += (cx * prox * ROBOT_CONFIG.eyes.x - S.eyes.x) * damp(D.eyes, delta);
    S.eyes.y += (cy * prox * ROBOT_CONFIG.eyes.y - S.eyes.y) * damp(D.eyes, delta);
    S.hover += (prox - S.hover) * damp(D.hover, delta);
    u.uHover.value = S.hover;
    (u.uEyeOffset.value as THREE.Vector2).copy(S.eyes);

    // --- joint transforms ----------------------------------------------------
    const parts = u.uPart.value as THREE.Matrix4[];
    const pivot = (out: THREE.Matrix4, at: THREE.Vector3, rx: number, ry: number, rz: number) => {
      S.e.set(rx, ry, rz);
      out.makeTranslation(at.x, at.y, at.z);
      out.multiply(S.t.makeRotationFromEuler(S.e));
      out.multiply(S.t.makeTranslation(-at.x, -at.y, -at.z));
      return out;
    };
    const breathe = Math.sin(time * 1.1) * 0.006 * motion;
    pivot(S.torsoM, ROBOT_PIVOTS.waist, S.torso.y + breathe, S.torso.x, 0);
    parts[1].copy(S.torsoM);
    parts[0].copy(S.torsoM).multiply(pivot(S.m, ROBOT_PIVOTS.neck, S.head.y, S.head.x, -S.head.x * 0.15));
    parts[2].copy(S.torsoM).multiply(pivot(S.m, ROBOT_PIVOTS.shoulderL, 0, 0, -S.swing - breathe));
    parts[3].copy(S.torsoM).multiply(pivot(S.m, ROBOT_PIVOTS.shoulderR, 0, 0, -S.swing + breathe));
    parts[4].identity();

    // --- cursor in robot space (for the local particle response) ------------
    if (prox > 0.01) {
      S.plane.constant = -root.position.z;
      S.ndc.set(p.x, p.y);
      S.ray.setFromCamera(S.ndc, state.camera);
      if (S.ray.ray.intersectPlane(S.plane, S.hit)) (u.uCursor.value as THREE.Vector3).copy(root.worldToLocal(S.hit));
    }
  });

  return (
    <group ref={rootRef} visible={false}>
      <points ref={pointsRef} geometry={geometry} material={material} frustumCulled={false} />
    </group>
  );
}
