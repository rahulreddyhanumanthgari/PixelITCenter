import { ArrowRight } from "lucide-react";
import { hero, site, staffing } from "@/content/site";
import { HeroExit } from "./HeroExit";

// Plain text from content/site.ts heading markup (`*word*`, ` | `, `**`).
const plain = (text: string) => text.replace(/\*/g, "").replace(/\s*\|\s*/g, " ");

// The four service words under the right-hand statement.
const TAGS = ["AI", "Cloud", "Cybersecurity", "IT Staffing"];

/**
 * Light hero, after the owner's reference: a frosted glowing orb on a stage
 * in the centre (drawn by the page-wide particle layer and LightSky). Bottom
 * left: a small spaced label, the headline in a medium-weight sans, the
 * description and one black pill CTA. Bottom right: a short statement, a
 * hairline and four service words. Phones: everything stacks under the orb.
 */
export function LightHero() {
  return (
    <section id="top" data-hero aria-labelledby="hero-title" className="relative flex min-h-[100svh] flex-col justify-end">
      <div className="mx-auto w-full max-w-7xl px-6 pb-16 pt-[58svh] lg:px-8 lg:pb-14 lg:pt-40">
        <div data-hero-exit className="flex flex-col gap-12 lg:flex-row lg:items-end lg:justify-between">
          <div data-hero-content className="max-w-2xl">
            <p data-reveal="0" className="light-hero-label">
              {site.name}
            </p>
            <h1 id="hero-title" data-reveal="1" className="light-hero-heading mt-4">
              <span className="block">
                {hero.kicker[0]} &amp; {hero.kicker[1]}
              </span>
              <span className="block">
                {hero.statement[0]} {hero.statement[1]}
              </span>
            </h1>
            <p data-reveal="2" className="light-hero-copy mt-4">
              {plain(hero.description)}
            </p>
            <a data-reveal="3" href={hero.primaryCta.href} className="light-hero-cta mt-8">
              {hero.primaryCta.label}
              <ArrowRight className="size-4" aria-hidden="true" />
            </a>
          </div>

          <div data-reveal="3" className="w-full max-w-[24rem]">
            <p className="light-hero-statement">{plain(staffing.title)}.</p>
            <ul className="light-hero-tags" aria-label="What we do">
              {TAGS.map((tag) => (
                <li key={tag}>
                  <a href="#services">{tag}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <HeroExit />
    </section>
  );
}
