"use client";

import { useRef, useState } from "react";
import { resumes, type Job } from "@/content/student-demo";
import { applyToJob, defaultResumeOf, useSession } from "../session";
import { Chip } from "../ui";

/**
 * The Apply popup (pick which resume to send), shared by the job cards and
 * the job page. `const apply = useApply(showToast)`, then `apply.open(job)`
 * and render `apply.dialog` once. Front end only: applying is saved in the
 * demo session, nothing is sent.
 */
export function useApply(showToast: (text: string) => void) {
  const session = useSession();
  const ref = useRef<HTMLDialogElement>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [resumeId, setResumeId] = useState("");

  const open = (j: Job) => {
    setJob(j);
    setResumeId(session ? defaultResumeOf(session) : resumes[0].id);
    ref.current?.showModal();
  };

  const dialog = (
    <dialog
      ref={ref}
      className="dash-card m-auto w-[min(28rem,calc(100vw-2rem))] p-0 backdrop:bg-[rgb(4_19_39/0.4)]"
      onClose={() => setJob(null)}
      aria-labelledby="apply-heading"
    >
      {job && (
        <form
          method="dialog"
          className="p-5 sm:p-6"
          onSubmit={() => {
            applyToJob(job.id, resumeId);
            showToast(`Applied to ${job.company}. ${job.recruiter} has been told.`);
          }}
        >
          <h2 id="apply-heading" className="text-lg font-semibold">
            Apply to {job.company}
          </h2>
          <p className="mt-1 text-sm text-[var(--dash-muted)]">
            {job.title} · {job.employment} · {job.workMode}
          </p>
          <fieldset className="mt-5 space-y-2">
            <legend className="dash-label">Which resume?</legend>
            {resumes.map((r) => (
              <label
                key={r.id}
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-[var(--dash-line-strong)] p-3 has-[:checked]:border-[var(--dash-orange)] has-[:checked]:bg-[var(--dash-orange-tint)]"
              >
                <input
                  type="radio"
                  name="resume"
                  value={r.id}
                  checked={resumeId === r.id}
                  onChange={() => setResumeId(r.id)}
                  className="accent-[var(--dash-orange)]"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{r.name}</span>
                  <span className="block text-xs text-[var(--dash-muted)]">{r.target}</span>
                </span>
                <Chip>{r.status}</Chip>
              </label>
            ))}
          </fieldset>
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" className="dash-btn-ghost" onClick={() => ref.current?.close()}>
              Cancel
            </button>
            <button type="submit" className="dash-btn" data-tone="orange">
              Send application
            </button>
          </div>
        </form>
      )}
    </dialog>
  );

  return { open, dialog };
}
