"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { SceneErrorBoundary } from "@/themes/core/components/particles/SceneErrorBoundary";
import { hasWebGL } from "@/themes/core/hooks/device";

const GlobeScene = dynamic(() => import("../hero/GlobeScene"), { ssr: false, loading: () => null });

/**
 * Light design, Contact (Light Theme pack: "Contact remains minimal with one
 * calm large particle object"): a large dotted particle sphere, turning
 * slowly behind the centred Contact text. Renders only while on screen.
 */
export function ContactOrb() {
  const stage = useRef<HTMLDivElement>(null);
  const still = useRef(0);
  const [active, setActive] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (hasWebGL()) setCount(window.innerWidth < 768 ? 5000 : 9000);
    const el = stage.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { rootMargin: "100px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center overflow-hidden">
      <div ref={stage} className="light-contact-orb">
        {count > 0 && (
          <SceneErrorBoundary>
            <GlobeScene variant="orb" count={count} scroll={still} active={active} />
          </SceneErrorBoundary>
        )}
      </div>
    </div>
  );
}
