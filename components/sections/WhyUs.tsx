import { whyUs } from "@/content/site";
import { SectionHeader } from "./SectionHeader";
import { storySectionClass } from "./story-section";

export function WhyUs() {
  return (
    // Tall on purpose: the torus arrives with the section, then becomes the
    // node symbol as it scrolls (STEP_WINDOWS). The content stays centred
    // and pinned on desktop meanwhile.
    <section
      data-story-section
      aria-labelledby="why-title"
      className={storySectionClass(
        "center",
        "lg:min-h-[175vh] lg:justify-start",
      )}
    >
      <div data-why-content data-pinned-content className="lg:sticky lg:top-[16vh]">
        <SectionHeader
          id="why-title"
          eyebrow={whyUs.eyebrow}
          title={whyUs.title}
        />
        <ul
          data-reveal="3"
          className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2"
        >
          {whyUs.reasons.map((reason) => (
            <li key={reason.title} className="bg-background p-7">
              <h3 className="font-display text-xl font-semibold uppercase tracking-wide">
                {reason.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {reason.body}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
