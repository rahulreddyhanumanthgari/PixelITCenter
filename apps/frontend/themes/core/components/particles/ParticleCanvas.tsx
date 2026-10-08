"use client";

import { useState, type ReactNode, type Ref } from "react";
import { Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import type { BloomEffect } from "postprocessing";
import { hasWebGL } from "@/themes/core/hooks/device";

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
  /** When false, rendering stops entirely (nothing on screen needs it). */
  active: boolean;
  /** Lets the scene adjust bloom intensity per frame without re-rendering. */
  bloomRef?: Ref<BloomEffect>;
}

/**
 * A WebGL canvas for a particle system: perspective camera and restrained
 * bloom. Renders nothing when WebGL is unavailable, so the page around it is
 * unaffected.
 */
export function ParticleCanvas(props: ParticleCanvasProps) {
  const [supported] = useState(hasWebGL);
  return supported ? <ParticleCanvasInner {...props} /> : null;
}

function ParticleCanvasInner({ settings, children, active, bloomRef }: ParticleCanvasProps) {
  return (
    <Canvas
      dpr={settings.dpr}
      frameloop={active ? "always" : "never"}
      camera={{ fov: settings.cameraFov, position: [0, 0, settings.cameraZ], near: 0.1, far: 60 }}
      gl={{ antialias: false, alpha: false, powerPreference: "high-performance" }}
      fallback={null}
      style={{ pointerEvents: "none" }}
      aria-hidden="true"
    >
      <color attach="background" args={[settings.background]} />
      {children}
      <EffectComposer multisampling={0}>
        <Bloom
          ref={bloomRef}
          mipmapBlur
          intensity={settings.bloom.intensity}
          luminanceThreshold={settings.bloom.threshold}
          luminanceSmoothing={settings.bloom.smoothing}
        />
      </EffectComposer>
    </Canvas>
  );
}
