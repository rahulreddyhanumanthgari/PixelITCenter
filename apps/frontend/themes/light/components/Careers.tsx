import { careers } from "@/content/site";
import { plain } from "../lib/text";
import { Container } from "./Section";

/** A short band rather than a full section: one message, one action. */
export function Careers() {
  return (
    <section id="careers" aria-labelledby="careers-heading" className="bg-mist py-14 lg:py-16">
      <Container className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 id="careers-heading" className="font-display text-[clamp(1.5rem,1.3rem+0.9vw,2.125rem)] font-semibold tracking-[-0.025em]">
            {plain(careers.title)}
          </h2>
          <p className="l-body mt-2">{careers.body}</p>
        </div>
        <a href={careers.cta.href} className="l-btn l-btn--secondary shrink-0 border-ink/25 bg-paper">
          {careers.cta.label}
        </a>
      </Container>
    </section>
  );
}
