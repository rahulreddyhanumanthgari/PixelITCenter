"use client";

import { CalendarDays, Check, Lock, PlayCircle, Video } from "lucide-react";
import { assignments, course, recordings } from "@/content/student-demo";
import { Avatar, Chip, PageHeader, useToast } from "../ui";

/** The training program: progress, modules, assignments and recordings. */
export function LearningPage() {
  const [toast, showToast] = useToast();
  const done = course.modules.filter((m) => m.status === "Done").length;

  return (
    <div className="space-y-6">
      <PageHeader title="Learning" body={`${course.name} · ${course.cohort}`} />

      <section className="dash-hero grid gap-5 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_20rem]" aria-label="Course progress">
        <div>
          <p className="text-sm font-semibold">Your progress</p>
          <p className="mt-2 flex items-baseline gap-1 text-[2.5rem] leading-none font-semibold">
            {course.progress}
            <span className="text-sm text-[var(--dash-muted)]">%</span>
          </p>
          <p className="mt-1 text-sm text-[var(--dash-muted)]">
            {done} of {course.modules.length} modules done
          </p>
          <div className="dash-bar mt-4 max-w-md">
            <span style={{ width: `${course.progress}%` }} />
          </div>
          <p className="mt-4 flex items-center gap-2 text-sm">
            <Avatar name={course.trainer} size={28} />
            <span>
              Trainer: <span className="font-semibold">{course.trainer}</span>
            </span>
          </p>
        </div>
        <div className="dash-stat self-start">
          <p className="flex items-center gap-2 text-xs font-semibold text-[var(--dash-orange-ink)]">
            <Video className="size-3.5" aria-hidden="true" /> Next live class
          </p>
          <p className="mt-2 text-sm font-semibold">{course.nextClass.title}</p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-[var(--dash-muted)]">
            <CalendarDays className="size-3.5" aria-hidden="true" /> {course.nextClass.when}
          </p>
          <button type="button" className="dash-btn mt-3 w-full" onClick={() => showToast("Demo: the Zoom link opens here when the portal is live.")}>
            Join on {course.nextClass.link}
          </button>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <section aria-labelledby="modules-heading" className="min-w-0">
          <h2 id="modules-heading" className="dash-section-title">
            Modules <span className="dash-count">{course.modules.length}</span>
          </h2>
          <ol className="dash-card mt-3 divide-y divide-[var(--dash-line)] px-4 sm:px-5">
            {course.modules.map((m, i) => (
              <li key={m.id} className="flex items-center gap-3 py-3.5">
                <span
                  className={`grid size-8 flex-none place-items-center rounded-full text-xs font-bold ${
                    m.status === "Done"
                      ? "bg-[var(--dash-orange)] text-white"
                      : m.status === "In progress"
                        ? "border-2 border-[var(--dash-orange)] text-[var(--dash-orange)]"
                        : "bg-[var(--dash-side)] text-[var(--dash-faint)]"
                  }`}
                  aria-hidden="true"
                >
                  {m.status === "Done" ? <Check className="size-4" strokeWidth={3} /> : m.status === "Locked" ? <Lock className="size-3.5" /> : i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block text-sm font-semibold ${m.status === "Locked" ? "text-[var(--dash-faint)]" : ""}`}>{m.title}</span>
                  <span className="block text-xs text-[var(--dash-muted)]">{m.lessons} lessons</span>
                </span>
                {m.status === "In progress" ? (
                  <button type="button" className="dash-btn h-9" data-tone="orange" onClick={() => showToast(`Demo: “${m.title}” opens here.`)}>
                    Continue
                  </button>
                ) : (
                  <Chip>{m.status}</Chip>
                )}
              </li>
            ))}
          </ol>
        </section>

        <div className="space-y-6">
          <section aria-labelledby="assign-heading" className="dash-card dash-card-pad">
            <h2 id="assign-heading" className="dash-section-title">
              Assignments
            </h2>
            <ul className="mt-3 divide-y divide-[var(--dash-line)]">
              {assignments.map((a) => (
                <li key={a.id} className="flex items-center gap-3 py-3">
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{a.title}</span>
                    <span className="block text-xs text-[var(--dash-muted)]">
                      {a.module} · due {a.due}
                    </span>
                  </span>
                  {a.grade ? <Chip tone="good">{`Grade ${a.grade}`}</Chip> : <Chip>{a.status}</Chip>}
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="rec-heading" className="dash-card dash-card-pad">
            <h2 id="rec-heading" className="dash-section-title">
              Recordings
            </h2>
            <ul className="mt-3 space-y-1">
              {recordings.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-[var(--dash-hover)]"
                    onClick={() => showToast("Demo: recordings play here when the portal is live.")}
                  >
                    <PlayCircle className="size-6 flex-none text-[var(--dash-orange)]" aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{r.title}</span>
                      <span className="block text-xs text-[var(--dash-muted)]">
                        {r.length} · {r.date}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
      {toast}
    </div>
  );
}
