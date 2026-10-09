import { whyUs } from "@/content/site";
import { SectionHeader } from "@/themes/core/components/sections/SectionHeader";
import { storySectionClass } from "@/themes/core/components/sections/story-section";
import {
  CARD_COLOR,
  ServiceIcon,
  type IconName,
} from "../services/ServiceIcon";

/**
 * Light version of Why Pixel IT Center: the heading and the four reasons,
 * centred inside the opening of the particle donut (drawn larger in light,
 * see torusScale in JourneyScene). The reasons use the site's card style
 * (.light-row), in the one card colour.
 */
const ICONS: IconName[] = ["layers", "people", "check", "loop"];

export function LightWhy() {
  return (
    <section
      data-story-section
      aria-labelledby="why-title"
      className={storySectionClass("center")}
    >
      <div data-why-content className="mx-auto w-full max-w-[720px]">
        <SectionHeader
          id="why-title"
          eyebrow={whyUs.eyebrow}
          title={whyUs.title}
          className="mx-auto text-center"
        />
        <ul className="mt-10 grid gap-3 sm:grid-cols-2">
          {whyUs.reasons.map((reason, i) => (
            <li
              key={reason.title}
              data-card
              className="light-svc light-row light-row--compact"
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
                  {reason.title}
                </h3>
                <p className="light-svc__body light-row__body">{reason.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
