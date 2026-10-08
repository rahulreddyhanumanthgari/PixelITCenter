import { services } from "@/content/site";
import { SectionHeader } from "@/themes/core/components/sections/SectionHeader";
import { storySectionClass } from "@/themes/core/components/sections/story-section";
import { cn } from "@/lib/utils";
import { CARD_COLOR, ServiceIcon, type IconName } from "./ServiceIcon";

/**
 * Light version of Services, content toward the right (the particle ring
 * holds the left): the same content as the dark one, as tiles after the
 * owner's card reference — a pale tinted tile with a flat icon, the title and
 * a short description under it.
 * Styles: .light-svc in light.css.
 */
const ICONS: Record<string, IconName> = {
  AI: "spark",
  "Cloud (AWS, Azure, GCP)": "cloud",
  Cybersecurity: "shield",
  "Big Data Analytics": "bars",
  DevOps: "loop",
  "QA Automation": "check",
  "Networking Solutions": "nodes",
  "IT Staffing": "people",
  "Contract Staffing": "clock",
  "Professional Services": "briefcase",
  "Project Management": "layers",
  "Business Analysis": "pie",
  "Specialized Technology Talent": "diamond",
};

export function LightServices() {
  return (
    <section
      id="services"
      data-story-section
      aria-labelledby="services-title"
      className={cn(storySectionClass("left"), "lg:-mr-16 lg:w-[44%]")}
    >
      <div data-services-content>
        <SectionHeader
          id="services-title"
          eyebrow={services.eyebrow}
          title={services.title}
          className="mx-0 text-left"
        />

        <div className="mt-12 grid gap-14">
          {services.groups.map((group) => (
            <div key={group.name}>
              <div data-reveal="3">
                <h3 className="type-heading">{group.name}</h3>
                <p className="type-body mt-2">{group.summary}</p>
              </div>
              <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3">
                {group.items.map((item) => {
                  return (
                    <li
                      key={item.title}
                      data-card
                      className="light-svc"
                      style={{ "--svc": CARD_COLOR } as React.CSSProperties}
                    >
                      <div className="light-svc__tile">
                        <ServiceIcon
                          name={ICONS[item.title] ?? "spark"}
                          color={CARD_COLOR}
                        />
                      </div>
                      <h4 className="light-svc__title">{item.title}</h4>
                      <p className="light-svc__body">{item.body}</p>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
