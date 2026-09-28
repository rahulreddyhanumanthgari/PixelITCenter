"use client";

import { useEffect } from "react";
import { gsap } from "@/lib/gsap";
import { processProgress } from "@/lib/processProgress";

type StepState = "inactive" | "active" | "completed";

const STEPS = 4;
/** Timeline position (in steps) where panel k hands over to panel k+1. */
const HANDOVER = { outLead: 0.2, inLead: 0.1, duration: 0.2, stagger: 0.05 } as const;

/**
 * Drives How We Work from scroll: one ScrollTrigger across the pinned track
 * scrubs the process progress 0 → 4 (0 = Discover active … 4 = all done).
 * - index items get `data-state` (inactive / active / completed)
 * - the step panels cross over at each checkpoint (number → title → text)
 * - the particle path reads the same progress (lib/processProgress)
 * Scrubbed, so everything reverses when scrolling back. Renders nothing.
 */
export function ProcessProgress() {
  useEffect(() => {
    const track = document.querySelector<HTMLElement>("[data-process-track]");
    if (!track) return;
    const steps = Array.from(track.querySelectorAll<HTMLElement>("[data-process-step]"));
    const panels = Array.from(track.querySelectorAll<HTMLElement>("[data-process-panel]"));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const shift = reduce ? 0 : 18;

    const apply = (stage: number) => {
      processProgress.value = stage;
      const active = Math.min(Math.floor(stage + 1e-4), STEPS);
      steps.forEach((el, k) => {
        const state: StepState = k < active ? "completed" : k === active ? "active" : "inactive";
        if (el.dataset.state !== state) el.dataset.state = state;
      });
      const shown = Math.min(active, STEPS - 1);
      panels.forEach((el, k) => el.setAttribute("aria-hidden", String(k !== shown)));
    };

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: "power2.out", duration: HANDOVER.duration },
        scrollTrigger: {
          trigger: track,
          start: "top 30%",
          end: "bottom 85%",
          scrub: 0.5,
          onUpdate: (self) => apply(self.progress * STEPS),
        },
      });
      const parts = panels.map((p) => Array.from(p.querySelectorAll<HTMLElement>("[data-panel-part]")));
      parts.slice(1).forEach((list) => gsap.set(list, { opacity: 0, x: shift }));

      for (let k = 0; k < STEPS - 1; k++) {
        const at = k + 1;
        // Current step releases focus: drifts left and fades…
        tl.to(parts[k], { opacity: 0, x: -shift, ease: "power1.in", stagger: HANDOVER.stagger }, at - HANDOVER.outLead);
        // …while the next one settles in from the right, slightly overlapping.
        tl.fromTo(
          parts[k + 1],
          { opacity: 0, x: shift },
          { opacity: 1, x: 0, stagger: HANDOVER.stagger, immediateRender: false },
          at - HANDOVER.inLead,
        );
      }
      // Pad so the timeline spans exactly 0 → 4 steps of scroll.
      tl.set({}, {}, STEPS);
    });
    apply(0);
    return () => {
      ctx.revert();
      processProgress.value = 0;
    };
  }, []);

  return null;
}
