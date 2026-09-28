import { Check } from "lucide-react";
import { process } from "@/content/site";
import { SectionHeader } from "./SectionHeader";
import { ProcessProgress } from "./ProcessProgress";
import { STORY_SECTION_CLASS } from "./story-section";

/**
 * How We Work — the four steps as one vertical journey. As the visitor
 * scrolls, each step becomes active, then completed (ProcessProgress sets
 * `data-state`); the particle path beside it lights up in step. All four
 * steps stay visible throughout — only their emphasis changes.
 */
export function Process() {
  return (
    <section data-story-section aria-labelledby="process-title" className={STORY_SECTION_CLASS}>
      <SectionHeader id="process-title" eyebrow={process.eyebrow} title={process.title} />
      <ProcessProgress />
      <ol className="mt-10">
        {process.steps.map((step, i) => (
          <li
            key={step.title}
            data-process-step
            data-state={i === 0 ? "active" : "inactive"}
            className="group relative flex gap-6 border-l border-white/10 py-10 pl-6 transition-[opacity,border-color] duration-500 data-[state=active]:border-brand-orange/70 data-[state=completed]:border-white/25 data-[state=inactive]:opacity-45 data-[state=completed]:opacity-80 sm:pl-8 lg:min-h-[34vh] lg:items-center"
          >
            <span
              aria-hidden="true"
              className="font-display text-3xl font-semibold text-muted-foreground transition-colors duration-500 group-data-[state=active]:text-brand-orange group-data-[state=completed]:text-foreground sm:text-4xl"
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="max-w-md">
              <h3 className="flex items-center gap-3 font-display text-2xl font-semibold uppercase sm:text-3xl">
                {step.title}
                <Check
                  aria-hidden="true"
                  className="size-5 text-brand-orange opacity-0 transition-opacity duration-500 group-data-[state=completed]:opacity-100"
                />
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground transition-colors duration-500 group-data-[state=active]:text-foreground sm:text-base">
                {step.body}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
