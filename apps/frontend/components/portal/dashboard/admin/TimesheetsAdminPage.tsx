"use client";

import { useMemo, useState } from "react";
import { BellRing, Check, FileText, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Chip, PageHeader, useToast } from "../ui";
import { adminApi, signedHref, type TimesheetDetail, type TimesheetMove, type TimesheetStatus, type Who } from "./api";
import { can, date, dateTime, Detail, Empty, ErrorNote, Field, fieldErrors, errorText, hours, Loading, monthShort, Panel, recentMonths, roleLabel, usd, useApi, useDebounced, useWho } from "./ui";

// Timesheets (admin, verifier, accounts). The consultant uploads one
// client-approved PDF a month; staff move it through
//   Received → Verified → Approved by verifier → Accounts check → Invoice raised → Submitted to client
// The API decides who may do each step (verifier and accounts are separate, and
// accounts acts only after the verifier approves); the buttons follow what it allows.

const FLOW: { status: TimesheetStatus; label: string }[] = [
  { status: "RECEIVED", label: "Received" },
  { status: "VERIFIED", label: "Verified" },
  { status: "VERIFIER_APPROVED", label: "Approved by verifier" },
  { status: "ACCOUNTS_CHECKED", label: "Accounts check" },
  { status: "INVOICE_RAISED", label: "Invoice raised" },
  { status: "SUBMITTED_TO_CLIENT", label: "Submitted to client" },
];

const TONE: Record<TimesheetStatus, "good" | "warn" | "bad" | "ink" | undefined> = {
  RECEIVED: "warn",
  VERIFIED: undefined,
  VERIFIER_APPROVED: "ink",
  ACCOUNTS_CHECKED: "good",
  INVOICE_RAISED: "good",
  SUBMITTED_TO_CLIENT: "good",
  REJECTED: "bad",
};

const STATUS_FILTERS: { value: "" | TimesheetStatus; label: string }[] = [
  { value: "", label: "All statuses" },
  ...FLOW.map((f) => ({ value: f.status, label: f.label })),
  { value: "REJECTED", label: "Sent back" },
];

