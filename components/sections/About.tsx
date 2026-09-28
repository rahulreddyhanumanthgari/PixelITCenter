import { about, careers } from "@/content/site";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Container, SectionHeader } from "./SectionHeader";

export function About() {
  return (
    <section id="about" aria-labelledby="about-title" className="scroll-mt-20 border-t border-border bg-surface py-24 sm:py-32">
      <Container className="grid gap-12 lg:grid-cols-2">
        <SectionHeader id="about-title" eyebrow={about.eyebrow} title={about.title} body={about.body} />

        <div className="flex flex-col gap-6">
          <dl className="grid gap-3 sm:grid-cols-3">
            {about.highlights.map((h) => (
              <div key={h.label} className="rounded-xl border border-border bg-background/60 p-5">
                <dt className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{h.label}</dt>
                <dd className="mt-2 font-medium">{h.value}</dd>
              </div>
            ))}
          </dl>

          <div id="careers" className="scroll-mt-24 rounded-2xl border border-border bg-background/60 p-7">
            <h3 className="font-display text-2xl font-semibold uppercase">{careers.title}</h3>
            <p className="mt-2 text-muted-foreground">{careers.body}</p>
            <a
              href={careers.cta.href}
              className={cn(buttonVariants({ variant: "outline" }), "mt-5 h-11 rounded-full border-white/20 bg-transparent px-5")}
            >
              {careers.cta.label}
            </a>
          </div>
        </div>
      </Container>
    </section>
  );
}
