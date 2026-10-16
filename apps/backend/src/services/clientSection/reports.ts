import type { Prisma } from "../../generated/prisma/client.js";
import { toCsv } from "../../lib/csv.js";
import { day, isoDay, monthLabel, monthOf, previousMonth } from "../../lib/dates.js";
import { cents, dec, num, sum } from "../../lib/money.js";
import { canSeeMoney, type Actor } from "../../lib/roles.js";
import type { BillingFilters, BillingStage } from "../../validation/billing.js";
import { TIMESHEET_LABEL, type Ctx } from "./context.js";
import { activeIn } from "./placements.js";

// The billing summary: one row per consultant per month (per timesheet), with
// where it is in the five-stage flow
//
//   1 Timesheet received → 2 Timesheet submitted to client → 3 Invoice sent
//   → 4 Payment received from client → 5 Consultant paid
//
// plus billed / received / paid / margin, overdue flags and per-consultant totals.

const include = {
  placement: { include: { client: true } },
  invoice: { include: { payments: true } },
} satisfies Prisma.TimesheetInclude;
type Row = Prisma.TimesheetGetPayload<{ include: typeof include }>;

export const STAGE_LABEL: Record<BillingStage, string> = {
  timesheet_received: "Timesheet received",
  timesheet_submitted: "Timesheet submitted to client",
  invoice_sent: "Invoice sent",
  client_paid: "Payment received from client",
  consultant_paid: "Consultant paid",
};

