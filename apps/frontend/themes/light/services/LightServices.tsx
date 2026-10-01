import { services } from "@/content/site";
import { ServiceCard } from "@/themes/core/components/ui/service-card";
import { SectionHeader } from "@/themes/core/components/sections/SectionHeader";
import { ServicesOrbit } from "./ServicesOrbit";

/**
 * Light design, Services: the heading and the service panels on the left;
 * on the right the services orbit (a half ring with every service's 3D icon
 * travelling round it). Desktop: the orbit stays in view while the panels
 * scroll. Phones: the orbit sits between the heading and the panels.
 */
export function LightServices() {
  return (
    <section
      id="services"
      data-story-section
      aria-labelledby="services-title"
      className="scroll-mt-20 py-20 sm:py-24 lg:grid lg:grid-cols-12 lg:gap-x-12 lg:py-28"
    >
      <div className="lg:col-span-7 lg:row-start-1">
        <SectionHeader id="services-title" eyebrow={services.eyebrow} title={services.title} className="mx-0 text-left" />
      </div>

      <div className="mt-10 lg:col-span-5 lg:col-start-8 lg:row-span-2 lg:row-start-1 lg:mt-0">
        <div className="lg:sticky lg:top-20 lg:h-[calc(100svh-6rem)]">
          <ServicesOrbit />
        </div>
      </div>

      <div data-services-content className="mt-12 grid gap-12 lg:col-span-7 lg:row-start-2">
        {services.groups.map((group, gi) => (
          <div key={group.name}>
            <div data-reveal="3" className="flex items-center gap-3 border-b border-border pb-4">
              <span
                aria-hidden="true"
                className={gi === 0 ? "size-2 rounded-full bg-brand-blue" : "size-2 rounded-full bg-brand-orange"}
              />
              <h3 className="type-heading">{group.name}</h3>
            </div>
            <p data-reveal="4" className="type-body mt-4">
              {group.summary}
            </p>
            <ul className="mt-8 grid gap-x-8 gap-y-10 sm:grid-cols-2">
              {group.items.map((item, i) => (
                <ServiceCard key={item.title} index={i + 1} title={item.title} description={item.body} label={item.label} />
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
