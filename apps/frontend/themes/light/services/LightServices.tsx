import { services } from "@/content/site";
import { ServiceCard } from "@/themes/core/components/ui/service-card";
import { SectionHeader } from "@/themes/core/components/sections/SectionHeader";

/**
 * Light design, Services: the heading and every service panel in the left
 * half; the right half is left open for the 3D particle torus (the particle
 * layer's light-theme Services form), so the object never crosses the text.
 */
export function LightServices() {
  return (
    <section id="services" data-story-section aria-labelledby="services-title" className="scroll-mt-20 py-20 sm:py-24 lg:py-28">
      <div className="lg:w-1/2">
        <SectionHeader id="services-title" eyebrow={services.eyebrow} title={services.title} className="mx-0 text-left" />

        <div data-services-content className="mt-12 grid gap-12">
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
      </div>
    </section>
  );
}
