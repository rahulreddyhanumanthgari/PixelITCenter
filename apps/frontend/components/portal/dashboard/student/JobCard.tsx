"use client";

import Link from "next/link";
import { Building2, MapPin } from "lucide-react";
import { submissionStatuses, type Job, type SubmissionStatus } from "@/content/student-demo";
import { Chip } from "../ui";

/** Job type and work style chips: "Permanent" "Hybrid". */
export function JobChips({ job }: { job: Job }) {
  return (
    <span className="flex flex-wrap gap-1.5">
      <Chip tone="ink">{job.employment}</Chip>
      <span className="dash-chip border border-[var(--dash-line-strong)] bg-white">{job.workMode}</span>
    </span>
  );
}

const TONE: Record<SubmissionStatus, "good" | "warn" | "bad" | "ink" | undefined> = {
  "Not Submitted": undefined,
  "Resume Submitted": "ink",
  "Under Review": "warn",
  "Interview Scheduled": "warn",
  Placed: "good",
  Rejected: "bad",
};

export const statusHelp = (s: SubmissionStatus) => submissionStatuses.find((x) => x.status === s)?.help ?? "";

/** Where PixelIT is with the student's resume for a job. Hover or long-press for what it means. */
export function SubmissionBadge({ status }: { status: SubmissionStatus }) {
  return (
    <span className="dash-chip cursor-help" data-tone={TONE[status]} title={statusHelp(status)}>
      {status}
    </span>
  );
}

/**
 * One job in the list: the role and its type, company and place, skills, a
 * short brief, and whether PixelIT has submitted the student's resume.
 * Students don't apply; the whole card opens the full JD (/portal/jobs/[id]).
 */
export function JobCard({ job, status }: { job: Job; status: SubmissionStatus }) {
  return (
    <li className="dash-card dash-card-pad relative flex flex-col transition hover:-translate-y-px hover:border-[var(--dash-line-strong)] hover:shadow-[0_14px_30px_-22px_rgb(4_19_39/0.45)] has-[.job-link:focus-visible]:outline-2 has-[.job-link:focus-visible]:outline-[var(--dash-orange)]">
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
        <h2 className="min-w-0 text-base font-semibold">
          {/* The link covers the whole card (after:inset-0). */}
          <Link href={`/portal/jobs/${job.id}`} className="job-link after:absolute after:inset-0 after:rounded-[1.25rem] focus-visible:outline-none">
            {job.title}
          </Link>
        </h2>
        <JobChips job={job} />
      </div>

      <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[var(--dash-muted)]">
        <span className="flex items-center gap-1.5 font-medium text-[var(--dash-cyan-ink)]">
          <Building2 className="size-3.5" aria-hidden="true" /> {job.company}
        </span>
        <span className="flex items-center gap-1.5">
          <MapPin className="size-3.5" aria-hidden="true" /> {job.location}
        </span>
      </p>

      <p className="mt-3 flex flex-wrap gap-1.5" aria-label="Skills">
        {job.skills.map((s) => (
          <span key={s} className="dash-chip">
            {s}
          </span>
        ))}
      </p>

      <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-[var(--dash-muted)]">{job.brief}</p>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pt-5">
        <span className="text-xs whitespace-nowrap text-[var(--dash-faint)]">
          {job.posted} · <span className="font-semibold text-[var(--dash-orange-ink)]">View details</span>
        </span>
        <span className="relative z-10 ml-auto">
          <SubmissionBadge status={status} />
        </span>
      </div>
    </li>
  );
}
