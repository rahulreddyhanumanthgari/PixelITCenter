"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, ExternalLink, Pencil, Plus, Search, Send } from "lucide-react";
import { Avatar, Chip, PageHeader, useToast } from "../ui";
import { adminApi, type Client, type ClientInput, type ClientType, type Who } from "./api";
import { can, Choice, Detail, Empty, ErrorNote, Field, fieldErrors, errorText, Loading, Panel, Toggle, useApi, useWho } from "./ui";

// Clients and vendors (admin, accounts). No logins: clients never sign in to the
// portal; invoices go to their billing email or VMS portal.
//
//   - Big cards: company logo (initials), name, client or vendor, contact.
//   - Click a card: the other cards go away and that client fills the page
//     (contact and billing, VMS, notes, its placements, unsent invoices).
//   - Add client: one question at a time in a small window, then review.
//
// Admins add, edit and archive; accounts reads and can send unsent invoices.

const TERMS = [15, 30, 45, 60, 90];
const typeLabel = (t: ClientType) => (t === "VENDOR" ? "Vendor" : "Client");

export function ClientsPage() {
  const who = useWho();
  const [showArchived, setShowArchived] = useState(false);
  const [type, setType] = useState<"ALL" | ClientType>("ALL");
  const [q, setQ] = useState("");
  const list = useApi(who ? () => adminApi.clients(who, showArchived) : null, [who?.email, who?.role, showArchived]);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [toast, showToast] = useToast();
  const isAdmin = can(who, "admin");

  const all = useMemo(() => list.data?.clients ?? [], [list.data]);
  const needle = q.trim().toLowerCase();
  const shown = all.filter(
    (c) =>
      (type === "ALL" || c.type === type) &&
      (!needle || [c.name, c.endClientName ?? "", c.contactPerson ?? "", c.billingEmail].some((v) => v.toLowerCase().includes(needle))),
  );
  const open = openId ? all.find((c) => c.id === openId) : undefined;

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [openId]);

  const done = (message: string, { close = false } = {}) => {
    setAdding(false);
    setEditing(null);
    if (close) setOpenId(null);
    list.reload();
    showToast(message);
  };

  const dialogs = who && isAdmin && (
    <>
      <AddClientWizard who={who} open={adding} onClose={() => setAdding(false)} onSaved={(m) => done(m)} />
      <EditClientPanel who={who} client={editing} onClose={() => setEditing(null)} onSaved={(m) => done(m)} />
    </>
  );

  if (open && who) {
    return (
      <>
        <ClientDetail
          who={who}
          client={open}
          onBack={() => setOpenId(null)}
          onEdit={isAdmin ? () => setEditing(open) : undefined}
          onChanged={(m, close) => done(m, { close })}
        />
        {dialogs}
        {toast}
      </>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Clients" body="End clients and vendors you bill. They don't sign in here. Open a card to see everything about that client.">
        {isAdmin && (
          <button type="button" className="dash-btn" data-tone="orange" onClick={() => setAdding(true)}>
            <Plus className="size-4" aria-hidden="true" /> Add client
          </button>
        )}
      </PageHeader>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="dash-scroll-row -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div className="dash-tabs" role="group" aria-label="Filter by type">
            {(["ALL", "CLIENT", "VENDOR"] as const).map((t) => (
              <button key={t} type="button" className="dash-tab" aria-pressed={type === t} onClick={() => setType(t)}>
                {t === "ALL" ? "All" : t === "CLIENT" ? "Clients" : "Vendors"}
                <span className="ml-1.5 text-[var(--dash-faint)]">{t === "ALL" ? all.length : all.filter((c) => c.type === t).length}</span>
              </button>
            ))}
          </div>
          <div className="dash-tabs" role="group" aria-label="Show">
            <button type="button" className="dash-tab" aria-pressed={!showArchived} onClick={() => setShowArchived(false)}>
              Active
            </button>
            <button type="button" className="dash-tab" aria-pressed={showArchived} onClick={() => setShowArchived(true)}>
              Archived
            </button>
          </div>
        </div>
        <div className="relative lg:ml-auto lg:w-80">
          <label className="sr-only" htmlFor="cl-search">
            Search clients
          </label>
          <input id="cl-search" type="search" className="dash-input pr-10" placeholder="Name, contact, email…" value={q} onChange={(e) => setQ(e.target.value)} />
          <Search className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-[var(--dash-muted)]" aria-hidden="true" />
        </div>
      </div>

      {list.error && <ErrorNote text={list.error} onRetry={list.reload} />}
      {list.loading && !list.data ? (
        <Loading />
      ) : list.data ? (
        shown.length === 0 ? (
          <div className="dash-card">
            <Empty title={showArchived ? "No archived clients" : all.length ? "No clients match" : "No clients yet"} body={isAdmin && !showArchived && !all.length ? "Add the first one with “Add client”." : undefined} />
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
            {shown.map((c) => (
              <li key={c.id}>
                <ClientCard client={c} onOpen={() => setOpenId(c.id)} />
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

/** A company "logo": its initials in a rounded square. */
function Logo({ name, size }: { name: string; size: number }) {
  return <Avatar name={name} size={size} className="rounded-2xl" />;
}

/** A big card: logo, name, client or vendor, contact. The whole card opens the client. */
function ClientCard({ client: c, onOpen }: { client: Client; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`${c.name}, ${typeLabel(c.type)}. Open client.`}
      className="dash-card block h-full w-full overflow-hidden text-center transition hover:-translate-y-0.5 hover:border-[var(--dash-line-strong)] hover:shadow-[0_18px_40px_-28px_rgb(4_19_39/0.55)]"
    >
      <span className="dash-hero block h-20 rounded-none border-0" aria-hidden="true" />
      <span className="relative z-10 -mt-12 flex flex-col items-center px-5 pb-7">
        <span className="rounded-[1.25rem] ring-4 ring-white">
          <Logo name={c.name} size={88} />
        </span>
        <span className="mt-4 block text-xl font-semibold">{c.name}</span>
        <span className="mt-1.5 block">
          <Chip tone={c.type === "VENDOR" ? "warn" : "good"}>{typeLabel(c.type)}</Chip>
        </span>
        <span className="mt-2 block text-sm text-[var(--dash-muted)]">
          {c.type === "VENDOR" && c.endClientName ? `For ${c.endClientName}` : (c.contactPerson ?? c.billingEmail)}
        </span>
      </span>
    </button>
  );
}

/** One client, filling the page. */
function ClientDetail({
  who,
  client: c,
  onBack,
  onEdit,
  onChanged,
}: {
  who: Who;
  client: Client;
  onBack: () => void;
  onEdit?: () => void;
  onChanged: (message: string, close?: boolean) => void;
}) {
  const placements = useApi(() => adminApi.placements(who, { clientId: c.id }), [c.id]);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const isAdmin = who.role === "admin";
  const back = useRef<HTMLButtonElement>(null);
  useEffect(() => back.current?.focus(), []);

  async function act(run: () => Promise<string>, close = false) {
    setBusy(true);
    setProblem(null);
    try {
      onChanged(await run(), close);
    } catch (e) {
      setProblem(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  const people = placements.data?.placements ?? [];

  return (
    <div className="space-y-6">
      <button ref={back} type="button" className="dash-btn-ghost" onClick={onBack}>
        <ArrowLeft className="size-4" aria-hidden="true" /> All clients
      </button>

      <section className="dash-hero p-5 sm:p-8" aria-labelledby="client-name">
        <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
          <span className="rounded-[1.6rem] ring-4 ring-white">
            <Logo name={c.name} size={112} />
          </span>
          <div className="min-w-0 flex-1">
            <h1 id="client-name" className="dash-title">
              {c.name}
            </h1>
            {c.type === "VENDOR" && c.endClientName && <p className="mt-2 text-lg font-medium text-[var(--dash-cyan-ink)]">For {c.endClientName}</p>}
            <p className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
              <Chip tone={c.type === "VENDOR" ? "warn" : "good"}>{typeLabel(c.type)}</Chip>
              <Chip>{`Net ${c.paymentTermsDays}`}</Chip>
              {c.archived && <Chip tone="bad">Archived</Chip>}
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {c.unsentInvoices > 0 && (
              <button
                type="button"
                className="dash-btn"
                data-tone="orange"
                disabled={busy}
                onClick={() =>
                  act(async () => {
                    const r = await adminApi.sendClientInvoices(who, c.id);
                    return r.failed ? `Sent ${r.sent}; ${r.failed} failed and are flagged in Billing.` : `Sent ${r.sent} invoice${r.sent === 1 ? "" : "s"} to ${c.billingEmail}.`;
                  })
                }
              >
                <Send className="size-4" aria-hidden="true" /> Send {c.unsentInvoices} unsent
              </button>
            )}
            {onEdit && !c.archived && (
              <button type="button" className="dash-btn" onClick={onEdit}>
                <Pencil className="size-4" aria-hidden="true" /> Edit client
              </button>
            )}
          </div>
        </div>
      </section>

      {problem && <ErrorNote text={problem} />}

      <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
        <InfoCard title="Contact and billing">
          <Detail label="Contact person">{c.contactPerson ?? "–"}</Detail>
          <Detail label="Billing email">
            <a href={`mailto:${c.billingEmail}`} className="text-[var(--dash-orange-ink)] hover:underline">
              {c.billingEmail}
            </a>
          </Detail>
          <Detail label="Payment terms">Net {c.paymentTermsDays} days</Detail>
          <Detail label="Invoices by email">{c.autoSendInvoices ? "Automatically on the 1st" : "Off (sent by hand)"}</Detail>
        </InfoCard>
        <InfoCard title="VMS portal">
          <Detail label="Portal">{c.vmsPortalName ?? "None"}</Detail>
          <Detail label="Link">
            {c.vmsPortalUrl ? (
              <a href={c.vmsPortalUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[var(--dash-orange-ink)] hover:underline">
                Open portal <ExternalLink className="size-3.5" aria-hidden="true" />
              </a>
            ) : (
              "–"
            )}
          </Detail>
          {c.type === "VENDOR" && <Detail label="End client">{c.endClientName ?? "–"}</Detail>}
          <Detail label="Unsent invoices">{c.unsentInvoices}</Detail>
        </InfoCard>
      </div>

      {c.notes && (
        <section className="dash-card dash-card-pad">
          <h2 className="dash-section-title">Notes</h2>
          <p className="mt-3 text-sm leading-relaxed whitespace-pre-line">{c.notes}</p>
        </section>
      )}

      <section className="dash-card dash-card-pad" aria-labelledby="client-people">
        <div className="flex items-center justify-between gap-2">
          <h2 id="client-people" className="dash-section-title">
            Placed here <span className="dash-count">{people.length}</span>
          </h2>
          <Link href="/portal/admin/placements" className="text-sm font-semibold text-[var(--dash-orange-ink)] hover:underline">
            Open Placements
          </Link>
        </div>
        {placements.error ? (
          <div className="mt-3">
            <ErrorNote text={placements.error} onRetry={placements.reload} />
          </div>
        ) : placements.loading && !placements.data ? (
          <Loading />
        ) : people.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--dash-muted)]">No one is placed here yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-[var(--dash-line)]">
            {people.map((p) => (
              <li key={p.id} className="flex items-center gap-3 py-3">
                <Avatar name={p.consultantName} size={40} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{p.consultantName}</span>
                  <span className="block truncate text-xs text-[var(--dash-muted)]">{p.role}</span>
                </span>
                <Chip tone={p.extensionStatus === "ENDED" ? undefined : p.extensionStatus === "EXTENSION_PENDING" ? "warn" : "good"}>
                  {p.extensionStatus === "EXTENSION_PENDING" ? "Extension pending" : p.extensionStatus === "ENDED" ? "Ended" : p.extensionStatus === "EXTENDED" ? "Extended" : "Active"}
                </Chip>
              </li>
            ))}
          </ul>
        )}
      </section>

      {isAdmin && !c.archived && (
        <div className="flex flex-col items-start gap-2 border-t border-[var(--dash-line)] pt-5">
          <button
            type="button"
            className="dash-btn-ghost"
            disabled={busy}
            onClick={() => (confirmArchive ? act(async () => (await adminApi.archiveClient(who, c.id), `${c.name} archived.`), true) : setConfirmArchive(true))}
          >
            {confirmArchive ? "Click again to archive" : "Archive this client"}
          </button>
          <p className="text-xs text-[var(--dash-muted)]">Archived clients stay on their invoices but can&apos;t get new placements. End their active placements first.</p>
        </div>
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

// --- Add client: one question at a time --------------------------------------------------

type Draft = {
  name: string;
  type: ClientType;
  endClientName: string;
  contactPerson: string;
  billingEmail: string;
  vmsPortalName: string;
  vmsPortalUrl: string;
  paymentTermsDays: string;
  autoSendInvoices: "yes" | "no";
  notes: string;
};
type Key = keyof Draft;

const emptyDraft: Draft = {
  name: "",
  type: "CLIENT",
  endClientName: "",
  contactPerson: "",
  billingEmail: "",
  vmsPortalName: "",
  vmsPortalUrl: "",
  paymentTermsDays: "30",
  autoSendInvoices: "yes",
  notes: "",
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_OK = (v: string) => /^https?:\/\/\S+$/i.test(v) && URL.canParse(v);

type Step = {
  key: Key;
  question: string;
  hint?: string;
  optional?: boolean;
  /** Asked only when this is true for the answers so far. */
  when?: (d: Draft) => boolean;
  check?: (v: string) => string | null;
};

const STEPS: Step[] = [
  { key: "name", question: "What's the company called?" },
  { key: "type", question: "Is it an end client or a vendor?" },
  { key: "endClientName", question: "Who is the end client?", hint: "The company the vendor places our consultants at.", optional: true, when: (d) => d.type === "VENDOR" },
  { key: "contactPerson", question: "Who is the contact person?", hint: "Name, or a team like “Accounts Payable”.", optional: true },
  { key: "billingEmail", question: "Where do invoices go?", hint: "Their billing email. Invoices and approved timesheets are sent here.", check: (v) => (EMAIL.test(v) ? null : "Enter a valid email address.") },
  { key: "vmsPortalName", question: "Do they use a VMS portal?", hint: "e.g. Beeline, SAP Fieldglass. Leave empty if not.", optional: true },
  { key: "vmsPortalUrl", question: "What's the VMS portal link?", optional: true, when: (d) => Boolean(d.vmsPortalName.trim()), check: (v) => (URL_OK(v) ? null : "Use a full link starting with https://") },
  { key: "paymentTermsDays", question: "What are their payment terms?", hint: "An invoice is due this many days after it's issued." },
  { key: "autoSendInvoices", question: "Email their invoices automatically?", hint: "On the 1st of each month, unsent invoices and approved timesheets go to the billing email." },
  { key: "notes", question: "Anything else to note?", optional: true },
];

function AddClientWizard({ who, open, onClose, onSaved }: { who: Who; open: boolean; onClose: () => void; onSaved: (message: string) => void }) {
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [wasOpen, setWasOpen] = useState(open);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setDraft(emptyDraft);
      setStep(0);
      setError(null);
      setProblem(null);
    }
  }

  // Only the questions that apply (no end client for a direct client, no link without a VMS).
  const steps = STEPS.filter((s) => !s.when || s.when(draft));
  const review = step >= steps.length;
  const current = steps[step];

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      document.getElementById("client-wizard")?.querySelector<HTMLElement>('[aria-checked="true"], input, textarea, [role="radio"]')?.focus();
    }, 50);
    return () => clearTimeout(t);
  }, [open, step]);

  const set = (patch: Partial<Draft>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setError(null);
  };

  function next(e?: FormEvent) {
    e?.preventDefault();
    if (review) return void save();
    if (!current) return;
    const v = String(draft[current.key]).trim();
    if (!v && !current.optional) return setError("Please answer this to go on.");
    const why = v ? current.check?.(v) : null;
    if (why) return setError(why);
    // A VMS client usually gets invoices through the portal, not by email.
    if (current.key === "vmsPortalName") set({ autoSendInvoices: v ? "no" : "yes" });
    setError(null);
    setStep(step + 1);
  }

  async function save() {
    setBusy(true);
    setProblem(null);
    const body: Partial<ClientInput> = {
      name: draft.name.trim(),
      type: draft.type,
      endClientName: draft.type === "VENDOR" ? draft.endClientName.trim() || null : null,
      contactPerson: draft.contactPerson.trim() || null,
      billingEmail: draft.billingEmail.trim(),
      vmsPortalName: draft.vmsPortalName.trim() || null,
      vmsPortalUrl: draft.vmsPortalName.trim() ? draft.vmsPortalUrl.trim() || null : null,
      paymentTermsDays: Number(draft.paymentTermsDays),
      autoSendInvoices: draft.autoSendInvoices === "yes",
      notes: draft.notes.trim() || null,
    };
    try {
      await adminApi.createClient(who, body);
      onSaved(`${body.name} added.`);
    } catch (err) {
      const fields = fieldErrors(err);
      const at = steps.findIndex((s) => fields[s.key]);
      if (at >= 0) {
        setStep(at);
        setError(fields[steps[at]!.key]!);
      } else setProblem(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  const shown = (k: Key) => {
    const v = String(draft[k]);
    if (k === "type") return typeLabel(draft.type);
    if (k === "paymentTermsDays") return `Net ${v}`;
    if (k === "autoSendInvoices") return v === "yes" ? "Yes, on the 1st of each month" : "No, sent by hand";
    return v.trim() || "–";
  };
  const inputProps = (k: Key) => ({
    id: `cw-${k}`,
    className: "dash-input h-14 text-lg",
    value: String(draft[k]),
    "aria-invalid": Boolean(error) || undefined,
    "aria-describedby": error ? "cw-error" : current?.hint ? "cw-hint" : undefined,
    onChange: (e: { target: { value: string } }) => set({ [k]: e.target.value } as Partial<Draft>),
  });

  return (
    <Panel
      center
      open={open}
      title="Add a client"
      subtitle={review ? "Check everything, then add it." : `Question ${step + 1} of ${steps.length}`}
      onClose={onClose}
      footer={
        <>
          {step > 0 && (
            <button type="button" className="dash-btn-ghost mr-auto" onClick={() => (setStep(step - 1), setError(null))} disabled={busy}>
              <ArrowLeft className="size-4" aria-hidden="true" /> Back
            </button>
          )}
          <button type="submit" form="client-wizard" className="dash-btn" data-tone="orange" disabled={busy}>
            {review ? (
              <>
                <Check className="size-4" aria-hidden="true" /> {busy ? "Adding…" : "Add client"}
              </>
            ) : (
              <>
                {current?.optional && !String(draft[current.key]).trim() ? "Skip" : "Next"} <ArrowRight className="size-4" aria-hidden="true" />
              </>
            )}
          </button>
        </>
      }
    >
      <div className="dash-bar mb-8" aria-hidden="true">
        <span style={{ width: `${(Math.min(step, steps.length) / steps.length) * 100}%` }} />
      </div>

      <form id="client-wizard" onSubmit={next} noValidate>
        {review ? (
          <div className="space-y-4">
            {problem && <ErrorNote text={problem} />}
            <div className="flex items-center gap-4 rounded-2xl bg-[var(--dash-side)] p-4">
              <Logo name={draft.name} size={56} />
              <div className="min-w-0">
                <p className="text-lg font-semibold">{draft.name}</p>
                <p className="text-sm text-[var(--dash-muted)]">
                  {typeLabel(draft.type)}
                  {draft.type === "VENDOR" && draft.endClientName.trim() ? ` for ${draft.endClientName.trim()}` : ""}
                </p>
              </div>
            </div>
            <ul className="divide-y divide-[var(--dash-line)] rounded-2xl border border-[var(--dash-line)]">
              {steps.map((s, i) => (
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
            <p className="text-xs text-[var(--dash-muted)]">No login is created. Clients never sign in to the portal.</p>
          </div>
        ) : current ? (
          <div>
            <label htmlFor={`cw-${current.key}`} id={`cw-${current.key}-label`} className="block text-2xl font-semibold">
              {current.question}
              {current.optional && <span className="ml-2 text-base font-normal text-[var(--dash-muted)]">(optional)</span>}
            </label>
            {current.hint && (
              <p id="cw-hint" className="mt-2 text-sm text-[var(--dash-muted)]">
                {current.hint}
              </p>
            )}

            <div className="mt-6">
              {current.key === "type" ? (
                <div role="radiogroup" aria-labelledby="cw-type-label" className="grid gap-2">
                  <Choice on={draft.type === "CLIENT"} onClick={() => set({ type: "CLIENT" })} title="End client" body="We bill them directly." />
                  <Choice on={draft.type === "VENDOR"} onClick={() => set({ type: "VENDOR" })} title="Vendor" body="Sits between PixelIT and the end client." />
                </div>
              ) : current.key === "paymentTermsDays" ? (
                <div role="radiogroup" aria-labelledby="cw-paymentTermsDays-label" className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {TERMS.map((d) => (
                    <Choice key={d} on={draft.paymentTermsDays === String(d)} onClick={() => set({ paymentTermsDays: String(d) })} title={`Net ${d}`} body={`${d} days`} />
                  ))}
                </div>
              ) : current.key === "autoSendInvoices" ? (
                <div role="radiogroup" aria-labelledby="cw-autoSendInvoices-label" className="grid gap-2">
                  <Choice on={draft.autoSendInvoices === "yes"} onClick={() => set({ autoSendInvoices: "yes" })} title="Yes" body={`Email ${draft.billingEmail || "the billing email"} on the 1st.`} />
                  <Choice on={draft.autoSendInvoices === "no"} onClick={() => set({ autoSendInvoices: "no" })} title="No" body="Accounts sends them by hand or uploads them to the VMS." />
                </div>
              ) : current.key === "notes" ? (
                <textarea {...inputProps("notes")} className="dash-input text-base" rows={4} />
              ) : current.key === "billingEmail" ? (
                <input {...inputProps("billingEmail")} type="email" inputMode="email" autoComplete="off" />
              ) : current.key === "vmsPortalUrl" ? (
                <input {...inputProps("vmsPortalUrl")} type="url" inputMode="url" placeholder="https://" autoComplete="off" />
              ) : (
                <input {...inputProps(current.key)} autoComplete="off" />
              )}
            </div>

            {error && (
              <p id="cw-error" role="alert" className="mt-3 text-sm font-medium text-[var(--dash-red-ink)]">
                {error}
              </p>
            )}
          </div>
        ) : null}
      </form>
    </Panel>
  );
}

// --- Edit client: every field on one form (quick changes) --------------------------------

function EditClientPanel({ who, client, onClose, onSaved }: { who: Who; client: Client | null; onClose: () => void; onSaved: (message: string) => void }) {
  const [draft, setDraft] = useState<ClientInput | null>(client);
  const [last, setLast] = useState(client);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (client !== last) {
    setLast(client);
    setDraft(client);
    setErrors({});
    setProblem(null);
  }
  const edit = (patch: Partial<ClientInput>) => setDraft((d) => (d ? { ...d, ...patch } : d));
  const text = (k: keyof ClientInput) => ({
    id: `ce-${k}`,
    className: "dash-input",
    value: (draft?.[k] as string | null) ?? "",
    "aria-invalid": Boolean(errors[k]) || undefined,
    "aria-describedby": errors[k] ? `ce-${k}-error` : undefined,
    onChange: (e: { target: { value: string } }) => edit({ [k]: e.target.value } as Partial<ClientInput>),
  });

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!client || !draft) return;
    setBusy(true);
    setErrors({});
    setProblem(null);
    try {
      await adminApi.updateClient(who, client.id, {
        name: draft.name,
        type: draft.type,
        endClientName: draft.endClientName || null,
        contactPerson: draft.contactPerson || null,
        billingEmail: draft.billingEmail,
        vmsPortalName: draft.vmsPortalName || null,
        vmsPortalUrl: draft.vmsPortalUrl || null,
        paymentTermsDays: draft.paymentTermsDays,
        notes: draft.notes || null,
        autoSendInvoices: draft.autoSendInvoices,
      });
      onSaved("Saved.");
    } catch (err) {
      setErrors(fieldErrors(err));
      setProblem(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel
      open={Boolean(client)}
      title={`Edit ${client?.name ?? ""}`}
      subtitle="Changes apply to invoices raised from now on."
      onClose={onClose}
      footer={
        <button type="submit" form="client-edit" className="dash-btn" data-tone="orange" disabled={busy}>
          {busy ? "Saving…" : "Save"}
        </button>
      }
    >
      {draft && (
        <form id="client-edit" onSubmit={save} className="space-y-5" noValidate>
          {problem && <ErrorNote text={problem} />}
          <Field id="ce-name" label="Name" error={errors.name}>
            <input {...text("name")} autoComplete="organization" />
          </Field>
          <Field id="ce-type" label="Type" error={errors.type}>
            <select id="ce-type" className="dash-input" value={draft.type} onChange={(e) => edit({ type: e.target.value as ClientType })}>
              <option value="CLIENT">End client</option>
              <option value="VENDOR">Vendor</option>
            </select>
          </Field>
          <Field id="ce-endClientName" label="End client (optional)" error={errors.endClientName}>
            <input {...text("endClientName")} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="ce-contactPerson" label="Contact person" error={errors.contactPerson}>
              <input {...text("contactPerson")} />
            </Field>
            <Field id="ce-billingEmail" label="Billing email" error={errors.billingEmail}>
              <input {...text("billingEmail")} type="email" inputMode="email" />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="ce-vmsPortalName" label="VMS portal (optional)" error={errors.vmsPortalName}>
              <input {...text("vmsPortalName")} />
            </Field>
            <Field id="ce-vmsPortalUrl" label="VMS link (optional)" error={errors.vmsPortalUrl}>
              <input {...text("vmsPortalUrl")} type="url" inputMode="url" placeholder="https://" />
            </Field>
          </div>
          <Field id="ce-terms" label="Payment terms" error={errors.paymentTermsDays}>
            <select id="ce-terms" className="dash-input" value={draft.paymentTermsDays} onChange={(e) => edit({ paymentTermsDays: Number(e.target.value) })}>
              {[...new Set([...TERMS, draft.paymentTermsDays])].sort((a, b) => a - b).map((d) => (
                <option key={d} value={d}>
                  Net {d}
                </option>
              ))}
            </select>
          </Field>
          <Field id="ce-notes" label="Notes (optional)" error={errors.notes}>
            <textarea {...text("notes")} rows={3} />
          </Field>
          <Toggle
            id="ce-autosend"
            label="Email invoices automatically"
            hint="On the 1st of each month, unsent invoices and their approved timesheets go to the billing email."
            checked={draft.autoSendInvoices}
            onChange={(on) => edit({ autoSendInvoices: on })}
          />
        </form>
      )}
    </Panel>
  );
}
