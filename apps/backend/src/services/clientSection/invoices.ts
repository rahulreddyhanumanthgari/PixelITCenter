import { createHash } from "node:crypto";
import type { Prisma } from "../../generated/prisma/client.js";
import { dayLabel, isoDay, monthLabel } from "../../lib/dates.js";
import { conflict, HttpError, notFound } from "../../lib/errors.js";
import { cleanFileName } from "../../lib/fileType.js";
import { renderInvoicePdf } from "../../lib/invoicePdf.js";
import { log } from "../../lib/logger.js";
import { num, usd } from "../../lib/money.js";
import type { Actor } from "../../lib/roles.js";
import { markSubmittedToClient, raiseInvoice, recordTimesheetMove, TIMESHEET_LABEL, type Ctx } from "./context.js";
import type { Deliver, Trigger } from "./email.js";

// Invoices: raised automatically when accounts checks a timesheet (see
// timesheets.ts), rendered to PDF, sent to the client's billing email (by hand
// or by the monthly job) and tracked through payment. Students never reach any of this.

const include = {
  client: true,
  placement: { select: { role: true, consultantEmail: true } },
  timesheet: { include: { file: true } },
  payments: { orderBy: { createdAt: "asc" } },
  emails: { orderBy: { createdAt: "desc" }, take: 50 },
} satisfies Prisma.InvoiceInclude;

type Full = Prisma.InvoiceGetPayload<{ include: typeof include }>;

const SEND_LOCK_MS = 5 * 60_000;

