"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, Search, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { registeredStudents, type JobType, type RegisteredStudent, type WorkMode } from "@/content/registered-students";
import { cn } from "@/lib/utils";
import { Avatar, Chip, PageHeader, useToast } from "../ui";
import { adminApi, type Placement } from "./api";
import { restoreDeletedStudents, useDeletedStudents } from "./deletedStudents";
import { DeleteStudentButton, DocumentsWindow, StudentProfile } from "./StudentProfile";
import { can, date, Detail, EMPLOYMENT, ErrorNote, useApi, useWho } from "./ui";

// Talent: every student who registered on the portal, placed or not. The
// recruiters' database for answering a client's job description: match the JD's
// keywords, then narrow by title, skills, status (placed, unplaced, on bench),
// visa, role type, work mode, availability and experience. Search by name,
// email or PixelIT ID (PIC-…).
//
// FRONT END ONLY: students come from the demo list (content/registered-students.ts);
// placed / on bench comes from the real placements where the email matches.

export type Status = "PLACED" | "UNPLACED" | "BENCH";

export const STATUS_LABEL: Record<Status, string> = {
  PLACED: "Placed",
  UNPLACED: "Unplaced",
  BENCH: "On bench",
};
const STATUS_HELP: Record<Status, string> = {
  PLACED: "Working at a client now.",
  UNPLACED: "Never placed yet.",
  BENCH: "Was placed; the project ended. Ready for the next one.",
};
const STATUS_TONE: Record<Status, "good" | "warn" | "ink"> = {
  PLACED: "good",
  UNPLACED: "ink",
  BENCH: "warn",
};

type Person = RegisteredStudent & { status: Status; placement?: Placement };

/** Placed if a placement is still running; on bench if one ended (or marked so); else unplaced. */
export function withStatus(s: RegisteredStudent, placements: Placement[]): Person {
  const mine = placements.filter((p) => p.consultantEmail === s.email);
  const current = mine.find((p) => p.extensionStatus !== "ENDED");
  if (current) return { ...s, status: "PLACED", placement: current };
  if (mine.length || s.benchSince) return { ...s, status: "BENCH", placement: mine[0] };
  return { ...s, status: "UNPLACED" };
}

/** JD keywords: comma-separated terms ("cloud engineer, aws, terraform"), or single words. */
const jdTerms = (jd: string) => (jd.includes(",") ? jd.split(",") : jd.split(/\s+/)).map((t) => t.trim().toLowerCase()).filter((t) => t.length > 1);

const haystack = (s: RegisteredStudent) => [s.targetRole, s.headline, ...s.skills].join(" | ").toLowerCase();

type Filters = {
  q: string;
  jd: string;
  status: "ALL" | Status;
  title: string;
  skills: string[];
  visa: string;
  openTo: "" | JobType;
  workMode: "" | WorkMode;
  available: string;
  minYears: string;
  relocates: boolean;
};

const NO_FILTERS: Filters = {
  q: "",
  jd: "",
  status: "ALL",
  title: "",
  skills: [],
  visa: "",
  openTo: "",
  workMode: "",
  available: "",
  minYears: "",
  relocates: false,
};

