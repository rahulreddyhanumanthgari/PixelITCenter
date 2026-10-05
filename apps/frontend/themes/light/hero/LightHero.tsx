import { ArrowRight } from "lucide-react";
import { hero } from "@/content/site";
import { RichText } from "@/themes/core/components/ui/rich-text";

/**
 * Light hero, after the reference video: a tall condensed headline stacked
 * on the left, the copy and CTAs under it; the bead rocket (BeadLayer) holds
 * the right. Phones: the rocket sits above, the text below. Same entrance
 * choreography as the shared hero (data-reveal).
 */
export function LightHero() {
  return (
    <section id="top" data-hero aria-labelledby="hero-title" className="relative flex min-h-[100svh] items-end lg:items-center">
      <div className="mx-auto w-full max-w-7xl px-6 pb-16 pt-[46svh] lg:px-8 lg:pb-0 lg:pt-24">
        <div data-hero-content className="max-w-[40rem]">
          <h1 id="hero-title" className="light-display">
            <span data-reveal="0" className="block">
              {hero.kicker[0]}{" "}
              <span className="light-amp">&amp;</span> {hero.kicker[1]}
            </span>
            <span data-reveal="1" className="block">
              {hero.statement[0]}
            </span>
            <span data-reveal="1" className="block">
              {hero.statement[1]}
            </span>
          </h1>
          <p data-reveal="2" className="light-lead mt-7">
            <RichText text={hero.description} strongClassName="font-semibold text-[var(--text-primary)]" />
          </p>
          <div data-reveal="3" className="mt-9 flex flex-wrap items-center gap-3">
            <a href={hero.primaryCta.href} className="light-btn light-btn--dark">
              {hero.primaryCta.label}
              <ArrowRight className="size-4" aria-hidden="true" />
            </a>
            <a href={hero.secondaryCta.href} className="light-btn light-btn--ghost">
              {hero.secondaryCta.label}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
