"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, ChevronRight, Download, FileDown, Mail, Search, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, Chip, PageHeader, useToast } from "../ui";
import { adminApi, openSignedFrom, type BillingFilters, type Invoice, type SummaryRow, type Who } from "./api";
import {
  can,
  date,
  dateTime,
  Detail,
  Empty,
  ErrorNote,
  Field,
  fieldErrors,
  errorText,
  FlowSteps,
  hours,
  Loading,
  Panel,
  recentMonths,
  roleLabel,
  STAGES,
  todayIso,
  usd,
  useApi,
  useDebounced,
  useWho,
} from "./ui";

// Billing and invoices: ADMINS ONLY (menu, page guard and the API).
//
// One card per student at a company (a placement): at a glance who, where, how
// much was billed, paid and unpaid, and what's due or overdue. "Email reminder"
// sends the company's billing email a fixed message listing the unpaid invoices
// (only the invoices and amounts change; the server writes and sends it, logged).
// Click a card: every month's timesheet with its invoice and payments; click a
// month to send the invoice or record a payment.
//
// Each month still moves through five stages so nothing is missed:
//   Timesheet received → Timesheet submitted to client → Invoice sent
//   → Payment received from client → Student paid
// Invoices are raised automatically when the timesheet's hours are confirmed;
// nobody types an amount. "Student paid" is blocked until the client has paid,
// unless an admin overrides it with a reason (logged).

/** One placement's billing: the rows of the billing summary, added up. */
type Account = {
  placementId: string;
  consultantName: string;
  company: string;
  client: SummaryRow["client"];
  role: string;
  rows: SummaryRow[];
  billed: number;
  received: number;
  unpaid: number;
  paidOut: number;
  margin: number;
  overdue: SummaryRow[];
  nextDue: string | null;
  waiting: number;
};

function accountsOf(rows: SummaryRow[]): Account[] {
  const groups = new Map<string, SummaryRow[]>();
  for (const r of rows) groups.set(r.placementId, [...(groups.get(r.placementId) ?? []), r]);
  return [...groups.values()].map((g) => {
    const first = g[0]!;
    const invoiced = g.filter((r) => r.invoiceId);
    const open = invoiced.filter((r) => r.stage !== "client_paid" && r.stage !== "consultant_paid");
    const add = (k: "billed" | "received" | "paid" | "margin") => invoiced.reduce((a, r) => a + r[k], 0);
    return {
      placementId: first.placementId,
      consultantName: first.consultantName,
      company: first.endClientName ?? first.client.name,
      client: first.client,
      role: first.role,
      rows: [...g].sort((a, b) => b.month.localeCompare(a.month)),
      billed: add("billed"),
      received: add("received"),
      unpaid: open.reduce((a, r) => a + r.billed - r.received, 0),
      paidOut: add("paid"),
      margin: add("margin"),
      overdue: g.filter((r) => r.overdue),
      nextDue: open.map((r) => r.dueDate).filter((d): d is string => Boolean(d)).sort()[0] ?? null,
      waiting: g.filter((r) => !r.invoiceId).length,
    };
  });
}

type Status = { label: string; tone: "good" | "warn" | "bad" | "ink" };

function statusOf(a: Account): Status {
  if (a.overdue.length) {
    const days = Math.max(...a.overdue.map((r) => r.daysOverdue));
    return { label: `Overdue ${days} day${days === 1 ? "" : "s"}`, tone: "bad" };
  }
  if (a.unpaid > 0) return { label: `Due ${date(a.nextDue)}`, tone: "warn" };
  if (a.billed > 0) return { label: "All paid", tone: "good" };
  return { label: "No invoice yet", tone: "ink" };
}

