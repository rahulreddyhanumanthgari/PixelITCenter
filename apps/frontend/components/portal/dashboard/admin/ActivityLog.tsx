"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Building2, ChevronLeft, ChevronRight, Clock, CreditCard, FileBarChart, Handshake, History, ReceiptText, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { adminApi, type AuditEntry, type AuditFilters } from "./api";
import { dateTime, Empty, ErrorNote, Loading, roleLabel, useApi, useDebounced, useWho } from "./ui";

// The activity log: everything done on the portal, from the server's audit log.
// Built for lots of entries: you pick an area (cards with counts), then filter,
// sort and page through it. Filtering, sorting and paging happen on the server,
// so it stays fast with any number of entries.

const ACTIONS: Record<string, string> = {
  "client.create": "Added a client",
  "client.update": "Changed a client",
  "client.archive": "Archived a client",
  "client.view": "Opened a client",
  "client.list": "Viewed clients",
  "placement.create": "Added a placement",
  "placement.update": "Changed a placement",
  "placement.delete": "Deleted a placement",
  "placement.view": "Opened a placement",
  "placement.list": "Viewed placements",
  "timesheet.status": "Moved a timesheet",
  "timesheet.submit": "Student sent a timesheet",
  "timesheet.resubmit": "Student sent a timesheet again",
  "timesheet.reminders": "Sent timesheet reminders",
  "timesheet.view": "Opened a timesheet",
  "timesheet.list": "Viewed timesheets",
  "invoice.create": "Raised an invoice",
  "invoice.send": "Emailed an invoice",
  "invoice.send_failed": "Invoice email failed",
  "invoice.status": "Marked an invoice",
  "invoice.pdf": "Opened an invoice PDF",
  "invoice.view": "Opened an invoice",
  "invoice.list": "Viewed invoices",
  "payment.client.expected": "Noted an expected payment",
  "payment.client.received": "Recorded a client payment",
  "payment.consultant": "Recorded a student payment",
  "payment.consultant.override": "Paid a student before the client (override)",
  "report.billing_summary": "Viewed the billing summary",
  "report.billing_summary.csv": "Exported the billing CSV",
  "report.overview": "Opened the dashboard",
  "audit.view": "Viewed the activity log",
};

const actionLabel = (a: string) => ACTIONS[a] ?? a.replace(/[._]/g, " ");

type Area = { id: string; label: string; body: string; icon: LucideIcon };

const AREAS: Area[] = [
  { id: "", label: "Everything", body: "All areas together", icon: History },
  { id: "client", label: "Clients", body: "Added, changed, archived", icon: Building2 },
  { id: "placement", label: "Placements", body: "Added, changed, deleted", icon: Handshake },
  { id: "timesheet", label: "Timesheets", body: "Sent, verified, approved, sent back", icon: Clock },
  { id: "invoice", label: "Invoices", body: "Raised, emailed, marked sent", icon: ReceiptText },
  { id: "payment", label: "Payments", body: "From clients, to students, overrides", icon: CreditCard },
  { id: "report", label: "Reports", body: "Billing summary and CSV exports", icon: FileBarChart },
];

