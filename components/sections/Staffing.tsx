import { staffing } from "@/content/site";
import { SectionHeader } from "./SectionHeader";
import { STORY_SECTION_CLASS } from "./story-section";

export function Staffing() {
  return (
    <section id="staffing" data-story-section aria-labelledby="staffing-title" className={STORY_SECTION_CLASS}>
      <SectionHeader id="staffing-title" eyebrow={staffing.eyebrow} title={staffing.title} body={staffing.body} />
      <ul className="mt-12 grid gap-4">
        {staffing.points.map((point, i) => (
          <li key={point.title} className="flex gap-5 rounded-xl border border-border bg-surface p-6">
            <span className="font-display text-2xl font-semibold text-brand-orange" aria-hidden="true">
              0{i + 1}
            </span>
            <div>
              <h3 className="font-medium">{point.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{point.body}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
