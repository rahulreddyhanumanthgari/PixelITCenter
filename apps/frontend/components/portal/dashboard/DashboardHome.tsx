"use client";

import { useRef } from "react";
import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight, FolderKanban, ListChecks, MessageSquare, TrendingUp, UserRoundPlus } from "lucide-react";
import { accountTypes, activity, projects, stats } from "@/content/portal-demo";
import { profileCompletion, useSession } from "./session";
import { TaskList } from "./TaskList";
import { AvatarStack, Chip, PageHeader, ProfileRing } from "./ui";

const STAT_ICONS = { projects: FolderKanban, tasks: ListChecks, meetings: CalendarDays, messages: MessageSquare };

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

/** The dashboard home: profile card with stats, projects, activity, tasks. */
export function DashboardHome() {
  const session = useSession();
  const row = useRef<HTMLDivElement>(null);
  if (!session) return null;
  const { profile } = session;
  const percent = profileCompletion(profile);
  const type = accountTypes.find((t) => t.id === profile.accountType);
  const firstName = profile.fullName.split(" ")[0] || "there";
  const openTasks = session.tasks.filter((t) => !t.done).length;

  const scrollRow = (dir: 1 | -1) => row.current?.scrollBy({ left: dir * 340, behavior: "smooth" });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        body={
          <>
            {greeting()}, {firstName}. Here&apos;s what&apos;s happening today.
          </>
        }
      />

      {/* Profile + stats */}
      <section className="dash-hero p-4 sm:p-6" aria-labelledby="profile-heading">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 id="profile-heading" className="text-sm font-semibold">
              Profile
            </h2>
            <div className="mt-3 flex items-center gap-4">
              <ProfileRing name={profile.fullName || profile.email} percent={percent} />
              <div>
                <p className="flex items-baseline gap-1 text-[2rem] leading-none font-semibold">
                  {percent}
                  <span className="text-sm text-[var(--dash-muted)]">%</span>
                </p>
                <p className="mt-1.5 text-sm text-[var(--dash-muted)]">
                  {percent < 100 ? "Finish your profile to tailor your dashboard" : "Your profile is complete"}
                </p>
                <p className="mt-2">
                  <Chip tone={type ? "ink" : "warn"}>{type ? `${type.label} account` : "Account type not set"}</Chip>
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/portal/profile" className="dash-btn">
              Update profile
            </Link>
            <Link href="/portal/projects" className="dash-btn-ghost">
              View projects
            </Link>
          </div>
        </div>

        {!type && (
          <Link
            href="/portal/onboarding"
            className="mt-5 flex items-center gap-3 rounded-2xl bg-white/80 p-3.5 text-sm ring-1 ring-[var(--dash-line)] hover:bg-white"
          >
            <UserRoundPlus className="size-5 flex-none text-[var(--dash-orange)]" aria-hidden="true" />
            <span className="flex-1">
              <span className="font-semibold">Tell us who you are.</span>{" "}
              <span className="text-[var(--dash-muted)]">Student, employee or client: it decides what your dashboard shows.</span>
            </span>
            <ChevronRight className="size-4 flex-none" aria-hidden="true" />
          </Link>
        )}

        <ul className="mt-5 grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
          {stats.map((s) => {
            const Icon = STAT_ICONS[s.id];
            const value = s.id === "tasks" ? String(openTasks) : s.value;
            return (
              <li key={s.id} className="dash-stat">
                <p className="flex items-center gap-2 text-[0.8125rem] font-medium">
                  <span className="dash-stat-icon">
                    <Icon className="size-3.5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 leading-tight">{s.label}</span>
                </p>
                <p className="mt-2.5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span className="text-2xl font-semibold">{value}</span>
                  <span className="flex items-center gap-1 text-xs text-[var(--dash-muted)]">
                    {"trend" in s && (
                      <span className="flex items-center gap-0.5 font-semibold text-[var(--dash-cyan-ink)]">
                        <TrendingUp className="size-3" aria-hidden="true" />
                        {s.trend}
                      </span>
                    )}
                    {s.note}
                  </span>
                </p>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Projects row */}
      <section aria-labelledby="projects-heading">
        <div className="flex items-center justify-between">
          <h2 id="projects-heading" className="dash-section-title">
            Projects <span className="dash-count">{projects.length}</span>
          </h2>
          <div className="flex gap-1.5">
            <button type="button" className="dash-icon-btn size-8" onClick={() => scrollRow(-1)} aria-label="Previous projects">
              <ChevronLeft className="size-4" />
            </button>
            <button type="button" className="dash-icon-btn size-8" onClick={() => scrollRow(1)} aria-label="Next projects">
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
        <div ref={row} className="dash-scroll-row -mx-4 mt-3 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
          {projects.map((p) => (
            <Link
              key={p.id}
              href="/portal/projects"
              className="dash-card dash-card-pad w-[min(20rem,82vw)] flex-none snap-start"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-[0.9375rem] font-semibold">{p.name}</p>
                  <p className="truncate text-xs text-[var(--dash-cyan-ink)]">
                    {p.org} · {p.area}
                  </p>
                </div>
                <Chip>{p.status}</Chip>
              </div>
              <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-[var(--dash-muted)]">{p.body}</p>
              <div className="mt-4 flex items-center justify-between text-xs text-[var(--dash-muted)]">
                <span>Progress</span>
                <span className="font-semibold text-[var(--dash-ink)]">{p.progress}%</span>
              </div>
              <div className="dash-bar mt-1.5" data-tone={p.progress === 100 ? "good" : undefined}>
                <span style={{ width: `${p.progress}%` }} />
              </div>
              <div className="mt-4 flex items-center justify-between">
                <AvatarStack names={p.team} />
                <span className="text-xs text-[var(--dash-muted)]">Due {p.due}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Activity + tasks */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <section aria-labelledby="activity-heading" className="min-w-0">
          <h2 id="activity-heading" className="dash-section-title">
            Recent activity <span className="dash-count">{activity.length}</span>
          </h2>
          <div className="dash-card mt-3 p-2 sm:p-3">
            <div className="dash-table-wrap">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th scope="col">Item</th>
                    <th scope="col">Type</th>
                    <th scope="col">Status</th>
                    <th scope="col">Last update</th>
                    <th scope="col">Next step</th>
                  </tr>
                </thead>
                <tbody>
                  {activity.map((a) => (
                    <tr key={a.item}>
                      <td>{a.item}</td>
                      <td>{a.kind}</td>
                      <td>
                        <Chip>{a.status}</Chip>
                      </td>
                      <td>{a.updated}</td>
                      <td>{a.next}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section aria-labelledby="tasks-heading" className="dash-card dash-card-pad self-start">
          <div className="flex items-center justify-between">
            <h2 id="tasks-heading" className="dash-section-title">
              Today&apos;s tasks
            </h2>
            <Link href="/portal/tasks" className="text-xs font-semibold text-[var(--dash-orange-ink)] hover:underline">
              See all
            </Link>
          </div>
          <div className="mt-4">
            <TaskList limit={4} />
          </div>
        </section>
      </div>
    </div>
  );
}
