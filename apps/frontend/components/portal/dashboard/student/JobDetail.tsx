"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Briefcase, Building2, CalendarDays, Check, Clock, DollarSign, MapPin, MessageSquare, Users } from "lucide-react";
import type { Job } from "@/content/student-demo";
import { applicationsOf, useSession } from "../session";
import { Avatar, Chip, useToast } from "../ui";
import { useApply } from "./ApplyDialog";
import { JobChips } from "./JobCard";

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="dash-card dash-card-pad">
      <h2 className="dash-section-title">{title}</h2>
      <div className="mt-3 text-sm leading-relaxed text-[#3b4458]">{children}</div>
    </section>
  );
}

function Bullets({ items, tick = false }: { items: string[]; tick?: boolean }) {
  return (
    <ul className="space-y-2">
      {items.map((t) => (
        <li key={t} className="flex gap-2.5">
          {tick ? (
            <Check className="mt-0.5 size-4 flex-none text-[var(--dash-orange)]" aria-hidden="true" />
          ) : (
            <span className="mt-2 size-1.5 flex-none rounded-full bg-[var(--dash-orange)]" aria-hidden="true" />
          )}
          {t}
        </li>
      ))}
    </ul>
  );
}

/**
 * One job's full JD: the role, what you'd do, what you need, how the
 * interviews go, the company, and the key facts (pay, term, start,
 * recruiter). Apply sits at the bottom right and stays in view.
 */
export function JobDetail({ job }: { job: Job }) {
  const session = useSession();
  const [toast, showToast] = useToast({ raised: true });
  const apply = useApply(showToast);
  if (!session) return null;
  const stage = applicationsOf(session)[job.id];

  const facts = [
    { icon: DollarSign, label: "Pay", value: job.pay },
    { icon: Clock, label: "Type", value: job.term },
    { icon: MapPin, label: "Work style", value: `${job.workMode} · ${job.location}` },
    { icon: CalendarDays, label: "Start", value: job.start },
    { icon: Users, label: "Openings", value: String(job.openings) },
  ];

  return (
    <div className="space-y-6">
      <Link href="/portal/jobs" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--dash-muted)] hover:text-[var(--dash-ink)]">
        <ArrowLeft className="size-4" aria-hidden="true" /> All jobs
      </Link>

      <header className="dash-hero p-4 sm:p-6">
        <JobChips job={job} />
        <h1 className="dash-title mt-3">{job.title}</h1>
        <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--dash-muted)]">
          <span className="flex items-center gap-1.5 font-semibold text-[var(--dash-cyan-ink)]">
            <Building2 className="size-4" aria-hidden="true" /> {job.company}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin className="size-4" aria-hidden="true" /> {job.location}
          </span>
          <span className="flex items-center gap-1.5">
            <Briefcase className="size-4" aria-hidden="true" /> Posted {job.posted}
          </span>
        </p>
        <p className="mt-4 max-w-3xl text-[0.9375rem] leading-relaxed">{job.brief}</p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-4">
          <Block title="About the role">
            <p>{job.about}</p>
          </Block>
          <Block title="What you'll do">
            <Bullets items={job.duties} />
          </Block>
          <Block title="What you need">
            <Bullets items={job.mustHave} tick />
            {job.niceToHave.length > 0 && (
              <>
                <p className="mt-4 mb-2 text-xs font-semibold tracking-[0.12em] text-[var(--dash-faint)] uppercase">Nice to have</p>
                <Bullets items={job.niceToHave} />
              </>
            )}
          </Block>
          <Block title="Skills">
            <p className="flex flex-wrap gap-1.5">
              {job.skills.map((s) => (
                <span key={s} className="dash-chip">
                  {s}
                </span>
              ))}
            </p>
          </Block>
          <Block title="Interview process">
            <ol className="space-y-2.5">
              {job.interviewSteps.map((s, i) => (
                <li key={s} className="flex items-center gap-3">
                  <span className="grid size-6 flex-none place-items-center rounded-full bg-[var(--dash-ink)] text-xs font-bold text-white">{i + 1}</span>
                  {s}
                </li>
              ))}
            </ol>
          </Block>
          <Block title={`About ${job.company}`}>
            <p>{job.companyAbout}</p>
          </Block>
        </div>

        <aside className="min-w-0 space-y-4 lg:sticky lg:top-24 lg:self-start">
          <section className="dash-card dash-card-pad" aria-labelledby="facts-heading">
            <h2 id="facts-heading" className="dash-section-title">
              Key facts
            </h2>
            <dl className="mt-3 divide-y divide-[var(--dash-line)]">
              {facts.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3 py-2.5">
                  <Icon className="mt-0.5 size-4 flex-none text-[var(--dash-muted)]" aria-hidden="true" />
                  <dt className="w-20 flex-none text-xs text-[var(--dash-muted)]">{label}</dt>
                  <dd className="min-w-0 text-sm font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
          </section>
          <section className="dash-card dash-card-pad" aria-label="Recruiter">
            <p className="text-xs text-[var(--dash-muted)]">Your recruiter for this role</p>
            <div className="mt-2 flex items-center gap-3">
              <Avatar name={job.recruiter} size={40} />
              <p className="flex-1 text-sm font-semibold">{job.recruiter}</p>
              <Link href="/portal/messages" className="dash-btn-ghost h-9 px-3 text-xs">
                <MessageSquare className="size-3.5" aria-hidden="true" /> Ask {job.recruiter}
              </Link>
            </div>
          </section>
        </aside>
      </div>

      {/* Apply: bottom right, always in view. */}
      <div className="sticky bottom-4 z-20">
        <div className="dash-card flex flex-wrap items-center justify-between gap-3 px-4 py-3 shadow-[0_16px_40px_-18px_rgb(4_19_39/0.45)] sm:px-5">
          <p className="min-w-0 text-sm">
            <span className="block truncate font-semibold">{job.title}</span>
            <span className="block truncate text-xs text-[var(--dash-muted)]">
              {job.company} · {job.pay}
            </span>
          </p>
          {stage ? (
            <span className="ml-auto flex items-center gap-2">
              <Chip>{stage}</Chip>
              <Link href="/portal/jobs?tab=mine" className="dash-btn-ghost">
                View application
              </Link>
            </span>
          ) : (
            <button type="button" className="dash-btn ml-auto" data-tone="orange" onClick={() => apply.open(job)}>
              Apply now
            </button>
          )}
        </div>
      </div>
      {apply.dialog}
      {toast}
    </div>
  );
}
