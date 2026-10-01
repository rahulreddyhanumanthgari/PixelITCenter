import { ArrowRight } from "lucide-react";
import { hero } from "@/content/site";
import { buttonVariants } from "@/themes/core/components/ui/button";
import { RichText } from "@/themes/core/components/ui/rich-text";
import { cn } from "@/lib/utils";
/**
 * Light hero: centred hero hierarchy (the approved TECHNOLOGY & TALENT /
 * BUILT FOR WHAT'S NEXT headline, copy, CTAs) in a pale-blue atmosphere,
 * with three info cards. No particles: the central object is still to be
 * decided.
 */
export function LightHero() {
  return (
    <section id="top" data-hero aria-labelledby="hero-title" className="light-hero relative overflow-hidden">
      <div className="mx-auto w-full max-w-7xl px-6 pb-24 pt-28 lg:px-8 lg:pb-32 lg:pt-36">
        <div data-hero-content className="mx-auto flex max-w-4xl flex-col items-center text-center">
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

          <p className="type-body mx-auto mt-6 max-w-[36rem] text-center text-balance md:max-w-[44rem]">
            <RichText text={hero.description} strongClassName="font-medium whitespace-nowrap text-brand-orange" />
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
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

        {/* The hero's central object will go here (to be decided). Until
            then the three info cards sit in a row under the CTAs. */}
        <ul className="light-hero-cards">
          {hero.cards.map((card) => (
            <li key={card.label} className="light-hero-card" data-accent={card.accent}>
              <span className="light-hero-card-label">{card.label}</span>
              <span className="light-hero-card-value">{card.value}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
