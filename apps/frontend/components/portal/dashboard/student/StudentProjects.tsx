"use client";

import { ExternalLink, MessageSquareQuote, Trash2 } from "lucide-react";
import { practiceProjects } from "@/content/student-demo";
import { addedProjectsOf, removeProject, useSession } from "../session";
import { Chip, PageHeader, useToast } from "../ui";
import { GithubMark, useGithubImport } from "./GithubImport";

/**
 * Practice projects: the student's portfolio, each with recruiter
 * feedback. "Add from GitHub" adds a repo as a project (In review).
 */
export function StudentProjects() {
  const session = useSession();
  const [toast, showToast] = useToast();
  const gh = useGithubImport((name) => showToast(`Added “${name}”. Hari will look at it.`));
  if (!session) return null;
  const projects = [...addedProjectsOf(session), ...practiceProjects];

  return (
    <div className="space-y-6">
      <PageHeader title="Projects" body="Your practice projects. They're your best stories in an interview.">
        <button type="button" className="dash-btn" onClick={gh.open}>
          <GithubMark /> Add from GitHub
        </button>
      </PageHeader>

      <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {projects.map((p) => (
          <li key={p.id} className="dash-card dash-card-pad flex min-w-0 flex-col">
            <div className="flex items-start justify-between gap-3">
              <h2 className="min-w-0 text-base font-semibold break-words">{p.name}</h2>
              <Chip>{p.status}</Chip>
            </div>
            {p.repo && (
              <p className="mt-1.5 flex min-w-0 items-center gap-1.5 text-xs text-[var(--dash-muted)]">
                <GithubMark className="size-3.5 flex-none" />
                <span className="truncate">{p.repo}</span>
              </p>
            )}
            <p className="mt-2 text-sm leading-relaxed text-[var(--dash-muted)]">{p.body}</p>
            {p.stack.length > 0 && (
              <p className="mt-3 flex flex-wrap gap-1.5">
                {p.stack.map((s) => (
                  <span key={s} className="dash-chip">
                    {s}
                  </span>
                ))}
              </p>
            )}
            {p.review && (
              <p className="mt-4 flex gap-2 rounded-xl bg-[var(--dash-cyan-tint)] p-3 text-sm leading-relaxed text-[#23405a]">
                <MessageSquareQuote className="mt-0.5 size-4 flex-none text-[var(--dash-cyan-ink)]" aria-hidden="true" />
                <span>
                  <span className="font-semibold">Feedback: </span>
                  {p.review}
                </span>
              </p>
            )}
            <div className="mt-auto pt-5">
              {p.fromGithub ? (
                <p className="rounded-xl bg-[var(--dash-side)] px-3 py-2 text-xs text-[var(--dash-muted)]">Added from GitHub. Waiting for your recruiter&apos;s feedback.</p>
              ) : (
                <>
                  <div className="flex items-center justify-between text-xs text-[var(--dash-muted)]">
                    <span>Progress</span>
                    <span className="font-semibold text-[var(--dash-ink)]">{p.progress}%</span>
                  </div>
                  <div className="dash-bar mt-1.5" data-tone={p.progress === 100 ? "good" : undefined}>
                    <span style={{ width: `${p.progress}%` }} />
                  </div>
                </>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                {p.fromGithub && p.repo ? (
                  <>
                    <a href={`https://${p.repo}`} target="_blank" rel="noopener noreferrer" className="dash-btn-ghost h-9">
                      <ExternalLink className="size-3.5" aria-hidden="true" /> Open on GitHub
                    </a>
                    <button
                      type="button"
                      className="dash-btn-ghost h-9"
                      onClick={() => {
                        removeProject(p.id);
                        showToast(`Removed “${p.name}”.`);
                      }}
                    >
                      <Trash2 className="size-3.5" aria-hidden="true" /> Remove
                    </button>
                  </>
                ) : (
                  p.status !== "Not started" && (
                    <button
                      type="button"
                      className="dash-btn-ghost h-9"
                      onClick={() => showToast(p.status === "Reviewed" ? "Demo: opens the GitHub repo." : "Sent to Hari for feedback. (Demo)")}
                    >
                      {p.status === "Reviewed" ? "View code" : "Ask for feedback"}
                    </button>
                  )
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
      {gh.dialog}
      {toast}
    </div>
  );
}