export function TalentPage() {
  const who = useWho();
  const placements = useApi(who ? () => adminApi.placements(who) : null, [who?.email, who?.role]);
  const [f, setF] = useState<Filters>(NO_FILTERS);
  const [openPic, setOpenPic] = useState<string | null>(null);
  const set = (patch: Partial<Filters>) => setF((x) => ({ ...x, ...patch }));
  const deleted = useDeletedStudents();
  const isAdmin = can(who, "admin");
  const [toast, showToast] = useToast();

  const people = useMemo(
    () => registeredStudents.filter((s) => !deleted.includes(s.pixelitId)).map((s) => withStatus(s, placements.data?.placements ?? [])),
    [placements.data, deleted],
  );
  const options = useMemo(() => {
    const uniq = (xs: string[]) => [...new Set(xs)].sort((a, b) => a.localeCompare(b));
    return {
      titles: uniq(people.map((p) => p.targetRole)),
      skills: uniq(people.flatMap((p) => p.skills)),
      visas: uniq(people.map((p) => p.visaStatus)),
      available: uniq(people.map((p) => p.availableToStart)),
    };
  }, [people]);

  const terms = jdTerms(f.jd);
  const q = f.q.trim().toLowerCase();
  const shown = people
    .filter((p) => !q || p.fullName.toLowerCase().includes(q) || p.pixelitId.toLowerCase().includes(q) || p.email.includes(q))
    .filter((p) => f.status === "ALL" || p.status === f.status)
    .filter((p) => !f.title || p.targetRole === f.title)
    .filter((p) => f.skills.every((k) => p.skills.includes(k)))
    .filter((p) => !f.visa || p.visaStatus === f.visa)
    .filter((p) => !f.openTo || p.openTo.includes(f.openTo))
    .filter((p) => !f.workMode || p.workMode === f.workMode || p.workMode === "Any")
    .filter((p) => !f.available || p.availableToStart === f.available)
    .filter((p) => !f.minYears || p.relevantExperienceYears >= Number(f.minYears))
    .filter((p) => !f.relocates || !/^no\b/i.test(p.relocation))
    .map((p) => ({ p, hits: terms.filter((t) => haystack(p).includes(t)) }))
    .filter(({ hits }) => !terms.length || hits.length > 0)
    .sort((a, b) => b.hits.length - a.hits.length || a.p.fullName.localeCompare(b.p.fullName));

  const counts = (s: Status) => people.filter((p) => p.status === s).length;
  const extraFilters = [f.title, f.visa, f.openTo, f.workMode, f.available, f.minYears, f.relocates ? "x" : ""].filter(Boolean).length + f.skills.length;
  const anyFilter = JSON.stringify(f) !== JSON.stringify(NO_FILTERS);

  const open = openPic ? people.find((p) => p.pixelitId === openPic) : undefined;
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [openPic]);

  if (open) {
    return (
      <>
        <TalentDetail
          person={open}
          onBack={() => setOpenPic(null)}
          onDeleted={
            isAdmin
              ? (message) => {
                  setOpenPic(null);
                  showToast(message);
                }
              : undefined
          }
        />
        {toast}
      </>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Talent" body="Everyone who registered with Pixel IT Center, placed or not. Match a job description, then narrow it down." />

      <div className="grid gap-3 lg:grid-cols-2">
        <div>
          <label htmlFor="tl-search" className="dash-label">
            Find a student
          </label>
          <div className="relative">
            <input id="tl-search" type="search" className="dash-input pr-10" placeholder="Name, email or PIC-…" value={f.q} onChange={(e) => set({ q: e.target.value })} />
            <Search className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-[var(--dash-muted)]" aria-hidden="true" />
          </div>
        </div>
        <div>
          <label htmlFor="tl-jd" className="dash-label">
            Match a job description
          </label>
          <div className="relative">
            <input
              id="tl-jd"
              type="search"
              className="dash-input pr-10"
              placeholder="Keywords from the JD, e.g. cloud engineer, aws, terraform"
              value={f.jd}
              onChange={(e) => set({ jd: e.target.value })}
              aria-describedby="tl-jd-hint"
            />
            <Sparkles className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-[var(--dash-orange)]" aria-hidden="true" />
          </div>
          <p id="tl-jd-hint" className="mt-1.5 text-xs text-[var(--dash-muted)]">
            Separate terms with commas. Best matches come first.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="dash-scroll-row -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div className="dash-tabs" role="group" aria-label="Filter by status">
            {(["ALL", "PLACED", "UNPLACED", "BENCH"] as const).map((s) => (
              <button key={s} type="button" className="dash-tab" aria-pressed={f.status === s} onClick={() => set({ status: s })} title={s === "ALL" ? undefined : STATUS_HELP[s]}>
                {s === "ALL" ? "All" : STATUS_LABEL[s]}
                <span className="ml-1.5 text-[var(--dash-faint)]">{s === "ALL" ? people.length : counts(s)}</span>
              </button>
            ))}
          </div>
        </div>
        {anyFilter && (
          <button type="button" className="dash-btn-ghost sm:ml-auto" onClick={() => setF(NO_FILTERS)}>
            <X className="size-4" aria-hidden="true" /> Clear all
          </button>
        )}
      </div>

      <details className="dash-card group" open={extraFilters > 0 || undefined}>
        <summary className="flex min-h-[44px] cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-semibold sm:px-5 [&::-webkit-details-marker]:hidden">
          <SlidersHorizontal className="size-4" aria-hidden="true" /> More filters
          {extraFilters > 0 && <span className="dash-count">{extraFilters}</span>}
          <span className="ml-auto text-xs font-normal text-[var(--dash-muted)] group-open:hidden">Title, skills, visa, role type…</span>
        </summary>
        <div className="space-y-5 border-t border-[var(--dash-line)] p-4 sm:p-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Select id="tl-title" label="Title" value={f.title} onChange={(v) => set({ title: v })} options={options.titles} all="Any title" />
            <Select id="tl-visa" label="Visa" value={f.visa} onChange={(v) => set({ visa: v })} options={options.visas} all="Any visa" />
            <Select
              id="tl-open"
              label="Open to (role type)"
              value={f.openTo}
              onChange={(v) => set({ openTo: v as Filters["openTo"] })}
              options={(Object.keys(EMPLOYMENT) as JobType[]).map((t) => ({
                value: t,
                label: EMPLOYMENT[t].label,
              }))}
              all="Any role type"
            />
            <Select
              id="tl-mode"
              label="Work mode"
              value={f.workMode}
              onChange={(v) => set({ workMode: v as Filters["workMode"] })}
              options={["Remote", "Hybrid", "Onsite"]}
              all="Any work mode"
            />
            <Select id="tl-avail" label="Available to start" value={f.available} onChange={(v) => set({ available: v })} options={options.available} all="Any time" />
            <Select
              id="tl-years"
              label="Relevant experience"
              value={f.minYears}
              onChange={(v) => set({ minYears: v })}
              options={["2", "3", "5", "7"].map((y) => ({
                value: y,
                label: `${y}+ years`,
              }))}
              all="Any experience"
            />
          </div>
          <label className="flex min-h-[44px] items-center gap-2.5 text-sm font-medium sm:min-h-0">
            <input type="checkbox" className="size-4 accent-[var(--dash-orange)]" checked={f.relocates} onChange={(e) => set({ relocates: e.target.checked })} />
            Open to relocating
          </label>
          <fieldset>
            <legend className="dash-label">Skills (must have all selected)</legend>
            <div className="flex flex-wrap gap-2">
              {options.skills.map((k) => {
                const on = f.skills.includes(k);
                return (
                  <button
                    key={k}
                    type="button"
                    aria-pressed={on}
                    onClick={() =>
                      set({
                        skills: on ? f.skills.filter((x) => x !== k) : [...f.skills, k],
                      })
                    }
                    className={cn(
                      "min-h-[36px] rounded-full border px-3 text-sm font-medium transition",
                      on ? "border-[var(--dash-orange)] bg-[var(--dash-orange)] text-white" : "border-[var(--dash-line-strong)] bg-white hover:bg-[var(--dash-side)]",
                    )}
                  >
                    {k}
                  </button>
                );
              })}
            </div>
          </fieldset>
        </div>
      </details>

      {placements.error && <ErrorNote text={`Placed / on bench can't be shown: ${placements.error}`} onRetry={placements.reload} />}

      <p className="text-sm text-[var(--dash-muted)]" role="status">
        {shown.length} of {people.length} students
        {terms.length ? `, best match for “${f.jd.trim()}” first` : ""}
        {isAdmin && deleted.length > 0 && (
          <>
            {" · "}
            {deleted.length} deleted in this demo{" "}
            <button type="button" className="font-semibold text-[var(--dash-orange-ink)] hover:underline" onClick={restoreDeletedStudents}>
              Restore
            </button>
          </>
        )}
      </p>

      {shown.length === 0 ? (
        <div className="dash-card px-4 py-12 text-center">
          <p className="text-sm font-semibold">No one matches</p>
          <p className="mt-1 text-sm text-[var(--dash-muted)]">Take out a filter or a keyword.</p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
          {shown.map(({ p, hits }) => (
            <li key={p.pixelitId}>
              <TalentCard person={p} hits={hits} terms={terms.length} selectedSkills={f.skills} onOpen={() => setOpenPic(p.pixelitId)} />
            </li>
          ))}
        </ul>
      )}
      {toast}
    </div>
  );
}

