import { ArrowRight } from "lucide-react";
import { contactCta, site } from "@/content/site";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Container } from "./SectionHeader";

export function ContactCta() {
  return (
    <section id="contact" aria-labelledby="contact-title" className="scroll-mt-20 py-24 sm:py-32">
      <Container>
        <div className="relative overflow-hidden rounded-3xl border border-border bg-surface px-6 py-14 sm:px-12 sm:py-20">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-24 -top-24 size-80 rounded-full bg-brand-orange/15 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 -right-24 size-96 rounded-full bg-brand-blue/15 blur-3xl"
          />
          <div className="relative max-w-2xl">
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.22em] text-brand-orange">{contactCta.eyebrow}</p>
            <h2 id="contact-title" className="font-display text-4xl font-bold uppercase leading-[1] sm:text-6xl">
              {contactCta.title}
            </h2>
            <p className="mt-5 text-lg text-muted-foreground">{contactCta.body}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={contactCta.primary.href}
                className={cn(buttonVariants(), "h-12 rounded-full px-6 text-sm font-semibold")}
              >
                {contactCta.primary.label}
                <ArrowRight data-icon="inline-end" />
              </a>
              <a
                href={contactCta.secondary.href}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "h-12 rounded-full border-white/20 bg-transparent px-6 text-sm",
                )}
              >
                {contactCta.secondary.label}
              </a>
            </div>
            <p className="mt-6 text-sm text-muted-foreground">{site.contact.email}</p>
          </div>
        </div>
      </Container>
    </section>
  );
}