export function BillingAdminPage() {
  const who = useWho();
  const months = useMemo(() => recentMonths(12), []);
  const [filters, setFilters] = useState<BillingFilters>({});
  const query = useDebounced(filters);
  const summary = useApi(who ? () => adminApi.billingSummary(who, query) : null, [who?.email, who?.role, JSON.stringify(query)]);
  const clients = useApi(who ? () => adminApi.clients(who) : null, [who?.email, who?.role]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [remind, setRemind] = useState<Account | null>(null);
  const [toast, showToast] = useToast();
  const set = (patch: Partial<BillingFilters>) => setFilters((f) => ({ ...f, ...patch }));

  const accounts = useMemo(
    () =>
      accountsOf(summary.data?.rows ?? []).sort(
        (a, b) => b.overdue.length - a.overdue.length || b.unpaid - a.unpaid || a.consultantName.localeCompare(b.consultantName),
      ),
    [summary.data],
  );
  const open = openId ? accounts.find((a) => a.placementId === openId) : undefined;
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [openId]);

  async function exportCsv() {
    if (!who) return;
    try {
      await adminApi.billingCsv(who, query);
    } catch (e) {
      showToast(errorText(e));
    }
  }

  const reminder = who && (
    <ReminderWindow
      who={who}
      account={remind}
      onClose={() => setRemind(null)}
      onSent={(message) => {
        setRemind(null);
        summary.reload();
        showToast(message);
      }}
    />
  );

  if (open && who) {
    return (
      <>
        <BillingDetail
          who={who}
          account={open}
          onBack={() => setOpenId(null)}
          onRemind={() => setRemind(open)}
          onChanged={(message) => {
            summary.reload();
            showToast(message);
          }}
        />
        {reminder}
        {toast}
      </>
    );
  }

  const t = summary.data?.totals;

  return (
    <div className="space-y-6">
      <PageHeader title="Billing & invoices" body="Every student at every company: what's billed, paid, unpaid and due. Open a card for month-by-month details.">
        <button type="button" className="dash-btn-ghost" onClick={exportCsv} disabled={!summary.data}>
          <Download className="size-4" aria-hidden="true" /> Export CSV
        </button>
      </PageHeader>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div>
          <label htmlFor="bl-month" className="sr-only">
            Month
          </label>
          <select id="bl-month" className="dash-input" value={filters.month ?? ""} onChange={(e) => set({ month: e.target.value || undefined })}>
            <option value="">All months</option>
            {months.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="bl-client" className="sr-only">
            Company
          </label>
          <select id="bl-client" className="dash-input" value={filters.clientId ?? ""} onChange={(e) => set({ clientId: e.target.value || undefined })}>
            <option value="">All companies</option>
            {clients.data?.clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="bl-status" className="sr-only">
            Stage
          </label>
          <select id="bl-status" className="dash-input" value={filters.status ?? ""} onChange={(e) => set({ status: (e.target.value || undefined) as BillingFilters["status"] })}>
            <option value="">All stages</option>
            <option value="overdue">Overdue invoices</option>
            {STAGES.map((s) => (
              <option key={s.id} value={s.id}>
                At: {s.label}
              </option>
            ))}
          </select>
        </div>
        <div className="relative">
          <label htmlFor="bl-consultant" className="sr-only">
            Student
          </label>
          <input id="bl-consultant" type="search" className="dash-input pr-10" placeholder="Student name" value={filters.consultant ?? ""} onChange={(e) => set({ consultant: e.target.value || undefined })} />
          <Search className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-[var(--dash-muted)]" aria-hidden="true" />
        </div>
      </div>

      {summary.error && <ErrorNote text={summary.error} onRetry={summary.reload} />}

      {t && (
        <ul className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-5">
          <Stat label="Billed" value={usd(t.billed)} note={`${hours(t.hours)} · ${accounts.length} student${accounts.length === 1 ? "" : "s"}`} />
          <Stat label="Received from companies" value={usd(t.received)} note={`${usd(t.billed - t.received)} unpaid`} />
          <Stat label="Paid to students" value={usd(t.paid)} />
          <Stat label="Margin" value={usd(t.margin)} note={`Expected: ${usd(t.expectedMargin)}`} />
          <Stat label="Overdue" value={String(t.overdueInvoices)} note={t.overdueInvoices ? `${usd(t.overdueAmount)} past due` : "Nothing past due"} bad={t.overdueInvoices > 0} />
        </ul>
      )}

      {summary.loading && !summary.data ? (
        <Loading />
      ) : summary.data ? (
        accounts.length === 0 ? (
          <div className="dash-card">
            <Empty title="Nothing matches" body="Try another month, company or stage." />
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
            {accounts.map((a) => (
              <li key={a.placementId} className="min-w-0">
                <BillingCard account={a} onOpen={() => setOpenId(a.placementId)} onRemind={() => setRemind(a)} />
              </li>
            ))}
          </ul>
        )
      ) : null}

      {reminder}
      {toast}
    </div>
  );
}

/** At a glance: who, which company, billed / paid / unpaid, due or overdue. */
function BillingCard({ account: a, onOpen, onRemind }: { account: Account; onOpen: () => void; onRemind: () => void }) {
  const s = statusOf(a);
  return (
    <div className={cn("dash-card flex h-full flex-col overflow-hidden transition hover:border-[var(--dash-line-strong)] hover:shadow-[0_18px_40px_-28px_rgb(4_19_39/0.55)]", s.tone === "bad" && "border-[rgb(220_38_38/0.35)]")}>
      <button type="button" onClick={onOpen} aria-label={`${a.consultantName} at ${a.company}: ${s.label}. Open billing.`} className="flex flex-1 flex-col text-left">
        <span className="flex items-center gap-3.5 p-5 pb-4">
          <Avatar name={a.consultantName} size={52} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-lg font-semibold">{a.consultantName}</span>
            <span className="block truncate text-sm font-medium text-[var(--dash-cyan-ink)]">{a.company}</span>
            <span className="block truncate text-xs text-[var(--dash-muted)]">
              {a.role}
              {a.client.type === "VENDOR" ? ` · via ${a.client.name}` : ""}
            </span>
          </span>
          <ChevronRight className="size-5 flex-none text-[var(--dash-faint)]" aria-hidden="true" />
        </span>
        <span className="grid grid-cols-3 border-y border-[var(--dash-line)] bg-[var(--dash-side)]">
          <Figure label="Billed" value={dollars(a.billed)} />
          <Figure label="Paid" value={dollars(a.received)} />
          <Figure label="Unpaid" value={dollars(a.unpaid)} strong={a.unpaid > 0} bad={a.overdue.length > 0} />
        </span>
        <span className="flex flex-wrap items-center gap-2 px-5 py-3.5">
          <Chip tone={s.tone}>{s.label}</Chip>
          {a.waiting > 0 && <Chip>{`${a.waiting} timesheet${a.waiting === 1 ? "" : "s"} not invoiced`}</Chip>}
        </span>
      </button>
      {a.unpaid > 0 && (
        <div className="border-t border-[var(--dash-line)] px-5 py-3">
          <button type="button" className="dash-btn-ghost w-full" onClick={onRemind}>
            <Mail className="size-4" aria-hidden="true" /> Email payment reminder
          </button>
        </div>
      )}
    </div>
  );
}

/** Whole dollars for the cards ($36,960); the detail page shows cents. */
const dollars = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

function Figure({ label, value, strong = false, bad = false }: { label: string; value: string; strong?: boolean; bad?: boolean }) {
  return (
    <span className="min-w-0 px-1.5 py-3 text-center first:pl-4 last:pr-4">
      <span className="block text-[0.6875rem] font-medium tracking-wide text-[var(--dash-muted)] uppercase">{label}</span>
      <span className={cn("mt-0.5 block truncate text-sm font-semibold tabular-nums sm:text-base", strong && "text-[var(--dash-orange-ink)]", bad && "text-[var(--dash-red-ink)]")}>{value}</span>
    </span>
  );
}

/** One student at one company: totals, the reminder button, then every month. */
function BillingDetail({ who, account: a, onBack, onRemind, onChanged }: { who: Who; account: Account; onBack: () => void; onRemind: () => void; onChanged: (message: string) => void }) {
  const [row, setRow] = useState<SummaryRow | null>(null);
  const back = useRef<HTMLButtonElement>(null);
  useEffect(() => back.current?.focus(), []);
  const s = statusOf(a);

  return (
    <div className="space-y-6">
      <button ref={back} type="button" className="dash-btn-ghost" onClick={onBack}>
        <ArrowLeft className="size-4" aria-hidden="true" /> All billing
      </button>

      <section className="dash-hero p-5 sm:p-8" aria-labelledby="billing-name">
        <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
          <span className="rounded-full ring-4 ring-white">
            <Avatar name={a.consultantName} size={96} />
          </span>
          <div className="min-w-0 flex-1">
            <h1 id="billing-name" className="dash-title">
              {a.consultantName}
            </h1>
            <p className="mt-2 text-lg font-medium text-[var(--dash-cyan-ink)]">{a.company}</p>
            <p className="text-[0.9375rem] text-[var(--dash-muted)]">
              {a.role}
              {a.client.type === "VENDOR" ? ` · billed via ${a.client.name}` : ""}
            </p>
            <p className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
              <Chip tone={s.tone}>{s.label}</Chip>
            </p>
          </div>
          {a.unpaid > 0 && (
            <button type="button" className="dash-btn" data-tone="orange" onClick={onRemind}>
              <Mail className="size-4" aria-hidden="true" /> Email payment reminder
            </button>
          )}
        </div>
      </section>

      <ul className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-5">
        <Stat label="Billed" value={usd(a.billed)} />
        <Stat label="Received" value={usd(a.received)} />
        <Stat label="Unpaid" value={usd(a.unpaid)} note={a.nextDue ? `Next due ${date(a.nextDue)}` : undefined} bad={a.overdue.length > 0} />
        <Stat label="Paid to student" value={usd(a.paidOut)} />
        <Stat label="Margin" value={usd(a.margin)} note="Billed − paid to student" />
      </ul>

      <section className="dash-card dash-card-pad" aria-labelledby="billing-months">
        <h2 id="billing-months" className="dash-section-title">
          Month by month <span className="dash-count">{a.rows.length}</span>
        </h2>
        <p className="mt-1 text-sm text-[var(--dash-muted)]">Each month&apos;s timesheet, its invoice and the payments. Open a month to send its invoice or record a payment.</p>
        <ul className="mt-4 space-y-2.5">
          {a.rows.map((r) => (
            <li key={r.timesheetId}>
              <button
                type="button"
                onClick={() => setRow(r)}
                className={cn(
                  "grid w-full gap-3 rounded-2xl border p-4 text-left transition hover:bg-[var(--dash-side)] sm:grid-cols-[9rem_minmax(0,1fr)_auto] sm:items-center",
                  r.overdue ? "border-[rgb(220_38_38/0.35)]" : "border-[var(--dash-line)]",
                )}
              >
                <span>
                  <span className="block font-semibold">{r.monthLabel}</span>
                  <span className="block text-xs text-[var(--dash-muted)]">{hours(r.hours)}</span>
                </span>
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-2 text-sm">
                    <FlowSteps steps={r.steps} compact />
                    <span>{r.stageLabel}</span>
                  </span>
                  <span className="mt-1 block text-xs text-[var(--dash-muted)]">
                    {r.invoiceNumber ? `${r.invoiceNumber} · ${usd(r.billed)} · due ${date(r.dueDate)}` : `Timesheet: ${r.timesheetStatusLabel}. The invoice is raised once the hours are confirmed.`}
                    {r.clientPaymentExpectedDate && r.stage !== "client_paid" && r.stage !== "consultant_paid" ? ` · expected ${date(r.clientPaymentExpectedDate)}` : ""}
                  </span>
                </span>
                <span className="flex flex-wrap items-center gap-2 sm:justify-end">
                  {r.overdue && <Chip tone="bad">{`${r.daysOverdue} day${r.daysOverdue === 1 ? "" : "s"} overdue`}</Chip>}
                  {r.invoiceId && !r.overdue && (
                    <Chip tone={r.stage === "client_paid" || r.stage === "consultant_paid" ? "good" : "warn"}>
                      {r.stage === "client_paid" || r.stage === "consultant_paid" ? "Paid" : "Unpaid"}
                    </Chip>
                  )}
                  {r.emailFailed && <Chip tone="bad">Email failed</Chip>}
                  <ChevronRight className="size-4 text-[var(--dash-faint)]" aria-hidden="true" />
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <InvoicePanel
        who={who}
        row={row}
        onClose={() => setRow(null)}
        onChanged={(message) => {
          setRow(null);
          onChanged(message);
        }}
      />
    </div>
  );
}

/**
 * The payment reminder: the server writes it (a fixed message; only the
 * invoices and amounts change) and shows it here first. Sending emails the
 * company's billing email and is logged.
 */
function ReminderWindow({ who, account, onClose, onSent }: { who: Who; account: Account | null; onClose: () => void; onSent: (message: string) => void }) {
  const preview = useApi(account ? () => adminApi.paymentReminder(who, account.placementId, true) : null, [account?.placementId]);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [last, setLast] = useState(account);
  if (account !== last) {
    setLast(account);
    setProblem(null);
  }
  const p = preview.data;

  async function send() {
    if (!account) return;
    setBusy(true);
    setProblem(null);
    try {
      const r = await adminApi.paymentReminder(who, account.placementId);
      onSent(`Reminder emailed to ${r.to}.`);
    } catch (e) {
      setProblem(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel
      center
      open={Boolean(account)}
      title="Email a payment reminder"
      subtitle={account ? `${account.consultantName} at ${account.company}` : undefined}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="dash-btn-ghost mr-auto" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="button" className="dash-btn" data-tone="orange" onClick={send} disabled={busy || !p}>
            <Send className="size-4" aria-hidden="true" /> {busy ? "Sending…" : "Send reminder"}
          </button>
        </>
      }
    >
      {preview.error ? (
        <ErrorNote text={preview.error} onRetry={preview.reload} />
      ) : !p ? (
        <Loading />
      ) : (
        <div className="space-y-4">
          {problem && <ErrorNote text={problem} />}
          <dl className="grid gap-3 rounded-2xl bg-[var(--dash-side)] p-4 text-sm">
            <div>
              <dt className="text-xs text-[var(--dash-muted)]">To</dt>
              <dd className="font-medium break-all">{p.to}</dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--dash-muted)]">Subject</dt>
              <dd className="font-medium">{p.subject}</dd>
            </div>
          </dl>
          <pre className="max-h-[40dvh] overflow-auto rounded-2xl border border-[var(--dash-line)] p-4 font-sans text-sm leading-relaxed whitespace-pre-wrap">{p.text}</pre>
          <p className="text-xs text-[var(--dash-muted)]">The message is always the same; only the invoices and amounts change. It goes to the company&apos;s billing email on file.</p>
        </div>
      )}
    </Panel>
  );
}

function Stat({ label, value, note, bad = false }: { label: string; value: string; note?: string; bad?: boolean }) {
  return (
    <li className={cn("dash-stat", bad && "border-[rgb(220_38_38/0.35)] bg-[var(--dash-red-tint)]")}>
      <p className={cn("text-[0.8125rem] font-medium", bad ? "text-[var(--dash-red-ink)]" : "text-[var(--dash-muted)]")}>{label}</p>
      <p className={cn("mt-1.5 text-xl font-semibold sm:text-2xl", bad && "text-[var(--dash-red-ink)]")}>{value}</p>
      {note && <p className="mt-0.5 text-xs text-[var(--dash-muted)]">{note}</p>}
    </li>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold">{title}</h3>
      {children}
    </section>
  );
}

function InvoicePanel({ who, row, onClose, onChanged }: { who: Who; row: SummaryRow | null; onClose: () => void; onChanged: (message: string) => void }) {
  const invoiceId = row?.invoiceId ?? null;
  const loaded = useApi(invoiceId ? () => adminApi.invoice(who, invoiceId) : null, [invoiceId]);
  const [inv, setInv] = useState<Invoice | null>(null);
  const [lastData, setLastData] = useState(loaded.data);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  // Client payment form
  const [clientMode, setClientMode] = useState<"received" | "expected">("received");
  const [clientDate, setClientDate] = useState(todayIso());
  const [clientAmount, setClientAmount] = useState("");
  const [clientComment, setClientComment] = useState("");
  // Consultant payment form
  const [payDate, setPayDate] = useState(todayIso());
  const [payAmount, setPayAmount] = useState("");
  const [payComment, setPayComment] = useState("");
  const [override, setOverride] = useState(false);
  const [reason, setReason] = useState("");

  if (loaded.data !== lastData) {
    setLastData(loaded.data);
    setInv(loaded.data);
    setProblem(null);
    setErrors({});
    setClientAmount(loaded.data ? String(loaded.data.amount) : "");
    setPayAmount(loaded.data ? String(loaded.data.consultantPay) : "");
    setClientComment("");
    setPayComment("");
    setOverride(false);
    setReason("");
  }
  const current = inv && inv.id === invoiceId ? inv : null;

  async function act(run: () => Promise<Invoice>, message: string) {
    setBusy(true);
    setProblem(null);
    setErrors({});
    try {
      const next = await run();
      setInv(next);
      onChanged(message);
    } catch (e) {
      setErrors(fieldErrors(e));
      setProblem(errorText(e));
      loaded.reload();
    } finally {
      setBusy(false);
    }
  }

  const isAdmin = can(who, "admin");
  const steps = current
    ? {
        timesheet_received: row?.steps.timesheet_received ?? null,
        timesheet_submitted: current.timesheetSubmittedAt,
        invoice_sent: current.sentAt,
        client_paid: current.clientPaidAt,
        consultant_paid: current.consultantPaidAt,
      }
    : null;

  return (
    <Panel
      open={Boolean(row)}
      title={row?.invoiceNumber ? `Invoice ${row.invoiceNumber}` : row ? `${row.consultantName}, ${row.monthLabel}` : ""}
      subtitle={row ? `${row.consultantName} · ${row.monthLabel} · ${row.client.name}` : undefined}
      onClose={onClose}
    >
      {row && !row.invoiceId ? (
        <div className="space-y-4">
          <FlowSteps steps={row.steps} />
          <p className="text-sm text-[var(--dash-muted)]">
            No invoice yet. The timesheet is <strong className="text-[var(--dash-ink)]">{row.timesheetStatusLabel}</strong>. The invoice is raised automatically when accounts confirms the hours.
          </p>
          <Link href="/portal/admin/timesheets" className="dash-btn">
            Open Timesheets
          </Link>
        </div>
      ) : loaded.error && !current ? (
        <ErrorNote text={loaded.error} onRetry={loaded.reload} />
      ) : !current || !steps ? (
        <Loading />
      ) : (
        <div className="space-y-7">
          {problem && <ErrorNote text={problem} />}
          {current.overdue && (
            <p className="flex items-center gap-2 rounded-2xl bg-[var(--dash-red-tint)] p-3 text-sm font-semibold text-[var(--dash-red-ink)]">
              <AlertTriangle className="size-4 flex-none" aria-hidden="true" /> Overdue: due {date(current.dueDate)}, not paid yet.
            </p>
          )}
          {current.emailFailed && (
            <p className="flex items-center gap-2 rounded-2xl bg-[var(--dash-red-tint)] p-3 text-sm text-[var(--dash-red-ink)]">
              <Mail className="size-4 flex-none" aria-hidden="true" /> The last email failed after every retry. Check the billing email, then send again.
            </p>
          )}

          <FlowSteps steps={steps} />

          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Detail label="Bill to">
              {current.client.name}
              {current.client.type === "VENDOR" && " (vendor)"}
            </Detail>
            <Detail label="End client">{current.endClientName ?? "–"}</Detail>
            <Detail label="Billing email">{current.client.billingEmail}</Detail>
            <Detail label="Hours">{hours(current.hours)}</Detail>
            <Detail label="Bill rate">{usd(current.billRate)}/h</Detail>
            <Detail label="Amount">{usd(current.amount)}</Detail>
            <Detail label="Issued">{date(current.issueDate)}</Detail>
            <Detail label="Due">
              {date(current.dueDate)} (Net {current.paymentTermsDays})
            </Detail>
            <Detail label="Consultant pay">
              {usd(current.consultantPay)} ({usd(current.payRate)}/h)
            </Detail>
          </dl>

          <div className="flex flex-wrap gap-2">
            <button type="button" className="dash-btn-ghost" onClick={() => openSignedFrom(() => adminApi.invoicePdf(who, current.id)).catch((e) => setProblem(errorText(e)))}>
              <FileDown className="size-4" aria-hidden="true" /> Invoice PDF
            </button>
            <button
              type="button"
              className="dash-btn"
              data-tone={current.sentAt ? undefined : "orange"}
              disabled={busy}
              onClick={() => act(() => adminApi.sendInvoice(who, current.id, Boolean(current.sentAt)), `Emailed to ${current.client.billingEmail}.`)}
            >
              <Send className="size-4" aria-hidden="true" /> {current.sentAt ? "Send again" : "Send now"}
            </button>
          </div>
          <p className="-mt-4 text-xs text-[var(--dash-muted)]">
            Send now emails the invoice and the approved timesheet PDF to {current.client.billingEmail}.
            {current.client.autoSendInvoices ? " Auto-send is on: unsent invoices also go out on the 1st." : " Auto-send is off for this client."}
          </p>

          {!current.sentAt && (
            <Section title="Done outside the portal?">
              <div className="flex flex-wrap gap-2">
                {!current.timesheetSubmittedAt && (
                  <button type="button" className="dash-btn-ghost" disabled={busy} onClick={() => act(() => adminApi.moveInvoice(who, current.id, "TIMESHEET_SUBMITTED"), "Timesheet marked as submitted to the client.")}>
                    Timesheet submitted (VMS)
                  </button>
                )}
                <button type="button" className="dash-btn-ghost" disabled={busy} onClick={() => act(() => adminApi.moveInvoice(who, current.id, "SENT"), "Invoice marked as sent.")}>
                  Invoice sent (VMS / other)
                </button>
              </div>
            </Section>
          )}

          {!current.clientPaidAt && (
            <Section title="Payment from the client">
              {current.clientPaymentExpectedDate && (
                <p className="rounded-xl bg-[var(--dash-side)] p-3 text-sm">
                  Expected {date(current.clientPaymentExpectedDate)}
                  {current.clientPaymentComment && <span className="block text-[var(--dash-muted)]">“{current.clientPaymentComment}”</span>}
                </p>
              )}
              <div className="dash-tabs" role="group" aria-label="Payment from the client">
                <button type="button" className="dash-tab" aria-pressed={clientMode === "received"} onClick={() => setClientMode("received")}>
                  Received
                </button>
                <button type="button" className="dash-tab" aria-pressed={clientMode === "expected"} onClick={() => setClientMode("expected")}>
                  Expected
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field id="cp-date" label={clientMode === "received" ? "Received on" : "Expected on"} error={errors.receivedDate ?? errors.expectedDate}>
                  <input id="cp-date" type="date" className="dash-input" value={clientDate} onChange={(e) => setClientDate(e.target.value)} />
                </Field>
                {clientMode === "received" && (
                  <Field id="cp-amount" label="Amount received" error={errors.amount}>
                    <input id="cp-amount" type="number" inputMode="decimal" step="0.01" min="0" className="dash-input" value={clientAmount} onChange={(e) => setClientAmount(e.target.value)} />
                  </Field>
                )}
              </div>
              <Field id="cp-comment" label="Comment" hint={clientMode === "expected" ? "e.g. “Payment processed, expected next week”" : "Required if the amount differs."} error={errors.comment}>
                <input id="cp-comment" className="dash-input" value={clientComment} onChange={(e) => setClientComment(e.target.value)} />
              </Field>
              <button
                type="button"
                className="dash-btn"
                disabled={busy}
                onClick={() =>
                  act(
                    () =>
                      adminApi.clientPayment(
                        who,
                        clientMode === "received"
                          ? { invoiceId: current.id, status: "received", receivedDate: clientDate, amount: clientAmount ? Number(clientAmount) : undefined, comment: clientComment || undefined }
                          : { invoiceId: current.id, status: "expected", expectedDate: clientDate, comment: clientComment || undefined },
                      ),
                    clientMode === "received" ? "Client payment recorded." : "Expected payment date saved.",
                  )
                }
              >
                {clientMode === "received" ? "Record payment received" : "Save expected date"}
              </button>
            </Section>
          )}

          {!current.consultantPaidAt && (
            <Section title="Pay the consultant">
              {!current.clientPaidAt && (
                <p className="rounded-xl bg-[var(--dash-orange-tint)] p-3 text-sm text-[var(--dash-orange-ink)]">
                  Blocked until the client&apos;s payment is recorded.{isAdmin ? " As an admin you can override it with a reason; the override is logged." : " Only an admin can override this."}
                </p>
              )}
              {(current.clientPaidAt || isAdmin) && (
                <>
                  {!current.clientPaidAt && (
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <input type="checkbox" className="size-4 accent-[var(--dash-orange)]" checked={override} onChange={(e) => setOverride(e.target.checked)} />
                      Override: pay before the client pays
                    </label>
                  )}
                  {(current.clientPaidAt || override) && (
                    <>
                      {override && (
                        <Field id="pay-reason" label="Reason for the override" hint="Saved on the payment and in the audit log." error={errors.overrideReason}>
                          <textarea id="pay-reason" className="dash-input" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
                        </Field>
                      )}
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field id="pay-date" label="Paid on" error={errors.paidDate}>
                          <input id="pay-date" type="date" className="dash-input" value={payDate} onChange={(e) => setPayDate(e.target.value)} />
                        </Field>
                        <Field id="pay-amount" label="Amount paid" hint={`Hours × pay rate = ${usd(current.consultantPay)}`} error={errors.amount}>
                          <input id="pay-amount" type="number" inputMode="decimal" step="0.01" min="0" className="dash-input" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
                        </Field>
                      </div>
                      <Field id="pay-comment" label="Comment (optional)" error={errors.comment}>
                        <input id="pay-comment" className="dash-input" value={payComment} onChange={(e) => setPayComment(e.target.value)} />
                      </Field>
                      <button
                        type="button"
                        className="dash-btn"
                        disabled={busy}
                        onClick={() =>
                          act(
                            () =>
                              adminApi.consultantPayment(who, {
                                invoiceId: current.id,
                                paidDate: payDate,
                                amount: payAmount ? Number(payAmount) : undefined,
                                comment: payComment || undefined,
                                overrideReason: override ? reason : undefined,
                              }),
                            override ? "Consultant payment recorded (override logged)." : "Consultant payment recorded.",
                          )
                        }
                      >
                        Record consultant paid
                      </button>
                    </>
                  )}
                </>
              )}
            </Section>
          )}

          {current.payments.length > 0 && (
            <Section title="Payments">
              <ul className="space-y-2">
                {current.payments.map((p) => (
                  <li key={p.id} className="rounded-xl border border-[var(--dash-line)] p-3 text-sm">
                    <p className="flex flex-wrap items-center justify-between gap-2 font-semibold">
                      {p.kind === "CLIENT_RECEIPT" ? "From the client" : "To the consultant"}
                      <span>{usd(p.amount)}</span>
                    </p>
                    <p className="text-xs text-[var(--dash-muted)]">
                      {date(p.date)} · recorded by {p.by} ({roleLabel(p.role)})
                    </p>
                    {p.comment && <p className="mt-1">“{p.comment}”</p>}
                    {p.overrideReason && (
                      <p className="mt-1 text-[var(--dash-orange-ink)]">
                        <strong>Override:</strong> {p.overrideReason}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          <Section title="Emails">
            {current.emails.length === 0 ? (
              <p className="text-sm text-[var(--dash-muted)]">Not emailed yet.</p>
            ) : (
              <ul className="space-y-2">
                {current.emails.map((e) => (
                  <li key={e.id} className="flex flex-wrap items-start justify-between gap-2 rounded-xl border border-[var(--dash-line)] p-3 text-sm">
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium break-words">{e.subject}</span>
                      <span className="block text-xs text-[var(--dash-muted)]">
                        To {e.to} · {dateTime(e.at)} · try {e.attempt} · {e.trigger === "MONTHLY_JOB" ? "monthly job" : "sent by hand"}
                        {e.error && ` · ${e.error}`}
                      </span>
                    </span>
                    <Chip tone={e.status === "SENT" ? "good" : "bad"}>{e.status === "SENT" ? "Sent" : "Failed"}</Chip>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
      )}
    </Panel>
  );
}
