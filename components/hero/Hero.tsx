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
        <div data-hero-content className="mx-auto flex max-w-5xl flex-col items-center text-center">
          <p className="mb-6 flex items-center gap-2.5 text-xs font-medium uppercase tracking-[0.28em] text-brand-orange">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-brand-orange shadow-[0_0_12px_2px] shadow-brand-orange/60" />
            {hero.eyebrow}
          </p>

          {/* Four lines on phones; two balanced lines from md up. */}
          <h1
            id="hero-title"
            className="font-display text-[clamp(3rem,13vw,5rem)] font-bold uppercase leading-[0.92] tracking-tight md:text-[clamp(3.5rem,min(7vw,11svh),7.25rem)]"
          >
            {[hero.headline.slice(0, 2), hero.headline.slice(2)].map((pair, row) => (
              <span key={row} className="block md:whitespace-nowrap">
                {pair.map((line, i) => (
                  <span key={line.text} className={cn("block md:inline", line.outline && "text-outline")}>
                    {line.text.startsWith("& ") ? (
                      <>
                        <span className="text-brand-orange">&amp;</span>
                        {line.text.slice(1)}
                      </>
                    ) : (
                      line.text
                    )}
                    {i === 0 && <span className="hidden md:inline"> </span>}
                  </span>
                ))}
              </span>
            ))}
          </h1>

          <p className="mt-7 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            <RichText text={hero.description} strongClassName="font-semibold text-foreground" />
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
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
        className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowDown className="size-3.5" aria-hidden="true" />
        Scroll
      </a>
    </section>
  );
}
