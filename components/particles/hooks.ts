"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import type { PointerState } from "./types";

export type DeviceTier = "desktop" | "tablet" | "mobile";

const MOBILE_MAX = 768;
const TABLET_MAX = 1024;

/** Quality tier from viewport width and a rough device-power signal. */
export function detectTier(): DeviceTier {
  const w = window.innerWidth;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  // Few cores usually means a low-power device; keep it on a light tier.
  const weak = (navigator.hardwareConcurrency ?? 8) <= 4;
  if (w < MOBILE_MAX || (coarse && weak)) return "mobile";
  if (w < TABLET_MAX || coarse) return "tablet";
  return "desktop";
}

/** Current tier, re-evaluated when the window is resized. */
export function useDeviceTier(): DeviceTier {
  const [tier, setTier] = useState<DeviceTier>(detectTier);
  useEffect(() => {
    const onResize = () => setTier(detectTier());
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return tier;
}

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);
  return matches;
}

export function useReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}

/**
 * Pointer position in normalised device coordinates (-1..1), stored in a ref
 * so React never re-renders for it. Relative to `area` when given (so the
 * pointer maps onto that canvas), otherwise to the window. Tracked on the
 * window because HTML layers can sit on top of the canvas.
 */
export function usePointer(area?: RefObject<HTMLElement | null>): RefObject<PointerState> {
  const pointer = useRef<PointerState>({ x: 0, y: 0, active: false });
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const rect = area?.current?.getBoundingClientRect();
      const left = rect?.left ?? 0;
      const top = rect?.top ?? 0;
      const width = rect?.width || window.innerWidth;
      const height = rect?.height || window.innerHeight;
      pointer.current.x = ((e.clientX - left) / width) * 2 - 1;
      pointer.current.y = -((e.clientY - top) / height) * 2 + 1;
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
  }, [area]);
  return pointer;
}

/** True when the browser can actually create a WebGL context. */
export function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
    return gl !== null;
  } catch {
    return false;
  }
}
