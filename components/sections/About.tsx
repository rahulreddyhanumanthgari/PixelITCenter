import { about, careers } from "@/content/site";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Container, SectionHeader } from "./SectionHeader";

/**
 * About Us — editorial text on the left, a large 3D particle orbit on the
 * right. The orbit is drawn by the page-wide particle layer over the empty
 * [data-orbit-anchor] slot, so this section is transparent. Content enters
 * with the same scroll choreography as the story sections ([data-reveal]).
 */
export function About() {
  return (
    <section
      id="about"
      data-about
      aria-labelledby="about-title"
      className="scroll-mt-20 border-t border-border py-24 sm:py-32 lg:flex lg:min-h-screen lg:items-center"
    >
      <Container className="grid gap-x-12 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <SectionHeader
          id="about-title"
          eyebrow={about.eyebrow}
          title={about.title}
          body={about.body}
          titleRevealAxis="x"
          className="lg:col-start-1 lg:row-start-1"
        />

        {/* Orbit slot: phones between heading and details, desktop the whole right column. */}
        <div
          data-orbit-anchor
          aria-hidden="true"
          className="my-4 h-[300px] sm:h-[380px] lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:my-0 lg:h-[70vh] lg:self-center"
        />

        <div className="flex flex-col gap-10 lg:col-start-1 lg:row-start-2 lg:mt-12">
          <dl className="border-t border-border">
            {about.highlights.map((h) => (
              <div
                key={h.label}
                data-reveal="3"
                className="flex items-baseline justify-between gap-6 border-b border-border py-4"
              >
                <dt className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{h.label}</dt>
                <dd className="text-right font-medium">{h.value}</dd>
              </div>
            ))}
          </dl>

          <div data-reveal="4" id="careers" className="scroll-mt-24 rounded-2xl border border-border bg-background/60 p-7">
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
