import { ArrowRight } from "lucide-react";
import { contactCta, site } from "@/content/site";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { HeadingText } from "@/components/ui/heading-text";
import { Container } from "./SectionHeader";

export function ContactCta() {
  return (
    <section id="contact" aria-labelledby="contact-title" className="scroll-mt-20 pt-24 pb-12 sm:pt-32 sm:pb-16">
      <Container>
        {/* A whole section, not a card: centred text over the galaxy. */}
        <div data-galaxy-content className="mx-auto max-w-3xl text-center">
          <p data-reveal="0" className="type-eyebrow mb-4">
            {contactCta.eyebrow}
          </p>
          <h2 id="contact-title" data-reveal="1" className="type-display-lg mx-auto">
            <HeadingText text={contactCta.title} />
          </h2>
          <p data-reveal="2" className="type-body mx-auto mt-6">
            {contactCta.body}
          </p>
          <div data-reveal="3" className="mt-9 flex flex-wrap justify-center gap-3">
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
          <p className="type-body-sm mt-6">{site.contact.email}</p>
        </div>
      </Container>
    </section>
  );
}
