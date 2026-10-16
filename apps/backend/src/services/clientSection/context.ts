import type { InvoiceStatus, Prisma, TimesheetStatus } from "../../generated/prisma/client.js";
import { addDays, todayIn } from "../../lib/dates.js";
import type { CompanyDetails } from "../../lib/invoicePdf.js";
import type { Mailer } from "../../lib/mailer.js";
import { dec, lineTotal } from "../../lib/money.js";
import type { Db } from "../../lib/prisma.js";
import type { Actor } from "../../lib/roles.js";
import type { FileSigner, FileStore } from "../../lib/storage.js";
import type { VirusScanner } from "../../lib/virusScan.js";
import { createAudit, type Audit } from "../audit.js";

// Shared by the client-section services: their dependencies, and the few
// workflow steps more than one of them performs (inside a transaction).

export type ClientSectionDeps = {
  db: Db;
  store: FileStore;
  signer: FileSigner;
  scan: VirusScanner;
  mailer: Mailer;
  company: CompanyDetails;
  /** The business time zone: what "today" means for issue dates, due dates and jobs. */
  timeZone: string;
  portalUrl: string;
  mail: { maxAttempts: number; retryDelayMs: number };
  now?: () => Date;
};

export type Ctx = Required<ClientSectionDeps> & { audit: Audit; today: () => string };

export function createContext(deps: ClientSectionDeps): Ctx {
  const now = deps.now ?? (() => new Date());
  return { ...deps, now, audit: createAudit(deps.db, now), today: () => todayIn(deps.timeZone, now()) };
}

export type Tx = Prisma.TransactionClient;

// --- labels ---------------------------------------------------------------------------

export const TIMESHEET_LABEL: Record<TimesheetStatus, string> = {
  RECEIVED: "Received",
  VERIFIED: "Verified",
  VERIFIER_APPROVED: "Approved by verifier",
  ACCOUNTS_CHECKED: "Accounts checked",
  INVOICE_RAISED: "Invoice raised",
  SUBMITTED_TO_CLIENT: "Submitted to client",
  REJECTED: "Sent back",
};

// --- timesheet history ------------------------------------------------------------------

export function recordTimesheetMove(ctx: Ctx, tx: Tx, timesheetId: string, from: TimesheetStatus | null, to: TimesheetStatus, actor: Actor, comment?: string | null) {
  return tx.timesheetStatusHistory.create({
    data: {
      timesheetId,
      fromStatus: from,
      toStatus: to,
      comment: comment || null,
      actorUserId: actor.userId,
      actorRole: actor.role,
      actorEmail: actor.email ?? null,
      createdAt: ctx.now(),
    },
  });
}

// --- invoices --------------------------------------------------------------------------

/** The furthest stage reached, from the stage dates (the dates are the truth). */
export function invoiceStatusOf(i: {
  timesheetSubmittedAt: Date | null;
  sentAt: Date | null;
  clientPaidAt: Date | null;
  consultantPaidAt: Date | null;
}): InvoiceStatus {
  if (i.clientPaidAt && i.consultantPaidAt) return "CONSULTANT_PAID";
  if (i.clientPaidAt) return "CLIENT_PAID";
  if (i.sentAt) return "SENT";
  if (i.timesheetSubmittedAt) return "TIMESHEET_SUBMITTED";
  return "RAISED";
}

type RaiseFrom = Prisma.TimesheetGetPayload<{ include: { placement: { include: { client: true } } } }>;

/**
 * Raises the invoice for an accounts-checked timesheet: approved hours × bill rate,
 * due after the client's payment terms. The number comes from a per-year counter
 * (an atomic upsert), so two invoices raised at once never share a number.
 */
export async function raiseInvoice(ctx: Ctx, tx: Tx, t: RaiseFrom, approvedHours: Prisma.Decimal) {
  const { placement } = t;
  const { client } = placement;
  const issueDate = ctx.today();
  const year = Number(issueDate.slice(0, 4));
  const counter = await tx.invoiceCounter.upsert({
    where: { year },
    create: { year, last: 1 },
    update: { last: { increment: 1 } },
  });
  return tx.invoice.create({
    data: {
      number: `PIX-${year}-${String(counter.last).padStart(4, "0")}`,
      timesheetId: t.id,
      placementId: placement.id,
      clientId: client.id,
      month: t.month,
      consultantName: placement.consultantName,
      clientName: client.name,
      clientType: client.type,
      endClientName: placement.endClientName ?? client.endClientName,
      contactPerson: client.contactPerson,
      billingEmail: client.billingEmail,
      hours: approvedHours,
      billRate: placement.billRate,
      payRate: placement.payRate,
      amount: lineTotal(approvedHours, placement.billRate),
      paymentTermsDays: client.paymentTermsDays,
      issueDate: new Date(`${issueDate}T00:00:00Z`),
      dueDate: new Date(`${addDays(issueDate, client.paymentTermsDays)}T00:00:00Z`),
    },
  });
}

/**
 * The timesheet has gone to the client (by email, or in their VMS portal), and
 * with `sent` the invoice too. Moves the timesheet to "Submitted to client".
 */
export async function markSubmittedToClient(
  ctx: Ctx,
  tx: Tx,
  invoiceId: string,
  actor: Actor,
  { sent, comment }: { sent: boolean; comment?: string | null },
) {
  const inv = await tx.invoice.findUniqueOrThrow({ where: { id: invoiceId }, include: { timesheet: { select: { id: true, status: true } } } });
  const at = ctx.now();
  const next = {
    timesheetSubmittedAt: inv.timesheetSubmittedAt ?? at,
    sentAt: sent ? at : inv.sentAt,
    clientPaidAt: inv.clientPaidAt,
    consultantPaidAt: inv.consultantPaidAt,
  };
  const updated = await tx.invoice.update({
    where: { id: inv.id },
    data: { timesheetSubmittedAt: next.timesheetSubmittedAt, sentAt: next.sentAt, status: invoiceStatusOf(next), ...(sent ? { emailFailed: false } : {}) },
  });
  if (inv.timesheet.status === "INVOICE_RAISED") {
    await tx.timesheet.update({ where: { id: inv.timesheet.id }, data: { status: "SUBMITTED_TO_CLIENT" } });
    await recordTimesheetMove(ctx, tx, inv.timesheet.id, "INVOICE_RAISED", "SUBMITTED_TO_CLIENT", actor, comment ?? (sent ? `Sent with invoice ${inv.number}` : null));
  }
  return updated;
}

export const zero = dec(0);
