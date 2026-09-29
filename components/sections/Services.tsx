import { services } from "@/content/site";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "./SectionHeader";
import { storySectionClass } from "./story-section";

export function Services() {
  return (
    <section
      id="services"
      data-story-section
      aria-labelledby="services-title"
      className={storySectionClass("center")}
    >
      <div data-services-content>
        <SectionHeader
          id="services-title"
          eyebrow={services.eyebrow}
          title={services.title}
        />

        <div className="mt-14 grid gap-12">
          {services.groups.map((group, gi) => (
            <div key={group.name}>
              <div
                data-reveal="3"
                className="flex items-baseline justify-between gap-4 border-b border-border pb-4"
              >
                <h3 className="type-heading">
                  {group.name}
                </h3>
                <span
                  aria-hidden="true"
                  className={
                    gi === 0
                      ? "size-2 rounded-full bg-brand-blue"
                      : "size-2 rounded-full bg-brand-orange"
                  }
                />
              </div>
              <p data-reveal="4" className="type-body mt-4">
                {group.summary}
              </p>
              <ul className="mt-6 grid gap-[var(--card-gap)] sm:grid-cols-2">
                {group.items.map((item) => (
                  <Card as="li" key={item.title} data-reveal="5">
                    <h4 className="type-subheading card-title">
                      {item.title}
                    </h4>
                    <p className="type-body-sm mt-2">
                      {item.body}
                    </p>
                  </Card>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
