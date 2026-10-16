import { day, dayLabel, isoDay, monthLabel } from "../../lib/dates.js";
import { conflict, HttpError, notFound } from "../../lib/errors.js";
import { cents, dec, sum, usd } from "../../lib/money.js";
import type { Actor } from "../../lib/roles.js";
import { invoiceStatusOf, type Ctx } from "./context.js";
import type { Deliver } from "./email.js";
import type { InvoicesService } from "./invoices.js";

// Money in from the client, money out to the consultant.
//
// The rule that matters: a consultant is paid only after the client has paid.
// Recording a consultant payout without a client payment is refused (409), unless
// an ADMIN overrides it with a written reason; the reason is stored on the payment
// and in the audit log.

export function createPaymentsService(ctx: Ctx, invoices: InvoicesService, deliver: Deliver) {
  const { db, audit } = ctx;

  /**
   * The payment reminder for one placement: every invoice the client hasn't paid,
   * in one fixed message to the client's billing email. Only the invoices and
   * amounts change from one reminder to the next.
   */
  async function reminderFor(placementId: string) {
    const p = await db.placement.findUnique({ where: { id: placementId }, include: { client: true } });
    if (!p) throw notFound("Placement not found.");
    const unpaid = await db.invoice.findMany({ where: { placementId, clientPaidAt: null }, orderBy: { issueDate: "asc" } });
    if (unpaid.length === 0) throw conflict("Nothing is unpaid for this placement, so there's nothing to remind them about.");
    const today = ctx.today();
    const total = sum(unpaid.map((i) => i.amount));
    const lines = unpaid.map((i) => {
      const due = isoDay(i.dueDate);
      const late = due < today ? Math.round((day(today).getTime() - day(due).getTime()) / 86_400_000) : 0;
      return `  ${i.number}  ${monthLabel(i.month).padEnd(15)} ${usd(i.amount).padStart(12)}   due ${dayLabel(due)}${late ? ` (${late} day${late === 1 ? "" : "s"} overdue)` : ""}`;
    });
    const subject = `Payment reminder: ${unpaid.length} invoice${unpaid.length === 1 ? "" : "s"}, ${usd(total)} (${ctx.company.name})`;
    const text = [
      `Hello ${p.client.contactPerson ?? "Accounts Payable"},`,
      "",
      `This is a friendly reminder that the following invoice${unpaid.length === 1 ? " is" : "s are"} still open for ${p.consultantName}'s services (${p.role}) with ${p.client.name}:`,
      "",
      ...lines,
      "",
      `Total outstanding: ${usd(total)}`,
      "",
      `If payment is already on its way, thank you, and please reply with the expected date. Please quote the invoice number${unpaid.length === 1 ? "" : "s"} with your payment.`,
      "",
      "Thank you,",
      `${ctx.company.name} Accounts`,
      `${ctx.company.phone} · ${ctx.company.email}`,
    ].join("\n");
    return { placement: p, unpaid, total, mail: { to: p.client.billingEmail, subject, text } };
  }

  return {
    /** Preview or send the reminder. Sending is logged in the email log and the audit log. */
    async remind(actor: Actor, { placementId, preview }: { placementId: string; preview?: boolean }) {
      const r = await reminderFor(placementId);
      const summary = { to: r.mail.to, subject: r.mail.subject, text: r.mail.text, invoices: r.unpaid.length, total: r.total.toNumber() };
      if (preview) return { ...summary, sent: false };
      const result = await deliver(r.mail, { kind: "PAYMENT_REMINDER", trigger: "MANUAL", actor, clientId: r.placement.clientId, invoiceId: r.unpaid[0]!.id });
      await audit(actor, {
        action: result.ok ? "payment.reminder" : "payment.reminder_failed",
        entityType: "payment",
        entityId: placementId,
        detail: { invoices: r.unpaid.map((i) => i.number), attempts: result.attempts },
      });
      if (!result.ok) throw new HttpError(502, `The reminder didn't go out after ${result.attempts} tries. Check the client's billing email and try again.`);
      return { ...summary, sent: true };
    },

    /** "expected": the client said when it pays (date + comment). "received": the money arrived. */
    async recordClient(
      actor: Actor,
      input:
        | { invoiceId: string; status: "expected"; expectedDate: string; comment?: string }
        | { invoiceId: string; status: "received"; receivedDate: string; amount?: number; comment?: string },
    ) {
      await db.$transaction(async (tx) => {
        const inv = await tx.invoice.findUnique({ where: { id: input.invoiceId } });
        if (!inv) throw notFound("Invoice not found.");
        if (inv.clientPaidAt) throw conflict("The client's payment for this invoice is already recorded.");

        if (input.status === "expected") {
          await tx.invoice.update({
            where: { id: inv.id },
            data: { clientPaymentExpectedDate: day(input.expectedDate), clientPaymentComment: input.comment ?? inv.clientPaymentComment },
          });
          await audit(actor, { action: "payment.client.expected", entityType: "invoice", entityId: inv.id, detail: { expectedDate: input.expectedDate } }, tx);
          return;
        }

        if (!inv.timesheetSubmittedAt && !inv.sentAt) {
          throw conflict("Send the invoice (or mark it sent) before recording the client's payment.");
        }
        const amount = input.amount === undefined ? inv.amount : cents(dec(input.amount));
        if (!amount.equals(inv.amount) && !input.comment) {
          throw new HttpError(400, "Some details aren't in the right format.", { fields: { comment: "Say why the amount differs from the invoice." } });
        }
        // Conditional: two people recording at once can't both succeed.
        const next = { ...inv, clientPaidAt: day(input.receivedDate) };
        const { count } = await tx.invoice.updateMany({
          where: { id: inv.id, clientPaidAt: null },
          data: { clientPaidAt: next.clientPaidAt, status: invoiceStatusOf(next), clientPaymentComment: input.comment ?? inv.clientPaymentComment },
        });
        if (count === 0) throw conflict("The client's payment for this invoice is already recorded.");
        const payment = await tx.payment.create({
          data: {
            invoiceId: inv.id,
            kind: "CLIENT_RECEIPT",
            amount,
            date: next.clientPaidAt,
            comment: input.comment ?? null,
            actorUserId: actor.userId,
            actorRole: actor.role,
            actorEmail: actor.email ?? null,
            createdAt: ctx.now(),
          },
        });
        await audit(actor, { action: "payment.client.received", entityType: "payment", entityId: payment.id, detail: { invoiceId: inv.id, receivedDate: input.receivedDate } }, tx);
      });
      return invoices.viewById(input.invoiceId);
    },

    async recordConsultant(actor: Actor, input: { invoiceId: string; paidDate: string; amount?: number; comment?: string; overrideReason?: string }) {
      await db.$transaction(async (tx) => {
        const inv = await tx.invoice.findUnique({ where: { id: input.invoiceId } });
        if (!inv) throw notFound("Invoice not found.");
        if (inv.consultantPaidAt) throw conflict("The consultant's payment for this invoice is already recorded.");

        let overrideReason: string | null = null;
        if (!inv.clientPaidAt) {
          if (!input.overrideReason) {
            throw new HttpError(409, "Record the client's payment first. An admin can override this with a reason.", { code: "client_payment_missing" });
          }
          if (actor.role !== "admin") throw new HttpError(403, "Only an admin can pay a consultant before the client pays.");
          overrideReason = input.overrideReason;
        }

        const amount = input.amount === undefined ? cents(inv.hours.mul(inv.payRate)) : cents(dec(input.amount));
        const next = { ...inv, consultantPaidAt: day(input.paidDate) };
        const { count } = await tx.invoice.updateMany({
          where: { id: inv.id, consultantPaidAt: null },
          data: { consultantPaidAt: next.consultantPaidAt, status: invoiceStatusOf(next) },
        });
        if (count === 0) throw conflict("The consultant's payment for this invoice is already recorded.");
        const payment = await tx.payment.create({
          data: {
            invoiceId: inv.id,
            kind: "CONSULTANT_PAYOUT",
            amount,
            date: next.consultantPaidAt,
            comment: input.comment ?? null,
            overrideReason,
            actorUserId: actor.userId,
            actorRole: actor.role,
            actorEmail: actor.email ?? null,
            createdAt: ctx.now(),
          },
        });
        await audit(
          actor,
          {
            action: overrideReason ? "payment.consultant.override" : "payment.consultant",
            entityType: "payment",
            entityId: payment.id,
            detail: { invoiceId: inv.id, paidDate: input.paidDate, ...(overrideReason ? { reason: overrideReason } : {}) },
          },
          tx,
        );
      });
      return invoices.viewById(input.invoiceId);
    },
  };
}

export type PaymentsService = ReturnType<typeof createPaymentsService>;
