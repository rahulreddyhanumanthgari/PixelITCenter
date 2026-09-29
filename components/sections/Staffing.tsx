import { staffing } from "@/content/site";
import { SectionHeader } from "./SectionHeader";
import { storySectionClass } from "./story-section";

export function Staffing() {
  return (
    <section
      id="staffing"
      data-story-section
      aria-labelledby="staffing-title"
      className={storySectionClass("center")}
    >
      <div data-staffing-content>
        <SectionHeader
          id="staffing-title"
          eyebrow={staffing.eyebrow}
          title={staffing.title}
          body={staffing.body}
        />
        <ul className="mt-12 grid gap-4">
          {staffing.points.map((point, i) => (
            <li
              key={point.title}
              data-reveal="3"
              className="flex gap-5 rounded-xl border border-border bg-surface p-6"
            >
              <span
                className="font-display text-2xl font-semibold tabular-nums tracking-[-0.02em] text-brand-orange"
                aria-hidden="true"
              >
                0{i + 1}
              </span>
              <div>
                <h3 className="type-subheading">{point.title}</h3>
                <p className="type-body-sm mt-1.5">
                  {point.body}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
