"use client";

import type { ReactNode } from "react";
import { BellRing, CalendarCheck, Check, Clock, Copy, Hourglass, Lightbulb, Link2, Users, Video } from "lucide-react";
import { interviews, pastInterviews, type Interview } from "@/content/student-demo";
import { remindersOf, setReminders, useSession } from "../session";
import { PageHeader, useToast } from "../ui";

/** One labelled line in the card: icon, label, value. */
function Row({ icon: Icon, label, children }: { icon: typeof Clock; label: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <Icon className="mt-0.5 size-4 flex-none text-[var(--dash-muted)]" aria-hidden="true" />
      <dt className="w-24 flex-none text-xs leading-5 text-[var(--dash-muted)]">{label}</dt>
      <dd className="min-w-0 text-sm font-semibold">{children}</dd>
    </div>
  );
}

/**
 * The meeting link. Shared 1 day before the interview: until then a dashed
 * "coming soon" box says when; after, the link with Copy and Join.
 */
function LinkBox({ interview, onToast }: { interview: Interview; onToast: (t: string) => void }) {
  if (!interview.link)
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-dashed border-[var(--dash-line-strong)] bg-[var(--dash-side)] p-4">
        <Hourglass className="mt-0.5 size-5 flex-none text-[var(--dash-muted)]" aria-hidden="true" />
        <div>
          <p className="text-sm font-semibold">Link will be updated soon</p>
          <p className="mt-0.5 text-sm text-[var(--dash-muted)]">
            Shared on <span className="font-semibold text-[var(--dash-ink)]">{interview.linkOn}</span>, 1 day before your interview.
          </p>
        </div>
      </div>
    );

  const url = `https://${interview.link}`;
  return (
    <div className="rounded-2xl border border-[rgb(12_177_223/0.35)] bg-[var(--dash-cyan-tint)] p-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-[var(--dash-cyan-ink)]">
        <Check className="size-4" strokeWidth={3} aria-hidden="true" /> Your interview link is ready
      </p>
      <p className="mt-2 flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm">
        <Link2 className="size-4 flex-none text-[var(--dash-muted)]" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate font-medium">{interview.link}</span>
      </p>
      <div className="mt-3 flex flex-wrap justify-end gap-2">
        <button
          type="button"
          className="dash-btn-ghost h-9"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(url);
              onToast("Link copied.");
            } catch {
              onToast("Couldn't copy. Select the link and copy it instead.");
            }
          }}
        >
          <Copy className="size-4" aria-hidden="true" /> Copy link
        </button>
        <button
          type="button"
          className="dash-btn h-9"
          data-tone="orange"
          onClick={() => onToast("Demo: the real meeting opens here when the portal is live.")}
        >
          <Video className="size-4" aria-hidden="true" /> Join interview
        </button>
      </div>
    </div>
  );
}

const REMINDERS = [
  { key: "onSchedule", label: "When an interview is scheduled", body: "An email with the company, role, date and time." },
  { key: "before24h", label: "24 hours before", body: "A reminder the day before, with the meeting link." },
  { key: "before1h", label: "1 hour before", body: "A last nudge so you join on time." },
] as const;

/**
 * Email reminders for interviews.
 * TODO(backend): saved in the demo session only. The API stores these
 * (PUT /api/student/notification-settings) and a scheduler sends the emails.
 */
