import { staffing } from "@/content/site";
import { Card } from "@/themes/dark/components/ui/card";
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
        <ul className="mt-12 grid gap-[var(--card-gap)]">
          {staffing.points.map((point, i) => (
            <Card as="li" key={point.title} data-reveal="3" className="flex gap-5">
              <span className="card-index" aria-hidden="true">
                0{i + 1}
              </span>
              <div>
                <h3 className="type-subheading card-title">{point.title}</h3>
                <p className="type-body-sm mt-1.5">
                  {point.body}
                </p>
              </div>
            </Card>
          ))}
        </ul>
      </div>
    </section>
  );
}
