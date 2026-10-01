"use client";

import { useEffect } from "react";
import { gsap } from "@/themes/dark/lib/gsap";

/**
 * Typography entrances and exits, independent of the particles.
 *
 * Any element marked `data-reveal="<order>"` (in the hero, the story, or the
 * galaxy area) takes part: 0 = eyebrow, 1 = heading, 2 = description,
 * 3+ = content (cards). When it reaches the viewport it plays a short, timed
 * entrance — the typography stays calm while the particles move:
 * - eyebrow: fade + slight rise
 * - heading: word by word (its `[data-word]` spans) with a very small
 *   stagger, rising 20px and sharpening from a 4px blur; a highlighted word
 *   enters with the rest, then its accent colour resolves ~150ms later
 * - description, then cards: delayed fade + rise
 * Each entrance plays once; after that the content stays put — scrolling
 * back up (or down again) never hides or replays it. Items marked
 * `data-reveal-static` (a pinned header) take their entrance from their
 * section instead of their own position.
 * Reduced motion: a plain fade, no movement, blur or accent delay.
 * Renders nothing itself.
 */
const ENTER = { start: "top 88%", pinnedStart: "top 70%" } as const;
/** Entrance delay by order (s), so eyebrow → heading → body → cards read in sequence. */
const DELAY = [0, 0.08, 0.3, 0.4, 0.46, 0.52] as const;
const WORD = { rise: 20, blur: 4, duration: 0.8, stagger: 0.045, accentLag: 0.15 } as const;
const MOVE = { eyebrow: 10, block: 16 } as const;

export function StoryChoreography() {
  useEffect(() => {
    const els = Array.from(
      document.querySelectorAll<HTMLElement>(
        "[data-hero] [data-reveal], [data-story] [data-reveal], [data-galaxy-region] [data-reveal], [data-footer] [data-reveal]",
      ),
    );
    if (els.length === 0) return;
    const mm = gsap.matchMedia();

    mm.add(
      { reduce: "(prefers-reduced-motion: reduce)" },
      (context) => {
        const { reduce } = context.conditions as { reduce: boolean };

        els.forEach((el) => {
          const order = Number(el.dataset.reveal) || 0;
          const pinned = el.hasAttribute("data-reveal-static");
          const trigger = pinned ? (el.closest("section") ?? el) : el;
          const delay = DELAY[Math.min(order, DELAY.length - 1)];
          const words = Array.from(el.querySelectorAll<HTMLElement>("[data-word]"));
          const accents = words.filter((w) => w.classList.contains("highlight"));
          const tl = gsap.timeline({
            scrollTrigger: {
              trigger,
              start: pinned ? ENTER.pinnedStart : ENTER.start,
              once: true,
            },
          });

          if (reduce) {
            tl.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: "none" }, delay * 0.5);
            return;
          }

          if (words.length > 0) {
            // Heading: word by word; the accent colour resolves just after
            // its word lands (entrance only — no pulsing afterwards).
            tl.fromTo(
              words,
              { opacity: 0, y: WORD.rise, filter: `blur(${WORD.blur}px)` },
              {
                opacity: 1,
                y: 0,
                filter: "blur(0px)",
                duration: WORD.duration,
                ease: "power3.out",
                stagger: WORD.stagger,
              },
              delay,
            );
            accents.forEach((word) => {
              const accent = getComputedStyle(word).color;
              const base = getComputedStyle(el).color;
              const at = delay + words.indexOf(word) * WORD.stagger + WORD.duration * 0.5 + WORD.accentLag;
              tl.fromTo(word, { color: base }, { color: accent, duration: 0.6, ease: "power2.out" }, at);
            });
          } else {
            const rise = order === 0 ? MOVE.eyebrow : MOVE.block;
            tl.fromTo(el, { opacity: 0, y: rise }, { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" }, delay);
          }

        });
      },
    );

    return () => mm.revert();
  }, []);

  return null;
}
