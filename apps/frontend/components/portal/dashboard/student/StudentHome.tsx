"use client";

import Link from "next/link";
import { BriefcaseBusiness, CalendarDays, ChevronRight, FileText, MessageSquare, Mic, Send } from "lucide-react";
import { announcements, appStages, jobs, resumeChecklist, resumes, studentEvents, studentStats } from "@/content/student-demo";
import { demoToday } from "@/content/portal-demo";
import { shortDate } from "@/lib/dates";
import { applicationsOf, defaultResumeOf, profileCompletion, useSession } from "../session";
import { Chip, PageHeader, ProfileRing } from "../ui";
import { OnboardingChecklist } from "./OnboardingChecklist";

const STAT_ICONS = { jobs: BriefcaseBusiness, applications: Send, interviews: Mic, messages: MessageSquare };

// The next three things on the calendar (deadlines show on the Calendar page).
const upNext = studentEvents
  .filter((e) => e.date >= demoToday && e.kind !== "Deadline")
  .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
  .slice(0, 3);

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

/** Student dashboard: profile + stats, what's next, applications, resume, news. */
export function StudentHome() {
  const session = useSession();
  if (!session) return null;
  const { profile } = session;
  const percent = profileCompletion(profile);
  const apps = applicationsOf(session);
  const applied = jobs.filter((j) => apps[j.id]);
  const offer = applied.find((j) => apps[j.id] === "Offer");
  const resume = resumes.find((r) => r.id === defaultResumeOf(session)) ?? resumes[0];
  const ready = resumeChecklist.filter((c) => c.done).length;

  return (
    <div className="space-y-8">
      <PageHeader
        title={
          <>
            Student <span className="highlight">corner</span>
          </>
        }
        body={
          <>
            {greeting()}, {profile.fullName.split(" ")[0] || "there"}. Apply, interview and get hired, all from here.
          </>
        }
      />

      <section className="dash-hero p-4 sm:p-6" aria-labelledby="profile-heading">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 id="profile-heading" className="text-sm font-semibold">
              Profile
            </h2>
            <div className="mt-3 flex items-center gap-4">
              <ProfileRing name={profile.fullName || profile.email} percent={percent} />
              <div>
                <p className="flex items-baseline gap-1 text-[2rem] leading-none font-semibold">
                  {percent}
                  <span className="text-sm text-[var(--dash-muted)]">%</span>
                </p>
                <p className="mt-1.5 text-sm text-[var(--dash-muted)]">A complete profile gets you matched faster</p>
                <p className="mt-2 flex flex-wrap gap-1.5">
                  <Chip tone="ink">Student account</Chip>
                  {profile.targetRole && <Chip>{profile.targetRole}</Chip>}
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/portal/resume" className="dash-btn">
              Resume corner
            </Link>
            <Link href="/portal/jobs" className="dash-btn-ghost">
              Browse jobs
            </Link>
          </div>
        </div>

        <ul className="mt-5 grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
          {studentStats.map((s) => {
            const Icon = STAT_ICONS[s.id];
            const value = s.id === "applications" ? String(applied.length) : s.value;
            return (
              <li key={s.id} className="dash-stat">
                <p className="flex items-center gap-2 text-[0.8125rem] font-medium">
                  <span className="dash-stat-icon">
                    <Icon className="size-3.5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 leading-tight">{s.label}</span>
                </p>
                <p className="mt-2.5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span className="text-2xl font-semibold">{value}</span>
                  <span className="text-xs text-[var(--dash-muted)]">{s.note}</span>
                </p>
              </li>
            );
          })}
        </ul>
      </section>

      {offer && <OnboardingChecklist company={offer.company} compact />}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-6">
          {/* Up next: interviews and calls */}
          <section aria-labelledby="next-heading">
            <h2 id="next-heading" className="dash-section-title">
              Up next
            </h2>
            <ul className="mt-3 grid gap-3 md:grid-cols-3">
              {upNext.map((e) => (
                <li key={e.id}>
                  <Link
                    href={e.kind === "Interview" ? "/portal/interviews" : "/portal/schedule"}
                    className="dash-card dash-card-pad block h-full"
                  >
                    <Chip>{e.kind}</Chip>
                    <p className="mt-3 text-sm font-semibold">{e.title}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-[var(--dash-muted)]">
                      <CalendarDays className="size-3.5" aria-hidden="true" /> {shortDate(e.date)} · {e.time}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {/* Application tracker: a short list, not analytics */}
          <section aria-labelledby="apps-heading">
            <div className="flex items-center justify-between">
              <h2 id="apps-heading" className="dash-section-title">
                My applications <span className="dash-count">{applied.length}</span>
              </h2>
              <Link href="/portal/jobs?tab=mine" className="text-xs font-semibold text-[var(--dash-orange-ink)] hover:underline">
                See all
              </Link>
            </div>
            <ul className="dash-card mt-3 divide-y divide-[var(--dash-line)] px-4 sm:px-5">
              {applied.map((j) => {
                const stage = apps[j.id];
                const at = appStages.indexOf(stage);
                return (
                  <li key={j.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3.5">
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">{j.title}</span>
                      <span className="block text-xs text-[var(--dash-muted)]">{j.company}</span>
                    </span>
                    <span className="flex items-center gap-1" aria-hidden="true">
                      {appStages.map((s, i) => (
                        <span
                          key={s}
                          className="h-1.5 w-6 rounded-full sm:w-8"
                          style={{ background: i <= at ? (stage === "Offer" ? "var(--dash-cyan)" : "var(--dash-orange)") : "rgb(4 19 39 / 0.08)" }}
                        />
                      ))}
                    </span>
                    <Chip>{stage}</Chip>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        <div className="min-w-0 space-y-6">
          {/* Resume: the one sent when applying */}
          <section aria-labelledby="resume-heading" className="dash-card dash-card-pad">
            <div className="flex items-center justify-between">
              <h2 id="resume-heading" className="dash-section-title">
                Resume
              </h2>
              <span className="text-xs font-semibold">
                {ready}/{resumeChecklist.length} ready
              </span>
            </div>
            <div className="dash-bar mt-3">
              <span style={{ width: `${(ready / resumeChecklist.length) * 100}%` }} />
            </div>
            <Link href="/portal/resume" className="mt-4 flex items-center gap-3 rounded-xl bg-[var(--dash-side)] p-3 hover:bg-[var(--dash-hover)]">
              <FileText className="size-5 flex-none text-[var(--dash-orange)]" aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="block text-xs text-[var(--dash-muted)]">Sent when you apply</span>
                <span className="block text-sm leading-snug font-semibold">{resume.name}</span>
              </span>
              <Chip>{resume.status}</Chip>
              <ChevronRight className="size-4 flex-none" aria-hidden="true" />
            </Link>
          </section>

          {/* Announcements */}
          <section aria-labelledby="news-heading" className="dash-card dash-card-pad">
            <h2 id="news-heading" className="dash-section-title">
              Announcements
            </h2>
            <ul className="mt-3 space-y-3">
              {announcements.map((a) => (
                <li key={a.id}>
                  <p className="flex justify-between gap-2 text-sm font-semibold">
                    {a.title}
                    <span className="flex-none text-xs font-normal text-[var(--dash-faint)]">{a.date}</span>
                  </p>
                  <p className="text-sm text-[var(--dash-muted)]">{a.body}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
