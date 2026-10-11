"use client";

import { useRef, useState } from "react";
import { CalendarDays, Check, Download, FileText, MessageSquareText, Star, Target, Upload } from "lucide-react";
import { resumeChecklist, resumeFeedback, resumes as starter } from "@/content/student-demo";
import { defaultResumeOf, setDefaultResume, useSession } from "../session";
import { Avatar, PageHeader, useToast } from "../ui";

type Resume = (typeof starter)[number];

// What each status means, in words a student understands at a glance.
const STATUS: Record<Resume["status"], { label: string; note: string; tone: "good" | "warn" | undefined }> = {
  Reviewed: { label: "Reviewed", note: "Ready to send to employers", tone: "good" },
  "Needs changes": { label: "Needs changes", note: "See the feedback below", tone: "warn" },
  Draft: { label: "Draft", note: "Not reviewed yet", tone: undefined },
};

/** "Manas, Cloud Engineer v3.pdf" → "Cloud Engineer v3" */
const shortName = (name: string) => name.replace(/^Manas,\s*/, "").replace(/\.\w+$/, "");

function StatusLine({ status }: { status: Resume["status"] }) {
  const s = STATUS[status];
  return (
    <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
      <span className="dash-chip" data-tone={s.tone}>
        {s.label}
      </span>
      <span className="text-[var(--dash-muted)]">{s.note}</span>
    </span>
  );
}

/**
 * Resume corner: one card per resume (what it's for, when it was updated,
 * its status in words, how many recruiter notes it has, default or not),
 * the recruiter feedback with the resume each note is about, and a
 * checklist. Uploads stay in the page (demo).
 */
