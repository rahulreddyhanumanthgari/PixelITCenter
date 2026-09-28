"use client";

import dynamic from "next/dynamic";

// ssr: false has to live in a Client Component in the App Router. This keeps
// three.js entirely out of the server render while the hero text stays SSR.
const ParticleScene = dynamic(() => import("./ParticleScene"), {
  ssr: false,
  loading: () => null,
});

export function HeroCanvasLoader() {
  return <ParticleScene />;
}
