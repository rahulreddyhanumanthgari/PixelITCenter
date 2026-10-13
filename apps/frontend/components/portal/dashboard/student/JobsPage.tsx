"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { appStages, jobs } from "@/content/student-demo";
import { applicationsOf, useSession, withdrawApplication } from "../session";
import { Chip, PageHeader, useToast } from "../ui";
import { useApply } from "./ApplyDialog";
import { JobCard } from "./JobCard";
import { JobFilters, matches, noFilters, type Filters } from "./JobFilters";
import { OnboardingChecklist } from "./OnboardingChecklist";


/**
 * Jobs for students: open roles to apply to, and "My applications", the
 * tracker (Applied → Shortlisted → Interview → Offer). A small firm means a
 * few well-matched applications, so it's a list, not analytics.
 */
export function JobsPage() {
  const session = useSession();
  const params = useSearchParams();
  const [tab, setTab] = useState<"open" | "mine">(params.get("tab") === "mine" ? "mine" : "open");
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Filters>(noFilters);
  const [toast, showToast] = useToast();
  const apply = useApply(showToast);
  if (!session) return null;

  const apps = applicationsOf(session);
  const mine = jobs.filter((j) => apps[j.id]);
  const offer = mine.find((j) => apps[j.id] === "Offer");
  const q = query.trim().toLowerCase();
  const open = jobs.filter(
    (j) =>
      matches(filters, j) &&
      (!q || [j.title, j.company, ...j.skills].some((t) => t.toLowerCase().includes(q))),
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Jobs" body="Roles our recruiters picked for your skills. Apply in one step." />

      <div className="dash-tabs" role="tablist" aria-label="Jobs">
        <button type="button" role="tab" aria-selected={tab === "open"} className="dash-tab" onClick={() => setTab("open")}>
          Open jobs <span className="ml-1 text-[var(--dash-faint)]">{jobs.length}</span>
        </button>
        <button type="button" role="tab" aria-selected={tab === "mine"} className="dash-tab" onClick={() => setTab("mine")}>
          My applications <span className="ml-1 text-[var(--dash-faint)]">{mine.length}</span>
        </button>
      </div>

      {tab === "open" ? (
        <>
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

          <ul className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {open.map((j) => (
              <JobCard key={j.id} job={j} stage={apps[j.id]} onApply={() => apply.open(j)} />
            ))}
            {!open.length && <li className="py-10 text-center text-sm text-[var(--dash-muted)] md:col-span-2">No jobs match. Try another skill or clear the filters.</li>}
          </ul>
        </>
      ) : (
        <div className="space-y-6">
          {offer && <OnboardingChecklist company={offer.company} />}
          <ul className="space-y-3">
            {mine.map((j) => {
              const stage = apps[j.id];
              const at = appStages.indexOf(stage);
              return (
                <li key={j.id} className="dash-card dash-card-pad">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-[0.9375rem] font-semibold">
                        <Link href={`/portal/jobs/${j.id}`} className="hover:underline">
                          {j.title}
                        </Link>
                      </h2>
                      <p className="text-sm text-[var(--dash-muted)]">
                        {j.company} · {j.employment} · {j.workMode}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Chip>{stage}</Chip>
                      {stage === "Applied" && (
                        <button
                          type="button"
                          className="grid size-8 place-items-center rounded-full text-[var(--dash-faint)] hover:bg-[var(--dash-hover)] hover:text-[var(--dash-red-ink)]"
                          aria-label={`Withdraw application to ${j.company}`}
                          onClick={() => {
                            withdrawApplication(j.id);
                            showToast(`Withdrew your application to ${j.company}.`);
                          }}
                        >
                          <X className="size-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  {/* Stage stepper */}
                  <ol className="mt-4 grid grid-cols-4 gap-1.5" aria-label={`Stage: ${stage}`}>
                    {appStages.map((s, i) => (
                      <li key={s} aria-current={i === at ? "step" : undefined}>
                        <span
                          className="block h-1.5 rounded-full"
                          style={{ background: i <= at ? (stage === "Offer" ? "var(--dash-cyan)" : "var(--dash-orange)") : "rgb(4 19 39 / 0.08)" }}
                        />
                        <span className={`mt-1.5 block text-[0.6875rem] sm:text-xs ${i === at ? "font-semibold" : "text-[var(--dash-faint)]"}`}>{s}</span>
                      </li>
                    ))}
                  </ol>
                </li>
              );
            })}
            {!mine.length && <li className="py-10 text-center text-sm text-[var(--dash-muted)]">No applications yet. Find a role under Open jobs.</li>}
          </ul>
        </div>
      )}

      {apply.dialog}
      {toast}
    </div>
  );
}
