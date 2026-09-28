import { Check } from "lucide-react";
import { process } from "@/content/site";
import { SectionHeader } from "./SectionHeader";
import { ProcessProgress } from "./ProcessProgress";
import { storySectionClass } from "./story-section";

/**
 * How We Work — the particle path with four checkpoints sits on the left
 * (drawn by the journey layer); this text column sits on the right. A tall
 * scroll track pins a panel: a compact 01–04 index (the whole process stays
 * visible) above the active step, which transitions in as each checkpoint
 * is reached. ProcessProgress drives it all from scroll.
 */
export function Process() {
  return (
    <section data-story-section aria-labelledby="process-title" className={storySectionClass("left")}>
      <SectionHeader id="process-title" eyebrow={process.eyebrow} title={process.title} />
      <ProcessProgress />

      <div data-process-track className="relative mt-10 h-[240svh] lg:h-[220vh]">
        <div className="sticky top-[calc(34svh+6rem)] lg:top-[30vh]">
          {/* Index: all four steps, always visible. */}
          <ol className="grid grid-cols-4 gap-2 border-t border-white/10">
            {process.steps.map((step, i) => (
              <li
                key={step.title}
                data-process-step
                data-state={i === 0 ? "active" : "inactive"}
                className="group relative pt-3 transition-opacity duration-500 data-[state=inactive]:opacity-40"
              >
                <span
                  aria-hidden="true"
                  className="absolute -top-px left-0 h-px w-0 bg-brand-orange transition-[width] duration-500 group-data-[state=active]:w-full group-data-[state=completed]:w-full group-data-[state=completed]:bg-white/40"
                />
                <span className="flex items-center gap-1.5 font-display text-sm tracking-wide text-muted-foreground group-data-[state=active]:text-brand-orange">
                  {String(i + 1).padStart(2, "0")}
                  <Check
                    aria-hidden="true"
                    className="size-3.5 text-brand-orange opacity-0 transition-opacity duration-500 group-data-[state=completed]:opacity-100"
                  />
                </span>
                <span className="mt-1 block text-xs uppercase tracking-[0.16em] text-foreground/80 sm:text-sm">
                  {step.title}
                </span>
              </li>
            ))}
          </ol>

          {/* Active step: one panel at a time, stacked in one grid cell. */}
          <div className="mt-10 grid">
            {process.steps.map((step, i) => (
              <div key={step.title} data-process-panel aria-hidden={i !== 0} className="[grid-area:1/1]">
                <p data-panel-part className="font-display text-6xl font-semibold text-brand-orange sm:text-7xl">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h3 data-panel-part className="mt-3 font-display text-3xl font-semibold uppercase sm:text-4xl">
                  {step.title}
                </h3>
                <p data-panel-part className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
