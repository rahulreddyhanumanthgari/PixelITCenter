import { staffing } from "@/content/site";
import { Container, SectionHeader } from "./SectionHeader";

export function Staffing() {
  return (
    <section
      id="staffing"
      aria-labelledby="staffing-title"
      className="relative scroll-mt-20 overflow-hidden border-y border-border bg-surface py-24 sm:py-32"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 top-1/2 size-[36rem] -translate-y-1/2 rounded-full bg-brand-blue/10 blur-3xl"
      />
      <Container className="relative grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-center">
        <SectionHeader id="staffing-title" eyebrow={staffing.eyebrow} title={staffing.title} body={staffing.body} />
        <ul className="grid gap-4">
          {staffing.points.map((point, i) => (
            <li key={point.title} className="flex gap-5 rounded-xl border border-border bg-background/60 p-6">
              <span className="font-display text-2xl font-semibold text-brand-orange" aria-hidden="true">
                0{i + 1}
              </span>
              <div>
                <h3 className="font-medium">{point.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{point.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