export function ResumePage() {
  const session = useSession();
  const [list, setList] = useState<Resume[]>(starter);
  const [checks, setChecks] = useState(resumeChecklist);
  const [filter, setFilter] = useState<string>("all");
  const file = useRef<HTMLInputElement>(null);
  const feedbackRef = useRef<HTMLElement>(null);
  const [toast, showToast] = useToast();
  if (!session) return null;

  const main = defaultResumeOf(session);
  const ready = checks.filter((c) => c.done).length;
  const notesFor = (id: string) => resumeFeedback.filter((f) => f.resumeId === id);
  const shownNotes = filter === "all" ? resumeFeedback : notesFor(filter);
  const nameOf = (id: string) => list.find((r) => r.id === id)?.name ?? "";

  const showNotes = (id: string) => {
    setFilter(id);
    feedbackRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Resume corner" body="Keep a resume for each kind of role. Your recruiter reviews each one before it goes to an employer.">
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

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-8">
          {/* Resumes */}
          <section aria-labelledby="versions-heading">
            <h2 id="versions-heading" className="dash-section-title">
              Your resumes <span className="dash-count">{list.length}</span>
            </h2>
            <ul className="mt-3 space-y-3">
              {list.map((r) => {
                const isMain = r.id === main;
                const notes = notesFor(r.id).length;
                return (
                  <li
                    key={r.id}
                    className={`dash-card overflow-hidden ${isMain ? "border-[var(--dash-orange)] shadow-[0_0_0_3px_rgb(252_101_13/0.1)]" : ""}`}
                  >
                    {isMain && (
                      <p className="flex items-center gap-1.5 bg-[var(--dash-orange-tint)] px-4 py-1.5 text-xs font-semibold text-[var(--dash-orange-ink)] sm:px-5">
                        <Star className="size-3.5 fill-current" aria-hidden="true" /> Default: this is the resume sent when you apply
                      </p>
                    )}
                    <div className="flex gap-4 p-4 sm:p-5">
                      <span className="grid size-12 flex-none place-items-center rounded-2xl bg-[var(--dash-cyan-tint)] text-[var(--dash-cyan-ink)]">
                        <FileText className="size-6" aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-semibold break-words">{r.name}</h3>
                        <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--dash-muted)]">
                          <span className="flex items-center gap-1.5">
                            <Target className="size-3.5" aria-hidden="true" /> For {r.target}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <CalendarDays className="size-3.5" aria-hidden="true" /> Updated {r.updated}
                          </span>
                        </p>
                        <div className="mt-3">
                          <StatusLine status={r.status} />
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--dash-line)] px-4 py-3 sm:px-5">
                      {notes ? (
                        <button
                          type="button"
                          onClick={() => showNotes(r.id)}
                          className="flex items-center gap-1.5 text-sm font-semibold text-[var(--dash-orange-ink)] hover:underline"
                        >
                          <MessageSquareText className="size-4" aria-hidden="true" /> {notes} feedback {notes === 1 ? "note" : "notes"}
                        </button>
                      ) : (
                        <span className="flex items-center gap-1.5 text-sm text-[var(--dash-faint)]">
                          <MessageSquareText className="size-4" aria-hidden="true" /> No feedback yet
                        </span>
                      )}
                      <span className="flex items-center gap-2">
                        {!isMain && (
                          <button type="button" className="dash-btn-ghost h-9 px-3 text-xs" onClick={() => setDefaultResume(r.id)}>
                            <Star className="size-3.5" aria-hidden="true" /> Make default
                          </button>
                        )}
                        <button
                          type="button"
                          className="dash-btn-ghost h-9 px-3 text-xs"
                          onClick={() => showToast("Demo: downloads open when the portal is live.")}
                        >
                          <Download className="size-3.5" aria-hidden="true" /> Download
                        </button>
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Recruiter feedback, each note with the resume it's about */}
          <section aria-labelledby="feedback-heading" ref={feedbackRef} className="scroll-mt-24">
            <h2 id="feedback-heading" className="dash-section-title">
              Recruiter feedback <span className="dash-count">{resumeFeedback.length}</span>
            </h2>
            <div className="dash-scroll-row -mx-4 mt-3 overflow-x-auto px-4 sm:mx-0 sm:px-0">
              <div className="dash-tabs" role="group" aria-label="Show feedback for">
                <button type="button" className="dash-tab" aria-pressed={filter === "all"} onClick={() => setFilter("all")}>
                  All <span className="ml-1 text-[var(--dash-faint)]">{resumeFeedback.length}</span>
                </button>
                {list
                  .filter((r) => notesFor(r.id).length)
                  .map((r) => (
                    <button key={r.id} type="button" className="dash-tab" aria-pressed={filter === r.id} onClick={() => setFilter(r.id)}>
                      {shortName(r.name)} <span className="ml-1 text-[var(--dash-faint)]">{notesFor(r.id).length}</span>
                    </button>
                  ))}
              </div>
            </div>
            <ul className="mt-3 space-y-3">
              {shownNotes.map((f) => {
                const about = list.find((r) => r.id === f.resumeId);
                return (
                  <li key={f.id} className="dash-card dash-card-pad">
                    <div className="flex items-start gap-3">
                      <Avatar name={f.from} size={40} />
                      <div className="min-w-0 flex-1">
                        <p className="flex flex-wrap items-baseline justify-between gap-x-3">
                          <span className="text-sm font-semibold">
                            {f.from} <span className="font-normal text-[var(--dash-muted)]">· {f.role}</span>
                          </span>
                          <span className="text-xs text-[var(--dash-faint)]">{f.date}</span>
                        </p>
                        <button
                          type="button"
                          onClick={() => setFilter(f.resumeId)}
                          className="mt-2 inline-flex max-w-full items-center gap-1.5 rounded-lg border border-[var(--dash-line-strong)] bg-[var(--dash-side)] px-2.5 py-1 text-xs hover:bg-white"
                          aria-label={`About ${nameOf(f.resumeId)}. Show only its feedback`}
                        >
                          <FileText className="size-3.5 flex-none text-[var(--dash-cyan-ink)]" aria-hidden="true" />
                          <span className="text-[var(--dash-muted)]">About</span>
                          <span className="truncate font-semibold">{shortName(nameOf(f.resumeId))}</span>
                          {about && (
                            <span className="dash-chip h-5 px-1.5 text-[0.625rem]" data-tone={STATUS[about.status].tone}>
                              {about.status}
                            </span>
                          )}
                        </button>
                        <p className="mt-2.5 text-sm leading-relaxed text-[#3b4458]">{f.text}</p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        {/* Checklist */}
        <section aria-labelledby="check-heading" className="dash-card dash-card-pad self-start xl:sticky xl:top-24">
          <div className="flex items-center justify-between">
            <h2 id="check-heading" className="dash-section-title">
              Resume checklist
            </h2>
            <span className="text-xs font-semibold">
              {ready}/{checks.length} done
            </span>
          </div>
          <p className="mt-1 text-xs text-[var(--dash-muted)]">Tick each one off before you upload.</p>
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
