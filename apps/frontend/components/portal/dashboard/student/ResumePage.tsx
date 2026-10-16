"use client";

import { useRef, useState } from "react";
import { Check, Download, FileText, History, Info, MessageSquareText, Upload } from "lucide-react";
import { resumeChecklist, resumeFeedback, type ResumeStatus } from "@/content/student-demo";
import { addResumeVersion, resumeOf, useSession } from "../session";
import { Avatar, PageHeader, useToast } from "../ui";

// What each status means, in words a student understands at a glance.
const STATUS: Record<ResumeStatus, { note: string; tone: "good" | "warn" | undefined }> = {
  "Pending Review": { note: "Your recruiter will review it soon. You'll get a notification.", tone: undefined },
  "Needs Changes": { note: "Read the feedback below, then upload a new version.", tone: "warn" },
  Approved: { note: "Ready. Your recruiter sends this version to clients.", tone: "good" },
};

const MAX_MB = 5;
const ACCEPT = ".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const MIME_OK = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", ""];

function sizeLabel(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** PDF or Word (.docx) only, up to 5 MB. The server checks the contents again. */
function checkResume(file: File) {
  if (!/\.(pdf|docx)$/i.test(file.name) || !MIME_OK.includes(file.type)) return "Upload a PDF or a Word file (.docx).";
  if (file.size > MAX_MB * 1024 * 1024) return `This file is over ${MAX_MB} MB. Save it as a smaller PDF and try again.`;
  if (file.size === 0) return "This file is empty.";
  return null;
}

/**
 * Resume corner: one resume and its versions. The student uploads new
 * versions; the recruiter reviews the latest and leaves feedback, which the
 * student can only read. A new upload resets the status to Pending Review.
 *
 * TODO(backend): uploads stay in this browser (demo). The API stores the
 * file (POST /api/student/resume/versions) and recruiters set the status and
 * write feedback from the admin side.
 */
export function ResumePage() {
  const session = useSession();
  const [checks, setChecks] = useState(resumeChecklist);
  const [problem, setProblem] = useState<string | null>(null);
  const file = useRef<HTMLInputElement>(null);
  const [toast, showToast] = useToast();
  if (!session) return null;

  const { versions, status } = resumeOf(session);
  const current = versions[0];
  const ready = checks.filter((c) => c.done).length;
  const versionNo = (id: string) => versions.find((v) => v.id === id)?.version;

  return (
    <div className="space-y-6">
      <PageHeader title="Resume corner" body="Keep your latest resume here. Your recruiter reviews each new version before sending it to clients.">
        <button type="button" className="dash-btn" onClick={() => file.current?.click()}>
          <Upload className="size-4" aria-hidden="true" /> {current ? "Upload new version" : "Upload resume"}
        </button>
        <input
          ref={file}
          type="file"
          accept={ACCEPT}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f) return;
            const bad = checkResume(f);
            setProblem(bad);
            if (bad) return;
            addResumeVersion({ id: `v${Date.now()}`, fileName: f.name, size: sizeLabel(f.size), uploaded: "Just now" });
            showToast("New version uploaded. Status is back to Pending Review.");
          }}
        />
      </PageHeader>

      {problem && (
        <p className="portal-error" role="alert">
          {problem}
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-8">
          {/* Current version and its status */}
          {current ? (
            <section aria-labelledby="current-heading" className="dash-card overflow-hidden">
              <div className="flex gap-4 p-4 sm:p-5">
                <span className="grid size-12 flex-none place-items-center rounded-2xl bg-[var(--dash-cyan-tint)] text-[var(--dash-cyan-ink)]">
                  <FileText className="size-6" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold tracking-[0.12em] text-[var(--dash-faint)] uppercase">Current · version {current.version}</p>
                  <h2 id="current-heading" className="mt-0.5 text-base font-semibold break-words">
                    {current.fileName}
                  </h2>
                  <p className="mt-0.5 text-sm text-[var(--dash-muted)]">
                    Uploaded {current.uploaded} · {current.size}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-[var(--dash-line)] px-4 py-3 text-sm sm:px-5">
                <span className="dash-chip" data-tone={STATUS[status].tone}>
                  {status}
                </span>
                <span className="text-[var(--dash-muted)]">{STATUS[status].note}</span>
              </div>
            </section>
          ) : (
            <div className="dash-card dash-card-pad py-10 text-center">
              <p className="text-sm font-semibold">No resume yet</p>
              <p className="mt-1 text-sm text-[var(--dash-muted)]">Upload a PDF or Word file. Your recruiter can&apos;t market your profile without it.</p>
            </div>
          )}

          {/* Recruiter feedback: read only */}
          <section aria-labelledby="feedback-heading">
            <h2 id="feedback-heading" className="dash-section-title">
              Recruiter feedback <span className="dash-count">{resumeFeedback.length}</span>
            </h2>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-[var(--dash-muted)]">
              <Info className="size-3.5" aria-hidden="true" /> Notes from your recruiter. To reply, use Messages.
            </p>
            {resumeFeedback.length ? (
              <ul className="mt-3 space-y-3">
                {resumeFeedback.map((f) => (
                  <li key={f.id} className="dash-card dash-card-pad">
                    <div className="flex items-start gap-3">
                      <Avatar name={f.author} size={40} />
                      <div className="min-w-0 flex-1">
                        <p className="flex flex-wrap items-baseline justify-between gap-x-3">
                          <span className="text-sm font-semibold">
                            {f.author} <span className="font-normal text-[var(--dash-muted)]">· {f.role}</span>
                          </span>
                          <span className="text-xs text-[var(--dash-faint)]">{f.date}</span>
                        </p>
                        {versionNo(f.versionId) && (
                          <p className="mt-1 text-xs text-[var(--dash-muted)]">
                            About version {versionNo(f.versionId)}
                            {f.versionId !== current?.id && " (an older version)"}
                          </p>
                        )}
                        <p className="mt-2 text-sm leading-relaxed text-[#3b4458]">{f.text}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="dash-card dash-card-pad mt-3 text-sm text-[var(--dash-muted)]">
                <MessageSquareText className="mr-1.5 inline size-4" aria-hidden="true" />
                No feedback yet. You&apos;ll get a notification when your recruiter leaves a note.
              </p>
            )}
          </section>

          {/* Version history */}
          {versions.length > 0 && (
            <section aria-labelledby="history-heading">
              <h2 id="history-heading" className="flex items-center gap-2 dash-section-title">
                <History className="size-4" aria-hidden="true" /> Version history <span className="dash-count">{versions.length}</span>
              </h2>
              <ul className="dash-card mt-3 divide-y divide-[var(--dash-line)] px-4 sm:px-5">
                {versions.map((v, i) => (
                  <li key={v.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-3">
                    <span className="w-8 flex-none text-sm font-semibold text-[var(--dash-muted)]">v{v.version}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{v.fileName}</span>
                      <span className="block text-xs text-[var(--dash-muted)]">
                        {v.uploaded} · {v.size}
                      </span>
                    </span>
                    {i === 0 && <span className="dash-chip" data-tone="ink">Current</span>}
                    <button
                      type="button"
                      className="dash-icon-btn size-8"
                      aria-label={`Download version ${v.version}`}
                      title="Download"
                      onClick={() => showToast("Demo: downloads open when the portal is live.")}
                    >
                      <Download className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* Checklist */}
        <section aria-labelledby="check-heading" className="dash-card dash-card-pad self-start xl:sticky xl:top-24">
          <div className="flex items-center justify-between">
            <h2 id="check-heading" className="dash-section-title">
              Before you upload
            </h2>
            <span className="text-xs font-semibold">
              {ready}/{checks.length} done
            </span>
          </div>
          <p className="mt-1 text-xs text-[var(--dash-muted)]">A quick self-check. Only you see this.</p>
          <div className="dash-bar mt-3" data-tone={ready === checks.length ? "good" : undefined}>
            <span style={{ width: `${(ready / checks.length) * 100}%` }} />
          </div>
          <ul className="mt-3">
            {checks.map((c) => (
              <li key={c.id} className="flex items-center gap-3 py-2">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={c.done}
                  aria-label={c.text}
                  className="dash-check"
                  onClick={() => setChecks((l) => l.map((x) => (x.id === c.id ? { ...x, done: !x.done } : x)))}
                >
                  {c.done && <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />}
                </button>
                <span className={`text-sm ${c.done ? "text-[var(--dash-muted)]" : "font-medium"}`}>{c.text}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
      {toast}
    </div>
  );
}
