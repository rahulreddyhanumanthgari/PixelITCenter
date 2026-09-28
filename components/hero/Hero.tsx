import { ArrowDown, ArrowRight } from "lucide-react";
import { hero } from "@/content/site";
import { buttonVariants } from "@/components/ui/button";
import { RichText } from "@/components/ui/rich-text";
import { cn } from "@/lib/utils";
import { HeroCanvasLoader } from "./HeroCanvasLoader";
import { HERO_SCROLL_VH_PER_TRANSITION, MORPH_SEQUENCE } from "./morph-sequence";

// The section is taller than the screen; its inner viewport is sticky, so the
// hero stays pinned while the visitor scrolls through the particle morph.
const pinnedScrollVh = Math.max(MORPH_SEQUENCE.length - 1, 0) * HERO_SCROLL_VH_PER_TRANSITION;

/**
 * Two layers: the WebGL particle scene (client-only, decorative) and the
 * server-rendered HTML content that carries the real h1, copy and CTAs.
 */
export function Hero() {
  return (
    <section
      id="top"
      data-hero
      aria-labelledby="hero-title"
      className="relative bg-background"
      style={{ height: `calc(100svh + ${pinnedScrollVh}vh)` }}
    >
      <div className="sticky top-0 isolate flex h-[100svh] overflow-hidden">
        {/* Layer 1 — 3D scene */}
        <div className="absolute inset-0 -z-20">
          <HeroCanvasLoader />
        </div>

        {/* Readability scrims: bottom-up on mobile, left-to-right on desktop. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-t from-background via-background/75 to-transparent to-70% md:bg-gradient-to-r md:from-background/85 md:via-background/35 md:to-transparent md:to-60%"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-32 bg-gradient-to-t from-background to-transparent"
        />

        {/* Layer 2 — content */}
        <div className="mx-auto flex w-full max-w-7xl items-end px-4 pb-20 pt-28 sm:px-6 md:items-center md:pb-16 lg:px-8">
          <div className="max-w-xl md:w-[44%] md:max-w-none">
            <p className="mb-5 flex items-center gap-2.5 text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
              <span
                aria-hidden="true"
                className="size-1.5 rounded-full bg-brand-orange shadow-[0_0_12px_2px] shadow-brand-orange/60"
              />
              {hero.eyebrow}
            </p>

            <h1
              id="hero-title"
              className="font-display text-[clamp(3.1rem,11vw,5.25rem)] font-bold uppercase leading-[0.92] tracking-tight lg:text-[clamp(5rem,7.4vw,7.25rem)]"
            >
              {hero.headline.map((line) => (
                <span key={line.text} className={cn("block", line.outline && "text-outline")}>
                  {line.text}
                </span>
              ))}
            </h1>

            <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
              <RichText text={hero.description} strongClassName="font-semibold text-foreground" />
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href={hero.primaryCta.href}
                className={cn(buttonVariants(), "h-12 rounded-full px-6 text-sm font-semibold")}
              >
                {hero.primaryCta.label}
                <ArrowRight data-icon="inline-end" />
              </a>
              <a
                href={hero.secondaryCta.href}
                className={cn(
                  buttonVariants({ variant: "ghost" }),
                  "h-12 rounded-full px-5 text-sm text-foreground hover:bg-white/5",
                )}
              >
                {hero.secondaryCta.label}
              </a>
            </div>
          </div>
        </div>

        <a
          href="#services"
          className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground md:flex"
        >
          <ArrowDown className="size-3.5" aria-hidden="true" />
          Scroll
        </a>
      </div>
    </section>
  );
}
