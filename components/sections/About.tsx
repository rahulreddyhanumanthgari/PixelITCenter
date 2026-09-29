import { about, careers } from "@/content/site";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Container, SectionHeader } from "./SectionHeader";

/**
 * About Us — centred content inside a gravitational particle vortex. The
 * vortex is drawn by the page-wide particle layer, centred on the empty
 * [data-vortex-anchor]; particles behind [data-about-content] are dimmed so
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
      <div data-vortex-anchor aria-hidden="true" className="pointer-events-none absolute inset-0" />

      <Container className="relative">
        <div data-about-content className="mx-auto max-w-3xl text-center">
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
                <dt className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{h.label}</dt>
                <dd className="mt-2 font-medium">{h.value}</dd>
              </div>
            ))}
          </dl>

          <div
            data-reveal="4"
            id="careers"
            className="mx-auto mt-12 max-w-xl scroll-mt-24 rounded-2xl border border-border bg-background/60 p-7"
          >
            <h3 className="font-display text-2xl font-semibold uppercase">{careers.title}</h3>
            <p className="mt-2 text-muted-foreground">{careers.body}</p>
            <a
              href={careers.cta.href}
              className={cn(buttonVariants({ variant: "outline" }), "mt-5 h-11 rounded-full border-white/20 bg-transparent px-5")}
            >
              {careers.cta.label}
            </a>
          </div>
        </div>
      </Container>
    </section>
  );
}
