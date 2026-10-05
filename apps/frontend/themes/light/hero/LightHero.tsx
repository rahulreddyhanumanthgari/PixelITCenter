import { ArrowRight } from "lucide-react";
import { hero } from "@/content/site";
import { buttonVariants } from "@/themes/core/components/ui/button";
import { RichText } from "@/themes/core/components/ui/rich-text";
import { cn } from "@/lib/utils";

/**
 * Light hero, after the owner's reference: a glowing particle orb floating in
 * the centre (drawn by the page-wide particle layer and LightSky), the
 * headline and description at the bottom left, the CTAs at the bottom right.
 * Phones: everything stacks under the orb.
 */
export function LightHero() {
  return (
    <section id="top" data-hero aria-labelledby="hero-title" className="relative flex min-h-[100svh] flex-col justify-end">
      <div className="mx-auto w-full max-w-7xl px-6 pb-24 pt-[56svh] lg:px-8 lg:pb-20 lg:pt-40">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <div data-hero-content className="max-w-2xl">
            <h1 id="hero-title" className="light-hero-heading">
              <span data-reveal="0" className="block">
                {hero.kicker[0]} <span className="highlight">&amp;</span> {hero.kicker[1]}
              </span>
              <span data-reveal="1" className="block">
                {hero.statement[0]} {hero.statement[1]}
              </span>
            </h1>
            <p data-reveal="2" className="light-hero-copy mt-5">
              <RichText text={hero.description} strongClassName="font-medium" />
            </p>
          </div>

          <div data-reveal="3" className="flex flex-wrap items-center gap-3 lg:justify-end">
            <a href={hero.primaryCta.href} className={cn(buttonVariants(), "h-11 rounded-full px-6 text-sm font-medium")}>
              {hero.primaryCta.label}
              <ArrowRight data-icon="inline-end" />
            </a>
            <a
              href={hero.secondaryCta.href}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-11 rounded-full border-foreground/15 bg-white/60 px-5 text-sm font-medium",
              )}
            >
              {hero.secondaryCta.label}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
