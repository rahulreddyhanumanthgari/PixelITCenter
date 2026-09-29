import { footer, site } from "@/content/site";
import { Container } from "@/components/sections/SectionHeader";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface/60 pt-16 pb-10">
      <Container>
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="type-body-sm mt-4 max-w-xs">{site.description}</p>
          </div>

          {footer.columns.map((col) => (
            <div key={col.title}>
              <h2 className="type-label">{col.title}</h2>
              <ul className="mt-4 space-y-2.5 text-sm">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      {...(link.href.startsWith("http") && { target: "_blank", rel: "noopener noreferrer" })}
                      className="rounded-sm transition-colors hover:text-brand-orange"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h2 className="type-label">Contact</h2>
            <address className="mt-4 space-y-2.5 text-sm not-italic">
              <a href={`mailto:${site.contact.email}`} className="block hover:text-brand-orange">
                {site.contact.email}
              </a>
              <a href={`tel:${site.contact.phone.replace(/[^+\d]/g, "")}`} className="block hover:text-brand-orange">
                {site.contact.phone}
              </a>
              <span className="block text-muted-foreground">{site.contact.location}</span>
            </address>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {site.name} Corporation. All rights reserved.
          </p>
          <ul className="flex gap-6">
            {footer.legal.map((link) => (
              <li key={link.label}>
                <a href={link.href} className="hover:text-foreground">
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