export function ActivityLog() {
  const who = useWho();
  const summary = useApi(who ? () => adminApi.auditSummary(who) : null, [who?.email]);
  const [area, setArea] = useState<Area | null>(null);

  if (area) return <AreaLog area={area} people={summary.data?.people ?? []} onBack={() => setArea(null)} />;

  const sum = (r: Record<string, number> | undefined, id: string) => (id ? (r?.[id] ?? 0) : Object.values(r ?? {}).reduce((a, b) => a + b, 0));
  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--dash-muted)]">Pick an area to see what was done, by whom and when. Counts are changes (page views not included).</p>
      {summary.error && <ErrorNote text={summary.error} onRetry={summary.reload} />}
      {summary.loading && !summary.data ? (
        <Loading />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {AREAS.map((a) => {
            const Icon = a.icon;
            return (
              <li key={a.id || "all"}>
                <button
                  type="button"
                  onClick={() => setArea(a)}
                  className="dash-card flex h-full w-full items-start gap-4 p-5 text-left transition hover:-translate-y-0.5 hover:border-[var(--dash-line-strong)] hover:shadow-[0_18px_40px_-28px_rgb(4_19_39/0.55)]"
                >
                  <span className="grid size-11 flex-none place-items-center rounded-xl bg-[var(--dash-orange-tint)] text-[var(--dash-orange)]">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-semibold">{a.label}</span>
                    <span className="block text-xs text-[var(--dash-muted)]">{a.body}</span>
                    <span className="mt-3 block text-2xl font-semibold tabular-nums">{sum(summary.data?.changes, a.id).toLocaleString("en-US")}</span>
                    <span className="block text-xs text-[var(--dash-muted)]">{sum(summary.data?.last30Days, a.id).toLocaleString("en-US")} in the last 30 days</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

const PAGE_SIZES = [25, 50, 100];

/** One area's log, filling the panel: filters in one row, then the list, then pages. */
function AreaLog({ area, people, onBack }: { area: Area; people: string[]; onBack: () => void }) {
  const who = useWho();
  const [f, setF] = useState<AuditFilters>({ entityType: area.id || undefined, order: "newest", changesOnly: true, page: 1, pageSize: 25 });
  const set = (patch: Partial<AuditFilters>) => setF((x) => ({ ...x, ...patch, page: patch.page ?? 1 }));
  const query = useDebounced(f, 250);
  const log = useApi(who ? () => adminApi.auditLog(who, query) : null, [who?.email, JSON.stringify(query)]);
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [f.page]);

  const actions = Object.keys(ACTIONS).filter((a) => !area.id || a.startsWith(`${area.id}.`));
  const total = log.data?.total ?? 0;
  const page = f.page ?? 1;
  const size = f.pageSize ?? 25;
  const pages = Math.max(1, Math.ceil(total / size));
  const first = total ? (page - 1) * size + 1 : 0;
  const last = Math.min(total, page * size);
  const anyFilter = Boolean(f.actor || f.action || f.from || f.to);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="dash-btn-ghost" onClick={onBack}>
          <ArrowLeft className="size-4" aria-hidden="true" /> All areas
        </button>
        <h2 className="text-lg font-semibold">{area.label}</h2>
      </div>

      <div className="dash-card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-6 sm:p-5">
        <Pick id="lg-person" label="Person" value={f.actor ?? ""} onChange={(v) => set({ actor: v || undefined })} all="Anyone" options={people.map((p) => ({ value: p, label: p }))} />
        <Pick
          id="lg-action"
          label="What"
          value={f.action ?? ""}
          onChange={(v) => set({ action: v || undefined })}
          all={area.id ? `Anything in ${area.label.toLowerCase()}` : "Anything"}
          options={actions.map((a) => ({ value: a, label: actionLabel(a) }))}
        />
        <div>
          <label htmlFor="lg-from" className="dash-label">
            From
          </label>
          <input id="lg-from" type="date" className="dash-input" value={f.from ?? ""} max={f.to} onChange={(e) => set({ from: e.target.value || undefined })} />
        </div>
        <div>
          <label htmlFor="lg-to" className="dash-label">
            To
          </label>
          <input id="lg-to" type="date" className="dash-input" value={f.to ?? ""} min={f.from} onChange={(e) => set({ to: e.target.value || undefined })} />
        </div>
        <Pick
          id="lg-order"
          label="Sort"
          value={f.order ?? "newest"}
          onChange={(v) => set({ order: v as "newest" | "oldest" })}
          options={[
            { value: "newest", label: "Newest first" },
            { value: "oldest", label: "Oldest first" },
          ]}
        />
        <Pick id="lg-size" label="Per page" value={String(size)} onChange={(v) => set({ pageSize: Number(v) })} options={PAGE_SIZES.map((n) => ({ value: String(n), label: String(n) }))} />
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 sm:col-span-2 lg:col-span-6">
          <label className="flex min-h-[44px] items-center gap-2.5 text-sm font-medium sm:min-h-0">
            <input type="checkbox" className="size-4 accent-[var(--dash-orange)]" checked={f.changesOnly ?? false} onChange={(e) => set({ changesOnly: e.target.checked })} />
            Changes only (hide page views)
          </label>
          {anyFilter && (
            <button type="button" className="text-sm font-semibold text-[var(--dash-orange-ink)] hover:underline" onClick={() => set({ actor: undefined, action: undefined, from: undefined, to: undefined })}>
              Clear filters
            </button>
          )}
        </div>
      </div>

      <p className="text-sm text-[var(--dash-muted)]" role="status">
        {log.loading && !log.data ? "Loading…" : total ? `Showing ${first.toLocaleString("en-US")}–${last.toLocaleString("en-US")} of ${total.toLocaleString("en-US")}` : "Nothing matches"}
      </p>

      {log.error && <ErrorNote text={log.error} onRetry={log.reload} />}
      {log.loading && !log.data ? (
        <Loading />
      ) : (
        <div className={cn("dash-card p-2 sm:p-3", log.loading && "opacity-60")}>
          {(log.data?.entries.length ?? 0) === 0 ? (
            <Empty title="Nothing matches" body="Try another person, date or action." />
          ) : (
            <div className="dash-table-wrap">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th scope="col">When</th>
                    <th scope="col">What</th>
                    <th scope="col">Who</th>
                    <th scope="col">Area</th>
                    <th scope="col">Record</th>
                  </tr>
                </thead>
                <tbody>
                  {log.data!.entries.map((e) => (
                    <Row key={e.id} entry={e} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {pages > 1 && (
        <nav className="flex items-center justify-between gap-2" aria-label="Pages">
          <button type="button" className="dash-btn-ghost" disabled={page <= 1} onClick={() => set({ page: page - 1 })}>
            <ChevronLeft className="size-4" aria-hidden="true" /> Newer
          </button>
          <span className="text-sm text-[var(--dash-muted)]">
            Page {page} of {pages}
          </span>
          <button type="button" className="dash-btn-ghost" disabled={page >= pages} onClick={() => set({ page: page + 1 })}>
            Older <ChevronRight className="size-4" aria-hidden="true" />
          </button>
        </nav>
      )}
    </div>
  );
}

function Row({ entry: e }: { entry: AuditEntry }) {
  const reason = (e.detail as { reason?: string } | null)?.reason;
  return (
    <tr>
      <td className="text-[var(--dash-muted)]">{dateTime(e.at)}</td>
      <td>
        <span className={cn("font-semibold", e.action.endsWith("override") && "text-[var(--dash-orange-ink)]")}>{actionLabel(e.action)}</span>
        {reason && <span className="block text-xs whitespace-normal text-[var(--dash-muted)]">Reason: {reason}</span>}
      </td>
      <td>
        {e.by}
        <span className="block text-xs text-[var(--dash-muted)]">{roleLabel(e.role)}</span>
      </td>
      <td className="capitalize">{e.entityType}</td>
      <td className="font-mono text-xs text-[var(--dash-muted)]" title={e.entityId ?? undefined}>
        {e.entityId ? e.entityId.slice(0, 8) : "–"}
      </td>
    </tr>
  );
}

function Pick({ id, label, value, onChange, options, all }: { id: string; label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; all?: string }) {
  return (
    <div>
      <label htmlFor={id} className="dash-label">
        {label}
      </label>
      <select id={id} className="dash-input" value={value} onChange={(e) => onChange(e.target.value)}>
        {all && <option value="">{all}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
