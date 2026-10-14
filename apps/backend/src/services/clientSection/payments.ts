import { day } from "../../lib/dates.js";
import { conflict, HttpError, notFound } from "../../lib/errors.js";
import { cents, dec } from "../../lib/money.js";
import type { Actor } from "../../lib/roles.js";
import { invoiceStatusOf, type Ctx } from "./context.js";
import type { InvoicesService } from "./invoices.js";

// Money in from the client, money out to the consultant.
//
// The rule that matters: a consultant is paid only after the client has paid.
// Recording a consultant payout without a client payment is refused (409), unless
// an ADMIN overrides it with a written reason; the reason is stored on the payment
// and in the audit log.

export function createPaymentsService(ctx: Ctx, invoices: InvoicesService) {
  const { db, audit } = ctx;

  return {
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
