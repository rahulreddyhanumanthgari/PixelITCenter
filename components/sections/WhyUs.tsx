import { whyUs } from "@/content/site";
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
        <ul
          data-reveal="3"
          className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2"
        >
          {whyUs.reasons.map((reason) => (
            <li key={reason.title} className="bg-background p-7">
              <h3 className="font-display text-xl font-semibold uppercase tracking-wide">{reason.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{reason.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
