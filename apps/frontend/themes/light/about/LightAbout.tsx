import { about } from "@/content/site";
import { HeadingText } from "@/themes/core/components/ui/heading-text";
import { Container } from "@/themes/core/components/sections/SectionHeader";

/**
 * Light design, About (after the reference animation's "agency" scene): the
 * statement on the left, read like an editorial page; the right half is left
 * open for the blue tube, which stands there as a tall twisting column
 * (RibbonLayer). The highlights are square tiles, like the reference's
 * client tiles.
 */
export function LightAbout() {
  return (
    <section
      id="about"
      data-about
      aria-labelledby="about-title"
      className="relative scroll-mt-20 border-t border-border py-28 sm:py-36 lg:flex lg:min-h-[115vh] lg:items-center"
    >
      <Container className="relative">
        <div data-about-content className="max-w-xl lg:w-1/2 lg:max-w-none lg:pr-12">
          <p data-reveal="0" className="type-eyebrow mb-5">
            {about.eyebrow}
          </p>
          <h2 id="about-title" data-reveal="1" className="type-display-lg">
            <HeadingText text={about.title} />
          </h2>
          <p data-reveal="2" className="type-body mt-6">
            {about.body}
          </p>

          <figure data-reveal="2" className="light-about-vision mt-8">
            <figcaption className="type-label">Our vision</figcaption>
            <blockquote className="mt-3">{about.vision}</blockquote>
          </figure>

          <dl className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {about.highlights.map((h) => (
              <div key={h.label} data-reveal="3" className="light-tile">
                <dt className="type-label">{h.label}</dt>
                <dd className="light-tile-value">{h.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Container>
    </section>
  );
}