function Reminders({ onToast }: { onToast: (t: string) => void }) {
  const session = useSession();
  if (!session) return null;
  const prefs = remindersOf(session);
  return (
    <section aria-labelledby="reminders-heading" className="dash-card dash-card-pad">
      <h2 id="reminders-heading" className="flex items-center gap-2 dash-section-title">
        <BellRing className="size-4 text-[var(--dash-orange)]" aria-hidden="true" /> Email reminders
      </h2>
      <p className="mt-1 text-xs text-[var(--dash-muted)]">Sent to {session.profile.email}. Emails start once the portal is live.</p>
      <ul className="mt-3 divide-y divide-[var(--dash-line)]">
        {REMINDERS.map((r) => (
          <li key={r.key} className="flex items-center justify-between gap-4 py-3">
            <span className="min-w-0">
              <span className="block text-sm font-semibold">{r.label}</span>
              <span className="block text-xs text-[var(--dash-muted)]">{r.body}</span>
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={prefs[r.key]}
              aria-label={r.label}
              className="dash-switch"
              onClick={() => {
                setReminders({ [r.key]: !prefs[r.key] });
                onToast(`${r.label}: ${prefs[r.key] ? "off" : "on"}.`);
              }}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * Upcoming interviews, one card each: a date block, the company and role,
 * the time, format and who you'll meet, the meeting link (shared 1 day
 * before) and a short prep tip. Then past interviews and the email
 * reminder settings.
 */
export function InterviewsPage() {
  const [toast, showToast] = useToast();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Interviews"
        body="Your interviews, set up by your recruiter. Meeting links appear here 1 day before, and your recruiter emails them too."
      />

      <section aria-labelledby="upcoming-heading">
        <h2 id="upcoming-heading" className="dash-section-title">
          Upcoming <span className="dash-count">{interviews.length}</span>
        </h2>
        {!interviews.length && (
          <div className="dash-card dash-card-pad mt-3 py-8 text-center">
            <p className="text-sm font-semibold">No interviews coming up</p>
            <p className="mt-1 text-sm text-[var(--dash-muted)]">When a client wants to meet you, your recruiter sets it up and it shows here.</p>
          </div>
        )}
        <ul className="mt-3 grid grid-cols-1 gap-4 xl:grid-cols-2">
          {interviews.map((i) => (
            <li key={i.id} className="dash-card dash-card-pad flex flex-col gap-4">
              {/* Date block + who and what */}
              <div className="flex items-start gap-4">
                <div className="grid w-16 flex-none overflow-hidden rounded-2xl border border-[var(--dash-line)] text-center" aria-hidden="true">
                  <span className="bg-[var(--dash-ink)] py-1 text-[0.6875rem] font-semibold tracking-[0.12em] text-white uppercase">{i.month}</span>
                  <span className="pt-1.5 text-2xl leading-none font-bold">{i.day}</span>
                  <span className="pb-1.5 text-[0.6875rem] text-[var(--dash-muted)]">{i.weekday}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2">
                    <span
                      className="dash-chip"
                      data-tone={i.relative === "Tomorrow" ? "warn" : undefined}
                    >
                      {i.relative}
                    </span>
                    <span className="dash-chip border border-[var(--dash-line-strong)] bg-white">{i.round}</span>
                  </p>
                  <h3 className="mt-2 text-lg leading-tight font-semibold">{i.company}</h3>
                  <p className="text-sm text-[var(--dash-muted)]">{i.role}</p>
                </div>
              </div>

              {/* The facts, one per line */}
              <dl className="divide-y divide-[var(--dash-line)] border-y border-[var(--dash-line)]">
                <Row icon={Clock} label="Date & time">
                  {i.date} · {i.time}
                </Row>
                <Row icon={Video} label="Format">
                  {i.format}
                </Row>
                <Row icon={Users} label="You'll meet">
                  {i.with}
                </Row>
              </dl>

              <LinkBox interview={i} onToast={showToast} />

              <p className="flex gap-2 text-sm leading-relaxed text-[var(--dash-muted)]">
                <Lightbulb className="mt-0.5 size-4 flex-none text-[var(--dash-orange)]" aria-hidden="true" />
                <span>
                  <span className="font-semibold text-[var(--dash-ink)]">Prep tip: </span>
                  {i.prep}
                </span>
              </p>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <section aria-labelledby="past-heading" className="min-w-0">
          <h2 id="past-heading" className="dash-section-title">
            Past <span className="dash-count">{pastInterviews.length}</span>
          </h2>
          {pastInterviews.length ? (
            <ul className="dash-card mt-3 divide-y divide-[var(--dash-line)] px-4 sm:px-5">
              {pastInterviews.map((i) => (
                <li key={i.id} className="flex flex-wrap items-start gap-x-4 gap-y-1 py-3.5">
                  <CalendarCheck className="mt-0.5 size-4 flex-none text-[var(--dash-muted)]" aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">
                      {i.company} <span className="font-normal text-[var(--dash-muted)]">· {i.role}</span>
                    </span>
                    <span className="block text-xs text-[var(--dash-muted)]">
                      {i.round} · {i.date} · {i.time} · {i.format}
                    </span>
                  </span>
                  <span className="text-xs text-[var(--dash-faint)]">Link closed</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="dash-card dash-card-pad mt-3 text-sm text-[var(--dash-muted)]">Your past interviews will be listed here.</p>
          )}
        </section>
        <Reminders onToast={showToast} />
      </div>
      {toast}
    </div>
  );
}
