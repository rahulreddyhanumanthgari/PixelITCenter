"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { SceneErrorBoundary } from "@/themes/core/components/particles/SceneErrorBoundary";
import { hasWebGL } from "@/themes/core/hooks/device";

const SculptureScene = dynamic(() => import("./SculptureScene"), { ssr: false, loading: () => null });

/** The hero sculpture's stage: WebGL only, and it renders only while on screen. */
export function Sculpture() {
  const stage = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(true);
  const [webgl, setWebgl] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWebgl(hasWebGL());
    const el = stage.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { rootMargin: "100px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={stage} className="light-sculpture" aria-hidden="true">
      {webgl && (
        <SceneErrorBoundary>
          <SculptureScene active={active} />
        </SceneErrorBoundary>
      )}
    </div>
  );
}
