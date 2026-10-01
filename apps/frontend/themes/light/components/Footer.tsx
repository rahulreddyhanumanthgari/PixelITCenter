import { footer, site } from "@/content/site";
import { Container } from "./Section";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="bg-paper pb-24 pt-16 sm:pb-10">
      <Container>
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Logo />
            <p className="l-body mt-5 max-w-[42ch] text-[0.9375rem]">{site.description}</p>
          </div>
          <div className="grid grid-cols-2 gap-8 lg:col-span-6 lg:col-start-7">
            {footer.columns.map((col) => (
              <nav key={col.title} aria-label={col.title}>
                <h2 className="text-sm font-semibold">{col.title}</h2>
                <ul className="mt-4 space-y-3 text-[0.9375rem]">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <a href={link.href} className="text-slate transition-colors hover:text-ink">
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-line pt-6 text-sm text-slate sm:flex-row sm:justify-between">
          <p>
            © {new Date().getFullYear()} {site.name} Corporation
          </p>
          <ul className="flex gap-6">
            {footer.legal.map((link) => (
              <li key={link.label}>
                <a href={link.href} className="hover:text-ink">
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
