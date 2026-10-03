import { ArrowDown, ArrowRight } from "lucide-react";
import { hero } from "@/content/site";
import { buttonVariants } from "@/themes/core/components/ui/button";
import { RichText } from "@/themes/core/components/ui/rich-text";
import { cn } from "@/lib/utils";

/**
 * Light hero: the shared headline, copy and CTAs, left-aligned on desktop so
 * the solar eclipse (drawn by the page-wide particle layer and LightSky)
 * holds the right half. Phones and tablets: centred, below the eclipse.
 * Same entrance choreography as the shared hero (data-reveal).
 */
export function LightHero() {
  return (
    <section
      id="top"
      data-hero
      aria-labelledby="hero-title"
      className="relative flex min-h-[100svh] items-end overflow-hidden lg:items-center"
    >
      <div className="mx-auto w-full max-w-7xl px-6 pb-20 pt-40 lg:px-8 lg:pb-16">
        <div data-hero-content className="flex flex-col items-center text-center lg:w-[52%] lg:items-start lg:text-left">
          <h1 id="hero-title" className="hero-title light-hero-title">
            <span data-reveal="0" className="hero-kicker block">
              {hero.kicker[0]} <span className="highlight">&amp;</span> {hero.kicker[1]}
            </span>
            <span data-reveal="1" className="hero-statement mt-2 block whitespace-normal sm:mt-3">
              {hero.statement[0]} {hero.statement[1]}
            </span>
          </h1>

          <p data-reveal="2" className="type-body mt-7 max-w-[34rem]">
            <RichText text={hero.description} strongClassName="font-medium" />
          </p>

          <div data-reveal="3" className="mt-10 flex flex-wrap items-center gap-3">
            <a href={hero.primaryCta.href} className={cn(buttonVariants(), "h-11 rounded-full px-6 text-sm font-medium")}>
              {hero.primaryCta.label}
              <ArrowRight data-icon="inline-end" />
            </a>
            <a
              href={hero.secondaryCta.href}
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "h-11 rounded-full px-5 text-sm font-medium text-[var(--text-secondary)] hover:bg-foreground/5 hover:text-foreground",
              )}
            >
              {hero.secondaryCta.label}
            </a>
          </div>
        </div>
      </div>

      <a
        href="#services"
        className="type-label absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-2 transition-colors hover:text-foreground"
      >
        <ArrowDown className="size-3.5" aria-hidden="true" />
        Scroll
      </a>
    </section>
  );
}
