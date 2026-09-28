import { whyUs } from "@/content/site";
import { SectionHeader } from "./SectionHeader";
import { STORY_SECTION_CLASS } from "./story-section";

export function WhyUs() {
  return (
    <section data-story-section aria-labelledby="why-title" className={STORY_SECTION_CLASS}>
      <SectionHeader id="why-title" eyebrow={whyUs.eyebrow} title={whyUs.title} />
      <ul className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2">
        {whyUs.reasons.map((reason) => (
          <li key={reason.title} className="bg-background p-7">
            <h3 className="font-display text-xl font-semibold uppercase tracking-wide">{reason.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{reason.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