export function createReportsService(ctx: Ctx) {
  const { db, audit } = ctx;

  function row(t: Row, today: string) {
    const inv = t.invoice;
    const received = sum(inv?.payments.filter((p) => p.kind === "CLIENT_RECEIPT").map((p) => p.amount) ?? []);
    const paid = sum(inv?.payments.filter((p) => p.kind === "CONSULTANT_PAYOUT").map((p) => p.amount) ?? []);
    const billed = inv?.amount ?? dec(0);
    // What the consultant is owed for the billed hours, paid or not.
    const cost = inv ? cents(inv.hours.mul(inv.payRate)) : dec(0);
    const due = inv ? isoDay(inv.dueDate) : null;
    const overdue = Boolean(inv && !inv.clientPaidAt && due && due < today);
    const stage: BillingStage =
      inv?.clientPaidAt && inv.consultantPaidAt
        ? "consultant_paid"
        : inv?.clientPaidAt
          ? "client_paid"
          : inv?.sentAt
            ? "invoice_sent"
            : inv?.timesheetSubmittedAt
              ? "timesheet_submitted"
              : "timesheet_received";
    return {
      timesheetId: t.id,
      placementId: t.placement.id,
      role: t.placement.role,
      invoiceId: inv?.id ?? null,
      invoiceNumber: inv?.number ?? null,
      month: t.month,
      monthLabel: monthLabel(t.month),
      consultantName: t.placement.consultantName,
      consultantKey: t.placement.consultantUserId ?? t.placement.consultantEmail,
      client: { id: t.placement.client.id, name: t.placement.client.name, type: t.placement.client.type },
      endClientName: t.placement.endClientName ?? t.placement.client.endClientName,
      timesheetStatus: t.status,
      timesheetStatusLabel: TIMESHEET_LABEL[t.status],
      hours: num(t.approvedHours ?? t.hours),
      billed: num(billed),
      received: num(received),
      paid: num(paid),
      /** Billed minus paid to the consultant so far. */
      margin: num(billed.sub(paid)),
      /** Billed minus what the consultant is owed (hours × pay rate): the margin once everyone is paid. */
      expectedMargin: num(billed.sub(cost)),
      dueDate: due,
      overdue,
      daysOverdue: overdue && due ? Math.round((day(today).getTime() - day(due).getTime()) / 86_400_000) : 0,
      stage,
      stageLabel: STAGE_LABEL[stage],
      steps: {
        timesheet_received: t.submittedAt.toISOString(),
        timesheet_submitted: inv?.timesheetSubmittedAt?.toISOString() ?? null,
        invoice_sent: inv?.sentAt?.toISOString() ?? null,
        client_paid: inv?.clientPaidAt ? isoDay(inv.clientPaidAt) : null,
        consultant_paid: inv?.consultantPaidAt ? isoDay(inv.consultantPaidAt) : null,
      },
      /** An admin paid the consultant before the client paid. */
      paidBeforeClient: Boolean(inv?.consultantPaidAt && !inv.clientPaidAt),
      clientPaymentExpectedDate: inv?.clientPaymentExpectedDate ? isoDay(inv.clientPaymentExpectedDate) : null,
      clientPaymentComment: inv?.clientPaymentComment ?? null,
      emailFailed: inv?.emailFailed ?? false,
    };
  }

  type SummaryRow = ReturnType<typeof row>;
  type Summed = "hours" | "billed" | "received" | "paid" | "margin" | "expectedMargin";

  async function rows(f: BillingFilters) {
    const today = ctx.today();
    const found = await db.timesheet.findMany({
      where: {
        ...(f.month ? { month: f.month } : f.year ? { month: { startsWith: `${f.year}-` } } : {}),
        placement: {
          ...(f.clientId ? { clientId: f.clientId } : {}),
          ...(f.consultant ? { consultantName: { contains: f.consultant, mode: "insensitive" } } : {}),
        },
      },
      include,
      orderBy: [{ month: "desc" }, { placement: { consultantName: "asc" } }],
    });
    return found.map((t) => row(t, today)).filter((r) => !f.status || (f.status === "overdue" ? r.overdue : r.stage === f.status));
  }

  function byConsultant(list: SummaryRow[]) {
    const groups = new Map<string, SummaryRow[]>();
    for (const r of list) groups.set(r.consultantKey, [...(groups.get(r.consultantKey) ?? []), r]);
    return [...groups.values()].map((g) => {
      const add = (k: Summed) => num(sum(g.map((r) => dec(r[k] ?? 0))));
      return {
        consultantName: g[0]!.consultantName,
        clients: [...new Set(g.map((r) => r.client.name))],
        months: g.length,
        hours: add("hours"),
        billed: add("billed"),
        received: add("received"),
        paid: add("paid"),
        margin: add("margin"),
        expectedMargin: add("expectedMargin"),
        overdueInvoices: g.filter((r) => r.overdue).length,
      };
    });
  }

  function totals(list: SummaryRow[]) {
    const add = (k: Summed) => num(sum(list.map((r) => dec(r[k] ?? 0))));
    return {
      rows: list.length,
      hours: add("hours"),
      billed: add("billed"),
      received: add("received"),
      paid: add("paid"),
      margin: add("margin"),
      expectedMargin: add("expectedMargin"),
      overdueInvoices: list.filter((r) => r.overdue).length,
      overdueAmount: num(sum(list.filter((r) => r.overdue).map((r) => dec(r.billed ?? 0)))),
    };
  }

  return {
    async billingSummary(actor: Actor, f: BillingFilters) {
      const list = await rows(f);
      await audit(actor, { action: "report.billing_summary", entityType: "report", detail: { ...f, rows: list.length } });
      return { rows: list, byConsultant: byConsultant(list), totals: totals(list) };
    },

    async billingSummaryCsv(actor: Actor, f: BillingFilters) {
      const list = await rows(f);
      await audit(actor, { action: "report.billing_summary.csv", entityType: "report", detail: { ...f, rows: list.length } });
      return toCsv(
        [
          "Month",
          "Consultant",
          "Client / vendor",
          "Type",
          "End client",
          "Hours",
          "Invoice",
          "Stage",
          "Billed",
          "Received from client",
          "Paid to consultant",
          "Margin (billed - paid)",
          "Expected margin",
          "Due date",
          "Overdue",
          "Days overdue",
          "Payment expected",
          "Payment comment",
          "Paid before client",
        ],
        list.map((r) => [
          r.month,
          r.consultantName,
          r.client.name,
          r.client.type === "VENDOR" ? "Vendor" : "Client",
          r.endClientName,
          r.hours,
          r.invoiceNumber,
          r.stageLabel,
          r.billed,
          r.received,
          r.paid,
          r.margin,
          r.expectedMargin,
          r.dueDate,
          r.overdue ? "Yes" : "No",
          r.daysOverdue || null,
          r.clientPaymentExpectedDate,
          r.clientPaymentComment,
          r.paidBeforeClient ? "Yes (admin override)" : "No",
        ]),
      );
    },

    /** Counts for the staff dashboard, by role: each person sees their own queue. */
    async overview(actor: Actor) {
      const today = ctx.today();
      const lastMonth = previousMonth(monthOf(today));
      const role = actor.role;
      const finance = canSeeMoney(role);
      const accounts = role === "admin" || role === "accounts";
      const timesheetStaff = role === "verifier" || accounts;

      const [activePlacements, toVerify, toCheck, missing, unsent, overdue, toPay] = await Promise.all([
        db.placement.count({ where: { extensionStatus: { not: "ENDED" } } }),
        timesheetStaff && role !== "accounts" ? db.timesheet.count({ where: { status: { in: ["RECEIVED", "VERIFIED"] } } }) : null,
        accounts ? db.timesheet.count({ where: { status: "VERIFIER_APPROVED" } }) : null,
        timesheetStaff ? db.placement.count({ where: { ...activeIn(lastMonth), extensionStatus: { not: "ENDED" }, timesheets: { none: { month: lastMonth } } } }) : null,
        finance ? db.invoice.count({ where: { sentAt: null } }) : null,
        finance ? db.invoice.count({ where: { clientPaidAt: null, dueDate: { lt: day(today) } } }) : null,
        finance ? db.invoice.count({ where: { clientPaidAt: { not: null }, consultantPaidAt: null } }) : null,
      ]);
      if (finance) await audit(actor, { action: "report.overview", entityType: "report" });
      return {
        role,
        today,
        lastMonth,
        activePlacements,
        timesheetsToVerify: toVerify,
        timesheetsForAccounts: toCheck,
        missingTimesheetsLastMonth: missing,
        invoicesToSend: unsent,
        overdueInvoices: overdue,
        consultantsToPay: toPay,
      };
    },
  };
}

export type ReportsService = ReturnType<typeof createReportsService>;