function Select({
  id,
  label,
  value,
  onChange,
  options,
  all,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: (string | { value: string; label: string })[];
  all: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="dash-label">
        {label}
      </label>
      <select id={id} className="dash-input" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{all}</option>
        {options.map((o) => {
          const { value: v, label: l } = typeof o === "string" ? { value: o, label: o } : o;
          return (
            <option key={v} value={v}>
              {l}
            </option>
          );
        })}
      </select>
    </div>
  );
}

/** A big card: photo, name, PIC, title, status, top skills. The whole card opens the student. */
function TalentCard({ person: p, hits, terms, selectedSkills, onOpen }: { person: Person; hits: string[]; terms: number; selectedSkills: string[]; onOpen: () => void }) {
  const matched = (k: string) => selectedSkills.includes(k) || hits.some((h) => k.toLowerCase().includes(h) || h.includes(k.toLowerCase()));
  const skills = [...p.skills].sort((a, b) => Number(matched(b)) - Number(matched(a))).slice(0, 4);
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`${p.fullName} (${p.pixelitId}), ${p.targetRole}, ${STATUS_LABEL[p.status]}. Open profile.`}
      className="dash-card flex h-full w-full flex-col justify-start overflow-hidden text-center transition hover:-translate-y-0.5 hover:border-[var(--dash-line-strong)] hover:shadow-[0_18px_40px_-28px_rgb(4_19_39/0.55)]"
    >
      <span className="dash-hero block h-20 w-full flex-none rounded-none border-0" aria-hidden="true" />
      <span className="relative z-10 -mt-12 flex flex-col items-center px-5 pb-6">
        <span className="rounded-full ring-4 ring-white">
          <Avatar name={p.fullName} size={88} />
        </span>
        <span className="mt-4 block text-xl font-semibold">{p.fullName}</span>
        <span className="mt-0.5 block text-xs font-semibold tracking-wider text-[var(--dash-muted)]">{p.pixelitId}</span>
        <span className="mt-1 block text-[0.9375rem] font-medium text-[var(--dash-cyan-ink)]">{p.targetRole}</span>
        <span className="mt-2 flex flex-wrap justify-center gap-1.5">
          <Chip tone={STATUS_TONE[p.status]}>
            {p.status === "PLACED" && p.placement ? `Placed at ${p.placement.endClientName ?? p.placement.client.name}` : STATUS_LABEL[p.status]}
          </Chip>
          {terms > 0 && <Chip tone="warn">{`Matches ${hits.length} of ${terms}`}</Chip>}
        </span>
        <span className="mt-3 flex flex-wrap justify-center gap-1.5">
          {skills.map((k) => (
            <span
              key={k}
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-medium",
                matched(k) ? "bg-[var(--dash-orange-tint)] text-[var(--dash-orange-ink)]" : "bg-[var(--dash-side)] text-[var(--dash-muted)]",
              )}
            >
              {k}
            </span>
          ))}
        </span>
      </span>
    </button>
  );
}

