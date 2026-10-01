"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { SceneErrorBoundary } from "@/themes/core/components/particles/SceneErrorBoundary";
import { hasWebGL } from "@/themes/core/hooks/device";
import { gsap, ScrollTrigger } from "@/themes/core/lib/gsap";

const GlobeScene = dynamic(() => import("./GlobeScene"), { ssr: false, loading: () => null });

/**
 * The globe's stage in the light hero, plus the hand-off to the page's
 * particle journey. While the hero is on screen the journey layer (whose
 * opening form is the dark design's black hole) is hidden; it fades in as
 * Services arrives, so its particles appear gathering into the Services ring.
 */
export function HeroGlobe() {
  const stage = useRef<HTMLDivElement>(null);
  const scroll = useRef(0);
  const [active, setActive] = useState(true);
  const [webgl, setWebgl] = useState<boolean | null>(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    // Decided after mount: WebGL and screen size are browser-only facts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWebgl(hasWebGL());
    setCount(window.innerWidth < 768 ? 9000 : 22000);
  }, []);

  useEffect(() => {
    const el = stage.current;
    const hero = el?.closest<HTMLElement>("[data-hero]");
    const layer = document.querySelector<HTMLElement>("[data-journey-layer]");
    if (!el || !hero) return;

    // Render only while the globe can be seen.
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { rootMargin: "100px" });
    io.observe(el);

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: hero,
        start: "top top",
        end: "bottom top",
        onUpdate: (self) => {
          scroll.current = self.progress;
        },
      });
      if (layer) {
        gsap.fromTo(
          layer,
          { opacity: 0 },
          {
            opacity: 1,
            ease: "none",
            scrollTrigger: { trigger: "#services", start: "top 100%", end: "top 45%", scrub: true },
          },
        );
      }
    });
    return () => {
      io.disconnect();
      ctx.revert();
      if (layer) layer.style.opacity = "";
    };
  }, []);

  return (
    <div ref={stage} className="light-globe-stage" aria-hidden="true">
      {/* Body, glow and shadow without WebGL too: the globe is never missing. */}
      <div className="light-globe-glow" />
      <div className="light-globe-shadow" />
      {webgl === false && <div className="light-globe-fallback" />}
      {webgl && count > 0 && (
        <div className="absolute inset-0">
          <SceneErrorBoundary>
            <GlobeScene count={count} scroll={scroll} active={active} />
          </SceneErrorBoundary>
        </div>
      )}
    </div>
  );
}
