"use client";

import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { hasWebGL } from "./hooks";

export interface CanvasSettings {
  cameraFov: number;
  cameraZ: number;
  background: string;
  dpr: number;
  bloom: { intensity: number; threshold: number; smoothing: number };
}

interface ParticleCanvasProps {
  settings: CanvasSettings;
  children: ReactNode;
  /** Receives the wrapper element (for scroll triggers / pointer mapping). */
  containerRef?: RefObject<HTMLDivElement | null>;
}

/**
 * A WebGL canvas for a particle system: perspective camera, restrained
 * bloom, and rendering paused while the canvas is off-screen. Renders
 * nothing when WebGL is unavailable, so the page around it is unaffected.
 */
export function ParticleCanvas(props: ParticleCanvasProps) {
  const [supported] = useState(hasWebGL);
  return supported ? <ParticleCanvasInner {...props} /> : null;
}

function ParticleCanvasInner({ settings, children, containerRef }: ParticleCanvasProps) {
  const ownRef = useRef<HTMLDivElement>(null);
  const ref = containerRef ?? ownRef;
  const [visible, setVisible] = useState(true);

  // Stop rendering entirely while the canvas is off-screen.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      rootMargin: "100px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);

  return (
    <div ref={ref} className="absolute inset-0" aria-hidden="true">
      <Canvas
        dpr={settings.dpr}
        frameloop={visible ? "always" : "never"}
        camera={{ fov: settings.cameraFov, position: [0, 0, settings.cameraZ], near: 0.1, far: 60 }}
        gl={{ antialias: false, alpha: false, powerPreference: "high-performance" }}
        fallback={null}
        style={{ pointerEvents: "none" }}
      >
        <color attach="background" args={[settings.background]} />
        {children}
        <EffectComposer multisampling={0}>
          <Bloom
            mipmapBlur
            intensity={settings.bloom.intensity}
            luminanceThreshold={settings.bloom.threshold}
            luminanceSmoothing={settings.bloom.smoothing}
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
