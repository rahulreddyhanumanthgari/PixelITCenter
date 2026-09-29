import { ArrowDown, ArrowRight } from "lucide-react";
import { hero } from "@/content/site";
import { buttonVariants } from "@/components/ui/button";
import { RichText } from "@/components/ui/rich-text";
import { cn } from "@/lib/utils";

/**
 * Landing hero: one full-screen statement, centred inside the black hole's
 * calm centre (the particle ring frames it; drawn by the page-wide
 * JourneyLayer behind this transparent section).
 *
 * Hierarchy: a smaller positioning line (TECHNOLOGY & TALENT, only "&" in
 * orange) above the primary statement (BUILT FOR / WHAT'S NEXT), then quiet
 * supporting copy and CTAs. Line breaks are explicit, never left to wrapping.
 * Entrance: line by line, each a short fade + rise (data-reveal).
 */
export function Hero() {
  return (
    <section
      id="top"
      data-hero
      aria-labelledby="hero-title"
      className="relative flex min-h-[100svh] items-center justify-center overflow-hidden"
    >
      <div className="mx-auto w-full max-w-7xl px-6 pb-24 pt-28 lg:px-8">
        <div data-hero-content className="mx-auto flex max-w-4xl flex-col items-center text-center">
          <h1 id="hero-title" className="hero-title">
            {/* Positioning line: two lines on phones, one from sm up. */}
            <span data-reveal="0" className="hero-kicker block">
              {hero.kicker[0]}
              <br className="sm:hidden" />
              <span className="hidden sm:inline"> </span>
              <span className="highlight">&amp;</span> {hero.kicker[1]}
            </span>
            {/* Primary statement: always its own two lines. */}
            <span data-reveal="1" className="hero-statement mt-5 block sm:mt-6">
              {hero.statement.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </span>
          </h1>

          <p data-reveal="2" className="type-body mx-auto mt-8 max-w-[36rem] text-center text-balance">
            <RichText text={hero.description} strongClassName="font-medium text-brand-orange" />
          </p>

          <div data-reveal="3" className="mt-12 flex flex-wrap items-center justify-center gap-3">
            <a href={hero.primaryCta.href} className={cn(buttonVariants(), "h-11 rounded-full px-6 text-sm font-medium")}>
              {hero.primaryCta.label}
              <ArrowRight data-icon="inline-end" />
            </a>
            <a
              href={hero.secondaryCta.href}
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "h-11 rounded-full px-5 text-sm font-medium text-[var(--text-secondary)] hover:bg-white/5 hover:text-foreground",
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
