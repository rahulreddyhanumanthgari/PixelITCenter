"use client";

import { useEffect } from "react";
import { gsap, ScrollTrigger } from "@/themes/core/lib/gsap";
import { JOURNEY_FORMS } from "@/themes/core/components/journey/journey-config";
import {
  journeyClock,
  journeyProgress,
} from "@/themes/core/lib/journeyProgress";

/**
 * Light version: every card group ([data-card]) follows the particles
 * exactly. The cards stay scattered (pushed out in different directions,
 * small, tilted) while their section's particle form assembles; the
 * frame the form is fully built — the drawn morph position (journeyProgress,
 * written by the particle system) reaching that form — they pop into place,
 * one after another. Scrolling back so the form comes apart scatters them
 * again, so they replay in both directions, like the particles. Groups in the
 * galaxy area (About onward) follow About's galaxy. A group plays only while
 * it is on screen. Without particles (no WebGL) the cards simply show.
 * Reduced motion: a plain fade in / out. Renders nothing.
 */
/** "Fully built": within this much of the form's position. */
const BUILT = 0.02;

export function CardEntrance() {
  useEffect(() => {
    const cards = Array.from(
      document.querySelectorAll<HTMLElement>("[data-card]"),
    );
    if (cards.length === 0) return;
    const groups = new Map<HTMLElement, HTMLElement[]>();
    cards.forEach((c) => {
      const parent = c.parentElement ?? c;
      groups.set(parent, [...(groups.get(parent) ?? []), c]);
    });
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    // Which particle form each story section owns (JOURNEY_FORMS order).
    const storySections = Array.from(
      document.querySelectorAll<HTMLElement>("[data-story-section]"),
    );
    const galaxyAt = JOURNEY_FORMS.indexOf("galaxy");

    type Group = {
      list: HTMLElement[];
      form: number;
      visible: boolean;
      shown: boolean;
      out: gsap.TweenVars;
    };
    const all: Group[] = [];

    const ctx = gsap.context(() => {
      groups.forEach((list, parent) => {
        const story = parent.closest<HTMLElement>("[data-story-section]");
        const form = parent.closest("[data-galaxy-region]")
          ? galaxyAt
          : story
            ? storySections.indexOf(story) + 1
            : 0;
        const scatter = list.map((_, i) => {
          const a = (i * 2.399963) % (Math.PI * 2); // golden angle
          const d = 140 + (i % 3) * 50;
          return {
            x: Math.cos(a) * d,
            y: Math.sin(a) * d * 0.6 + 40,
            r: ((i % 5) - 2) * 7,
          };
        });
        const out: gsap.TweenVars = reduce
          ? { opacity: 0 }
          : {
              opacity: 0,
              x: (i: number) => scatter[i].x,
              y: (i: number) => scatter[i].y,
              rotation: (i: number) => scatter[i].r,
              scale: 0.55,
            };
        gsap.set(list, out);
        const g: Group = { list, form, visible: false, shown: false, out };
        all.push(g);
        ScrollTrigger.create({
          trigger: parent,
          start: "top 95%",
          end: "bottom 5%",
          onToggle: (self) => {
            g.visible = self.isActive;
          },
        });
      });
    });

    const show = (g: Group, want: boolean) => {
      if (want === g.shown) return;
      g.shown = want;
      gsap.killTweensOf(g.list);
      if (want) {
        gsap.to(g.list, {
          opacity: 1,
          x: 0,
          y: 0,
          rotation: 0,
          scale: 1,
          duration: reduce ? 0.4 : 0.75,
          ease: "back.out(1.4)",
          stagger: 0.07,
          // Hand the transform back to CSS so the hover lift works.
          clearProps: "transform",
        });
      } else {
        gsap.to(g.list, {
          ...g.out,
          duration: reduce ? 0.3 : 0.5,
          ease: "power2.in",
          stagger: 0.04,
        });
      }
    };

    // Every frame: compare each group's form with where the particles are.
    let raf = 0;
    const tick = () => {
      const live =
        journeyClock.at > 0 && performance.now() - journeyClock.at < 1500;
      const at = journeyProgress.value;
      for (const g of all) {
        const built = !live || at >= g.form - BUILT;
        show(g, built && g.visible);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ctx.revert();
    };
  }, []);

  return null;
}
