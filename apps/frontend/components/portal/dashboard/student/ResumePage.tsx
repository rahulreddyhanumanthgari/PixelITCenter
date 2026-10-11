"use client";

import { useRef, useState } from "react";
import { Check, Download, FileText, Star, Upload } from "lucide-react";
import { resumeChecklist, resumeFeedback, resumes as starter } from "@/content/student-demo";
import { defaultResumeOf, setDefaultResume, useSession } from "../session";
import { Avatar, Chip, PageHeader, useToast } from "../ui";

/**
 * Resume corner: versions for different roles, the one sent by default when
 * applying, recruiter feedback and a checklist. Uploads stay in the page (demo).
 */
export function ResumePage() {
  const session = useSession();
  const [list, setList] = useState(starter);
  const [checks, setChecks] = useState(resumeChecklist);
  const file = useRef<HTMLInputElement>(null);
  const [toast, showToast] = useToast();
  if (!session) return null;
  const main = defaultResumeOf(session);
  const ready = checks.filter((c) => c.done).length;

  return (
    <div className="space-y-6">
      <PageHeader title="Resume corner" body="Keep a resume for each kind of role. Recruiters review them before they go out.">
        <button type="button" className="dash-btn" onClick={() => file.current?.click()}>
          <Upload className="size-4" aria-hidden="true" /> Upload new version
        </button>
        <input
          ref={file}
          type="file"
          accept=".pdf,.doc,.docx"
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            setList((l) => [{ id: `cv${Date.now()}`, name: f.name, target: "Not set yet", updated: "Just now", status: "Draft" }, ...l]);
            showToast(`Uploaded “${f.name}”. Your recruiter will review it. (Demo)`);
            e.target.value = "";
          }}
        />
      </PageHeader>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <section aria-labelledby="versions-heading" className="min-w-0">
          <h2 id="versions-heading" className="dash-section-title">
            Your resumes <span className="dash-count">{list.length}</span>
          </h2>
          <ul className="mt-3 space-y-3">
            {list.map((r) => {
              const isMain = r.id === main;
              return (
                <li key={r.id} className={`dash-card dash-card-pad flex flex-wrap items-center gap-3 ${isMain ? "border-[var(--dash-orange)]" : ""}`}>
                  <span className="dash-stat-icon size-10 flex-none">
                    <FileText className="size-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{r.name}</span>
                    <span className="block text-xs text-[var(--dash-muted)]">
                      {r.target} · updated {r.updated}
                    </span>
                  </span>
                  <Chip>{r.status}</Chip>
                  <span className="flex items-center gap-1.5">
                    {isMain ? (
                      <span className="dash-chip" data-tone="warn">
                        <Star className="size-3" aria-hidden="true" /> Default
                      </span>
                    ) : (
                      <button type="button" className="dash-btn-ghost h-8 px-3 text-xs" onClick={() => setDefaultResume(r.id)}>
                        Make default
                      </button>
                    )}
                    <button
                      type="button"
                      className="dash-icon-btn size-8"
                      aria-label={`Download ${r.name}`}
                      onClick={() => showToast("Demo: downloads open when the portal is live.")}
                    >
                      <Download className="size-3.5" />
                    </button>
                  </span>
                </li>
              );
            })}
          </ul>

          <h2 className="dash-section-title mt-8">Recruiter feedback</h2>
          <ul className="mt-3 space-y-3">
            {resumeFeedback.map((f) => (
              <li key={f.date} className="dash-card dash-card-pad flex gap-3">
                <Avatar name={f.from} size={36} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold">
                    {f.from} <span className="font-normal text-[var(--dash-faint)]">· {f.date}</span>
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--dash-muted)]">{f.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="check-heading" className="dash-card dash-card-pad self-start">
          <div className="flex items-center justify-between">
            <h2 id="check-heading" className="dash-section-title">
              Resume checklist
            </h2>
            <span className="text-xs font-semibold">
              {ready}/{checks.length}
            </span>
          </div>
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
