"use client";

import { useState } from "react";
import { Check, Plus, Trash2 } from "lucide-react";
import type { Priority } from "@/content/portal-demo";
import { setTasks, useSession } from "./session";
import { Chip } from "./ui";

const FILTERS = ["All", "Open", "Closed"] as const;

/**
 * Tasks with All / Open / Closed filters: tick to close, bin to delete.
 * `adding` shows a box to add a task (the full Tasks page). Saved in the
 * demo session, so the dashboard card and the Tasks page stay in step.
 */
export function TaskList({ adding = false, limit }: { adding?: boolean; limit?: number }) {
  const session = useSession();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("Normal");
  if (!session) return null;

  const shown = session.tasks
    .filter((t) => (filter === "All" ? true : filter === "Open" ? !t.done : t.done))
    .slice(0, limit);

  return (
    <div>
      <div className="dash-tabs grid w-full grid-cols-3" role="group" aria-label="Show tasks">
        {FILTERS.map((f) => (
          <button key={f} type="button" className="dash-tab" aria-pressed={filter === f} onClick={() => setFilter(f)}>
            {f}
          </button>
        ))}
      </div>

      {adding && (
        <form
          className="mt-4 flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            if (!title.trim()) return;
            setTasks((list) => [{ id: `t${Date.now()}`, title: title.trim(), priority, done: false, due: "Today" }, ...list]);
            setTitle("");
          }}
        >
          <label htmlFor="new-task" className="sr-only">
            New task
          </label>
          <input
            id="new-task"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Add a task…"
            className="dash-input flex-1"
          />
          <div className="flex gap-2">
            <label htmlFor="new-task-priority" className="sr-only">
              Priority
            </label>
            <select
              id="new-task-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className="dash-input w-32"
            >
              <option>Normal</option>
              <option>Medium</option>
              <option>High</option>
            </select>
            <button type="submit" className="dash-btn h-11" disabled={!title.trim()}>
              <Plus className="size-4" aria-hidden="true" /> Add
            </button>
          </div>
        </form>
      )}

      <ul className="mt-3 divide-y divide-[var(--dash-line)]">
        {shown.map((t) => (
          <li key={t.id} className="flex items-center gap-3 py-3">
            <button
              type="button"
              role="checkbox"
              aria-checked={t.done}
              aria-label={t.done ? `Reopen “${t.title}”` : `Mark “${t.title}” done`}
              className="dash-check"
              onClick={() => setTasks((list) => list.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)))}
            >
              {t.done && <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />}
            </button>
            <span className="min-w-0 flex-1">
              <span
                className={`block text-sm ${t.done ? "text-[var(--dash-faint)] line-through" : "font-medium"}`}
              >
                {t.title}
              </span>
              <span className="block text-xs text-[var(--dash-faint)]">Due {t.due}</span>
            </span>
            <Chip>{t.priority}</Chip>
            <button
              type="button"
              aria-label={`Delete “${t.title}”`}
              className="grid size-8 flex-none place-items-center rounded-full text-[var(--dash-faint)] hover:bg-[var(--dash-hover)] hover:text-[var(--dash-red-ink)]"
              onClick={() => setTasks((list) => list.filter((x) => x.id !== t.id))}
            >
              <Trash2 className="size-4" />
            </button>
          </li>
        ))}
        {!shown.length && (
          <li className="py-6 text-center text-sm text-[var(--dash-muted)]">
            {filter === "Closed" ? "Nothing closed yet." : "All done. Nice work."}
          </li>
        )}
      </ul>
    </div>
  );
}
