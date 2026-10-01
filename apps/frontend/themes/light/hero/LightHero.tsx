import { hero, site } from "@/content/site";
import { SceneBackdrop } from "./SceneBackdrop";
import { Sculpture } from "./Sculpture";

/**
 * Light hero, laid out like the owner's reference landing page: a full-screen
 * dawn landscape (sky, misty mountains, a lake), the white spiral shell
 * sculpture standing on the water in the middle with its reflection, a small
 * shell at the upper left and drifting droplets. A small, widely spaced white
 * headline sits centred above the sculpture with a tiny spaced line and faint
 * copy under it; small spaced links sit in the bottom corners.
 */
export function LightHero() {
  return (
    <section
      id="top"
      data-hero
      aria-labelledby="hero-title"
      className="light-scene relative isolate flex min-h-[100svh] overflow-hidden"
    >
      <SceneBackdrop />
      <Sculpture />
      {/* The lake's surface over the lower part of the reflection. */}
      <div aria-hidden="true" className="light-scene-water" />

      <div data-hero-content className="light-scene-copy">
        <h1 id="hero-title">
          <span className="light-scene-title">
            {hero.kicker[0]} &amp; {hero.kicker[1]}
          </span>
          <span className="light-scene-subtitle">
            {hero.statement[0]} {hero.statement[1]}
          </span>
        </h1>
        <p className="light-scene-text">{hero.description.replace(/\*\*/g, "")}</p>
      </div>

      <nav aria-label="Get started" className="light-scene-corner light-scene-corner--left">
        <a href={hero.primaryCta.href}>{hero.primaryCta.label}:</a>
        <a href={hero.secondaryCta.href}>{hero.secondaryCta.label}</a>
      </nav>
      <a href={`mailto:${site.contact.email}`} className="light-scene-corner light-scene-corner--right">
        {site.contact.email}
      </a>
    </section>
  );
}
