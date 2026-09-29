import { testimonials } from "@/content/site";
import { Container, SectionHeader } from "./SectionHeader";

export function Testimonials() {
  return (
    <section aria-labelledby="testimonials-title" className="border-t border-border py-24 sm:py-32">
      <Container>
        <div data-galaxy-content>
          <SectionHeader id="testimonials-title" eyebrow={testimonials.eyebrow} title={testimonials.title} />
        </div>
        <ul className="mt-14 grid gap-4 md:grid-cols-3">
          {testimonials.items.map((t, i) => (
            <li key={i}>
              <figure className="flex h-full flex-col justify-between rounded-2xl border border-border bg-surface p-7">
                <blockquote className="text-lg leading-relaxed">&ldquo;{t.quote}&rdquo;</blockquote>
                <figcaption className="mt-6 text-sm">
                  <span className="font-medium">{t.name}</span>
                  <span className="block text-muted-foreground">{t.role}</span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
