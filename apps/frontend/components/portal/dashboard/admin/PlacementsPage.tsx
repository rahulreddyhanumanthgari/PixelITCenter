"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, FileText, Pencil, Plus, Search } from "lucide-react";
import { registeredStudents, studentByEmail, type RegisteredStudent } from "@/content/registered-students";
import { cn } from "@/lib/utils";
import { Avatar, Chip, PageHeader, useToast } from "../ui";
import { adminApi, type Client, type EmploymentType, type ExtensionStatus, type Placement, type PlacementInput, type Who } from "./api";
import { DocumentsWindow, StudentProfile } from "./StudentProfile";
import { can, Choice, date, EMPLOYMENT, Detail, Empty, ErrorNote, Field, fieldErrors, errorText, hours, Loading, Panel, usd, useApi, useWho } from "./ui";

// Placements: who is placed where, at what rates, until when.
//
//   - Big cards: photo, name, company and role only.
//   - Click a card: the other cards go away and that student's placement fills
//     the page (details, rates, recent timesheets). "All placements" goes back.
//   - Add placement: one question at a time, Next → Next → … → review → save.
//
// Admins add and edit; accounts sees the rates; recruiters and verifiers see
// placements without any rates (the API leaves them out for those roles).

const STATUS: Record<ExtensionStatus, { label: string; tone: "good" | "warn" | "ink" | undefined; body: string }> = {
  ACTIVE: { label: "Active", tone: "good", body: "Working at the client now." },
  EXTENSION_PENDING: { label: "Extension pending", tone: "warn", body: "The contract may be extended; waiting to hear." },
  EXTENDED: { label: "Extended", tone: "ink", body: "The client extended the contract." },
  ENDED: { label: "Ended", tone: undefined, body: "The placement is over." },
};

const FILTERS: ("ALL" | ExtensionStatus)[] = ["ALL", "ACTIVE", "EXTENSION_PENDING", "EXTENDED", "ENDED"];

/** The company the consultant works at: the end client when there is one. */
const companyOf = (p: Placement) => p.endClientName ?? p.client.name;

