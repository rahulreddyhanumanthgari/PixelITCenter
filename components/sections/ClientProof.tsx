import { clientProof } from "@/content/site";
import { Container } from "./SectionHeader";

export function ClientProof() {
  return (
    <section aria-label="Clients" className="border-y border-border bg-surface/60 py-10">
      <Container>
        <p className="text-center text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
          {clientProof.title}
        </p>
        <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {clientProof.logos.map((logo, i) => (
            <li
              key={i}
              className="grid h-14 place-items-center rounded-lg border border-dashed border-white/10 text-xs uppercase tracking-widest text-muted-foreground/70"
            >
              {logo}
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
