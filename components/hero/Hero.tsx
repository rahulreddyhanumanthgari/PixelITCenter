import { ArrowDown, ArrowRight } from "lucide-react";
import { hero } from "@/content/site";
import { buttonVariants } from "@/components/ui/button";
import { RichText } from "@/components/ui/rich-text";
import { cn } from "@/lib/utils";

/**
 * Landing hero: one full-screen statement, centred. The whole viewport is
 * the particle gravity field (drawn by the page-wide JourneyLayer behind
 * this transparent section); this is just the real h1, copy and CTAs on top.
 * Particles projected behind [data-hero-content] are dimmed in the shader.
 */
export function Hero() {
  return (
    <section
      id="top"
      data-hero
      aria-labelledby="hero-title"
      className="relative flex min-h-[100svh] items-center justify-center overflow-hidden"
    >
      <div className="mx-auto w-full max-w-7xl px-4 pb-24 pt-28 sm:px-6 lg:px-8">
        <div data-hero-content className="mx-auto flex max-w-6xl flex-col items-center text-center">
          {/* Four lines on phones; two balanced lines from md up. Each word is
              a [data-word] span for the word-by-word entrance. */}
          <h1
            id="hero-title"
            data-reveal="1"
            className="type-display-xl hero-title text-[clamp(2.75rem,13vw,4.5rem)] md:text-[clamp(3.5rem,min(7.4vw,12svh),6.5rem)]"
          >
            {[hero.headline.slice(0, 2), hero.headline.slice(2)].map((pair, row) => (
              <span key={row} className="block md:whitespace-nowrap">
                {pair.map((line, i) => (
                  <span key={line.text} className="block md:inline">
                    {line.text.split(" ").map((word, wi) => (
                      <span key={wi}>
                        {wi > 0 && " "}
                        <span
                          data-word
                          className={cn("inline-block", hero.accentWords.includes(word) && "highlight")}
                        >
                          {word}
                        </span>
                      </span>
                    ))}
                    {i === 0 && <span className="hidden md:inline"> </span>}
                  </span>
                ))}
              </span>
            ))}
          </h1>

          <p
            data-reveal="2"
            className="type-body mx-auto mt-8 max-w-xl text-center text-balance"
          >
            <RichText text={hero.description} strongClassName="font-semibold text-brand-orange" />
          </p>

          <div data-reveal="3" className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <a href={hero.primaryCta.href} className={cn(buttonVariants(), "h-12 rounded-full px-6 text-sm font-semibold")}>
              {hero.primaryCta.label}
              <ArrowRight data-icon="inline-end" />
            </a>
            <a
              href={hero.secondaryCta.href}
              className={cn(buttonVariants({ variant: "ghost" }), "h-12 rounded-full px-5 text-sm text-foreground hover:bg-white/5")}
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
