import { clientProof } from "@/content/site";
import { Container } from "./SectionHeader";
import { LogoMarquee } from "./LogoMarquee";

export function ClientProof() {
  return (
    <section aria-labelledby="clients-title" className="border-y border-border bg-surface/60 py-12">
      <Container>
        <h2
          id="clients-title"
          className="text-center text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground"
        >
          {clientProof.title}
        </h2>
      </Container>
      <LogoMarquee logos={clientProof.logos} />
    </section>
  );
}
