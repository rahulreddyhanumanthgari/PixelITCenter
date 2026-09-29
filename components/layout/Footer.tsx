import { footer, site } from "@/content/site";
import { Container } from "@/components/sections/SectionHeader";
import { Logo } from "./Logo";

/** Stable pseudo-random 0..1, so the dust field renders the same everywhere. */
const rand = (i: number, k: number) => {
  const s = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return s - Math.floor(s);
};

/**
 * Sparse particle dust: the site's particles quieting down. Denser toward the
 * bottom, around the wordmark; tiny white / blue / a few orange dots drifting
 * very slowly (`.footer-dust` in globals.css).
 */
const DUST = Array.from({ length: 110 }, (_, i) => {
  const c = rand(i, 3);
  return {
    left: rand(i, 1) * 100,
    // Squaring pushes most dots toward the bottom (the wordmark).
    top: 100 - Math.pow(rand(i, 2), 1.8) * 100,
    size: 1 + Math.round(rand(i, 4) * 1.5),
    tone: c > 0.92 ? "orange" : c > 0.62 ? "blue" : "white",
    delay: -rand(i, 5) * 40,
  };
});

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  const external = href.startsWith("http");
  return (
    <a
      href={href}
      {...(external && { target: "_blank", rel: "noopener noreferrer" })}
      className="footer-link group relative inline-block rounded-sm"
    >
      <span aria-hidden="true" className="footer-link-tick" />
      {children}
    </a>
  );
}

/**
 * Footer — the site's closing scene: practical navigation and contact up
 * top with generous space; then an oversized, barely-there PIXEL IT CENTER
 * wordmark, cropped by the edges, in a sparse drift of particle dust; then
 * the legal row. Opaque (the galaxy's ending sun rests on its top edge).
 */
export function Footer() {
  return (
    <footer data-footer className="footer-scene relative overflow-hidden">
      <Container className="relative z-10 pt-24 pb-16 sm:pt-28">
        <div className="grid gap-14 lg:grid-cols-[1.2fr_2fr] lg:gap-20">
          <div>
            <Logo />
            <p className="type-body-sm mt-6 max-w-sm">{site.description}</p>
          </div>

          <div className="grid gap-12 sm:grid-cols-3 sm:gap-8">
            {footer.columns.map((col) => (
              <div key={col.title}>
                <h2 className="footer-label">{col.title}</h2>
                <ul className="mt-6 space-y-3.5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <FooterLink href={link.href}>{link.label}</FooterLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div>
              <h2 className="footer-label">Contact</h2>
              <address className="mt-6 space-y-3.5 not-italic">
                <a href={`mailto:${site.contact.email}`} className="footer-email block">
                  {site.contact.email}
                </a>
                <FooterLink href={`tel:${site.contact.phone.replace(/[^+\d]/g, "")}`}>{site.contact.phone}</FooterLink>
                <span className="type-body-sm block max-w-[16rem]">{site.contact.location}</span>
              </address>
            </div>
          </div>
        </div>
      </Container>

      {/* The oversized wordmark, cropped by the edges, in slow particle dust. */}
      <div className="relative" aria-hidden="true">
        <div className="pointer-events-none absolute inset-0">
          {DUST.map((d, i) => (
            <span
              key={i}
              className="footer-dust"
              data-tone={d.tone}
              style={{
                left: `${d.left.toFixed(2)}%`,
                top: `${d.top.toFixed(2)}%`,
                width: d.size,
                height: d.size,
                animationDelay: `${d.delay.toFixed(1)}s`,
              }}
            />
          ))}
        </div>
        <Container className="relative">
          <span className="block h-px w-12 bg-brand-orange/80" />
        </Container>
        {/* Clipped here, so the letters end cleanly at the divider below. */}
        <div className="overflow-hidden">
          <p data-reveal="1" className="footer-wordmark">
            {site.name}
          </p>
        </div>
      </div>

      <Container className="relative z-10">
        <div className="flex flex-col gap-4 border-t border-border py-7 text-xs text-[var(--text-muted)] sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {site.name} Corporation. All rights reserved.
          </p>
          <ul className="flex gap-6">
            {footer.legal.map((link) => (
              <li key={link.label}>
                <a href={link.href} className="transition-colors duration-300 hover:text-[var(--text-primary)]">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </footer>
  );
}
