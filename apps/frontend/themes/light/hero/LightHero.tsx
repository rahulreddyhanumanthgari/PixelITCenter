import { ArrowDown, ArrowRight } from "lucide-react";
import { hero } from "@/content/site";
import { buttonVariants } from "@/themes/core/components/ui/button";
import { RichText } from "@/themes/core/components/ui/rich-text";
import { cn } from "@/lib/utils";

/**
 * Light hero, after the owner's reference animation: the approved headline
 * (TECHNOLOGY & TALENT / BUILT FOR WHAT'S NEXT, the site's own type) and CTAs
 * centred at the top; the blue tube rises below them as a large arch (drawn
 * by the page-wide RibbonLayer behind this transparent section). The
 * description sits bottom right and a scroll cue bottom left (phones: the
 * description follows the CTAs). Text is still;
 * the object moves.
 */
export function LightHero() {
  return (
    <section id="top" data-hero aria-labelledby="hero-title" className="relative flex min-h-[100svh] flex-col">
      <div data-hero-content className="mx-auto flex w-full max-w-5xl flex-col items-center px-6 pt-32 text-center lg:pt-36">
        <h1 id="hero-title" className="hero-title light-hero-title">
          <span className="hero-kicker block">
            {hero.kicker[0]}
            <br className="sm:hidden" />
            <span className="hidden sm:inline"> </span>
            <span className="highlight">&amp;</span> {hero.kicker[1]}
          </span>
          <span className="hero-statement mt-1 block sm:mt-2">
            {hero.statement[0]}
            <br className="md:hidden" />
            <span className="hidden md:inline"> </span>
            {hero.statement[1]}
          </span>
        </h1>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a href={hero.primaryCta.href} className={cn(buttonVariants(), "h-11 rounded-full px-6 text-sm font-medium")}>
            {hero.primaryCta.label}
            <ArrowRight data-icon="inline-end" />
          </a>
          <a
            href={hero.secondaryCta.href}
            className={cn(buttonVariants({ variant: "outline" }), "h-11 rounded-full bg-white/70 px-5 text-sm font-medium")}
          >
            {hero.secondaryCta.label}
          </a>
        </div>
      </div>

      {/* Phones: the description follows the CTAs (the arch fills the bottom);
          larger screens: it sits bottom right, the scroll cue bottom left. */}
      <p className="light-hero-copy mx-auto mt-6 px-6 text-center sm:absolute sm:bottom-10 sm:right-6 sm:mt-0 sm:px-0 sm:text-left lg:right-[max(2rem,calc((100vw-80rem)/2+2rem))]">
        <RichText text={hero.description} strongClassName="font-medium text-brand-orange" />
      </p>
      <a
        href="#services"
        className="type-label absolute bottom-10 left-6 hidden items-center gap-2 transition-colors hover:text-foreground sm:flex lg:left-[max(2rem,calc((100vw-80rem)/2+2rem))]"
      >
        <ArrowDown className="size-3.5" aria-hidden="true" />
        Scroll
      </a>
    </section>
  );
}
