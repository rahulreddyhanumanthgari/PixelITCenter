"use client";

import { useMemo } from "react";
import { registeredStudents } from "@/content/registered-students";
import { adminApi } from "./api";
import { BarList, ChartCard, StatTile } from "./charts";
import { useDeletedStudents } from "./deletedStudents";
import { STATUS_LABEL, withStatus, type Status } from "./TalentPage";
import { ErrorNote, Loading, usd, useApi, useWho } from "./ui";

// Analytics: how the portal is doing, month by month. Real numbers where the
// data lives in the database (clients, placements, billing, overdue); student
// registrations come from the demo student list until the student backend exists.

const MONTHS = 6;

/** The last six months, oldest first: { key: "2026-10", label: "Oct" }. */
function lastMonths(n = MONTHS) {
  const now = new Date();
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(Date.UTC(now.getFullYear(), now.getMonth() - (n - 1 - i), 1));
    return { key: d.toISOString().slice(0, 7), label: d.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }) };
  });
}

const countBy = (keys: string[], dates: string[]) => keys.map((k) => dates.filter((d) => d.startsWith(k)).length);

export function AnalyticsTab() {
  const who = useWho();
  const deleted = useDeletedStudents();
  const placements = useApi(who ? () => adminApi.placements(who) : null, [who?.email]);
  const clients = useApi(
    who ? async () => [...(await adminApi.clients(who)).clients, ...(await adminApi.clients(who, true)).clients] : null,
    [who?.email],
  );
  const billing = useApi(who ? () => adminApi.billingSummary(who) : null, [who?.email]);
  const overview = useApi(who ? () => adminApi.overview(who) : null, [who?.email]);

  const months = useMemo(() => lastMonths(), []);
  const keys = months.map((m) => m.key);
  const labels = months.map((m) => m.label);

  const students = useMemo(() => registeredStudents.filter((s) => !deleted.includes(s.pixelitId)), [deleted]);
  const registrations = countBy(keys, students.map((s) => s.registeredOn));
  const placed = countBy(keys, (placements.data?.placements ?? []).map((p) => p.startDate));
  const newClients = countBy(keys, (clients.data ?? []).map((c) => c.createdAt));
  const rows = billing.data?.rows ?? [];
  const billed = keys.map((k) => rows.filter((r) => r.month === k).reduce((a, r) => a + r.billed, 0));
  const received = keys.map((k) => rows.filter((r) => r.month === k).reduce((a, r) => a + r.received, 0));
  const margin = keys.map((k) => rows.filter((r) => r.month === k).reduce((a, r) => a + r.expectedMargin, 0));

  const now = MONTHS - 1;
  const change = (xs: number[]) => (xs[now] ?? 0) - (xs[now - 1] ?? 0);
  const talent = useMemo(() => {
    const people = students.map((s) => withStatus(s, placements.data?.placements ?? []));
    return (["PLACED", "UNPLACED", "BENCH"] as Status[]).map((s) => ({ status: s, count: people.filter((p) => p.status === s).length }));
  }, [students, placements.data]);

  const error = placements.error ?? clients.error ?? billing.error ?? overview.error;
  const loading = !placements.data || !clients.data || !billing.data || !overview.data;
  const money = (n: number) => usd(n).replace(/\.00$/, "");
  const moneyAxis = (n: number) => `$${new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n)}`;

  if (error) return <ErrorNote text={error} onRetry={() => [placements, clients, billing, overview].forEach((q) => q.reload())} />;
  if (loading) return <Loading />;

  return (
    <div className="space-y-5">
      <ul className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <StatTile label="New registrations" value={String(registrations[now])} delta={change(registrations)} />
        <StatTile label="Students placed" value={String(placed[now])} delta={change(placed)} />
        <StatTile label="New clients" value={String(newClients[now])} delta={change(newClients)} />
        <StatTile label="Active placements" value={String(overview.data!.activePlacements)} note="Not ended" />
        <StatTile label="Billed this month" value={money(billed[now] ?? 0)} delta={change(billed)} formatDelta={(n) => money(Math.abs(n))} />
        <StatTile
          label="Overdue invoices"
          value={String(overview.data!.overdueInvoices ?? 0)}
          note={overview.data!.overdueInvoices ? "Past due, not paid" : "Nothing past due"}
        />
      </ul>
      <p className="text-xs text-[var(--dash-muted)]">This month so far, compared with all of last month. Billing counts invoices by the month the work was done.</p>

      <div className="grid gap-4 sm:gap-5 xl:grid-cols-2">
        <ChartCard
          title="Registrations and placements"
          body="Students who registered, and students placed with a client, each month."
          labels={labels}
          series={[
            { name: "Registered", values: registrations },
            { name: "Placed", values: placed },
          ]}
        />
        <ChartCard
          title="Billed and received"
          body="What was invoiced for each month's work, and what clients have paid of it."
          labels={labels}
          series={[
            { name: "Billed", values: billed },
            { name: "Received", values: received },
          ]}
          format={money}
          axisFormat={moneyAxis}
        />
        <ChartCard title="New clients" body="Clients and vendors added each month." labels={labels} series={[{ name: "New clients", values: newClients }]} />
        <ChartCard
          title="Expected margin"
          body="Billed minus what the students are owed (hours × pay rate), by month of work."
          labels={labels}
          series={[{ name: "Expected margin", values: margin }]}
          format={money}
          axisFormat={moneyAxis}
        />
      </div>

      <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
        <section className="dash-card dash-card-pad">
          <h3 className="text-[0.9375rem] font-semibold">Where students are</h3>
          <p className="mt-0.5 text-xs text-[var(--dash-muted)]">All {students.length} registered students today.</p>
          <div className="mt-4">
            <BarList items={talent.map((t) => ({ label: STATUS_LABEL[t.status], value: t.count }))} />
          </div>
        </section>
        <section className="dash-card dash-card-pad">
          <h3 className="text-[0.9375rem] font-semibold">Waiting on someone</h3>
          <p className="mt-0.5 text-xs text-[var(--dash-muted)]">Work queues right now.</p>
          <div className="mt-4">
            <BarList
              items={[
                { label: "Timesheets to verify", value: overview.data!.timesheetsToVerify ?? 0 },
                { label: "Timesheets waiting for accounts", value: overview.data!.timesheetsForAccounts ?? 0 },
                { label: `Missing timesheets (${new Date(`${overview.data!.lastMonth}-01T12:00:00Z`).toLocaleDateString("en-US", { month: "long", timeZone: "UTC" })})`, value: overview.data!.missingTimesheetsLastMonth ?? 0 },
                { label: "Invoices to send", value: overview.data!.invoicesToSend ?? 0 },
                { label: "Students to pay", value: overview.data!.consultantsToPay ?? 0 },
              ]}
            />
          </div>
        </section>
      </div>
      <p className="text-xs text-[var(--dash-muted)]">
        Clients, placements, billing and queues are live from the database. Registrations come from the demo student list until student accounts are on the server.
      </p>
    </div>
  );
}
