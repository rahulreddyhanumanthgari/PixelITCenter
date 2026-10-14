import { createHash } from "node:crypto";
import type { Prisma, TimesheetStatus } from "../../generated/prisma/client.js";
import { isoDay, monthEnd, monthLabel, monthOf, monthStart } from "../../lib/dates.js";
import { conflict, HttpError, notFound } from "../../lib/errors.js";
import { checkFileType, cleanFileName } from "../../lib/fileType.js";
import { log } from "../../lib/logger.js";
import { dec, num } from "../../lib/money.js";
import { canSeeMoney, type Actor, type Role } from "../../lib/roles.js";
import type { TimesheetMove } from "../../validation/billing.js";
import { markSubmittedToClient, raiseInvoice, recordTimesheetMove, TIMESHEET_LABEL, type Ctx } from "./context.js";
import type { Deliver, Trigger } from "./email.js";
import type { InvoicesService } from "./invoices.js";
import { activeIn, type PlacementsService } from "./placements.js";

// Timesheets: the consultant uploads one client-approved PDF a month; staff take
// it through
//
//   Received → Verified → Approved by verifier → Accounts checked → Invoice raised
//            → Submitted to client
//
// Verifier and accounts are separate roles: accounts acts only after the verifier
// approves, and the person who approved as verifier can't also do the accounts
// check (not even an admin). Before the invoice, any step can send it back to the
// consultant with a comment; they upload again and it starts over at Received.
// Every move is in TimesheetStatusHistory (who, when, comment).

const RULES: Record<TimesheetMove, { from: TimesheetStatus[]; roles: Role[] }> = {
  VERIFIED: { from: ["RECEIVED"], roles: ["verifier", "admin"] },
  VERIFIER_APPROVED: { from: ["VERIFIED"], roles: ["verifier", "admin"] },
  ACCOUNTS_CHECKED: { from: ["VERIFIER_APPROVED"], roles: ["accounts", "admin"] },
  SUBMITTED_TO_CLIENT: { from: ["INVOICE_RAISED"], roles: ["accounts", "admin"] },
  REJECTED: { from: ["RECEIVED", "VERIFIED", "VERIFIER_APPROVED"], roles: ["verifier", "accounts", "admin"] },
};

const WRONG_ROLE: Record<TimesheetMove, string> = {
  VERIFIED: "Only a verifier can verify a timesheet.",
  VERIFIER_APPROVED: "Only a verifier can approve a timesheet.",
  ACCOUNTS_CHECKED: "Only accounts can do the accounts check.",
  SUBMITTED_TO_CLIENT: "Only accounts can mark a timesheet as submitted to the client.",
  REJECTED: "You can't send this timesheet back.",
};

/** What the consultant sees, in their own words (matches the student Timesheets page). */
function studentStatus(status: TimesheetStatus, consultantPaid: boolean) {
  if (consultantPaid) return "Paid";
  switch (status) {
    case "RECEIVED":
      return "Submitted";
    case "VERIFIED":
    case "VERIFIER_APPROVED":
      return "Under Verification";
    case "ACCOUNTS_CHECKED":
      return "Approved";
    case "INVOICE_RAISED":
    case "SUBMITTED_TO_CLIENT":
      return "Invoiced";
    case "REJECTED":
      return "Needs Resubmission";
  }
}

const include = {
  placement: { include: { client: true } },
  file: true,
  invoice: { select: { id: true, number: true, status: true, amount: true, consultantPaidAt: true } },
  history: { orderBy: { createdAt: "asc" } },
} satisfies Prisma.TimesheetInclude;

type Full = Prisma.TimesheetGetPayload<{ include: typeof include }>;

const lastComment = (t: Full, status: TimesheetStatus) => [...t.history].reverse().find((h) => h.toStatus === status)?.comment ?? null;

