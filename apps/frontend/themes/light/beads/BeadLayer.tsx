"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { SceneErrorBoundary } from "@/themes/core/components/particles/SceneErrorBoundary";
import { hasWebGL } from "@/themes/core/hooks/device";

const BeadScene = dynamic(() => import("./BeadScene"), { ssr: false, loading: () => null });

/**
 * Fixed, full-screen layer behind the light page: the white atmosphere and,
 * over it, the bead scene. The page content sits above it (main is z-10).
 */
export function BeadLayer() {
  const [webgl, setWebgl] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWebgl(hasWebGL());
  }, []);
  return (
    <div aria-hidden="true" className="light-atmosphere pointer-events-none fixed inset-0 z-0">
      {webgl && (
        <SceneErrorBoundary>
          <BeadScene />
        </SceneErrorBoundary>
      )}
    </div>
  );
}
