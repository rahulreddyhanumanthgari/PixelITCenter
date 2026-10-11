"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, SlidersHorizontal } from "lucide-react";
import type { Employment, WorkMode } from "@/content/student-demo";

export const EMPLOYMENTS: Employment[] = ["Permanent", "Contract", "Part-time"];
export const WORK_MODES: WorkMode[] = ["Remote", "Hybrid", "On-site"];

export type Filters = { employment: Employment[]; workMode: WorkMode[] };
export const noFilters: Filters = { employment: [], workMode: [] };

/** Nothing ticked in a group means "any". */
export const matches = (f: Filters, job: { employment: Employment; workMode: WorkMode }) =>
  (!f.employment.length || f.employment.includes(job.employment)) && (!f.workMode.length || f.workMode.includes(job.workMode));

function Group<T extends string>({
  title,
  options,
  picked,
  onToggle,
}: {
  title: string;
  options: T[];
  picked: T[];
  onToggle: (v: T) => void;
}) {
  return (
    <fieldset>
      <legend className="px-2.5 pt-1 pb-1.5 text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--dash-faint)] uppercase">{title}</legend>
      {options.map((o) => {
        const on = picked.includes(o);
        return (
          <label
            key={o}
            className="flex cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 text-sm hover:bg-[var(--dash-hover)] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[var(--dash-orange)]"
          >
            <input type="checkbox" checked={on} onChange={() => onToggle(o)} className="sr-only" />
            <span className={`dash-check size-5 rounded-[5px] ${on ? "border-[var(--dash-orange)] bg-[var(--dash-orange)]" : ""}`} aria-hidden="true">
              {on && <Check className="size-3" strokeWidth={3} />}
            </span>
            {o}
          </label>
        );
      })}
    </fieldset>
  );
}

/**
 * One "Filter" button with a dropdown: Job type (Permanent / Contract /
 * Part-time) and Work style (Remote / Hybrid / On-site). Tick any mix;
 * the button shows how many are on. Closes on outside click or Escape.
 */
export function JobFilters({ value, onChange }: { value: Filters; onChange: (f: Filters) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const count = value.employment.length + value.workMode.length;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggle = <K extends keyof Filters>(key: K, v: Filters[K][number]) => {
    const list = value[key] as string[];
    onChange({ ...value, [key]: list.includes(v) ? list.filter((x) => x !== v) : [...list, v] });
  };

  return (
    <div className="relative flex-none" ref={ref}>
      <button
        type="button"
        className="dash-btn-ghost h-10"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((o) => !o)}
        data-active={count > 0 || undefined}
      >
        <SlidersHorizontal className="size-4" aria-hidden="true" />
        Filter
        {count > 0 && <span className="dash-nav-count ml-0">{count}</span>}
        <ChevronDown className={`size-4 transition ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>

      {open && (
        <div className="dash-popover w-[min(16rem,calc(100vw-2rem))]" role="group" aria-label="Filter jobs">
          <Group title="Job type" options={EMPLOYMENTS} picked={value.employment} onToggle={(v) => toggle("employment", v)} />
          <div className="mx-2.5 my-1.5 h-px bg-[var(--dash-line)]" />
          <Group title="Work style" options={WORK_MODES} picked={value.workMode} onToggle={(v) => toggle("workMode", v)} />
          <div className="mt-1.5 flex items-center justify-between border-t border-[var(--dash-line)] px-2.5 pt-2.5 pb-1">
            <button
              type="button"
              className="text-xs font-semibold text-[var(--dash-muted)] hover:underline disabled:opacity-40"
              disabled={!count}
              onClick={() => onChange(noFilters)}
            >
              Clear all
            </button>
            <button type="button" className="dash-btn h-8 px-3.5 text-xs" onClick={() => setOpen(false)}>
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
