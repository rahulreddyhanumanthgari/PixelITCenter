"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { SceneErrorBoundary } from "@/themes/core/components/particles/SceneErrorBoundary";
import { hasWebGL } from "@/themes/core/hooks/device";

const GlobeRelief = dynamic(() => import("./GlobeRelief"), { ssr: false, loading: () => null });

/** The globe behind the Staffing content, centred. Renders only while on screen. */
export function StaffingGlobe() {
  const stage = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [webgl, setWebgl] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWebgl(hasWebGL());
    const el = stage.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { rootMargin: "150px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center overflow-hidden">
      <div ref={stage} className="light-staffing-globe">
        {webgl && (
          <div className="absolute inset-0">
            <SceneErrorBoundary>
              <GlobeRelief active={active} />
            </SceneErrorBoundary>
          </div>
        )}
      </div>
    </div>
  );
}