/** One student, filling the page: who they are, where they're placed, their whole profile. */
function TalentDetail({ person: p, onBack, onDeleted }: { person: Person; onBack: () => void; onDeleted?: (message: string) => void }) {
  const [showDocs, setShowDocs] = useState(false);
  const back = useRef<HTMLButtonElement>(null);
  useEffect(() => back.current?.focus(), []);

  return (
    <div className="space-y-6">
      <button ref={back} type="button" className="dash-btn-ghost" onClick={onBack}>
        <ArrowLeft className="size-4" aria-hidden="true" /> All talent
      </button>

      <section className="dash-hero p-5 sm:p-8" aria-labelledby="talent-name">
        <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
          <span className="rounded-full ring-4 ring-white">
            <Avatar name={p.fullName} size={112} />
          </span>
          <div className="min-w-0 flex-1">
            <h1 id="talent-name" className="dash-title">
              {p.fullName}
            </h1>
            <p className="mt-2 text-lg font-medium text-[var(--dash-cyan-ink)]">{p.targetRole}</p>
            <p className="text-[0.9375rem] text-[var(--dash-muted)]">{p.headline}</p>
            <p className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
              <Chip tone="ink">{p.pixelitId}</Chip>
              <Chip tone={STATUS_TONE[p.status]}>{STATUS_LABEL[p.status]}</Chip>
              <Chip>{p.workMode === "Any" ? "Any work mode" : p.workMode}</Chip>
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto">
            <button type="button" className="dash-btn-ghost" onClick={() => setShowDocs(true)}>
              <FileText className="size-4" aria-hidden="true" /> Documents
            </button>
            {onDeleted && <DeleteStudentButton student={p} onDeleted={onDeleted} />}
          </div>
        </div>
      </section>

      <DocumentsWindow name={p.fullName} open={showDocs} onClose={() => setShowDocs(false)} />

      <Card title={p.status === "PLACED" ? "Current placement" : p.status === "BENCH" ? "On bench" : "Not placed yet"}>
        {p.status === "PLACED" && p.placement ? (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
            <Detail label="Company">{p.placement.endClientName ?? p.placement.client.name}</Detail>
            <Detail label="Role">{p.placement.role}</Detail>
            <Detail label="Role type">{EMPLOYMENT[p.placement.employmentType].label}</Detail>
            <Detail label="Since">{date(p.placement.startDate)}</Detail>
          </dl>
        ) : p.status === "BENCH" ? (
          <p className="text-sm">
            {p.placement
              ? `Last placed at ${p.placement.endClientName ?? p.placement.client.name} as ${p.placement.role}, until ${date(p.placement.endDate)}.`
              : `Their last project ended ${date(p.benchSince)}.`}{" "}
            Available: {p.availableToStart.toLowerCase()}.
          </p>
        ) : (
          <p className="text-sm">
            Looking for {p.targetRole} roles ({p.openTo.map((t) => EMPLOYMENT[t].label.toLowerCase()).join(", ")}
            ). Available: {p.availableToStart.toLowerCase()}.
          </p>
        )}
        {p.placement && (
          <Link href="/portal/admin/placements" className="mt-3 inline-block text-sm font-semibold text-[var(--dash-orange-ink)] hover:underline">
            Open Placements
          </Link>
        )}
      </Card>

      <StudentProfile student={p} email={p.email} />
    </div>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="dash-card dash-card-pad">
      <h2 className="dash-section-title">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}
