"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { LAND_MASK } from "@/themes/core/lib/particles/landMask";
import { decodeMask } from "@/themes/core/lib/particles/forms/earth";
import { useReducedMotion } from "@/themes/core/hooks/device";

/**
 * Light design, Staffing (owner's reference): a white, matte, sculpted
 * globe. The continents (the site's Natural Earth land mask) are raised in
 * relief on the sphere so they catch the light; lit softly from the upper
 * left with a cool blue from the lower right, as in the reference. Turns
 * slowly. Solid 3D, not particles.
 */

const START_TURN = -0.95;

/** The land mask as a softened greyscale map: white land, black sea. */
function reliefTexture(): THREE.CanvasTexture {
  const { width: W, height: H } = LAND_MASK;
  const grid = decodeMask();
  const mask = document.createElement("canvas");
  mask.width = W;
  mask.height = H;
  const mctx = mask.getContext("2d")!;
  const img = mctx.createImageData(W, H);
  // Land is craggy (a little height noise), the sea flat, as in the reference.
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < W * H; i++) {
    const v = grid[i] ? Math.round(170 + rand() * 85) : 0;
    img.data[i * 4] = v;
    img.data[i * 4 + 1] = v;
    img.data[i * 4 + 2] = v;
    img.data[i * 4 + 3] = 255;
  }
  mctx.putImageData(img, 0, 0);

  // Upscale with a slight blur, so the coasts rise as soft slopes, not steps.
  const out = document.createElement("canvas");
  out.width = 2048;
  out.height = 1024;
  const ctx = out.getContext("2d")!;
  ctx.filter = "blur(1.2px)";
  ctx.drawImage(mask, 0, 0, out.width, out.height);
  const tex = new THREE.CanvasTexture(out);
  tex.colorSpace = THREE.NoColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function Globe({ reducedMotion }: { reducedMotion: boolean }) {
  const map = useMemo(() => reliefTexture(), []);
  const geometry = useMemo(() => new THREE.SphereGeometry(1.6, 320, 160), []);
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#ffffff",
        roughness: 0.82,
        metalness: 0,
        displacementMap: map,
        displacementScale: 0.07,
        bumpMap: map,
        bumpScale: 3.5,
      }),
    [map],
  );
  useEffect(() => () => map.dispose(), [map]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);

  const spin = useRef<THREE.Mesh>(null);
  // Start facing Europe, Africa and Asia (as in the reference).
  useEffect(() => {
    if (spin.current) spin.current.rotation.y = START_TURN;
  }, []);
  useFrame((_, raw) => {
    if (spin.current && !reducedMotion) spin.current.rotation.y += Math.min(raw, 1 / 20) * 0.05;
  });

  return (
    // Tilted like the reference: the northern lands toward the viewer.
    <group rotation={[0.42, -0.6, 0.12]}>
      <mesh ref={spin} geometry={geometry} material={material} />
    </group>
  );
}

export default function GlobeRelief({ active }: { active: boolean }) {
  const reducedMotion = useReducedMotion();
  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={[1, 2]}
      camera={{ fov: 30, position: [0, 0, 7.2] }}
      gl={{ alpha: true, antialias: true, toneMapping: THREE.NeutralToneMapping }}
      style={{ background: "transparent" }}
    >
      {/* Soft daylight from the upper left; the light hero's blue fills the
          lower right, as the blue tint in the reference. */}
      <hemisphereLight args={["#ffffff", "#d3e1f0", 1.35]} />
      <directionalLight position={[-3, 4, 4]} intensity={1.7} color="#ffffff" />
      <directionalLight position={[3.5, -2.5, 1.5]} intensity={0.6} color="#a9c8ee" />
      <directionalLight position={[0, 0, 6]} intensity={0.35} color="#ffffff" />
      <Globe reducedMotion={reducedMotion} />
    </Canvas>
  );
}