export function TimesheetsAdminPage() {
  const who = useWho();
  const months = useMemo(() => recentMonths(12), []);
  const [month, setMonth] = useState("");
  const [status, setStatus] = useState<"" | TimesheetStatus>("");
  const [clientId, setClientId] = useState("");
  const [consultant, setConsultant] = useState("");
  const name = useDebounced(consultant.trim());
  const list = useApi(
    who ? () => adminApi.timesheets(who, { month: month || undefined, status: status || undefined, clientId: clientId || undefined, consultant: name || undefined }) : null,
    [who?.email, who?.role, month, status, clientId, name],
  );
  // Client names for the filter (verifiers can't read client records, but can read placements).
  const placements = useApi(who ? () => adminApi.placements(who) : null, [who?.email, who?.role]);
  const clients = [...new Map((placements.data?.placements ?? []).map((p) => [p.client.id, p.client.name])).entries()];
  const [openId, setOpenId] = useState<string | null>(null);
  const [toast, showToast] = useToast();
  const [reminding, setReminding] = useState(false);

  async function remind() {
    if (!who) return;
    setReminding(true);
    try {
      const r = await adminApi.sendReminders(who);
      showToast(r.reminded ? `Reminded ${r.reminded} consultant${r.reminded === 1 ? "" : "s"} by email and in the portal.` : "Everyone placed has sent this month's timesheet.");
    } catch (e) {
      showToast(errorText(e));
    } finally {
      setReminding(false);
    }
  }

  const rows = list.data?.timesheets ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Timesheets" body="One client-approved PDF per consultant per month. Verify it, approve it, then accounts confirms the hours and the invoice is raised.">
        <button type="button" className="dash-btn-ghost" onClick={remind} disabled={reminding}>
          <BellRing className="size-4" aria-hidden="true" /> {reminding ? "Sending…" : "Remind missing"}
        </button>
      </PageHeader>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div>
          <label htmlFor="ts-month" className="sr-only">
            Month
          </label>
          <select id="ts-month" className="dash-input" value={month} onChange={(e) => setMonth(e.target.value)}>
            <option value="">All months</option>
            {months.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="ts-status" className="sr-only">
            Status
          </label>
          <select id="ts-status" className="dash-input" value={status} onChange={(e) => setStatus(e.target.value as "" | TimesheetStatus)}>
            {STATUS_FILTERS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="ts-client" className="sr-only">
            Client
          </label>
          <select id="ts-client" className="dash-input" value={clientId} onChange={(e) => setClientId(e.target.value)}>
            <option value="">All clients</option>
            {clients.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="ts-consultant" className="sr-only">
            Consultant
          </label>
          <input id="ts-consultant" type="search" className="dash-input" placeholder="Consultant name" value={consultant} onChange={(e) => setConsultant(e.target.value)} />
        </div>
      </div>

      {list.error && <ErrorNote text={list.error} onRetry={list.reload} />}
      {list.loading && !list.data ? (
        <Loading />
      ) : list.data ? (
        <div className="dash-card p-2 sm:p-3">
          {rows.length === 0 ? (
            <Empty title="No timesheets match" body="Try another month or status." />
          ) : (
            <div className="dash-table-wrap">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th scope="col">Consultant</th>
                    <th scope="col">Month</th>
                    <th scope="col">Client</th>
                    <th scope="col">Hours</th>
                    <th scope="col">Leave</th>
                    <th scope="col">Received</th>
                    <th scope="col">Status</th>
                    <th scope="col">Invoice</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((t) => (
                    <tr key={t.id} data-clickable onClick={() => setOpenId(t.id)} data-flag={t.status === "REJECTED" ? "bad" : undefined}>
                      <td>
                        <button type="button" className="text-left font-semibold hover:underline" onClick={(e) => (e.stopPropagation(), setOpenId(t.id))}>
                          {t.consultant.name}
                        </button>
                      </td>
                      <td>{monthShort(t.month)}</td>
                      <td>
                        {t.client.name}
                        {t.endClientName && t.endClientName !== t.client.name && <span className="block text-xs text-[var(--dash-muted)]">for {t.endClientName}</span>}
                      </td>
                      <td>
                        {hours(t.approvedHours ?? t.hours)}
                        {t.approvedHours !== null && t.approvedHours !== t.hours && <span className="block text-xs text-[var(--dash-muted)]">sent {hours(t.hours)}</span>}
                      </td>
                      <td>{t.leaveDays ? `${t.leaveDays} d` : "–"}</td>
                      <td>{date(t.submittedAt)}</td>
                      <td>
                        <Chip tone={TONE[t.status]}>{t.statusLabel}</Chip>
                      </td>
                      <td>{t.invoice?.number ?? "–"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}

      {who && (
        <TimesheetPanel
          who={who}
          id={openId}
          onClose={() => setOpenId(null)}
          onChanged={(message) => {
            list.reload();
            showToast(message);
          }}
        />
      )}
      {toast}
    </div>
  );
}

const ACTION_TEXT: Record<TimesheetMove, { button: string; done: string }> = {
  VERIFIED: { button: "Mark verified", done: "Marked verified." },
  VERIFIER_APPROVED: { button: "Approve", done: "Approved. Accounts checks it next." },
  ACCOUNTS_CHECKED: { button: "Confirm hours and raise invoice", done: "Hours confirmed. The invoice is raised." },
  SUBMITTED_TO_CLIENT: { button: "Mark submitted to client", done: "Marked as submitted to the client." },
  REJECTED: { button: "Send back", done: "Sent back. The consultant was told by email and in the portal." },
};

function TimesheetPanel({ who, id, onClose, onChanged }: { who: Who; id: string | null; onClose: () => void; onChanged: (message: string) => void }) {
  const detail = useApi(id ? () => adminApi.timesheet(who, id) : null, [id]);
  const [t, setT] = useState<TimesheetDetail | null>(null);
  const [lastData, setLastData] = useState(detail.data);
  const [comment, setComment] = useState("");
  const [approved, setApproved] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (detail.data !== lastData) {
    setLastData(detail.data);
    setT(detail.data);
    setComment("");
    setApproved(detail.data ? String(detail.data.approvedHours ?? detail.data.hours) : "");
    setRejecting(false);
    setProblem(null);
    setErrors({});
  }
  const current = id && t?.id === id ? t : null;

  async function run(move: TimesheetMove) {
    if (!current) return;
    setBusy(true);
    setProblem(null);
    setErrors({});
    try {
      const body: { status: TimesheetMove; comment?: string; approvedHours?: number } = { status: move };
      if (comment.trim()) body.comment = comment.trim();
      if (move === "ACCOUNTS_CHECKED" && approved !== "" && Number(approved) !== current.hours) body.approvedHours = Number(approved);
      const next = await adminApi.moveTimesheet(who, current.id, body);
      setT(next);
      setComment("");
      setRejecting(false);
      onChanged(ACTION_TEXT[move].done);
    } catch (e) {
      setErrors(fieldErrors(e));
      setProblem(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  const forward = current?.actions.filter((a) => a !== "REJECTED") ?? [];
  const canReject = current?.actions.includes("REJECTED") ?? false;
  const reached = current ? FLOW.findIndex((f) => f.status === current.status) : -1;

  return (
    <Panel
      open={Boolean(id)}
      title={current ? `${current.consultant.name}, ${current.monthLabel}` : "Timesheet"}
      subtitle={current ? `${current.client.name}${current.endClientName && current.endClientName !== current.client.name ? ` → ${current.endClientName}` : ""} · ${current.placement.role}` : undefined}
      onClose={onClose}
      footer={
        current && (forward.length > 0 || canReject) ? (
          <>
            {canReject && (
              <button
                type="button"
                className="dash-btn-ghost mr-auto"
                disabled={busy}
                onClick={() => (rejecting ? run("REJECTED") : setRejecting(true))}
              >
                <Undo2 className="size-4" aria-hidden="true" /> {rejecting ? "Send back to consultant" : "Send back"}
              </button>
            )}
            {!rejecting &&
              forward.map((a) => (
                <button key={a} type="button" className="dash-btn" data-tone="orange" disabled={busy} onClick={() => run(a)}>
                  <Check className="size-4" aria-hidden="true" /> {busy ? "Saving…" : ACTION_TEXT[a].button}
                </button>
              ))}
            {rejecting && (
              <button type="button" className="dash-btn-ghost" onClick={() => setRejecting(false)} disabled={busy}>
                Cancel
              </button>
            )}
          </>
        ) : undefined
      }
    >
      {detail.error && <ErrorNote text={detail.error} onRetry={detail.reload} />}
      {!current ? (
        <Loading />
      ) : (
        <div className="space-y-6">
          {problem && <ErrorNote text={problem} />}

          {current.status === "REJECTED" ? (
            <div className="rounded-2xl bg-[var(--dash-red-tint)] p-4 text-sm text-[var(--dash-red-ink)]">
              <p className="font-semibold">Sent back. Waiting for the consultant to upload it again.</p>
              {current.rejectionComment && <p className="mt-1">“{current.rejectionComment}”</p>}
            </div>
          ) : (
            <ol className="grid grid-cols-3 gap-2 sm:grid-cols-6" aria-label="Where this timesheet is">
              {FLOW.map((f, i) => (
                <li key={f.status} className="text-center">
                  <span className={cn("mx-auto block h-1.5 rounded-full", i <= reached ? "bg-[var(--dash-cyan)]" : "bg-[rgb(4_19_39/0.1)]")} aria-hidden="true" />
                  <span className={cn("mt-1.5 block text-[0.6875rem] leading-tight", i === reached ? "font-semibold" : "text-[var(--dash-muted)]")}>
                    {f.label}
                    {i <= reached && <span className="sr-only"> (done)</span>}
                  </span>
                </li>
              ))}
            </ol>
          )}

          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Detail label="Hours sent">{hours(current.hours)}</Detail>
            <Detail label="Hours approved">{hours(current.approvedHours)}</Detail>
            <Detail label="Leave">{current.leaveDays ? `${current.leaveDays} day${current.leaveDays === 1 ? "" : "s"}` : "None"}</Detail>
            {current.leaveNote && (
              <div className="col-span-2 sm:col-span-3">
                <Detail label="Leave note">{current.leaveNote}</Detail>
              </div>
            )}
            <Detail label="Received">{dateTime(current.submittedAt)}</Detail>
            <Detail label="Consultant email">{current.consultant.email}</Detail>
            {current.invoice && (
              <Detail label="Invoice">
                {current.invoice.number}
                {current.invoice.amount !== undefined && ` · ${usd(current.invoice.amount)}`}
              </Detail>
            )}
          </dl>

          <a
            href={signedHref(current.fileLink.url)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-[44px] items-center gap-3 rounded-2xl border border-[var(--dash-line-strong)] p-3 hover:bg-[var(--dash-side)]"
          >
            <FileText className="size-5 flex-none text-[var(--dash-orange)]" aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{current.file.name}</span>
              <span className="block text-xs text-[var(--dash-muted)]">Client-approved PDF · opens in a new tab (link works for a few minutes)</span>
            </span>
          </a>

          {(forward.length > 0 || canReject) && (
            <div className="space-y-4 rounded-2xl bg-[var(--dash-side)] p-4">
              {forward.includes("ACCOUNTS_CHECKED") && !rejecting && (
                <Field id="ts-approved" label="Hours to bill" hint="Change only if the client-approved PDF shows different hours; say why below." error={errors.approvedHours}>
                  <input id="ts-approved" className="dash-input" type="number" inputMode="decimal" min="0" step="0.25" value={approved} onChange={(e) => setApproved(e.target.value)} />
                </Field>
              )}
              <Field
                id="ts-comment"
                label={rejecting ? "What needs fixing (the consultant sees this)" : "Comment (optional)"}
                error={errors.comment}
              >
                <textarea id="ts-comment" className="dash-input" rows={3} value={comment} onChange={(e) => setComment(e.target.value)} />
              </Field>
              {forward.includes("SUBMITTED_TO_CLIENT") && !rejecting && (
                <p className="text-xs text-[var(--dash-muted)]">Use this when the timesheet went into the client&apos;s VMS portal. Emailing the invoice from Billing marks it automatically.</p>
              )}
            </div>
          )}
          {current.actions.length === 0 && current.status !== "SUBMITTED_TO_CLIENT" && current.status !== "REJECTED" && (
            <p className="text-sm text-[var(--dash-muted)]">
              {can(who, "accounts") && current.status !== "INVOICE_RAISED"
                ? "Waiting for the verifier. Accounts acts after the verifier approves."
                : "Nothing for your role to do at this step."}
            </p>
          )}

          <section aria-labelledby="ts-history">
            <h3 id="ts-history" className="dash-section-title text-base">
              History
            </h3>
            <ol className="mt-3 space-y-3 border-l border-[var(--dash-line-strong)] pl-4">
              {[...current.history].reverse().map((h, i) => (
                <li key={i} className="relative text-sm">
                  <span className="absolute top-1.5 -left-[1.3rem] size-2 rounded-full bg-[var(--dash-orange)]" aria-hidden="true" />
                  <p className="font-semibold">{h.toLabel}</p>
                  <p className="text-xs text-[var(--dash-muted)]">
                    {roleLabel(h.role)} · {h.by} · {dateTime(h.at)}
                  </p>
                  {h.comment && <p className="mt-1 text-[var(--dash-ink)]">“{h.comment}”</p>}
                </li>
              ))}
            </ol>
          </section>
        </div>
      )}
    </Panel>
  );
}
