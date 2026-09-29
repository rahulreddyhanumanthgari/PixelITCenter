import { testimonials } from "@/content/site";
import { Card } from "@/components/ui/card";
import { Container, SectionHeader } from "./SectionHeader";

export function Testimonials() {
  return (
    <section aria-labelledby="testimonials-title" className="border-t border-border py-24 sm:py-32">
      <Container>
        <SectionHeader id="testimonials-title" eyebrow={testimonials.eyebrow} title={testimonials.title} />
        <ul className="mt-14 grid gap-[var(--card-gap)] md:grid-cols-3">
          {testimonials.items.map((t, i) => (
            <li key={i} data-reveal="3">
              <Card as="figure" className="flex h-full flex-col justify-between">
                <blockquote className="text-[1.0625rem] leading-[1.6] text-[var(--text-primary)]/90">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <figcaption className="type-subheading card-title mt-6">{t.name}</figcaption>
              </Card>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
