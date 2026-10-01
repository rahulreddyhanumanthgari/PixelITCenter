import { about } from "@/content/site";
import { plain } from "../lib/text";
import { Section } from "./Section";

export function About() {
  return (
    <Section id="about" title={plain(about.title)}>
      <p className="l-lead text-ink">{about.body}</p>

      <dl className="mt-10 grid gap-6 border-y border-line py-8 sm:grid-cols-3">
        {about.highlights.map((h) => (
          <div key={h.label}>
            <dt className="text-sm text-slate">{h.label}</dt>
            <dd className="mt-1 font-display text-lg font-semibold">{h.value}</dd>
          </div>
        ))}
      </dl>

      <figure className="mt-10">
        <figcaption className="text-sm text-slate">Our vision</figcaption>
        <blockquote className="mt-3 max-w-[40ch] font-display text-[clamp(1.375rem,1.2rem+0.8vw,1.875rem)] font-medium leading-snug tracking-[-0.02em]">
          {about.vision}
        </blockquote>
      </figure>
    </Section>
  );
}
