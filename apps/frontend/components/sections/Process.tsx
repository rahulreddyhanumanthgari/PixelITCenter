import { Check } from "lucide-react";
import { process } from "@/content/site";
import { SectionHeader } from "./SectionHeader";
import { ProcessProgress } from "./ProcessProgress";
import { storySectionClass } from "./story-section";

/**
 * How We Work — centred content inside a particle solar system (drawn by the
 * journey layer): four planets, one per step, joined by curved trails. A
 * tall scroll track pins the heading and a compact 01–04 index above the
 * active step; as each step is reached its planet lights up (and stays lit)
 * while the step text fades in. ProcessProgress drives both from scroll.
 */
export function Process() {
  return (
    <section data-story-section aria-labelledby="process-title" className={storySectionClass("center")}>
      <ProcessProgress />

      <div data-process-track className="relative h-[240svh] lg:h-[220vh]">
        {/* Pinned: the heading, the step index and the active step stay in
            place together while the steps are scrolled. */}
        <div
          data-process-content
          className="sticky top-[calc(34svh+5rem)] mx-auto max-w-[720px] text-center lg:top-[calc(50vh-15rem)]"
        >
          <SectionHeader id="process-title" eyebrow={process.eyebrow} title={process.title} className="mx-auto text-center" revealExit={false} />

          {/* Index: all four steps, always visible. Waiting steps are muted;
              the active one has an orange number and a white title; completed
              ones settle to secondary grey with a check. Colours ease between. */}
          <ol className="mx-auto mt-6 grid max-w-[560px] grid-cols-4 gap-2 lg:mt-10">
            {process.steps.map((step, i) => (
              <li
                key={step.title}
                data-process-step
                data-state={i === 0 ? "active" : "inactive"}
                className="group"
              >
                <span className="flex items-center justify-center gap-1.5 font-display text-sm font-semibold tabular-nums text-[var(--text-muted)] transition-colors duration-500 group-data-[state=active]:text-brand-orange group-data-[state=completed]:text-[var(--text-secondary)]">
                  {String(i + 1).padStart(2, "0")}
                  <Check
                    aria-hidden="true"
                    className="size-3.5 text-brand-orange opacity-0 transition-opacity duration-500 group-data-[state=completed]:opacity-100"
                  />
                </span>
                <span className="type-label mt-1.5 block transition-colors duration-500 group-data-[state=active]:text-[var(--text-primary)] group-data-[state=completed]:text-[var(--text-secondary)]">
                  {step.title}
                </span>
              </li>
            ))}
          </ol>

          {/* Active step: one panel at a time, stacked in one grid cell. Open
              text over the planets — no card here, by design. */}
          <div className="mt-6 grid lg:mt-10">
            {process.steps.map((step, i) => (
              <div key={step.title} data-process-panel aria-hidden={i !== 0} className="[grid-area:1/1]">
                <p data-panel-part className="card-index text-6xl sm:text-7xl">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h3 data-panel-part className="type-display-lg mt-3 text-[clamp(1.75rem,1.35rem+1.5vw,2.5rem)]">
                  {step.title}
                </h3>
                <p data-panel-part className="type-body mx-auto mt-4 max-w-md">
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
