"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle, Download, FileDown, Mail, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { Chip, PageHeader, useToast } from "../ui";
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
  monthShort,
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

// Billing and invoices (admin, accounts). One row per consultant per month,
// tracked through five stages so nothing is missed:
//   Timesheet received → Timesheet submitted to client → Invoice sent
//   → Payment received from client → Consultant paid
// Invoices are raised automatically when accounts checks a timesheet; nobody
// types an amount. "Consultant paid" is blocked until the client has paid,
// unless an admin overrides it with a reason (logged).

export function BillingAdminPage() {
  const who = useWho();
  const months = useMemo(() => recentMonths(12), []);
  const [filters, setFilters] = useState<BillingFilters>({});
  const [view, setView] = useState<"rows" | "consultants">("rows");
  const query = useDebounced(filters);
  const summary = useApi(who ? () => adminApi.billingSummary(who, query) : null, [who?.email, who?.role, JSON.stringify(query)]);
  const clients = useApi(who ? () => adminApi.clients(who) : null, [who?.email, who?.role]);
  const [open, setOpen] = useState<SummaryRow | null>(null);
  const [toast, showToast] = useToast();
  const set = (patch: Partial<BillingFilters>) => setFilters((f) => ({ ...f, ...patch }));

  async function exportCsv() {
    if (!who) return;
    try {
      await adminApi.billingCsv(who, query);
    } catch (e) {
      showToast(errorText(e));
    }
  }

  const t = summary.data?.totals;

  return (
    <div className="space-y-6">
      <PageHeader title="Billing & invoices" body="Every consultant, every month: timesheet, invoice, client payment, consultant pay.">
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
            Client
          </label>
          <select id="bl-client" className="dash-input" value={filters.clientId ?? ""} onChange={(e) => set({ clientId: e.target.value || undefined })}>
            <option value="">All clients</option>
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
        <div>
          <label htmlFor="bl-consultant" className="sr-only">
            Consultant
          </label>
          <input id="bl-consultant" type="search" className="dash-input" placeholder="Consultant name" value={filters.consultant ?? ""} onChange={(e) => set({ consultant: e.target.value || undefined })} />
        </div>
      </div>

      {summary.error && <ErrorNote text={summary.error} onRetry={summary.reload} />}

      {t && (
        <ul className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-5">
          <Stat label="Billed" value={usd(t.billed)} note={`${hours(t.hours)} · ${t.rows} row${t.rows === 1 ? "" : "s"}`} />
          <Stat label="Received from clients" value={usd(t.received)} note={`${usd(t.billed - t.received)} outstanding`} />
          <Stat label="Paid to consultants" value={usd(t.paid)} />
          <Stat label="Margin" value={usd(t.margin)} note={`Billed − paid. Expected: ${usd(t.expectedMargin)}`} />
          <Stat label="Overdue" value={String(t.overdueInvoices)} note={t.overdueInvoices ? `${usd(t.overdueAmount)} past due` : "Nothing past due"} bad={t.overdueInvoices > 0} />
        </ul>
      )}

      <div className="dash-tabs" role="group" aria-label="View">
        <button type="button" className="dash-tab" aria-pressed={view === "rows"} onClick={() => setView("rows")}>
          By month
        </button>
        <button type="button" className="dash-tab" aria-pressed={view === "consultants"} onClick={() => setView("consultants")}>
          By consultant
        </button>
      </div>

      {summary.loading && !summary.data ? (
        <Loading />
      ) : summary.data ? (
        <div className="dash-card p-2 sm:p-3">
          {summary.data.rows.length === 0 ? (
            <Empty title="Nothing matches" body="Try another month, client or stage." />
          ) : view === "rows" ? (
            <div className="dash-table-wrap">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th scope="col">Consultant</th>
                    <th scope="col">Month</th>
                    <th scope="col">Client</th>
                    <th scope="col">Stage</th>
                    <th scope="col">Hours</th>
                    <th scope="col">Invoice</th>
                    <th scope="col">Billed</th>
                    <th scope="col">Received</th>
                    <th scope="col">Paid out</th>
                    <th scope="col">Margin</th>
                    <th scope="col">Due</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.data.rows.map((r) => (
                    <tr key={r.timesheetId} data-clickable onClick={() => setOpen(r)} data-flag={r.overdue ? "bad" : undefined}>
                      <td>
                        <button type="button" className="text-left font-semibold hover:underline" onClick={(e) => (e.stopPropagation(), setOpen(r))}>
                          {r.consultantName}
                        </button>
                      </td>
                      <td>{monthShort(r.month)}</td>
                      <td>{r.client.name}</td>
                      <td>
                        <span className="flex items-center gap-2">
                          <FlowSteps steps={r.steps} compact />
                          <span className="text-xs">{r.stageLabel}</span>
                          {r.paidBeforeClient && <Chip tone="warn">Override</Chip>}
                          {r.emailFailed && <Chip tone="bad">Email failed</Chip>}
                        </span>
                      </td>
                      <td>{hours(r.hours)}</td>
                      <td>{r.invoiceNumber ?? <span className="text-[var(--dash-muted)]">{r.timesheetStatusLabel}</span>}</td>
                      <td className="font-semibold text-[var(--dash-ink)]">{r.invoiceNumber ? usd(r.billed) : "–"}</td>
                      <td>{r.invoiceNumber ? usd(r.received) : "–"}</td>
                      <td>{r.invoiceNumber ? usd(r.paid) : "–"}</td>
                      <td>{r.invoiceNumber ? usd(r.margin) : "–"}</td>
                      <td>
                        {r.overdue ? (
                          <Chip tone="bad">{`${r.daysOverdue} day${r.daysOverdue === 1 ? "" : "s"} overdue`}</Chip>
                        ) : r.clientPaymentExpectedDate && r.stage !== "client_paid" && r.stage !== "consultant_paid" ? (
                          <span title={r.clientPaymentComment ?? undefined}>Expected {date(r.clientPaymentExpectedDate)}</span>
                        ) : (
                          date(r.dueDate)
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="dash-table-wrap">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th scope="col">Consultant</th>
                    <th scope="col">Clients</th>
                    <th scope="col">Months</th>
                    <th scope="col">Hours</th>
                    <th scope="col">Billed</th>
                    <th scope="col">Received from client</th>
                    <th scope="col">Paid to consultant</th>
                    <th scope="col">Margin</th>
                    <th scope="col">Overdue</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.data.byConsultant.map((c) => (
                    <tr key={c.consultantName + c.clients.join()} data-flag={c.overdueInvoices ? "bad" : undefined}>
                      <td>{c.consultantName}</td>
                      <td>{c.clients.join(", ")}</td>
                      <td>{c.months}</td>
                      <td>{hours(c.hours)}</td>
                      <td className="font-semibold text-[var(--dash-ink)]">{usd(c.billed)}</td>
                      <td>{usd(c.received)}</td>
                      <td>{usd(c.paid)}</td>
                      <td>
                        {usd(c.margin)}
                        <span className="block text-xs text-[var(--dash-muted)]">expected {usd(c.expectedMargin)}</span>
                      </td>
                      <td>{c.overdueInvoices ? <Chip tone="bad">{String(c.overdueInvoices)}</Chip> : "0"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}

      {who && (
        <InvoicePanel
          who={who}
          row={open}
          onClose={() => setOpen(null)}
          onChanged={(message) => {
            summary.reload();
            showToast(message);
          }}
        />
      )}
      {toast}
    </div>
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
