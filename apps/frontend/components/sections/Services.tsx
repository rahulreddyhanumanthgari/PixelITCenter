import { services } from "@/content/site";
import { ServiceCard } from "@/components/ui/service-card";
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
                className="flex items-center justify-center gap-3 border-b border-border pb-4"
              >
                <span
                  aria-hidden="true"
                  className={
                    gi === 0
                      ? "size-2 rounded-full bg-brand-blue"
                      : "size-2 rounded-full bg-brand-orange"
                  }
                />
                <h3 className="type-heading">
                  {group.name}
                </h3>
              </div>
              <p data-reveal="4" className="type-body mx-auto mt-4 text-center">
                {group.summary}
              </p>
              <ul className="mt-6 grid gap-[var(--card-gap)] sm:grid-cols-2">
                {group.items.map((item, i) => (
                  <ServiceCard
                    key={item.title}
                    index={i + 1}
                    tag={item.tag}
                    icon={item.icon}
                    title={item.title}
                    description={item.body}
                  />
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
