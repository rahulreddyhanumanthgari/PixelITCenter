import { contactCta, site } from "@/content/site";
import { plain } from "../lib/text";
import { Container } from "./Section";

export function Contact() {
  return (
    <section id="contact" aria-labelledby="contact-heading" className="bg-ink py-20 text-paper lg:py-28">
      <Container className="grid gap-12 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-7">
          <h2 id="contact-heading" className="l-display text-[clamp(2.25rem,1.4rem+3.4vw,4.25rem)]">
            {plain(contactCta.title)}
          </h2>
          <p className="l-lead mt-6 text-paper/75">{contactCta.body}</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <a href={contactCta.primary.href} className="l-btn bg-teal text-ink hover:bg-paper">
              {contactCta.primary.label}
            </a>
            <a href={contactCta.secondary.href} className="l-btn border border-paper/30 hover:border-paper">
              {contactCta.secondary.label}
            </a>
          </div>
        </div>

        <dl className="grid content-start gap-7 lg:col-span-4 lg:col-start-9 lg:border-l lg:border-paper/15 lg:pl-8">
          <div>
            <dt className="text-sm text-paper/60">Email</dt>
            <dd className="mt-1">
              <a href={`mailto:${site.contact.email}`} className="break-all font-display text-xl font-semibold hover:text-teal">
                {site.contact.email}
              </a>
            </dd>
          </div>
          <div>
            <dt className="text-sm text-paper/60">Phone</dt>
            <dd className="mt-1">
              <a href={contactCta.secondary.href} className="font-display text-xl font-semibold hover:text-teal">
                {site.contact.phone}
              </a>
            </dd>
          </div>
          <div>
            <dt className="text-sm text-paper/60">Office</dt>
            <dd className="mt-1 text-paper/85">{site.contact.location}</dd>
          </div>
        </dl>
      </Container>
    </section>
  );
}
