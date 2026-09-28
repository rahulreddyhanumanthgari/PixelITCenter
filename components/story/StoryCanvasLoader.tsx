"use client";

import dynamic from "next/dynamic";
import { SceneErrorBoundary } from "@/components/particles/SceneErrorBoundary";

// three.js stays out of the server render; the section text around it is SSR.
const StoryScene = dynamic(() => import("./StoryScene"), { ssr: false, loading: () => null });

export function StoryCanvasLoader() {
  return (
    <SceneErrorBoundary>
      <StoryScene />
    </SceneErrorBoundary>
  );
}