export function createInvoicesService(ctx: Ctx, deliver: Deliver) {
  const { db, audit, store, signer } = ctx;

  async function load(id: string) {
    const inv = await db.invoice.findUnique({ where: { id }, include });
    if (!inv) throw notFound("Invoice not found.");
    return inv;
  }

  const overdue = (inv: { clientPaidAt: Date | null; dueDate: Date }) => !inv.clientPaidAt && isoDay(inv.dueDate) < ctx.today();

  function view(inv: Full) {
    return {
      id: inv.id,
      number: inv.number,
      month: inv.month,
      monthLabel: monthLabel(inv.month),
      status: inv.status,
      consultantName: inv.consultantName,
      role: inv.placement.role,
      client: { id: inv.clientId, name: inv.clientName, type: inv.clientType, billingEmail: inv.client.billingEmail, autoSendInvoices: inv.client.autoSendInvoices },
      endClientName: inv.endClientName,
      timesheet: { id: inv.timesheetId, status: inv.timesheet.status, statusLabel: TIMESHEET_LABEL[inv.timesheet.status] },
      hours: num(inv.hours),
      billRate: num(inv.billRate),
      payRate: num(inv.payRate),
      amount: num(inv.amount),
      consultantPay: num(inv.hours.mul(inv.payRate).toDecimalPlaces(2)),
      paymentTermsDays: inv.paymentTermsDays,
      issueDate: isoDay(inv.issueDate),
      dueDate: isoDay(inv.dueDate),
      overdue: overdue(inv),
      timesheetSubmittedAt: inv.timesheetSubmittedAt?.toISOString() ?? null,
      sentAt: inv.sentAt?.toISOString() ?? null,
      clientPaymentExpectedDate: inv.clientPaymentExpectedDate ? isoDay(inv.clientPaymentExpectedDate) : null,
      clientPaymentComment: inv.clientPaymentComment,
      clientPaidAt: inv.clientPaidAt ? isoDay(inv.clientPaidAt) : null,
      consultantPaidAt: inv.consultantPaidAt ? isoDay(inv.consultantPaidAt) : null,
      emailFailed: inv.emailFailed,
      payments: inv.payments.map((p) => ({
        id: p.id,
        kind: p.kind,
        amount: num(p.amount),
        date: isoDay(p.date),
        comment: p.comment,
        overrideReason: p.overrideReason,
        by: p.actorEmail ?? p.actorUserId,
        role: p.actorRole,
        at: p.createdAt.toISOString(),
      })),
      emails: inv.emails.map((e) => ({
        id: e.id,
        to: e.to,
        subject: e.subject,
        status: e.status,
        attempt: e.attempt,
        error: e.error,
        trigger: e.trigger,
        at: e.createdAt.toISOString(),
      })),
    };
  }

  /** The invoice PDF, rendered and stored the first time it's needed. */
  async function ensurePdf(id: string) {
    const inv = await db.invoice.findUniqueOrThrow({ where: { id }, include: { pdfFile: true, placement: { select: { role: true } } } });
    if (inv.pdfFile) return inv.pdfFile;

    const data = await renderInvoicePdf(
      {
        number: inv.number,
        issueDate: dayLabel(isoDay(inv.issueDate)),
        dueDate: dayLabel(isoDay(inv.dueDate)),
        paymentTermsDays: inv.paymentTermsDays,
        periodLabel: monthLabel(inv.month),
        client: { name: inv.clientName, type: inv.clientType, endClientName: inv.endClientName, contactPerson: inv.contactPerson, billingEmail: inv.billingEmail },
        consultantName: inv.consultantName,
        role: inv.placement.role,
        hours: inv.hours.toFixed(2),
        rate: usd(inv.billRate),
        total: usd(inv.amount),
      },
      ctx.company,
    );
    const storageKey = await store.put(data);
    try {
      return await db.$transaction(async (tx) => {
        const file = await tx.storedFile.create({
          data: {
            kind: "INVOICE",
            originalName: `${inv.number}.pdf`,
            storageKey,
            mimeType: "application/pdf",
            sizeBytes: data.length,
            sha256: createHash("sha256").update(data).digest("hex"),
            scanStatus: "CLEAN",
          },
        });
        // Only if no other request stored one meanwhile.
        const { count } = await tx.invoice.updateMany({ where: { id, pdfFileId: null }, data: { pdfFileId: file.id } });
        if (count === 0) throw conflict("PDF already stored");
        return file;
      });
    } catch (e) {
      await store.remove(storageKey).catch(() => undefined);
      const again = await db.invoice.findUniqueOrThrow({ where: { id }, include: { pdfFile: true } });
      if (again.pdfFile) return again.pdfFile;
      throw e;
    }
  }

  function invoiceEmail(inv: Full) {
    const period = monthLabel(inv.month);
    const at = inv.endClientName ? ` at ${inv.endClientName}` : "";
    const lines = [
      `Hello ${inv.client.contactPerson ?? "Accounts Payable"},`,
      "",
      `Please find attached invoice ${inv.number} for ${inv.consultantName}'s services (${inv.placement.role}${at}) for ${period}, together with the client-approved timesheet.`,
      "",
      `Hours: ${inv.hours.toFixed(2)}`,
      `Rate: ${usd(inv.billRate)} per hour`,
      `Amount due: ${usd(inv.amount)}`,
      `Due date: ${dayLabel(isoDay(inv.dueDate))} (Net ${inv.paymentTermsDays})`,
      "",
      `Please quote ${inv.number} with your payment. Reply to this email with any questions.`,
      "",
      "Thank you,",
      `${ctx.company.name} Accounts`,
      `${ctx.company.phone} · ${ctx.company.email}`,
    ];
    return {
      to: inv.client.billingEmail,
      subject: `Invoice ${inv.number}: ${inv.consultantName}, ${period} (${ctx.company.name})`,
      text: lines.join("\n"),
    };
  }

  /**
   * Emails the invoice PDF and the approved timesheet PDF to the client's billing
   * email, with retries. On success the invoice is Sent and the timesheet
   * Submitted to client; after the last failed try the invoice is flagged.
   */
  async function send(actor: Actor, id: string, { resend = false, trigger = "MANUAL" as Trigger } = {}) {
    const inv = await load(id);
    if (inv.sentAt && !resend) throw conflict(`This invoice was already sent on ${dayLabel(isoDay(inv.sentAt))}. Choose "Send again" to resend it.`);

    const now = ctx.now();
    const { count } = await db.invoice.updateMany({
      where: { id, OR: [{ sendLockedUntil: null }, { sendLockedUntil: { lt: now } }] },
      data: { sendLockedUntil: new Date(now.getTime() + SEND_LOCK_MS) },
    });
    if (count === 0) throw conflict("This invoice is being sent right now.");

    try {
      const pdf = await ensurePdf(id);
      const [invoicePdf, timesheetPdf] = await Promise.all([store.read(pdf.storageKey), store.read(inv.timesheet.file.storageKey)]);
      const mail = {
        ...invoiceEmail(inv),
        attachments: [
          { filename: `${inv.number}.pdf`, content: invoicePdf, contentType: "application/pdf" },
          { filename: cleanFileName(`Timesheet ${inv.consultantName} ${inv.month}.pdf`), content: timesheetPdf, contentType: "application/pdf" },
        ],
      };
      const result = await deliver(mail, { kind: "INVOICE", trigger, actor, invoiceId: id, clientId: inv.clientId });

      await db.$transaction(async (tx) => {
        if (result.ok) await markSubmittedToClient(ctx, tx, id, actor, { sent: true });
        else await tx.invoice.update({ where: { id }, data: { emailFailed: true } });
        await audit(
          actor,
          { action: result.ok ? "invoice.send" : "invoice.send_failed", entityType: "invoice", entityId: id, detail: { trigger, attempts: result.attempts, resend } },
          tx,
        );
      });
      if (!result.ok) {
        throw new HttpError(502, `The email didn't go out after ${result.attempts} tries. The invoice is flagged; try Send now again later.`);
      }
      return view(await load(id));
    } finally {
      await db.invoice.update({ where: { id }, data: { sendLockedUntil: null } }).catch(() => undefined);
    }
  }

  return {
    ensurePdf,
    send,

    /** The invoice as the API returns it, without an audit entry (the caller writes its own). */
    viewById: async (id: string) => view(await load(id)),

    async get(actor: Actor, id: string) {
      const inv = await load(id);
      await audit(actor, { action: "invoice.view", entityType: "invoice", entityId: id });
      return view(inv);
    },

    async list(actor: Actor, { month, clientId, status }: { month?: string; clientId?: string; status?: Full["status"] }) {
      const rows = await db.invoice.findMany({
        where: { ...(month ? { month } : {}), ...(clientId ? { clientId } : {}), ...(status ? { status } : {}) },
        include,
        orderBy: [{ issueDate: "desc" }, { number: "desc" }],
      });
      await audit(actor, { action: "invoice.list", entityType: "invoice", detail: { count: rows.length, month: month ?? null, status: status ?? null } });
      return rows.map(view);
    },

    /** POST /invoices: for an accounts-checked timesheet that has no invoice yet (normally it's raised automatically). */
    async generate(actor: Actor, timesheetId: string) {
      const existing = await db.invoice.findUnique({ where: { timesheetId }, select: { id: true } });
      if (existing) return { created: false, invoice: view(await load(existing.id)) };

      const inv = await db.$transaction(async (tx) => {
        const t = await tx.timesheet.findUnique({ where: { id: timesheetId }, include: { placement: { include: { client: true } } } });
        if (!t) throw notFound("Timesheet not found.");
        if (t.status !== "ACCOUNTS_CHECKED") throw conflict("An invoice is raised only after accounts checks the timesheet.");
        const created = await raiseInvoice(ctx, tx, t, t.approvedHours ?? t.hours);
        await tx.timesheet.update({ where: { id: t.id }, data: { status: "INVOICE_RAISED" } });
        await recordTimesheetMove(ctx, tx, t.id, "ACCOUNTS_CHECKED", "INVOICE_RAISED", actor, `Invoice ${created.number} raised`);
        await audit(actor, { action: "invoice.create", entityType: "invoice", entityId: created.id, detail: { number: created.number } }, tx);
        return created;
      });
      await ensurePdf(inv.id).catch(() => log.warn("invoice pdf not rendered", { invoice: inv.number }));
      return { created: true, invoice: view(await load(inv.id)) };
    },

    /** By hand: the timesheet went into the client's VMS portal, or the invoice was sent outside the portal. */
    async move(actor: Actor, id: string, { status, comment }: { status: "TIMESHEET_SUBMITTED" | "SENT"; comment?: string }) {
      await db.$transaction(async (tx) => {
        const inv = await tx.invoice.findUnique({ where: { id } });
        if (!inv) throw notFound("Invoice not found.");
        if (status === "TIMESHEET_SUBMITTED" && inv.timesheetSubmittedAt) throw conflict("The timesheet is already marked as submitted to the client.");
        if (status === "SENT" && inv.sentAt) throw conflict("This invoice is already marked as sent.");
        await markSubmittedToClient(ctx, tx, id, actor, { sent: status === "SENT", comment });
        await audit(actor, { action: "invoice.status", entityType: "invoice", entityId: id, detail: { to: status, manual: true } }, tx);
      });
      return view(await load(id));
    },

    /** A short-lived signed link to the invoice PDF. */
    async pdfLink(actor: Actor, id: string) {
      await load(id);
      const file = await ensurePdf(id);
      await audit(actor, { action: "invoice.pdf", entityType: "invoice", entityId: id });
      return { fileName: file.originalName, ...signer.sign(file.id) };
    },

    /** Sends every unsent invoice for one client: the "Send now" for a whole client. */
    async sendPendingForClient(actor: Actor, clientId: string, trigger: Trigger = "MANUAL") {
      const pending = await db.invoice.findMany({ where: { clientId, sentAt: null }, select: { id: true }, orderBy: { issueDate: "asc" } });
      let sent = 0;
      let failed = 0;
      for (const { id } of pending) {
        try {
          await send(actor, id, { trigger });
          sent++;
        } catch {
          failed++;
        }
      }
      return { sent, failed };
    },
  };
}

export type InvoicesService = ReturnType<typeof createInvoicesService>;
