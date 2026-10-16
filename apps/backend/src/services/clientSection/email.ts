import { setTimeout as sleep } from "node:timers/promises";
import type { EmailKind } from "../../generated/prisma/client.js";
import { log } from "../../lib/logger.js";
import { safeMailError, type Mail } from "../../lib/mailer.js";
import type { Actor } from "../../lib/roles.js";
import type { Ctx } from "./context.js";

// Sends one email with retries and logs every attempt (to, subject, time,
// status) in EmailLog. Waits MAIL_RETRY_DELAY_MS, then twice that, and so on.
// After the last failed attempt it returns ok: false; the caller flags the record.

export type Trigger = "MANUAL" | "MONTHLY_JOB" | "REMINDER_JOB" | "WORKFLOW";

export type DeliveryMeta = {
  kind: EmailKind;
  trigger: Trigger;
  actor: Actor;
  invoiceId?: string;
  clientId?: string;
  recipientUserId?: string | null;
};

export function createDelivery(ctx: Ctx) {
  return async function deliver(mail: Mail, meta: DeliveryMeta): Promise<{ ok: boolean; attempts: number }> {
    const max = ctx.mail.maxAttempts;
    for (let attempt = 1; attempt <= max; attempt++) {
      try {
        const { messageId } = await ctx.mailer.send(mail);
        await logAttempt(ctx, mail, meta, attempt, { status: "SENT", providerMessageId: messageId });
        return { ok: true, attempts: attempt };
      } catch (e) {
        const error = safeMailError(e);
        await logAttempt(ctx, mail, meta, attempt, { status: "FAILED", error });
        log.warn("email attempt failed", { kind: meta.kind, attempt, error });
        if (attempt < max && ctx.mail.retryDelayMs > 0) await sleep(ctx.mail.retryDelayMs * 2 ** (attempt - 1));
      }
    }
    return { ok: false, attempts: max };
  };
}

export type Deliver = ReturnType<typeof createDelivery>;

function logAttempt(
  ctx: Ctx,
  mail: Mail,
  meta: DeliveryMeta,
  attempt: number,
  result: { status: "SENT" | "FAILED"; providerMessageId?: string; error?: string },
) {
  return ctx.db.emailLog.create({
    data: {
      kind: meta.kind,
      invoiceId: meta.invoiceId ?? null,
      clientId: meta.clientId ?? null,
      recipientUserId: meta.recipientUserId ?? null,
      to: mail.to,
      subject: mail.subject,
      status: result.status,
      attempt,
      error: result.error ?? null,
      providerMessageId: result.providerMessageId ?? null,
      trigger: meta.trigger,
      actorUserId: meta.actor.userId,
      createdAt: ctx.now(),
    },
  });
}
