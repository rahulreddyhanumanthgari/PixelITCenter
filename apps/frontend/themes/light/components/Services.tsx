import { services } from "@/content/site";
import { cn } from "@/lib/utils";
import { plain } from "../lib/text";
import { Section } from "./Section";

// The node marker says which group a service belongs to: filled for
// Technology Services, open for Talent & Delivery. The group heading carries
// the same marker, so it reads as a key.
function Node({ open }: { open: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn("mt-[0.4rem] block size-3 shrink-0 rounded-full", open ? "border-2 border-teal-deep" : "bg-teal")}
    />
  );
}

export function Services() {
  return (
    <Section id="services" title={plain(services.title)}>
      <div className="space-y-16">
        {services.groups.map((group, g) => (
          <div key={group.name}>
            <div className="flex gap-3">
              <Node open={g === 1} />
              <div>
                <h3 className="l-h3">{group.name}</h3>
                <p className="l-body mt-1">{group.summary}</p>
              </div>
            </div>
            <ul className="mt-8 grid gap-x-10 gap-y-8 border-t border-line pt-8 sm:grid-cols-2">
              {group.items.map((item) => (
                <li key={item.title} className="flex gap-3">
                  <Node open={g === 1} />
                  <div>
                    <h4 className="font-display text-lg font-semibold tracking-[-0.01em]">{item.title}</h4>
                    <p className="l-body mt-1.5 text-[0.9375rem]">{item.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Section>
  );
}
