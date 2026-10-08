import { staffing } from "@/content/site";
import { SectionHeader } from "@/themes/core/components/sections/SectionHeader";
import { storySectionClass } from "@/themes/core/components/sections/story-section";
import { cn } from "@/lib/utils";
import {
  CARD_COLOR,
  ServiceIcon,
  type IconName,
} from "../services/ServiceIcon";

/**
 * Light version of Staffing & Consulting, content on the left (the Earth
 * holds the right): the Services tile style (.light-svc__tile) laid out as
 * long horizontal rows — the icon tile on the left, the title and text
 * beside it. Styles: .light-row in light.css.
 */
const ICONS: IconName[] = ["people", "layers", "briefcase"];

export function LightStaffing() {
  return (
    <section
      id="staffing"
      data-story-section
      aria-labelledby="staffing-title"
      className={cn(storySectionClass("right"), "lg:-ml-16 lg:w-[46%]")}
    >
      <div data-staffing-content>
        <SectionHeader
          id="staffing-title"
          eyebrow={staffing.eyebrow}
          title={staffing.title}
          body={staffing.body}
          className="mx-0 text-left [&_p]:mx-0"
        />
        <ul className="mt-10 grid gap-4">
          {staffing.points.map((point, i) => (
            <li
              key={point.title}
              data-card
              className="light-svc light-row"
              style={{ "--svc": CARD_COLOR } as React.CSSProperties}
            >
              <div className="light-svc__tile light-row__tile">
                <ServiceIcon
                  name={ICONS[i % ICONS.length]}
                  color={CARD_COLOR}
                />
              </div>
              <div className="light-row__text">
                <h3 className="light-svc__title light-row__title">
                  {point.title}
                </h3>
                <p className="light-svc__body light-row__body">{point.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
