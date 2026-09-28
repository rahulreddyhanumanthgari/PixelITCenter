"use client";

import { useEffect } from "react";
import { gsap } from "@/lib/gsap";

/**
 * Scroll-scrubbed entrances and exits for the story content, so the text moves
 * with the particles instead of sitting still beside them.
 *
 * Any element inside [data-story] marked `data-reveal="<order>"` takes part:
 * 0 = label, 1 = heading, 2 = description, 3+ = content. Higher orders start
 * a little later, giving a label → heading → body stagger. Each element rises
 * a few pixels and sharpens as it enters, and drifts up, dims and softens as
 * it scrolls away — scrubbed, so it reverses exactly when scrolling back.
 * Renders nothing itself.
 */
const ENTER = { from: 94, to: 68, stepPct: 3 } as const; // viewport %, element top
const MOVE = { header: 18, content: 26, exit: 16 } as const; // px
const BLUR = 6; // px, headers only

export function StoryChoreography() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-story] [data-reveal], [data-about] [data-reveal]"));
    if (els.length === 0) return;
    const mm = gsap.matchMedia();

    mm.add(
      {
        columns: "(min-width: 1024px)",
        reduce: "(prefers-reduced-motion: reduce)",
      },
      (context) => {
        const { columns, reduce } = context.conditions as { columns: boolean; reduce: boolean };
        // Phones/tablets: story content disappears under the pinned band
        // (~41% of the screen), so it exits before reaching it. About has no
        // band, so it always uses the normal exit.
        const normalExit = { start: "bottom 22%", end: "bottom 2%" };
        const bandExit = { start: "bottom 62%", end: "bottom 44%" };

        els.forEach((el) => {
          const order = Number(el.dataset.reveal) || 0;
          const exit = columns || el.closest("[data-about]") ? normalExit : bandExit;
          const sideways = el.dataset.revealAxis === "x";
          const header = order <= 2;
          const start = `top ${ENTER.from - order * ENTER.stepPct}%`;
          const end = `top ${ENTER.to - order * ENTER.stepPct}%`;

          if (reduce) {
            // Reduced motion: a gentle fade in only, no movement or blur.
            gsap.fromTo(el, { opacity: 0 }, { opacity: 1, ease: "none", scrollTrigger: { trigger: el, start, end, scrub: true } });
            return;
          }

          const rise = header ? MOVE.header : MOVE.content;
          gsap.fromTo(
            el,
            {
              opacity: 0,
              x: sideways ? -rise * 1.4 : 0,
              y: sideways ? 0 : rise,
              filter: header ? `blur(${BLUR}px)` : "none",
            },
            {
              opacity: 1,
              x: 0,
              y: 0,
              filter: "blur(0px)",
              ease: "power2.out",
              scrollTrigger: { trigger: el, start, end, scrub: 0.6 },
            },
          );
          gsap.to(el, {
            opacity: 0.12,
            y: -MOVE.exit,
            filter: header ? `blur(${BLUR / 2}px)` : "none",
            ease: "power1.in",
            immediateRender: false,
            scrollTrigger: { trigger: el, start: exit.start, end: exit.end, scrub: 0.6 },
          });
        });
      },
    );

    return () => mm.revert();
  }, []);

  return null;
}
