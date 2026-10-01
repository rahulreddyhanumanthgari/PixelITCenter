import { process } from "@/content/site";
import { plain } from "../lib/text";
import { Section } from "./Section";

/**
 * A real sequence, so it is numbered: four nodes on one line, the network
 * motif again. The line runs down the left on phones and across on desktop.
 */
export function Process() {
  return (
    <Section id="process" tone="mist" title={plain(process.title)}>
      <ol className="grid gap-10 lg:grid-cols-4 lg:gap-6">
        {process.steps.map((step, i) => (
          <li key={step.title} className="relative flex gap-5 lg:block">
            {i < process.steps.length - 1 && (
              <span
                aria-hidden="true"
                className="absolute bottom-[-2.5rem] left-[1.1875rem] top-12 w-0.5 bg-line lg:bottom-auto lg:left-12 lg:right-[-1.5rem] lg:top-[1.1875rem] lg:h-0.5 lg:w-auto"
              />
            )}
            <span className="relative grid size-10 shrink-0 place-items-center rounded-full border-2 border-teal-deep bg-paper font-display text-base font-semibold text-teal-deep">
              {i + 1}
            </span>
            <div className="lg:mt-6">
              <h3 className="l-h3">{step.title}</h3>
              <p className="l-body mt-2 text-[0.9375rem]">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}
