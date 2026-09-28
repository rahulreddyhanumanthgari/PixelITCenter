import { process } from "@/content/site";
import { SectionHeader } from "./SectionHeader";
import { STORY_SECTION_CLASS } from "./story-section";

export function Process() {
  return (
    <section data-story-section aria-labelledby="process-title" className={STORY_SECTION_CLASS}>
      <SectionHeader id="process-title" eyebrow={process.eyebrow} title={process.title} />
      <ol className="mt-14 grid gap-8 sm:grid-cols-2">
        {process.steps.map((step, i) => (
          <li key={step.title} className="relative border-t border-white/15 pt-6">
            <span
              aria-hidden="true"
              className="absolute -top-px left-0 h-px w-12 bg-gradient-to-r from-brand-orange to-brand-blue"
            />
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">Step {i + 1}</p>
            <h3 className="mt-2 font-display text-2xl font-semibold uppercase">{step.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
