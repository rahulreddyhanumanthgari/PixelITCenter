"use client";

import { useState } from "react";
import { ChevronDown, Clock, Mail, MapPin, Phone } from "lucide-react";
import { site } from "@/content/site";
import { faqs as defaultFaqs, tickets as starter } from "@/content/portal-demo";
import { Avatar, Chip, PageHeader, useToast } from "./ui";

type Person = { name: string; role: string; email: string };
type OfficeHours = { open: number; close: number; label: string };

/** Open now? Office hours are Eastern Time, Monday to Friday. */
function officeOpen({ open, close }: OfficeHours, now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", weekday: "short", hour: "numeric", hourCycle: "h23" }).formatToParts(now);
  const day = parts.find((x) => x.type === "weekday")?.value ?? "";
  const hour = Number(parts.find((x) => x.type === "hour")?.value ?? -1);
  return !["Sat", "Sun"].includes(day) && hour >= open && hour < close;
}

/**
 * Contact details, common questions and support tickets. Students see it as
 * "Help", with their recruiter and placement lead listed first.
 */
export function SupportPage({
  title = "Support",
  faqs = defaultFaqs,
  people,
  hours,
  ticketsNote,
  detailLabel = "Details",
  ticketTitle = "Open a ticket",
}: {
  title?: string;
  faqs?: { q: string; a: string }[];
  people?: Person[];
  /** Shows whether the office is open now (students' Help). */
  hours?: OfficeHours;
  /** A line under the ticket form, e.g. who sees tickets. */
  ticketsNote?: string;
  detailLabel?: string;
  ticketTitle?: string;
}) {
  const [tickets, setTickets] = useState(starter);
  const [subject, setSubject] = useState("");
  const [detail, setDetail] = useState("");
  const [toast, showToast] = useToast();

  const contacts = [
    { icon: Mail, label: "Email", value: site.contact.email, href: `mailto:${site.contact.email}` },
    { icon: Phone, label: "Phone", value: site.contact.phone, href: `tel:${site.contact.phone.replace(/[^+\d]/g, "")}` },
    { icon: MapPin, label: "Office", value: site.contact.location },
  ];
  const isOpen = hours ? officeOpen(hours) : false;

  return (
    <div className="space-y-6">
      <PageHeader title={title} body="Questions, problems or requests. We usually reply within one working day." />

      {people && (
        <section aria-labelledby="people-heading">
          <h2 id="people-heading" className="dash-section-title">
            Your people
          </h2>
          <ul className="mt-3 grid gap-3 md:grid-cols-3">
            {people.map((p) => (
              <li key={p.email} className="dash-stat flex items-center gap-3">
                <Avatar name={p.name} size={40} />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{p.name}</span>
                  <span className="block text-xs text-[var(--dash-muted)]">{p.role}</span>
                  <a href={`mailto:${p.email}`} className="block truncate text-xs font-semibold text-[var(--dash-orange-ink)] hover:underline">
                    {p.email}
                  </a>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {hours && (
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm" role="status">
          <Clock className="size-4 text-[var(--dash-muted)]" aria-hidden="true" />
          <span className="dash-chip" data-tone={isOpen ? "good" : undefined}>
            {isOpen ? "Office open now" : "Office closed now"}
          </span>
          <span className="text-[var(--dash-muted)]">
            {hours.label}. {isOpen ? "Expect a reply today." : "Raise a ticket and we reply when we open."}
          </span>
        </p>
      )}

      <ul className="grid gap-3 md:grid-cols-3">
        {contacts.map(({ icon: Icon, label, value, href }) => (
          <li key={label} className="dash-stat flex items-center gap-3">
            <span className="dash-stat-icon size-9 flex-none">
              <Icon className="size-4" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block text-xs text-[var(--dash-muted)]">{label}</span>
              {href ? (
                <a href={href} className="block truncate text-sm font-semibold hover:underline">
                  {value}
                </a>
              ) : (
                <span className="block text-sm font-semibold">{value}</span>
              )}
            </span>
          </li>
        ))}
      </ul>

      <div className="grid gap-6 xl:grid-cols-2">
        <section aria-labelledby="faq-heading" className="dash-card dash-card-pad min-w-0">
          <h2 id="faq-heading" className="dash-section-title">
            Common questions
          </h2>
          <div className="mt-3 divide-y divide-[var(--dash-line)]">
            {faqs.map((f) => (
              <details key={f.q} className="group py-1">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-lg py-2.5 text-sm font-semibold [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <ChevronDown className="size-4 flex-none transition group-open:rotate-180" aria-hidden="true" />
                </summary>
                <p className="pb-3 text-sm leading-relaxed text-[var(--dash-muted)]">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section aria-labelledby="ticket-heading" className="dash-card dash-card-pad min-w-0">
          <h2 id="ticket-heading" className="dash-section-title">
            {ticketTitle}
          </h2>
          <form
            className="mt-4 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!subject.trim()) return;
              const id = `SUP-${220 + tickets.length}`;
              setTickets((t) => [{ id, subject: subject.trim(), status: "Open", updated: "Just now" }, ...t]);
              setSubject("");
              setDetail("");
              showToast(`${id} opened. Demo: nothing was sent.`);
            }}
          >
            <div>
              <label htmlFor="t-subject" className="dash-label">
                Subject
              </label>
              <input id="t-subject" value={subject} onChange={(e) => setSubject(e.target.value)} className="dash-input" placeholder="What do you need help with?" />
            </div>
            <div>
              <label htmlFor="t-detail" className="dash-label">
                {detailLabel}
              </label>
              <textarea id="t-detail" value={detail} onChange={(e) => setDetail(e.target.value)} className="dash-input" placeholder="Anything that helps us sort it quickly." />
            </div>
            <button type="submit" className="dash-btn" disabled={!subject.trim()}>
              Send ticket
            </button>
            {ticketsNote && <p className="text-xs text-[var(--dash-muted)]">{ticketsNote}</p>}
          </form>

          <h3 className="mt-6 text-sm font-semibold">Your tickets</h3>
          <ul className="mt-2 divide-y divide-[var(--dash-line)]">
            {tickets.map((t) => (
              <li key={t.id} className="flex items-center gap-3 py-2.5 text-sm">
                <span className="w-16 flex-none text-xs font-semibold text-[var(--dash-muted)]">{t.id}</span>
                <span className="min-w-0 flex-1 truncate">{t.subject}</span>
                <span className="hidden text-xs text-[var(--dash-faint)] sm:inline">{t.updated}</span>
                <Chip>{t.status}</Chip>
              </li>
            ))}
          </ul>
        </section>
      </div>
      {toast}
    </div>
  );
}
