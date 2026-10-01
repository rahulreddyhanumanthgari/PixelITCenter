import { staffing } from "@/content/site";
import { plain } from "../lib/text";
import { Section } from "./Section";

/** The one dark band in the light design, so the page has a change of pace. */
export function Staffing() {
  return (
    <Section id="staffing" tone="ink" title={plain(staffing.title)} intro={staffing.body}>
      <ul className="grid gap-10 sm:grid-cols-3 sm:gap-8">
        {staffing.points.map((point) => (
          <li key={point.title} className="border-t-2 border-teal pt-6">
            <h3 className="l-h3">{point.title}</h3>
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-paper/70">{point.body}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}
