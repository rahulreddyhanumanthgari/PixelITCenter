import { ArrowRight } from "lucide-react";
import { careers } from "@/content/site";
import { buttonVariants } from "@/themes/core/components/ui/button";
import { cn } from "@/lib/utils";
import { Container, SectionHeader } from "./SectionHeader";

/**
 * Careers — its own section (not a card), centred on the galaxy between
 * About and Proof Points: eyebrow, heading, description and one call to
 * action, on the same type system and scroll choreography as the rest.
 */
export function Careers() {
  return (
    <section id="careers" aria-labelledby="careers-title" className="scroll-mt-20 border-t border-border py-24 sm:py-32">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <SectionHeader
            id="careers-title"
            eyebrow={careers.eyebrow}
            title={careers.title}
            body={careers.body}
            className="mx-auto"
          />
          <div data-reveal="3" className="mt-9 flex justify-center">
            <a
              href={careers.cta.href}
              className={cn(buttonVariants({ variant: "outline" }), "h-12 rounded-full border-foreground/20 bg-transparent px-6 text-sm")}
            >
              {careers.cta.label}
              <ArrowRight data-icon="inline-end" />
            </a>
          </div>
        </div>
      </Container>
    </section>
  );
}
