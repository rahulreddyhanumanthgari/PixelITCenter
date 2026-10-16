"use client";

import { useState } from "react";
import { ChevronDown, Info, Search } from "lucide-react";
import { jobs, submissionStatuses } from "@/content/student-demo";
import { jobStatusesOf, useSession } from "../session";
import { PageHeader } from "../ui";
import { JobCard, SubmissionBadge } from "./JobCard";
import { JobFilters, matches, noFilters, type Filters } from "./JobFilters";

/**
 * Jobs for students, read only. Admins post the jobs on the employee/admin
 * side; PixelIT's recruiters submit the student's resume to the ones that
 * match. Each card says how far that has got.
 */
export function JobsPage() {
  const session = useSession();
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Filters>(noFilters);
  if (!session) return null;

  const statuses = jobStatusesOf(session);
  const q = query.trim().toLowerCase();
  const shown = jobs.filter(
    (j) => matches(filters, j) && (!q || [j.title, j.company, j.location, ...j.skills].some((t) => t.toLowerCase().includes(q))),
  );
  const submitted = jobs.filter((j) => statuses[j.id] && statuses[j.id] !== "Not Submitted").length;

  return (
    <div className="space-y-6">
      <PageHeader title="Jobs" body={`Openings that match your skills. Your resume has gone to ${submitted} of them.`} />

      <div className="flex items-start gap-3 rounded-2xl border border-[rgb(12_177_223/0.35)] bg-[var(--dash-cyan-tint)] p-4 text-sm">
        <Info className="mt-0.5 size-4 flex-none text-[var(--dash-cyan-ink)]" aria-hidden="true" />
        <div className="min-w-0">
          <p className="font-semibold">PixelIT&apos;s recruiters submit your resume to matching openings. Check here for progress.</p>
          <details className="group mt-1">
            <summary className="inline-flex cursor-pointer list-none items-center gap-1 text-xs font-semibold text-[var(--dash-cyan-ink)] [&::-webkit-details-marker]:hidden">
              What do the statuses mean?
              <ChevronDown className="size-3.5 transition group-open:rotate-180" aria-hidden="true" />
            </summary>
            <ul className="mt-2 space-y-1.5">
              {submissionStatuses.map((s) => (
                <li key={s.status} className="flex flex-wrap items-center gap-2 text-xs text-[var(--dash-muted)]">
                  <SubmissionBadge status={s.status} /> {s.help}
                </li>
              ))}
            </ul>
          </details>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="dash-search max-w-none sm:max-w-sm">
          <label htmlFor="job-search" className="sr-only">
            Search jobs
          </label>
          <input id="job-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search role, company or skill…" />
          <Search className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-[var(--dash-muted)]" aria-hidden="true" />
        </div>
        <JobFilters value={filters} onChange={setFilters} />
      </div>

      {shown.length ? (
        <ul className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {shown.map((j) => (
            <JobCard key={j.id} job={j} status={statuses[j.id] ?? "Not Submitted"} />
          ))}
        </ul>
      ) : (
        <div className="dash-card dash-card-pad py-10 text-center">
          <p className="text-sm font-semibold">{jobs.length ? "No jobs match" : "No openings yet"}</p>
          <p className="mt-1 text-sm text-[var(--dash-muted)]">
            {jobs.length ? "Try another skill or clear the filters." : "Your recruiter adds openings as they come in. Check back soon."}
          </p>
        </div>
      )}
    </div>
  );
}
