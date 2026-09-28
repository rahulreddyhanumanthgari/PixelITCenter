import Image from "next/image";
import { clientProof } from "@/content/site";
import { Container } from "./SectionHeader";

type Logo = (typeof clientProof.logos)[number];

function LogoTile({ logo, decorative = false }: { logo: Logo; decorative?: boolean }) {
  return (
    <li className="shrink-0">
      {/* Light tile: several logos have dark lettering or their own solid box,
          so they can't sit directly on the dark page. */}
      <div className="grid h-16 w-32 place-items-center rounded-xl bg-white px-3 sm:h-20 sm:w-40">
        <Image
          src={logo.src}
          alt={decorative ? "" : logo.name}
          width={300}
          height={150}
          sizes="160px"
          // Eager: tiles slide in from off-screen, so lazy loading would show blanks.
          loading="eager"
          className="h-auto max-h-full w-full object-contain"
        />
      </div>
    </li>
  );
}

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

      {/* Scrolling strip. The list is rendered twice so the loop is seamless;
          the copy is hidden from screen readers. Reduced motion: static wrap. */}
      <div className="group relative mt-8 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)] motion-reduce:[mask-image:none]">
        <div className="flex w-max animate-[marquee_60s_linear_infinite] gap-4 group-hover:[animation-play-state:paused] motion-reduce:w-full motion-reduce:animate-none">
          <ul className="flex gap-4 motion-reduce:w-full motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:px-4">
            {clientProof.logos.map((logo) => (
              <LogoTile key={logo.name} logo={logo} />
            ))}
          </ul>
          <ul aria-hidden="true" className="flex gap-4 motion-reduce:hidden">
            {clientProof.logos.map((logo) => (
              <LogoTile key={logo.name} logo={logo} decorative />
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
