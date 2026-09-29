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
            <li key={i} data-reveal="3">
              <figure className="flex h-full flex-col justify-between rounded-2xl border border-border bg-surface p-7">
                <blockquote className="text-[1.0625rem] leading-[1.6] text-[var(--text-primary)]/90">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <figcaption className="type-subheading mt-6">{t.name}</figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
