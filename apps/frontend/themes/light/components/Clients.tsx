import Image from "next/image";
import { clientProof } from "@/content/site";
import { Container } from "./Section";

/** A still grid of client logos (the dark design scrolls them in a strip). */
export function Clients() {
  return (
    <section aria-labelledby="clients-heading" className="border-y border-line bg-paper py-12 lg:py-16">
      <Container>
        <h2 id="clients-heading" className="text-[0.9375rem] font-medium text-slate">
          {clientProof.title}
        </h2>
        <ul className="mt-8 grid grid-cols-4 items-center gap-x-4 gap-y-6 sm:gap-x-8 lg:grid-cols-8">
          {clientProof.logos.map((logo) => (
            <li key={logo.name} className="flex justify-center">
              <Image
                src={logo.src}
                alt={logo.name}
                width={300}
                height={150}
                sizes="(min-width: 1024px) 120px, 22vw"
                className="h-auto w-full max-w-[7.5rem] opacity-75 mix-blend-multiply grayscale"
              />
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
