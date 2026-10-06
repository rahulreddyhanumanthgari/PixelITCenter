import { MoveRight } from "lucide-react";
import { hero } from "@/content/site";
import { RichText } from "@/themes/core/components/ui/rich-text";

/**
 * Light hero: the landing-page reference, as it is. On desktop every block
 * sits at the reference's own coordinates (light.css, in reference pixels:
 * 1 = 100vw / 1672); the particle engine draws the traced vortex on the right
 * and LightHeroBokeh the out-of-focus foreground cubes. Phones: the vortex
 * above, the text below.
 */
export function LightHero() {
  const [what, ...next] = hero.statement[1].split(" ");
  return (
    <section
      id="top"
      data-hero
      aria-labelledby="hero-title"
      className="light-hero"
    >
      <LightHeroBokeh />
      <div data-hero-content className="light-hero__copy">
        <h1 id="hero-title" className="light-hero__title">
          <span data-reveal="0" className="light-hero__kicker">
            {hero.kicker[0]} &amp; {hero.kicker[1]}
          </span>
          <span
            data-reveal="1"
            className="light-hero__line light-hero__line--1"
          >
            {hero.statement[0]}
          </span>
          <span
            data-reveal="1"
            className="light-hero__line light-hero__line--2"
          >
            <span className="light-hero__orange">{what}</span>{" "}
            <span className="light-hero__cyan">{next.join(" ")}</span>
          </span>
        </h1>
        <p data-reveal="2" className="light-hero__desc">
          <RichText
            text={hero.description}
            strongClassName="light-hero__strong"
          />
        </p>
        <div data-reveal="3" className="light-hero__ctas">
          <a
            href={hero.primaryCta.href}
            className="light-hero__btn light-hero__btn--dark"
          >
            {hero.primaryCta.label}
            <MoveRight
              className="light-hero__arrow"
              strokeWidth={1.6}
              aria-hidden="true"
            />
          </a>
          <a
            href={hero.secondaryCta.href}
            className="light-hero__btn light-hero__btn--ghost"
          >
            {hero.secondaryCta.label}
          </a>
        </div>
      </div>
    </section>
  );
}

/**
 * The reference's out-of-focus foreground cubes (x, y, size in reference px;
 * colour; blur in reference px). Drawn as simple shaded cubes and blurred.
 */
const BOKEH: ReadonlyArray<readonly [number, number, number, string, number]> =
  [
    [25, 810, 110, "#1e6e96", 14],
    [140, 875, 150, "#f07828", 18],
    [300, 777, 30, "#f5965a", 5],
    [422, 792, 18, "#eb6e28", 3],
    [400, 925, 95, "#f58c3c", 12],
    [628, 810, 55, "#78c8e1", 6],
    [738, 862, 55, "#3c78a0", 6],
    [805, 930, 70, "#f5a05a", 8],
    [605, 660, 20, "#f58c50", 3],
    [800, 805, 55, "#f5963c", 3],
    [1190, 790, 62, "#f5beaa", 4],
    [1410, 750, 55, "#3caad2", 3],
    [1535, 890, 130, "#284664", 10],
    [1607, 683, 34, "#f59650", 5],
    [1660, 910, 45, "#f59646", 8],
    [1660, 650, 50, "#2882aa", 8],
    [1510, 605, 60, "#3cb4d7", 2],
    [1642, 90, 60, "#3c96be", 7],
    [1665, 265, 25, "#f5823c", 3],
    [888, 878, 16, "#f09650", 2],
    [990, 912, 60, "#78bed2", 6],
    [340, 745, 10, "#f0aa96", 2],
  ];

function LightHeroBokeh() {
  return (
    <div aria-hidden="true" className="light-hero__bokeh">
      {BOKEH.map(([x, y, s, color, blur], i) => (
        <svg
          key={i}
          viewBox="0 0 100 100"
          className="light-hero__bokeh-cube"
          style={
            {
              "--x": x,
              "--y": y,
              "--s": s,
              "--blur": blur,
            } as React.CSSProperties
          }
        >
          {/* top, left, right faces of a cube seen from slightly above */}
          <polygon
            points="50,6 92,26 50,46 8,26"
            fill={color}
            style={{ filter: "brightness(1.18)" }}
          />
          <polygon points="8,26 50,46 50,96 8,76" fill={color} />
          <polygon
            points="50,46 92,26 92,76 50,96"
            fill={color}
            style={{ filter: "brightness(0.8)" }}
          />
        </svg>
      ))}
    </div>
  );
}
