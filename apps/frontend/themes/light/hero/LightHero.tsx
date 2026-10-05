import { ArrowRight } from "lucide-react";
import { hero } from "@/content/site";
import { RichText } from "@/themes/core/components/ui/rich-text";

/**
 * Light hero (Light Pixel Master Specification §6): strong left typography;
 * the large pixel formation (the shared particle journey's hero form) holds
 * the right. Phones: the formation sits above, the text below. Same entrance
 * choreography as the shared hero (data-reveal).
 */
export function LightHero() {
  return (
    <section id="top" data-hero aria-labelledby="hero-title" className="relative flex min-h-[100svh] items-end lg:items-center">
      <div className="mx-auto w-full max-w-7xl px-6 pb-16 pt-[52svh] lg:px-8 lg:pb-0 lg:pt-24">
        <div data-hero-content className="max-w-[36rem]">
          <h1 id="hero-title" className="hero-title">
            <span data-reveal="0" className="hero-kicker block">
              {hero.kicker[0]} &amp; {hero.kicker[1]}
            </span>
            <span data-reveal="1" className="hero-statement block">
              {hero.statement[0]}
            </span>
            <span data-reveal="1" className="hero-statement block">
              <span className="text-[var(--accent-orange)]">{hero.statement[1].split(" ")[0]}</span>{" "}
              <span className="text-[var(--accent-blue)]">{hero.statement[1].split(" ").slice(1).join(" ")}</span>
            </span>
          </h1>
          <p data-reveal="2" className="type-body mt-6 max-w-[32rem]">
            <RichText text={hero.description} strongClassName="font-semibold text-[var(--text-primary)]" />
          </p>
          <div data-reveal="3" className="mt-8 flex flex-wrap items-center gap-3">
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
