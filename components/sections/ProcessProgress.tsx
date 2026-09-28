"use client";

import { useEffect } from "react";
import { gsap } from "@/lib/gsap";
import { processProgress } from "@/lib/processProgress";

type StepState = "inactive" | "active" | "completed";

/**
 * Drives the How We Work steps from scroll. Each step scrubs 0→1 while it
 * passes a line just above the middle of the viewport; the sum is the
 * process progress (0 = Discover active … 4 = all done). Steps get a
 * `data-state` for styling, and the particles read the same progress.
 * Renders nothing itself. Two-way scrub: scrolling back reverses it all.
 */
export function ProcessProgress() {
  useEffect(() => {
    const steps = Array.from(document.querySelectorAll<HTMLElement>("[data-process-step]"));
    if (steps.length === 0) return;
    const parts = steps.map(() => ({ v: 0 }));

    const apply = () => {
      const progress = parts.reduce((sum, p) => sum + p.v, 0);
      processProgress.value = progress;
      const active = Math.floor(progress + 1e-4);
      steps.forEach((el, k) => {
        const state: StepState = k < active ? "completed" : k === active ? "active" : "inactive";
        if (el.dataset.state !== state) el.dataset.state = state;
      });
    };

    const ctx = gsap.context(() => {
      steps.forEach((el, k) => {
        gsap.to(parts[k], {
          v: 1,
          ease: "none",
          onUpdate: apply,
          scrollTrigger: { trigger: el, start: "top 58%", end: "bottom 58%", scrub: 0.4 },
        });
      });
    });
    apply();
    return () => {
      ctx.revert();
      processProgress.value = 0;
    };
  }, []);

  return null;
}
