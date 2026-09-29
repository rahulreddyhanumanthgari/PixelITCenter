import { about } from "@/content/site";
import { Container, SectionHeader } from "./SectionHeader";

/**
 * About Us — centred content framed by a particle spiral galaxy. The
 * galaxy is the journey's last form: How We Work's planets break up and
 * re-form into it as About scrolls in. It stays pinned behind About,
 * Careers, Proof Points and Contact ([data-galaxy-anchor] in app/page.tsx); particles behind [data-about-content] are dimmed so
 * the text stays calm. This section is transparent. Content enters with the
 * same scroll choreography as the story sections ([data-reveal]).
 */
export function About() {
  return (
    <section
      id="about"
      data-about
      aria-labelledby="about-title"
      className="relative scroll-mt-20 border-t border-border py-28 sm:py-36 lg:flex lg:min-h-[115vh] lg:items-center"
    >
      <Container className="relative">
        <div data-about-content data-galaxy-content className="mx-auto max-w-3xl text-center">
          <SectionHeader
            id="about-title"
            eyebrow={about.eyebrow}
            title={about.title}
            body={about.body}
            className="mx-auto"
          />

          <dl className="mt-12 grid border-y border-border sm:grid-cols-3 sm:divide-x sm:divide-border">
            {about.highlights.map((h) => (
              <div key={h.label} data-reveal="3" className="border-b border-border px-4 py-5 last:border-b-0 sm:border-b-0">
                <dt className="type-label">{h.label}</dt>
                <dd className="type-subheading mt-2">{h.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Container>
    </section>
  );
}
