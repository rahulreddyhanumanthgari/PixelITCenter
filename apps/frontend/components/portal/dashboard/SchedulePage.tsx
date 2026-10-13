"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, List, Users } from "lucide-react";
import { demoToday, events as starter, type CalEvent, type EventKind } from "@/content/portal-demo";
import { dayName, longDate, monthGrid, parseDay, shortDate } from "@/lib/dates";
import { PageHeader } from "./ui";

// One colour per kind of event, used by the month grid, the dots, the list
// bars and the legend.
const KIND: Record<EventKind, { bar: string; tint: string; ink: string }> = {
  Interview: { bar: "var(--dash-orange)", tint: "rgb(252 101 13 / 0.12)", ink: "var(--dash-orange-ink)" },
  Call: { bar: "var(--dash-cyan)", tint: "rgb(12 177 223 / 0.14)", ink: "var(--dash-cyan-ink)" },
  Meeting: { bar: "var(--dash-ink)", tint: "rgb(4 19 39 / 0.07)", ink: "var(--dash-ink)" },
  Deadline: { bar: "#dc2626", tint: "rgb(220 38 38 / 0.1)", ink: "var(--dash-red-ink)" },
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const VIEW_KEY = "pixelit-portal-calendar-view";

function Legend() {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-[var(--dash-muted)]" aria-label="Colours">
      {(Object.keys(KIND) as EventKind[]).map((k) => (
        <li key={k} className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full" style={{ background: KIND[k].bar }} aria-hidden="true" />
          {k}
        </li>
      ))}
    </ul>
  );
}

/** One event as a readable row: time, colour bar, title, type and who. */
function EventRow({ e }: { e: CalEvent }) {
  const k = KIND[e.kind];
  return (
    <li className="flex items-stretch gap-3 rounded-2xl border border-[var(--dash-line)] bg-white p-3 sm:gap-4 sm:p-4">
      <span className="w-[4.5rem] flex-none sm:w-24">
        <span className="block text-sm font-semibold">{e.time}</span>
        {e.end && <span className="block text-xs text-[var(--dash-muted)]">to {e.end}</span>}
      </span>
      <span className="w-1 flex-none rounded-full" style={{ background: k.bar }} aria-hidden="true" />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{e.title}</span>
        <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--dash-muted)]">
          <span className="rounded-full px-2 py-0.5 font-semibold" style={{ background: k.tint, color: k.ink }}>
            {e.kind}
          </span>
          <span className="flex items-center gap-1">
            <Users className="size-3.5" aria-hidden="true" /> {e.with}
          </span>
        </span>
      </span>
    </li>
  );
}

