import { hero } from "@/content/site";
import { plain } from "../lib/text";
import { Container } from "./Section";
import { NetworkMark } from "./NetworkMark";

// "Technology and talent, built for what’s next": the same message as the
// dark hero's TECHNOLOGY & TALENT / BUILT FOR WHAT’S NEXT, as one sentence.
const headline = `${hero.kicker[0]} and ${hero.kicker[1].toLowerCase()}, ${hero.statement.join(" ").toLowerCase()}`;

export function Hero() {
  return (
    <section aria-labelledby="hero-heading" className="bg-paper">
      <Container className="grid items-center gap-12 pb-16 pt-12 sm:pt-16 lg:grid-cols-12 lg:gap-8 lg:pb-28 lg:pt-24">
        <div className="lg:col-span-6">
          <h1 id="hero-heading" className="l-display">
            {headline}
          </h1>
          <p className="l-lead mt-6">{plain(hero.description)}</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <a href={hero.primaryCta.href} className="l-btn l-btn--primary">
              {hero.primaryCta.label}
            </a>
            <a href={hero.secondaryCta.href} className="l-btn l-btn--secondary">
              {hero.secondaryCta.label}
            </a>
          </div>
        </div>
        <div className="flex justify-center lg:col-span-6 lg:justify-end">
          <NetworkMark />
        </div>
      </Container>
    </section>
  );
}
