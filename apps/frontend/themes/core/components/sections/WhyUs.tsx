import { whyUs } from "@/content/site";
import { Card } from "@/themes/core/components/ui/card";
import { SectionHeader } from "./SectionHeader";
import { storySectionClass } from "./story-section";

/**
 * Why Pixel IT Center — centred content sitting inside the opening of a
 * large, slowly turning particle torus (drawn by the journey layer, centred
 * behind this section).
 */
export function WhyUs() {
  return (
    <section data-story-section aria-labelledby="why-title" className={storySectionClass("center")}>
      <div data-why-content className="mx-auto w-full max-w-[720px]">
        <SectionHeader id="why-title" eyebrow={whyUs.eyebrow} title={whyUs.title} className="mx-auto text-center" />
        <ul data-reveal="3" className="mt-12 grid gap-[var(--card-gap)] sm:grid-cols-2">
          {whyUs.reasons.map((reason) => (
            <Card as="li" key={reason.title}>
              <h3 className="type-heading card-title">{reason.title}</h3>
              <p className="type-body-sm mt-3">{reason.body}</p>
            </Card>
          ))}
        </ul>
      </div>
    </section>
  );
}
