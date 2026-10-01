import { testimonials } from "@/content/site";
import { plain } from "../lib/text";
import { Section } from "./Section";

export function Testimonials() {
  return (
    <Section id="testimonials" title={plain(testimonials.title)}>
      <ul className="space-y-12">
        {testimonials.items.map((t) => (
          <li key={t.name}>
            <figure className="border-l-2 border-teal pl-6">
              <blockquote className="font-display text-[clamp(1.25rem,1.1rem+0.6vw,1.625rem)] font-medium leading-snug tracking-[-0.015em]">
                “{t.quote}”
              </blockquote>
              <figcaption className="mt-4 text-[0.9375rem] text-slate">{t.name}, client</figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </Section>
  );
}
