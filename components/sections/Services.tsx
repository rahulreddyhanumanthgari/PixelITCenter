import { services } from "@/content/site";
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
                <h3 className="font-display text-2xl font-semibold uppercase tracking-wide">
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
              <p data-reveal="4" className="mt-4 text-muted-foreground">
                {group.summary}
              </p>
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {group.items.map((item) => (
                  <li
                    key={item.title}
                    data-reveal="5"
                    className="group rounded-xl border border-border bg-surface p-5 transition-colors hover:border-white/20 hover:bg-surface-2"
                  >
                    <h4 className="font-medium text-foreground">
                      {item.title}
                    </h4>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {item.body}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
