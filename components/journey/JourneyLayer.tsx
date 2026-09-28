"use client";

import dynamic from "next/dynamic";
import { SceneErrorBoundary } from "@/components/particles/SceneErrorBoundary";

// three.js stays out of the server render; all page text is SSR as normal.
const JourneyScene = dynamic(() => import("./JourneyScene"), { ssr: false, loading: () => null });

/**
 * Fixed, full-screen layer behind the page that holds the one particle
 * system for the whole journey. The page content sits above it (main is
 * z-10); JourneyScene moves this layer above the page only on phones, clipped
 * to the pinned story band.
 */
export function JourneyLayer() {
  return (
    <div data-journey-layer aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
      <SceneErrorBoundary>
        <JourneyScene />
      </SceneErrorBoundary>
    </div>
  );
}