export function PlacementsPage() {
  const who = useWho();
  const [status, setStatus] = useState<"ALL" | ExtensionStatus>("ALL");
  const [clientId, setClientId] = useState("");
  const [q, setQ] = useState("");
  const list = useApi(who ? () => adminApi.placements(who) : null, [who?.email, who?.role]);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Placement | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [toast, showToast] = useToast();
  const isAdmin = can(who, "admin");

  const all = useMemo(() => list.data?.placements ?? [], [list.data]);
  const money = all.some((p) => p.billRate !== undefined);
  const clients = useMemo(() => [...new Map(all.map((p) => [p.client.id, p.client.name])).entries()].sort((a, b) => a[1].localeCompare(b[1])), [all]);
  const needle = q.trim().toLowerCase();
  const shown = all.filter(
    (p) =>
      (status === "ALL" || p.extensionStatus === status) &&
      (!clientId || p.client.id === clientId) &&
      (!needle ||
        [p.consultantName, p.role, p.client.name, p.endClientName ?? "", studentByEmail(p.consultantEmail)?.pixelitId ?? ""].some((v) => v.toLowerCase().includes(needle))),
  );
  const open = openId ? all.find((p) => p.id === openId) : undefined;

  // Opening or closing a placement starts at the top of the page.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [openId]);

  const saved = (message: string) => {
    setAdding(false);
    setEditing(null);
    list.reload();
    showToast(message);
  };

  const dialogs = who && isAdmin && (
    <>
      <AddPlacementWizard who={who} open={adding} known={all} onClose={() => setAdding(false)} onSaved={saved} />
      <EditPlacementPanel who={who} placement={editing} onClose={() => setEditing(null)} onSaved={saved} />
    </>
  );

  if (open) {
    return (
      <>
        <PlacementDetail who={who} placement={open} onBack={() => setOpenId(null)} onEdit={isAdmin ? () => setEditing(open) : undefined} />
        {dialogs}
        {toast}
      </>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Placements" body={money ? "Who is placed where. Open a card to see everything about that placement." : "Who is placed where and until when."}>
        {isAdmin && (
          <button type="button" className="dash-btn" data-tone="orange" onClick={() => setAdding(true)}>
            <Plus className="size-4" aria-hidden="true" /> Add placement
          </button>
        )}
      </PageHeader>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="dash-scroll-row -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div className="dash-tabs" role="group" aria-label="Filter by status">
            {FILTERS.map((f) => (
              <button key={f} type="button" className="dash-tab" aria-pressed={status === f} onClick={() => setStatus(f)}>
                {f === "ALL" ? "All" : STATUS[f].label}
                <span className="ml-1.5 text-[var(--dash-faint)]">{f === "ALL" ? all.length : all.filter((p) => p.extensionStatus === f).length}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:ml-auto lg:max-w-xl">
          <label className="sr-only" htmlFor="pl-client">
            Client
          </label>
          <select id="pl-client" className="dash-input" value={clientId} onChange={(e) => setClientId(e.target.value)}>
            <option value="">All clients</option>
            {clients.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
          <div className="relative">
            <label className="sr-only" htmlFor="pl-search">
              Search placements
            </label>
            <input id="pl-search" type="search" className="dash-input pr-10" placeholder="Name, PIC ID, role, company…" value={q} onChange={(e) => setQ(e.target.value)} />
            <Search className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-[var(--dash-muted)]" aria-hidden="true" />
          </div>
        </div>
      </div>

      {list.error && <ErrorNote text={list.error} onRetry={list.reload} />}
      {list.loading && !list.data ? (
        <Loading />
      ) : list.data ? (
        shown.length === 0 ? (
          <div className="dash-card">
            <Empty title="No placements match" body={all.length ? "Try another filter." : isAdmin ? "Add the first one with “Add placement”." : undefined} />
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
            {shown.map((p) => (
              <li key={p.id}>
                <PlacementCard placement={p} onOpen={() => setOpenId(p.id)} />
              </li>
            ))}
          </ul>
        )
      ) : null}

      {dialogs}
      {toast}
    </div>
  );
}

/** A big card: photo, name, company, role. The whole card opens the placement. */
function PlacementCard({ placement: p, onOpen }: { placement: Placement; onOpen: () => void }) {
  const pic = studentByEmail(p.consultantEmail)?.pixelitId;
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`${p.consultantName}${pic ? ` (${pic})` : ""}, ${p.role} at ${companyOf(p)}. Open placement.`}
      className="dash-card flex h-full w-full flex-col justify-start overflow-hidden text-center transition hover:-translate-y-0.5 hover:border-[var(--dash-line-strong)] hover:shadow-[0_18px_40px_-28px_rgb(4_19_39/0.55)]"
    >
      <span className="dash-hero block h-20 w-full flex-none rounded-none border-0" aria-hidden="true" />
      <span className="relative z-10 -mt-12 flex flex-col items-center px-5 pb-7">
        <span className="rounded-full ring-4 ring-white">
          <Avatar name={p.consultantName} size={88} />
        </span>
        <span className="mt-4 block text-xl font-semibold">{p.consultantName}</span>
        {pic && <span className="mt-0.5 block text-xs font-semibold tracking-wider text-[var(--dash-muted)]">{pic}</span>}
        <span className="mt-1 block text-[0.9375rem] font-medium text-[var(--dash-cyan-ink)]">{companyOf(p)}</span>
        <span className="mt-0.5 block text-sm text-[var(--dash-muted)]">
          {p.role} · {EMPLOYMENT[p.employmentType].label}
        </span>
      </span>
    </button>
  );
}

/** One placement, filling the page. */
function PlacementDetail({ who, placement: p, onBack, onEdit }: { who: Who | null; placement: Placement; onBack: () => void; onEdit?: () => void }) {
  const seesTimesheets = can(who, "admin", "verifier", "accounts");
  const timesheets = useApi(who && seesTimesheets ? () => adminApi.timesheets(who, { consultant: p.consultantName }) : null, [p.id, who?.role]);
  const mine = (timesheets.data?.timesheets ?? []).filter((t) => t.placement.id === p.id);
  const money = p.billRate !== undefined;
  const back = useRef<HTMLButtonElement>(null);
  useEffect(() => back.current?.focus(), []);
  const [showDocs, setShowDocs] = useState(false);
  const student = studentByEmail(p.consultantEmail);

  return (
    <div className="space-y-6">
      <button ref={back} type="button" className="dash-btn-ghost" onClick={onBack}>
        <ArrowLeft className="size-4" aria-hidden="true" /> All placements
      </button>

      <section className="dash-hero p-5 sm:p-8" aria-labelledby="placement-name">
        <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
          <span className="rounded-full ring-4 ring-white">
            <Avatar name={p.consultantName} size={112} />
          </span>
          <div className="min-w-0 flex-1">
            <h1 id="placement-name" className="dash-title">
              {p.consultantName}
            </h1>
            <p className="mt-2 text-lg font-medium text-[var(--dash-cyan-ink)]">{companyOf(p)}</p>
            <p className="text-[0.9375rem] text-[var(--dash-muted)]">{p.role}</p>
            <p className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
              {student && <Chip tone="ink">{student.pixelitId}</Chip>}
              <Chip>{EMPLOYMENT[p.employmentType].label}</Chip>
              <Chip tone={STATUS[p.extensionStatus].tone}>{STATUS[p.extensionStatus].label}</Chip>
              {!p.consultantLinked && <Chip>Hasn&apos;t signed in yet</Chip>}
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto">
            <button type="button" className="dash-btn-ghost" onClick={() => setShowDocs(true)}>
              <FileText className="size-4" aria-hidden="true" /> Documents
            </button>
            {onEdit && (
              <button type="button" className="dash-btn" onClick={onEdit}>
                <Pencil className="size-4" aria-hidden="true" /> Edit placement
              </button>
            )}
          </div>
        </div>
      </section>

      <DocumentsWindow name={p.consultantName} open={showDocs} onClose={() => setShowDocs(false)} />

      <div className={cn("grid gap-4 sm:gap-5", money && "lg:grid-cols-2")}>
        <InfoCard title="Placement">
          <Detail label="Email">{p.consultantEmail}</Detail>
          <Detail label={p.client.type === "VENDOR" ? "Vendor" : "Client"}>{p.client.name}</Detail>
          <Detail label="End client">{p.endClientName ?? "–"}</Detail>
          <Detail label="Role">{p.role}</Detail>
          <Detail label="Role type">{EMPLOYMENT[p.employmentType].label}</Detail>
          <Detail label="Start date">{date(p.startDate)}</Detail>
          <Detail label="Contract end">{date(p.endDate)}</Detail>
        </InfoCard>
        {money && (
          <InfoCard title="Rates">
            <Detail label="Bill rate (charged to the client)">
              <span className="text-xl">{usd(p.billRate)}</span>/h
            </Detail>
            <Detail label="Pay rate (paid to the student)">
              <span className="text-xl">{usd(p.payRate)}</span>/h
            </Detail>
            <Detail label="Margin">
              <span className={cn("text-xl", p.marginPerHour !== undefined && p.marginPerHour < 0 && "text-[var(--dash-red-ink)]")}>{usd(p.marginPerHour)}</span>/h
            </Detail>
          </InfoCard>
        )}
      </div>

      <StudentProfile student={student} email={p.consultantEmail} />

      {seesTimesheets && (
        <section className="dash-card dash-card-pad" aria-labelledby="placement-timesheets">
          <div className="flex items-center justify-between gap-2">
            <h2 id="placement-timesheets" className="dash-section-title">
              Timesheets <span className="dash-count">{mine.length}</span>
            </h2>
            <Link href="/portal/admin/timesheets" className="text-sm font-semibold text-[var(--dash-orange-ink)] hover:underline">
              Open Timesheets
            </Link>
          </div>
          {timesheets.error ? (
            <div className="mt-3">
              <ErrorNote text={timesheets.error} onRetry={timesheets.reload} />
            </div>
          ) : timesheets.loading && !timesheets.data ? (
            <Loading />
          ) : mine.length === 0 ? (
            <p className="mt-3 text-sm text-[var(--dash-muted)]">No timesheets yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-[var(--dash-line)]">
              {mine.map((t) => (
                <li key={t.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3 text-sm">
                  <span className="min-w-[8rem] font-semibold">{t.monthLabel}</span>
                  <span className="text-[var(--dash-muted)]">{hours(t.approvedHours ?? t.hours)}</span>
                  {t.invoice && <span className="text-[var(--dash-muted)]">{t.invoice.number}</span>}
                  <span className="ml-auto">
                    <Chip tone={t.status === "REJECTED" ? "bad" : t.status === "RECEIVED" ? "warn" : "good"}>{t.statusLabel}</Chip>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

function InfoCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="dash-card dash-card-pad">
      <h2 className="dash-section-title">{title}</h2>
      <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">{children}</dl>
    </section>
  );
}

// --- Add placement: one question at a time --------------------------------------------

const emptyDraft = { consultantName: "", consultantEmail: "", clientId: "", endClientName: "", role: "", billRate: "", payRate: "", startDate: "", endDate: "", extensionStatus: "ACTIVE" as ExtensionStatus, employmentType: "CONTRACT" as EmploymentType };
type Draft = typeof emptyDraft;
type Key = keyof Draft;

const money2 = (v: string) => /^\d+(\.\d{1,2})?$/.test(v) && Number(v) > 0;

type Step = {
  key: Key;
  question: string;
  hint?: string;
  optional?: boolean;
  check?: (v: string, d: Draft) => string | null;
};

const STEPS: Step[] = [
  { key: "consultantEmail", question: "Which student is being placed?", hint: "Search by name or PixelIT ID. Their profile comes with them, so nothing is typed twice." },
  { key: "clientId", question: "Which client or vendor?", hint: "Who PixelIT bills for this placement." },
  { key: "endClientName", question: "Who is the end client?", hint: "The company they actually work at. Leave empty if it's the client itself.", optional: true },
  { key: "role", question: "What's their role?", hint: "e.g. Cloud Engineer (AWS)" },
  { key: "employmentType", question: "What kind of role is it?" },
  { key: "billRate", question: "Bill rate per hour?", hint: "What the client is charged, in dollars.", check: (v) => (money2(v) ? null : "Enter an amount like 92 or 92.50.") },
  { key: "payRate", question: "Pay rate per hour?", hint: "What the student is paid, in dollars. Students see only this rate.", check: (v) => (money2(v) ? null : "Enter an amount like 65 or 65.50.") },
  { key: "startDate", question: "When do they start?" },
  { key: "endDate", question: "When does the contract end?", hint: "Leave empty if there's no end date yet.", optional: true, check: (v, d) => (v && d.startDate && v < d.startDate ? "The end date can't be before the start date." : null) },
  { key: "extensionStatus", question: "What's the status?" },
];

function AddPlacementWizard({ who, open, known, onClose, onSaved }: { who: Who; open: boolean; known: Placement[]; onClose: () => void; onSaved: (message: string) => void }) {
  const clients = useApi(open ? () => adminApi.clients(who) : null, [open]);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [wasOpen, setWasOpen] = useState(open);

  // Each time it opens, start from the first question.
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setDraft(emptyDraft);
      setStep(0);
      setError(null);
      setProblem(null);
    }
  }

  const review = step === STEPS.length;
  const current = STEPS[step];
  // Put the cursor in the new question (the chosen option, or the first one).
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      const form = document.getElementById("wizard-form");
      const target = form?.querySelector<HTMLElement>('[aria-checked="true"], input, [role="radio"]');
      target?.focus();
    }, 50);
    return () => clearTimeout(t);
  }, [open, step]);

  const set = (patch: Partial<Draft>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setError(null);
  };

  const clientList = clients.data?.clients ?? [];
  const clientOf = (id: string) => clientList.find((c) => c.id === id);

  function next(e?: FormEvent) {
    e?.preventDefault();
    if (review) return void save();
    if (!current) return;
    const v = draft[current.key].trim();
    if (!v && !current.optional) return setError(current.key === "consultantEmail" ? "Pick a student to go on." : "Please answer this to go on.");
    const why = v ? current.check?.(v, draft) : null;
    if (why) return setError(why);
    // Choosing a vendor fills in its end client.
    if (current.key === "clientId" && !draft.endClientName) set({ endClientName: clientOf(v)?.endClientName ?? "" });
    setError(null);
    setStep(step + 1);
  }

  async function save() {
    setBusy(true);
    setProblem(null);
    const body: PlacementInput = {
      clientId: draft.clientId,
      consultantName: draft.consultantName.trim(),
      consultantEmail: draft.consultantEmail.trim(),
      endClientName: draft.endClientName.trim() || null,
      role: draft.role.trim(),
      billRate: Number(draft.billRate),
      payRate: Number(draft.payRate),
      startDate: draft.startDate,
      endDate: draft.endDate || null,
      extensionStatus: draft.extensionStatus,
      employmentType: draft.employmentType,
    };
    try {
      await adminApi.createPlacement(who, body);
      onSaved(`${body.consultantName} is placed at ${body.endClientName ?? clientOf(body.clientId)?.name ?? "the client"}.`);
    } catch (err) {
      // Go back to the first question the server didn't accept.
      const fields = fieldErrors(err);
      const at = STEPS.findIndex((s) => fields[s.key]);
      if (at >= 0) {
        setStep(at);
        setError(fields[STEPS[at]!.key]!);
      } else setProblem(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  const shown = (k: Key) => {
    const v = draft[k];
    if (!v) return "–";
    if (k === "consultantEmail") return `${draft.consultantName} · ${studentByEmail(v)?.pixelitId ?? v}`;
    if (k === "clientId") return clientOf(v)?.name ?? "–";
    if (k === "billRate" || k === "payRate") return `${usd(Number(v))}/h`;
    if (k === "startDate" || k === "endDate") return date(v);
    if (k === "extensionStatus") return STATUS[v as ExtensionStatus].label;
    if (k === "employmentType") return EMPLOYMENT[v as EmploymentType].label;
    return v;
  };
  const margin = draft.billRate && draft.payRate ? Number(draft.billRate) - Number(draft.payRate) : null;
  const inputProps = (k: Key) => ({
    id: `wiz-${k}`,
    className: "dash-input h-14 text-lg",
    value: draft[k],
    "aria-invalid": Boolean(error) || undefined,
    "aria-describedby": error ? "wiz-error" : current?.hint ? "wiz-hint" : undefined,
    onChange: (e: { target: { value: string } }) => set({ [k]: e.target.value } as Partial<Draft>),
  });

  return (
    <Panel
      center
      open={open}
      title="Add a placement"
      subtitle={review ? "Check everything, then add it." : `Question ${step + 1} of ${STEPS.length}`}
      onClose={onClose}
      footer={
        <>
          {step > 0 && (
            <button type="button" className="dash-btn-ghost mr-auto" onClick={() => (setStep(step - 1), setError(null))} disabled={busy}>
              <ArrowLeft className="size-4" aria-hidden="true" /> Back
            </button>
          )}
          <button type="submit" form="wizard-form" className="dash-btn" data-tone="orange" disabled={busy}>
            {review ? (
              <>
                <Check className="size-4" aria-hidden="true" /> {busy ? "Adding…" : "Add placement"}
              </>
            ) : (
              <>
                {current?.optional && !draft[current.key] ? "Skip" : "Next"} <ArrowRight className="size-4" aria-hidden="true" />
              </>
            )}
          </button>
        </>
      }
    >
      <div className="dash-bar mb-8" aria-hidden="true">
        <span style={{ width: `${(Math.min(step, STEPS.length) / STEPS.length) * 100}%` }} />
      </div>

      <form id="wizard-form" onSubmit={next} noValidate>
        {review ? (
          <div className="space-y-4">
            {problem && <ErrorNote text={problem} />}
            <div className="flex items-center gap-4 rounded-2xl bg-[var(--dash-side)] p-4">
              <Avatar name={draft.consultantName} size={56} />
              <div className="min-w-0">
                <p className="text-lg font-semibold">{draft.consultantName}</p>
                <p className="text-sm text-[var(--dash-cyan-ink)]">{draft.endClientName || clientOf(draft.clientId)?.name}</p>
                <p className="text-sm text-[var(--dash-muted)]">{draft.role}</p>
              </div>
            </div>
            <ul className="divide-y divide-[var(--dash-line)] rounded-2xl border border-[var(--dash-line)]">
              {STEPS.map((s, i) => (
                <li key={s.key} className="flex items-center gap-3 px-4 py-3">
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs text-[var(--dash-muted)]">{s.question}</span>
                    <span className="block text-sm font-medium break-words">{shown(s.key)}</span>
                  </span>
                  <button type="button" className="text-sm font-semibold text-[var(--dash-orange-ink)] hover:underline" onClick={() => setStep(i)}>
                    Change
                  </button>
                </li>
              ))}
            </ul>
            {margin !== null && (
              <p className={cn("text-sm", margin < 0 ? "font-semibold text-[var(--dash-red-ink)]" : "text-[var(--dash-muted)]")}>
                Margin: {usd(margin)} per hour{margin < 0 ? ". The bill rate is below the pay rate; check both." : "."}
              </p>
            )}
          </div>
        ) : current ? (
          <div>
            <label htmlFor={`wiz-${current.key}`} className="block text-2xl font-semibold">
              {current.question}
              {current.optional && <span className="ml-2 text-base font-normal text-[var(--dash-muted)]">(optional)</span>}
            </label>
            {current.hint && (
              <p id="wiz-hint" className="mt-2 text-sm text-[var(--dash-muted)]">
                {current.hint}
              </p>
            )}

            <div className="mt-6">
              {current.key === "clientId" ? (
                <ClientChoice clients={clientList} loading={clients.loading} value={draft.clientId} onPick={(id) => set({ clientId: id })} />
              ) : current.key === "employmentType" ? (
                <div role="radiogroup" aria-labelledby="wiz-employmentType" className="grid gap-2">
                  {(Object.keys(EMPLOYMENT) as EmploymentType[]).map((t) => (
                    <Choice key={t} on={draft.employmentType === t} onClick={() => set({ employmentType: t })} title={EMPLOYMENT[t].label} body={EMPLOYMENT[t].body} />
                  ))}
                </div>
              ) : current.key === "extensionStatus" ? (
                <div role="radiogroup" aria-labelledby="wiz-extensionStatus" className="grid gap-2">
                  {(Object.keys(STATUS) as ExtensionStatus[]).map((s) => (
                    <Choice key={s} on={draft.extensionStatus === s} onClick={() => set({ extensionStatus: s })} title={STATUS[s].label} body={STATUS[s].body} />
                  ))}
                </div>
              ) : current.key === "consultantEmail" ? (
                <StudentPicker value={draft.consultantEmail} placements={known} onPick={(st) => set({ consultantEmail: st.email, consultantName: st.fullName })} />
              ) : current.key === "billRate" || current.key === "payRate" ? (
                <div className="relative">
                  <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-lg text-[var(--dash-muted)]" aria-hidden="true">
                    $
                  </span>
                  <input {...inputProps(current.key)} className="dash-input h-14 pl-9 text-lg" type="number" inputMode="decimal" min="0" step="0.01" />
                </div>
              ) : current.key === "startDate" || current.key === "endDate" ? (
                <input {...inputProps(current.key)} type="date" />
              ) : (
                <input {...inputProps(current.key)} autoComplete="off" />
              )}
            </div>

            {current.key === "payRate" && margin !== null && !error && (
              <p className={cn("mt-3 text-sm", margin < 0 ? "font-semibold text-[var(--dash-red-ink)]" : "text-[var(--dash-muted)]")}>
                Margin: {usd(margin)} per hour.
              </p>
            )}
            {error && (
              <p id="wiz-error" role="alert" className="mt-3 text-sm font-medium text-[var(--dash-red-ink)]">
                {error}
              </p>
            )}
          </div>
        ) : null}
      </form>
    </Panel>
  );
}

/**
 * Pick a registered student: search by name or PixelIT ID. Students with the
 * same name are told apart by their ID, email and city. FRONT END ONLY: the
 * list is the demo student directory; with the backend it's a student search.
 */
function StudentPicker({ value, placements, onPick }: { value: string; placements: Placement[]; onPick: (s: RegisteredStudent) => void }) {
  const [q, setQ] = useState("");
  const needle = q.trim().toLowerCase();
  const found = registeredStudents.filter((s) => !needle || s.fullName.toLowerCase().includes(needle) || s.pixelitId.toLowerCase().includes(needle) || s.email.includes(needle));
  const placedAt = (email: string) => placements.find((p) => p.consultantEmail === email && p.extensionStatus !== "ENDED");

  return (
    <div className="space-y-3">
      <div className="relative">
        <label htmlFor="wiz-student-search" className="sr-only">
          Search students by name or PixelIT ID
        </label>
        <input id="wiz-student-search" type="search" className="dash-input h-12 pr-10" placeholder="Name or PIC-…" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" />
        <Search className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-[var(--dash-muted)]" aria-hidden="true" />
      </div>
      {found.length === 0 ? (
        <p className="text-sm text-[var(--dash-muted)]">No registered student matches. Students register on the portal first and get their PixelIT ID then.</p>
      ) : (
        <div role="radiogroup" aria-label="Students" className="grid max-h-[40dvh] gap-2 overflow-y-auto pr-1">
          {found.map((s) => {
            const on = value === s.email;
            const now = placedAt(s.email);
            return (
              <button
                key={s.pixelitId}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => onPick(s)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition",
                  on ? "border-[var(--dash-orange)] bg-[var(--dash-orange-tint)]" : "border-[var(--dash-line-strong)] hover:bg-[var(--dash-side)]",
                )}
              >
                <Avatar name={s.fullName} size={44} />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-x-2">
                    <span className="font-semibold">{s.fullName}</span>
                    <span className="text-xs font-bold tracking-wider text-[var(--dash-orange-ink)]">{s.pixelitId}</span>
                  </span>
                  <span className="block truncate text-xs text-[var(--dash-muted)]">
                    {s.email} · {s.location}
                  </span>
                  {now && <span className="block text-xs font-medium text-[var(--dash-orange-ink)]">Already placed at {companyOf(now)}</span>}
                </span>
                {on && <Check className="size-5 flex-none text-[var(--dash-orange)]" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ClientChoice({ clients, loading, value, onPick }: { clients: Client[]; loading: boolean; value: string; onPick: (id: string) => void }) {
  if (loading && !clients.length) return <Loading />;
  if (!clients.length) {
    return (
      <p className="text-sm text-[var(--dash-muted)]">
        No clients yet.{" "}
        <Link href="/portal/admin/clients" className="font-semibold text-[var(--dash-orange-ink)] hover:underline">
          Add one under Clients
        </Link>{" "}
        first.
      </p>
    );
  }
  return (
    <div role="radiogroup" aria-labelledby="wiz-clientId" className="grid max-h-[50dvh] gap-2 overflow-y-auto">
      {clients.map((c) => (
        <Choice
          key={c.id}
          on={value === c.id}
          onClick={() => onPick(c.id)}
          title={c.name}
          body={c.type === "VENDOR" ? `Vendor${c.endClientName ? ` · end client ${c.endClientName}` : ""}` : "Client"}
        />
      ))}
    </div>
  );
}

// --- Edit placement: every field on one form (quick changes) ------------------------------

const toDraft = (p: Placement): Draft => ({
  clientId: p.client.id,
  consultantName: p.consultantName,
  consultantEmail: p.consultantEmail,
  endClientName: p.endClientName ?? "",
  role: p.role,
  billRate: String(p.billRate ?? ""),
  payRate: String(p.payRate ?? ""),
  startDate: p.startDate,
  endDate: p.endDate ?? "",
  extensionStatus: p.extensionStatus,
  employmentType: p.employmentType,
});

function EditPlacementPanel({ who, placement, onClose, onSaved }: { who: Who; placement: Placement | null; onClose: () => void; onSaved: (message: string) => void }) {
  const clients = useApi(placement ? () => adminApi.clients(who) : null, [Boolean(placement)]);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [last, setLast] = useState(placement);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (placement !== last) {
    setLast(placement);
    setDraft(placement ? toDraft(placement) : emptyDraft);
    setErrors({});
    setProblem(null);
  }
  const edit = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));
  const input = (k: Key) => ({
    id: `pl-${k}`,
    className: "dash-input",
    value: draft[k],
    "aria-invalid": Boolean(errors[k]) || undefined,
    "aria-describedby": errors[k] ? `pl-${k}-error` : undefined,
    onChange: (e: { target: { value: string } }) => edit({ [k]: e.target.value } as Partial<Draft>),
  });

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!placement) return;
    setBusy(true);
    setErrors({});
    setProblem(null);
    try {
      await adminApi.updatePlacement(who, placement.id, {
        clientId: draft.clientId,
        consultantName: draft.consultantName,
        consultantEmail: draft.consultantEmail,
        endClientName: draft.endClientName || null,
        role: draft.role,
        billRate: Number(draft.billRate),
        payRate: Number(draft.payRate),
        startDate: draft.startDate,
        endDate: draft.endDate || null,
        extensionStatus: draft.extensionStatus,
        employmentType: draft.employmentType,
      });
      onSaved("Saved. New rates apply to invoices raised from now on.");
    } catch (err) {
      setErrors(fieldErrors(err));
      setProblem(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel
      open={Boolean(placement)}
      title={`Edit ${placement?.consultantName ?? ""}'s placement`}
      subtitle="Rate changes apply to invoices raised from now on."
      onClose={onClose}
      footer={
        <button type="submit" form="placement-form" className="dash-btn" data-tone="orange" disabled={busy}>
          {busy ? "Saving…" : "Save"}
        </button>
      }
    >
      <form id="placement-form" onSubmit={save} className="space-y-5" noValidate>
        {problem && <ErrorNote text={problem} />}
        <Field id="pl-clientId" label="Client or vendor" error={errors.clientId}>
          <select {...input("clientId")}>
            {clients.data?.clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.type === "VENDOR" ? " (vendor)" : ""}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="pl-consultantName" label="Student" error={errors.consultantName}>
            <input {...input("consultantName")} autoComplete="off" />
          </Field>
          <Field id="pl-consultantEmail" label="Portal email" error={errors.consultantEmail}>
            <input {...input("consultantEmail")} type="email" inputMode="email" autoComplete="off" />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="pl-role" label="Role" error={errors.role}>
            <input {...input("role")} />
          </Field>
          <Field id="pl-endClientName" label="End client (optional)" error={errors.endClientName}>
            <input {...input("endClientName")} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field id="pl-billRate" label="Bill rate ($/h)" error={errors.billRate}>
            <input {...input("billRate")} type="number" inputMode="decimal" min="0" step="0.01" />
          </Field>
          <Field id="pl-payRate" label="Pay rate ($/h)" error={errors.payRate}>
            <input {...input("payRate")} type="number" inputMode="decimal" min="0" step="0.01" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field id="pl-startDate" label="Start date" error={errors.startDate}>
            <input {...input("startDate")} type="date" />
          </Field>
          <Field id="pl-endDate" label="Contract end" error={errors.endDate}>
            <input {...input("endDate")} type="date" />
          </Field>
        </div>
        <Field id="pl-employmentType" label="Role type" error={errors.employmentType}>
          <select {...input("employmentType")}>
            {(Object.keys(EMPLOYMENT) as EmploymentType[]).map((t) => (
              <option key={t} value={t}>
                {EMPLOYMENT[t].label}
              </option>
            ))}
          </select>
        </Field>
        <Field id="pl-extensionStatus" label="Status" error={errors.extensionStatus}>
          <select {...input("extensionStatus")}>
            {(Object.keys(STATUS) as ExtensionStatus[]).map((s) => (
              <option key={s} value={s}>
                {STATUS[s].label}
              </option>
            ))}
          </select>
        </Field>
      </form>
    </Panel>
  );
}
