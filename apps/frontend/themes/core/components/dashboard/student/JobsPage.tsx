"use client";

import { useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, MapPin, Search, X } from "lucide-react";
import { appStages, jobs, resumes, type Job } from "@/content/student-demo";
import { applicationsOf, applyToJob, defaultResumeOf, useSession, withdrawApplication } from "../session";
import { Chip, PageHeader, useToast } from "../ui";
import { OnboardingChecklist } from "./OnboardingChecklist";

const TYPES = ["All", "Full-time", "Contract", "Contract to hire"] as const;

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
  const [type, setType] = useState<(typeof TYPES)[number]>("All");
  const [applying, setApplying] = useState<Job | null>(null);
  const [resumeId, setResumeId] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const [toast, showToast] = useToast();
  if (!session) return null;

  const apps = applicationsOf(session);
  const mine = jobs.filter((j) => apps[j.id]);
  const offer = mine.find((j) => apps[j.id] === "Offer");
  const q = query.trim().toLowerCase();
  const open = jobs.filter(
    (j) =>
      (type === "All" || j.type === type) &&
      (!q || [j.title, j.company, ...j.skills].some((t) => t.toLowerCase().includes(q))),
  );

  const startApply = (job: Job) => {
    setApplying(job);
    setResumeId(defaultResumeOf(session));
    dialog.current?.showModal();
  };

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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="dash-search max-w-none sm:max-w-sm">
              <label htmlFor="job-search" className="sr-only">
                Search jobs
              </label>
              <input id="job-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search role, company or skill…" />
              <Search className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-[var(--dash-muted)]" aria-hidden="true" />
            </div>
            <div className="dash-scroll-row -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
              <div className="dash-tabs" role="group" aria-label="Job type">
                {TYPES.map((t) => (
                  <button key={t} type="button" className="dash-tab" aria-pressed={type === t} onClick={() => setType(t)}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <ul className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {open.map((j) => {
              const stage = apps[j.id];
              return (
                <li key={j.id} className="dash-card dash-card-pad flex flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-base font-semibold">{j.title}</h2>
                      <p className="text-sm text-[var(--dash-cyan-ink)]">{j.company}</p>
                    </div>
                    <Chip tone="ink">{j.type}</Chip>
                  </div>
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-[var(--dash-muted)]">
                    <MapPin className="size-3.5" aria-hidden="true" /> {j.location} · {j.posted}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--dash-muted)]">{j.body}</p>
                  <p className="mt-3 flex flex-wrap gap-1.5">
                    {j.skills.map((s) => (
                      <span key={s} className="dash-chip">
                        {s}
                      </span>
                    ))}
                  </p>
                  <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                    {stage ? (
                      <>
                        <span className="flex items-center gap-1.5 text-sm font-semibold text-[var(--dash-cyan-ink)]">
                          <Check className="size-4" aria-hidden="true" /> Applied
                        </span>
                        <Chip>{stage}</Chip>
                      </>
                    ) : (
                      <button type="button" className="dash-btn" data-tone="orange" onClick={() => startApply(j)}>
                        Apply
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
            {!open.length && <li className="py-10 text-center text-sm text-[var(--dash-muted)] md:col-span-2">No jobs match. Try another skill.</li>}
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
                      <h2 className="text-[0.9375rem] font-semibold">{j.title}</h2>
                      <p className="text-sm text-[var(--dash-muted)]">
                        {j.company} · {j.type}
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

      {/* Apply: pick which resume to send. */}
      <dialog
        ref={dialog}
        className="dash-card m-auto w-[min(28rem,calc(100vw-2rem))] p-0 backdrop:bg-[rgb(4_19_39/0.4)]"
        onClose={() => setApplying(null)}
        aria-labelledby="apply-heading"
      >
        {applying && (
          <form
            method="dialog"
            className="p-5 sm:p-6"
            onSubmit={() => {
              applyToJob(applying.id, resumeId);
              showToast(`Applied to ${applying.company}. Your recruiter has been told.`);
            }}
          >
            <h2 id="apply-heading" className="text-lg font-semibold">
              Apply to {applying.company}
            </h2>
            <p className="mt-1 text-sm text-[var(--dash-muted)]">{applying.title}</p>
            <fieldset className="mt-5 space-y-2">
              <legend className="dash-label">Which resume?</legend>
              {resumes.map((r) => (
                <label
                  key={r.id}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-[var(--dash-line-strong)] p-3 has-[:checked]:border-[var(--dash-orange)] has-[:checked]:bg-[var(--dash-orange-tint)]"
                >
                  <input type="radio" name="resume" value={r.id} checked={resumeId === r.id} onChange={() => setResumeId(r.id)} className="accent-[var(--dash-orange)]" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{r.name}</span>
                    <span className="block text-xs text-[var(--dash-muted)]">{r.target}</span>
                  </span>
                  <Chip>{r.status}</Chip>
                </label>
              ))}
            </fieldset>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" className="dash-btn-ghost" onClick={() => dialog.current?.close()}>
                Cancel
              </button>
              <button type="submit" className="dash-btn" data-tone="orange">
                Send application
              </button>
            </div>
          </form>
        )}
      </dialog>
      {toast}
    </div>
  );
}
