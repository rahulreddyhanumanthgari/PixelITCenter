import { nav, site } from "@/content/site";
import { Container } from "./Section";
import { Logo } from "./Logo";
import { MobileMenu } from "./MobileMenu";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper/90 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-6 lg:h-[4.5rem]">
        <a href="#top" aria-label={`${site.name} home`} className="flex min-h-11 shrink-0 items-center rounded-sm">
          <Logo priority alt="" />
        </a>

        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-7 text-[0.9375rem]">
            {nav.map((item) => (
              <li key={item.label}>
                <a href={item.href} className="text-slate transition-colors hover:text-ink">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <a href={site.portalUrl} className="l-btn l-btn--secondary hidden min-h-10 px-4 text-[0.9375rem] sm:inline-flex">
            Portal login
          </a>
          <MobileMenu />
        </div>
      </Container>
    </header>
  );
}
