import { whyUs } from "@/content/site";
import { plain } from "../lib/text";
import { Section } from "./Section";

export function WhyUs() {
  return (
    <Section id="why" title={plain(whyUs.title)}>
      <ul className="grid gap-x-12 gap-y-10 sm:grid-cols-2">
        {whyUs.reasons.map((reason) => (
          <li key={reason.title}>
            <h3 className="l-h3">{reason.title}</h3>
            <p className="l-body mt-2">{reason.body}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}