/** Month view: each day box lists what's on it; pick a day to see it in full. */
function MonthView({ events, today }: { events: CalEvent[]; today: string }) {
  const t = parseDay(today);
  const [month, setMonth] = useState({ y: t.getFullYear(), m: t.getMonth() });
  const [picked, setPicked] = useState(today);

  const byDay = useMemo(() => {
    const map = new Map<string, CalEvent[]>();
    for (const e of [...events].sort((a, b) => a.time.localeCompare(b.time))) map.set(e.date, [...(map.get(e.date) ?? []), e]);
    return map;
  }, [events]);

  let days = monthGrid(month.y, month.m);
  if (days.slice(35).every((d) => !d.inMonth)) days = days.slice(0, 35); // drop an empty last week
  const title = new Date(month.y, month.m, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const step = (n: number) => setMonth(({ y, m }) => ({ y: m + n < 0 ? y - 1 : m + n > 11 ? y + 1 : y, m: (m + n + 12) % 12 }));
  const pickedEvents = byDay.get(picked) ?? [];

  return (
    <div className="grid grid-cols-1 gap-5 2xl:grid-cols-[minmax(0,1fr)_21rem]">
      <section className="dash-card min-w-0 p-3 sm:p-4" aria-label={title}>
        <div className="flex items-center justify-between gap-2 px-1 pb-3">
          <h2 className="text-base font-semibold sm:text-lg">{title}</h2>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              className="dash-btn-ghost h-9 px-3 text-xs"
              onClick={() => {
                setMonth({ y: t.getFullYear(), m: t.getMonth() });
                setPicked(today);
              }}
            >
              Today
            </button>
            <button type="button" className="dash-icon-btn size-9" onClick={() => step(-1)} aria-label="Previous month">
              <ChevronLeft className="size-4" />
            </button>
            <button type="button" className="dash-icon-btn size-9" onClick={() => step(1)} aria-label="Next month">
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 border-b border-[var(--dash-line)] pb-2 text-center text-[0.6875rem] font-semibold tracking-[0.08em] text-[var(--dash-faint)] uppercase">
          {WEEKDAYS.map((w) => (
            <span key={w}>
              <span className="sm:hidden">{w[0]}</span>
              <span className="hidden sm:inline">{w}</span>
            </span>
          ))}
        </div>

        <div className="mt-1 grid grid-cols-7 gap-1">
          {days.map((d) => {
            const list = byDay.get(d.iso) ?? [];
            const isToday = d.iso === today;
            const isPicked = d.iso === picked;
            return (
              <button
                key={d.iso}
                type="button"
                onClick={() => setPicked(d.iso)}
                aria-pressed={isPicked}
                aria-label={`${longDate(d.iso)}: ${list.length ? `${list.length} ${list.length === 1 ? "item" : "items"}` : "nothing planned"}`}
                className={`flex min-h-14 flex-col rounded-xl border p-1 text-left transition sm:min-h-32 sm:p-1.5 ${
                  isPicked
                    ? "border-[var(--dash-orange)] bg-[var(--dash-orange-tint)]"
                    : "border-transparent hover:border-[var(--dash-line-strong)] hover:bg-[var(--dash-side)]"
                } ${d.inMonth ? "" : "opacity-45"}`}
              >
                <span
                  className={`grid size-6 place-items-center self-center rounded-full text-xs font-semibold sm:self-start ${
                    isToday ? "bg-[var(--dash-orange)] text-white" : ""
                  }`}
                >
                  {d.day}
                </span>

                {/* Phones: a dot per item. Wider screens: the items themselves. */}
                <span className="mt-1 flex justify-center gap-0.5 sm:hidden" aria-hidden="true">
                  {list.slice(0, 3).map((e) => (
                    <span key={e.id} className="size-1.5 rounded-full" style={{ background: KIND[e.kind].bar }} />
                  ))}
                </span>
                <span className="mt-1 hidden w-full space-y-0.5 sm:block" aria-hidden="true">
                  {list.slice(0, 3).map((e) => (
                    <span
                      key={e.id}
                      className="block rounded-md px-1.5 py-1 text-[0.6875rem] leading-tight font-medium"
                      style={{ background: KIND[e.kind].tint, color: KIND[e.kind].ink }}
                    >
                      <span className="block font-bold">{e.time}</span>
                      <span className="line-clamp-2 block text-[var(--dash-ink)]">{e.title}</span>
                    </span>
                  ))}
                  {list.length > 3 && <span className="block px-1.5 text-[0.6875rem] font-semibold text-[var(--dash-muted)]">+{list.length - 3} more</span>}
                </span>
              </button>
            );
          })}
        </div>
        <div className="mt-3 border-t border-[var(--dash-line)] px-1 pt-3">
          <Legend />
        </div>
      </section>

      <section className="dash-card dash-card-pad self-start" aria-live="polite" aria-labelledby="picked-heading">
        <p className="text-xs font-semibold tracking-[0.12em] text-[var(--dash-faint)] uppercase">{dayName(picked, today)}</p>
        <h2 id="picked-heading" className="mt-0.5 text-lg font-semibold">
          {longDate(picked)}
        </h2>
        {pickedEvents.length ? (
          <ul className="mt-4 space-y-2.5">
            {pickedEvents.map((e) => (
              <EventRow key={e.id} e={e} />
            ))}
          </ul>
        ) : (
          <p className="mt-4 rounded-2xl bg-[var(--dash-side)] p-4 text-sm text-[var(--dash-muted)]">Nothing planned. A free day.</p>
        )}
      </section>
    </div>
  );
}

/** List view: everything coming up, grouped by day, easy to scan. */
function ListView({ events, today }: { events: CalEvent[]; today: string }) {
  const [showPast, setShowPast] = useState(false);
  const sorted = [...events].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const past = sorted.filter((e) => e.date < today);
  const shown = showPast ? sorted : sorted.filter((e) => e.date >= today);
  const days = Array.from(new Set(shown.map((e) => e.date)));

  return (
    <div className="max-w-3xl space-y-6">
      {past.length > 0 && (
        <button type="button" className="dash-btn-ghost h-9 text-xs" onClick={() => setShowPast((v) => !v)}>
          {showPast ? "Hide earlier" : `Show earlier (${past.length})`}
        </button>
      )}
      {days.map((iso) => (
        <section key={iso} aria-labelledby={`d-${iso}`}>
          <h2 id={`d-${iso}`} className="flex items-baseline gap-2">
            <span className={`text-base font-semibold ${iso === today ? "text-[var(--dash-orange-ink)]" : ""}`}>{dayName(iso, today)}</span>
            <span className="text-sm text-[var(--dash-muted)]">{shortDate(iso)}</span>
          </h2>
          <ul className={`mt-2.5 space-y-2.5 ${iso < today ? "opacity-60" : ""}`}>
            {shown
              .filter((e) => e.date === iso)
              .map((e) => (
                <EventRow key={e.id} e={e} />
              ))}
          </ul>
        </section>
      ))}
      {!days.length && <p className="text-sm text-[var(--dash-muted)]">Nothing coming up.</p>}
    </div>
  );
}

/**
 * Calendar (students) / Schedule (everyone else), in two views: a month
 * calendar where each day shows what's on it, and a list grouped by day.
 * The chosen view is remembered in this browser.
 */
export function SchedulePage({
  title = "Schedule",
  body = "Meetings, interviews, calls and deadlines.",
  events = starter,
}: {
  title?: string;
  body?: string;
  events?: CalEvent[];
}) {
  const [view, setView] = useState<"month" | "list">("month");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(VIEW_KEY);
      // Reading a saved preference after the first render, so the server
      // and browser render the same page first.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved === "list" || saved === "month") setView(saved);
    } catch {
      // storage blocked: keep the default
    }
  }, []);

  const choose = (v: "month" | "list") => {
    setView(v);
    try {
      window.localStorage.setItem(VIEW_KEY, v);
    } catch {
      // storage blocked: fine, it just isn't remembered
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title={title} body={body}>
        <div className="dash-tabs" role="tablist" aria-label="View">
          <button type="button" role="tab" aria-selected={view === "month"} className="dash-tab flex items-center gap-1.5" onClick={() => choose("month")}>
            <CalendarDays className="size-4" aria-hidden="true" /> Calendar
          </button>
          <button type="button" role="tab" aria-selected={view === "list"} className="dash-tab flex items-center gap-1.5" onClick={() => choose("list")}>
            <List className="size-4" aria-hidden="true" /> List
          </button>
        </div>
      </PageHeader>
      {view === "month" ? <MonthView events={events} today={demoToday} /> : <ListView events={events} today={demoToday} />}
    </div>
  );
}