export function createTimesheetsService(ctx: Ctx, deliver: Deliver, invoices: InvoicesService, placements: PlacementsService) {
  const { db, audit, store, signer, scan } = ctx;

  function adminView(t: Full, role: Role) {
    const money = canSeeMoney(role);
    return {
      id: t.id,
      month: t.month,
      monthLabel: monthLabel(t.month),
      status: t.status,
      statusLabel: TIMESHEET_LABEL[t.status],
      hours: num(t.hours),
      approvedHours: num(t.approvedHours),
      leaveDays: num(t.leaveDays),
      leaveNote: t.leaveNote,
      submittedAt: t.submittedAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
      consultant: { name: t.placement.consultantName, email: t.placement.consultantEmail },
      placement: { id: t.placement.id, role: t.placement.role },
      client: { id: t.placement.client.id, name: t.placement.client.name, type: t.placement.client.type },
      endClientName: t.placement.endClientName ?? t.placement.client.endClientName,
      file: { name: t.file.originalName, sizeBytes: t.file.sizeBytes },
      rejectionComment: t.status === "REJECTED" ? lastComment(t, "REJECTED") : null,
      invoice: t.invoice ? { id: t.invoice.id, number: t.invoice.number, ...(money ? { status: t.invoice.status, amount: num(t.invoice.amount) } : {}) } : null,
    };
  }

  function detailView(t: Full, role: Role) {
    return {
      ...adminView(t, role),
      fileLink: signer.sign(t.file.id),
      history: t.history.map((h) => ({
        from: h.fromStatus,
        to: h.toStatus,
        toLabel: TIMESHEET_LABEL[h.toStatus],
        comment: h.comment,
        by: h.actorEmail ?? h.actorUserId,
        role: h.actorRole,
        at: h.createdAt.toISOString(),
      })),
      /** What this user may do next. */
      actions: (Object.keys(RULES) as TimesheetMove[]).filter((m) => allowed(m, t, role)),
    };
  }

  function allowed(move: TimesheetMove, t: { status: TimesheetStatus }, role: Role) {
    const rule = RULES[move];
    if (!rule.roles.includes(role) || !rule.from.includes(t.status)) return false;
    // Accounts acts only after the verifier has approved.
    if (role === "accounts" && move === "REJECTED") return t.status === "VERIFIER_APPROVED";
    return true;
  }

  /** The consultant's own timesheets. Never rates or invoice amounts. */
  async function studentList(actor: Actor) {
    const mine = await placements.forConsultant(actor);
    const rows = await db.timesheet.findMany({ where: { placementId: { in: mine.map((p) => p.id) } }, include, orderBy: { month: "desc" } });
    return rows.map((t) => ({
      id: t.id,
      month: t.month,
      hours: num(t.hours),
      leaveDays: num(t.leaveDays),
      leaveNote: t.leaveNote ?? "",
      fileName: t.file.originalName,
      fileLink: signer.sign(t.file.id),
      submittedAt: t.submittedAt.toISOString(),
      status: studentStatus(t.status, Boolean(t.invoice?.consultantPaidAt)),
      comment: t.status === "REJECTED" ? lastComment(t, "REJECTED") : null,
    }));
  }

  async function load(id: string) {
    const t = await db.timesheet.findUnique({ where: { id }, include });
    if (!t) throw notFound("Timesheet not found.");
    return t;
  }

  /** Tells the consultant in the portal and by email. Never throws: the workflow has already moved. */
  async function tellConsultant(
    p: { consultantUserId: string | null; consultantEmail: string; consultantName: string },
    month: string,
    kind: "TIMESHEET_REJECTED" | "TIMESHEET_REMINDER",
    trigger: Trigger,
    actor: Actor,
    comment?: string | null,
  ) {
    const period = monthLabel(month);
    const link = `${ctx.portalUrl}/portal/timesheets`;
    const text =
      kind === "TIMESHEET_REJECTED"
        ? {
            title: `Your ${period} timesheet needs a fix`,
            body: `Please upload it again. Note from PixelIT: ${comment ?? ""}`,
          }
        : { title: `Upload your ${period} timesheet`, body: "Please upload your client-approved timesheet (one PDF) before the month ends." };
    try {
      if (p.consultantUserId) await db.notification.create({ data: { userId: p.consultantUserId, title: text.title, body: text.body, href: "/portal/timesheets", createdAt: ctx.now() } });
      await deliver(
        {
          to: p.consultantEmail,
          subject: `${text.title} (${ctx.company.name})`,
          text: [`Hello ${p.consultantName},`, "", text.body, "", `Upload it here: ${link}`, "", `${ctx.company.name} Accounts`].join("\n"),
        },
        { kind, trigger, actor, recipientUserId: p.consultantUserId },
      );
    } catch {
      log.warn("consultant not notified", { kind });
    }
  }

  return {
    // --- staff ---------------------------------------------------------------------------

    async list(actor: Actor, f: { month?: string; clientId?: string; status?: TimesheetStatus; consultant?: string }) {
      const rows = await db.timesheet.findMany({
        where: {
          ...(f.month ? { month: f.month } : {}),
          ...(f.status ? { status: f.status } : {}),
          placement: {
            ...(f.clientId ? { clientId: f.clientId } : {}),
            ...(f.consultant ? { consultantName: { contains: f.consultant, mode: "insensitive" } } : {}),
          },
        },
        include,
        orderBy: [{ month: "desc" }, { submittedAt: "desc" }],
      });
      await audit(actor, { action: "timesheet.list", entityType: "timesheet", detail: { count: rows.length, month: f.month ?? null, status: f.status ?? null } });
      return rows.map((t) => adminView(t, actor.role));
    },

    async get(actor: Actor, id: string) {
      const t = await load(id);
      await audit(actor, { action: "timesheet.view", entityType: "timesheet", entityId: id });
      return detailView(t, actor.role);
    },

    async move(actor: Actor, id: string, body: { status: TimesheetMove; comment?: string; approvedHours?: number }) {
      const rule = RULES[body.status];
      if (!rule.roles.includes(actor.role)) throw new HttpError(403, WRONG_ROLE[body.status]);

      const { raisedInvoiceId } = await db.$transaction(async (tx) => {
        const t = await tx.timesheet.findUnique({ where: { id }, include: { placement: { include: { client: true } }, history: { orderBy: { createdAt: "desc" } } } });
        if (!t) throw notFound("Timesheet not found.");
        if (!rule.from.includes(t.status)) {
          throw conflict(`This timesheet is "${TIMESHEET_LABEL[t.status]}", so it can't be moved to "${TIMESHEET_LABEL[body.status]}".`);
        }
        if (!allowed(body.status, t, actor.role)) throw new HttpError(403, "Accounts can act only after the verifier approves the timesheet.");

        if (body.status === "SUBMITTED_TO_CLIENT") {
          // E.g. uploaded to the client's VMS portal. Recorded on the invoice too.
          const inv = await tx.invoice.findUniqueOrThrow({ where: { timesheetId: id }, select: { id: true } });
          await markSubmittedToClient(ctx, tx, inv.id, actor, { sent: false, comment: body.comment });
          await audit(actor, { action: "timesheet.status", entityType: "timesheet", entityId: id, detail: { from: t.status, to: body.status } }, tx);
          return { raisedInvoiceId: null };
        }

        let approvedHours: Prisma.Decimal | undefined;
        if (body.status === "ACCOUNTS_CHECKED") {
          const approver = t.history.find((h) => h.toStatus === "VERIFIER_APPROVED");
          if (approver?.actorUserId === actor.userId) {
            throw new HttpError(403, "You approved this timesheet as the verifier, so someone else must do the accounts check.");
          }
          approvedHours = body.approvedHours === undefined ? t.hours : dec(body.approvedHours);
          if (!approvedHours.equals(t.hours) && !body.comment) {
            throw new HttpError(400, "Some details aren't in the right format.", { fields: { comment: "Say why the hours differ from the timesheet." } });
          }
        }

        // Conditional on the status we read: two people acting at once can't both win.
        const { count } = await tx.timesheet.updateMany({
          where: { id, status: t.status },
          data: { status: body.status, ...(approvedHours ? { approvedHours } : {}) },
        });
        if (count === 0) throw conflict("Someone else just changed this timesheet. Reload and try again.");
        await recordTimesheetMove(ctx, tx, id, t.status, body.status, actor, body.comment);
        await audit(actor, { action: "timesheet.status", entityType: "timesheet", entityId: id, detail: { from: t.status, to: body.status } }, tx);

        if (body.status === "ACCOUNTS_CHECKED" && approvedHours) {
          // Accounts approved: raise the invoice now, in the same transaction.
          const inv = await raiseInvoice(ctx, tx, t, approvedHours);
          await tx.timesheet.update({ where: { id }, data: { status: "INVOICE_RAISED" } });
          await recordTimesheetMove(ctx, tx, id, "ACCOUNTS_CHECKED", "INVOICE_RAISED", actor, `Invoice ${inv.number} raised`);
          await audit(actor, { action: "invoice.create", entityType: "invoice", entityId: inv.id, detail: { number: inv.number, automatic: true } }, tx);
          return { raisedInvoiceId: inv.id };
        }
        return { raisedInvoiceId: null };
      });

      if (raisedInvoiceId) await invoices.ensurePdf(raisedInvoiceId).catch(() => log.warn("invoice pdf not rendered; it is made on first download"));
      const t = await load(id);
      if (body.status === "REJECTED") await tellConsultant(t.placement, t.month, "TIMESHEET_REJECTED", "WORKFLOW", actor, body.comment);
      return detailView(t, actor.role);
    },

    /** Emails (and notifies in the portal) every placed consultant with no timesheet for `month`. */
    async sendReminders(actor: Actor, month: string, trigger: Trigger) {
      const active = await db.placement.findMany({
        where: { ...activeIn(month), extensionStatus: { not: "ENDED" }, timesheets: { none: { month } } },
      });
      const seen = new Set<string>();
      for (const p of active) {
        const key = p.consultantUserId ?? p.consultantEmail;
        if (seen.has(key)) continue;
        seen.add(key);
        await tellConsultant(p, month, "TIMESHEET_REMINDER", trigger, actor);
      }
      await audit(actor, { action: "timesheet.reminders", entityType: "timesheet", detail: { month, reminded: seen.size, trigger } });
      return { month, reminded: seen.size };
    },

    // --- the consultant (student role) ------------------------------------------------------

    studentList,

    /** One client-approved PDF per month. A sent-back month can be uploaded again. */
    async studentSubmit(
      actor: Actor,
      input: { month: string; hours: number; leaveDays: number; leaveNote?: string; placementId?: string },
      file: { buffer: Buffer; mimetype: string; originalname: string },
    ) {
      const checked = checkFileType(file.buffer, file.mimetype, file.originalname);
      if (!checked.ok || checked.mime !== "application/pdf") {
        throw new HttpError(415, "Upload the client-approved timesheet as one PDF. Photos and other files aren't accepted.");
      }
      if (input.month > monthOf(ctx.today())) throw new HttpError(400, "Some details aren't in the right format.", { fields: { month: "You can't submit a month that hasn't started." } });
      const scanStatus = await scan(file.buffer);
      if (scanStatus === "INFECTED") throw new HttpError(422, "This file was flagged by the virus scan and was not saved.");

      const mine = await placements.forConsultant(actor);
      const candidates = mine
        .filter((p) => (input.placementId ? p.id === input.placementId : true))
        .filter((p) => isoDay(p.startDate) <= monthEnd(input.month) && (!p.endDate || isoDay(p.endDate) >= monthStart(input.month)));
      if (candidates.length === 0) throw new HttpError(422, `You don't have a placement in ${monthLabel(input.month)}.`);
      if (candidates.length > 1) throw new HttpError(422, "You have more than one placement that month. Say which one (placementId).");
      const placement = candidates[0]!;

      const existing = await db.timesheet.findUnique({ where: { placementId_month: { placementId: placement.id, month: input.month } }, include: { file: true } });
      if (existing && existing.status !== "REJECTED") {
        throw conflict(`You already sent your ${monthLabel(input.month)} timesheet. It's "${studentStatus(existing.status, false)}".`);
      }

      const storageKey = await store.put(file.buffer);
      try {
        const saved = await db.$transaction(async (tx) => {
          const stored = await tx.storedFile.create({
            data: {
              kind: "TIMESHEET",
              originalName: cleanFileName(file.originalname),
              storageKey,
              mimeType: checked.mime,
              sizeBytes: file.buffer.length,
              sha256: createHash("sha256").update(file.buffer).digest("hex"),
              scanStatus,
            },
          });
          const values = { hours: dec(input.hours), leaveDays: dec(input.leaveDays), leaveNote: input.leaveNote || null, fileId: stored.id, status: "RECEIVED" as const, approvedHours: null, submittedAt: ctx.now() };
          if (existing) {
            // Only while still sent back: a staff move in between wins.
            const { count } = await tx.timesheet.updateMany({ where: { id: existing.id, status: "REJECTED" }, data: values });
            if (count === 0) throw conflict("This timesheet changed while you were uploading. Reload and check its status.");
            await tx.storedFile.delete({ where: { id: existing.fileId } });
            await recordTimesheetMove(ctx, tx, existing.id, "REJECTED", "RECEIVED", actor, "Uploaded again");
            return existing.id;
          }
          const created = await tx.timesheet.create({ data: { ...values, placementId: placement.id, month: input.month } });
          await recordTimesheetMove(ctx, tx, created.id, null, "RECEIVED", actor);
          return created.id;
        });
        if (existing) await store.remove(existing.file.storageKey).catch(() => log.warn("old timesheet file not removed"));
        await audit(actor, { action: existing ? "timesheet.resubmit" : "timesheet.submit", entityType: "timesheet", entityId: saved, detail: { month: input.month } });
        return (await studentList(actor)).find((t) => t.id === saved)!;
      } catch (e) {
        await store.remove(storageKey).catch(() => undefined);
        throw e;
      }
    },

    async notifications(actor: Actor) {
      const rows = await db.notification.findMany({ where: { userId: actor.userId }, orderBy: { createdAt: "desc" }, take: 50 });
      return rows.map((n) => ({ id: n.id, title: n.title, body: n.body, href: n.href, read: n.readAt !== null, at: n.createdAt.toISOString() }));
    },

    async markRead(actor: Actor, id: string) {
      // Scoped to the caller: someone else's id looks like a missing one.
      const { count } = await db.notification.updateMany({ where: { id, userId: actor.userId, readAt: null }, data: { readAt: ctx.now() } });
      if (count === 0 && !(await db.notification.findFirst({ where: { id, userId: actor.userId } }))) throw notFound("Notification not found.");
    },
  };
}

export type TimesheetsService = ReturnType<typeof createTimesheetsService>;
