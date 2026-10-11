"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { projects, type Status } from "@/content/portal-demo";
import { AvatarStack, Chip, PageHeader } from "./ui";

const FILTERS: ("All" | Status)[] = ["All", "On track", "At risk", "Starting", "Completed"];

/** Every project as a card, filtered by status. */
export function ProjectsPage() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const shown = projects.filter((p) => filter === "All" || p.status === filter);

  return (
    <div className="space-y-6">
      <PageHeader title="Projects" body="Engagements you're part of, with progress and who's on the team." />

      <div className="dash-scroll-row -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="dash-tabs" role="group" aria-label="Filter by status">
          {FILTERS.map((f) => (
            <button key={f} type="button" className="dash-tab" aria-pressed={filter === f} onClick={() => setFilter(f)}>
              {f}
              <span className="ml-1.5 text-[var(--dash-faint)]">
                {f === "All" ? projects.length : projects.filter((p) => p.status === f).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      <ul className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {shown.map((p) => (
          <li key={p.id} className="dash-card dash-card-pad flex flex-col">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-base font-semibold">{p.name}</h2>
                <p className="text-sm text-[var(--dash-cyan-ink)]">
                  {p.org} · {p.area}
                </p>
              </div>
              <Chip>{p.status}</Chip>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-[var(--dash-muted)]">{p.body}</p>
            <div className="mt-auto pt-5">
              <div className="flex items-center justify-between text-xs text-[var(--dash-muted)]">
                <span>Progress</span>
                <span className="font-semibold text-[var(--dash-ink)]">{p.progress}%</span>
              </div>
              <div className="dash-bar mt-1.5" data-tone={p.progress === 100 ? "good" : undefined}>
                <span style={{ width: `${p.progress}%` }} />
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-[var(--dash-line)] pt-4">
                <AvatarStack names={p.team} />
                <span className="flex items-center gap-1.5 text-xs text-[var(--dash-muted)]">
                  <CalendarDays className="size-3.5" aria-hidden="true" /> Due {p.due}
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
