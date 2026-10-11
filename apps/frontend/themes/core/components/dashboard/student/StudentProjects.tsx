"use client";

import { MessageSquareQuote } from "lucide-react";
import { practiceProjects } from "@/content/student-demo";
import { Chip, PageHeader, useToast } from "../ui";

/** Practice projects: the student's portfolio, each with a trainer review. */
export function StudentProjects() {
  const [toast, showToast] = useToast();
  return (
    <div className="space-y-6">
      <PageHeader title="Projects" body="Your practice projects. They're your best stories in an interview." />
      <ul className="grid gap-4 md:grid-cols-2">
        {practiceProjects.map((p) => (
          <li key={p.id} className="dash-card dash-card-pad flex flex-col">
            <div className="flex items-start justify-between gap-3">
              <h2 className="min-w-0 text-base font-semibold">{p.name}</h2>
              <Chip>{p.status}</Chip>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-[var(--dash-muted)]">{p.body}</p>
            <p className="mt-3 flex flex-wrap gap-1.5">
              {p.stack.map((s) => (
                <span key={s} className="dash-chip">
                  {s}
                </span>
              ))}
            </p>
            {p.review && (
              <p className="mt-4 flex gap-2 rounded-xl bg-[var(--dash-cyan-tint)] p-3 text-sm leading-relaxed text-[#23405a]">
                <MessageSquareQuote className="mt-0.5 size-4 flex-none text-[var(--dash-cyan-ink)]" aria-hidden="true" />
                <span>
                  <span className="font-semibold">Trainer: </span>
                  {p.review}
                </span>
              </p>
            )}
            <div className="mt-auto pt-5">
              <div className="flex items-center justify-between text-xs text-[var(--dash-muted)]">
                <span>Progress</span>
                <span className="font-semibold text-[var(--dash-ink)]">{p.progress}%</span>
              </div>
              <div className="dash-bar mt-1.5" data-tone={p.progress === 100 ? "good" : undefined}>
                <span style={{ width: `${p.progress}%` }} />
              </div>
              {p.status !== "Not started" && (
                <button
                  type="button"
                  className="dash-btn-ghost mt-4 h-9"
                  onClick={() => showToast(p.status === "Reviewed" ? "Demo: opens the GitHub repo." : "Sent to your trainer for review. (Demo)")}
                >
                  {p.status === "Reviewed" ? "View code" : "Ask for review"}
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
      {toast}
    </div>
  );
}
