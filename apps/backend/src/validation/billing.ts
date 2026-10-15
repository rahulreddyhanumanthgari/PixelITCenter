import { z } from "zod";
import { isRealDay, MONTH } from "../lib/dates.js";

// Request rules for the client section. Every object schema is strict: unknown
// keys are refused, not ignored, so a stray "status" or "amount" can't slip in.

const name = (max = 200) => z.string().trim().min(1, "Required.").max(max);

/** Trimmed; "" or null clears it. */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional();

const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Enter a valid email address.").max(254));

const httpUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => /^https?:\/\/[^\s]+$/i.test(v) && URL.canParse(v), "Use a full link starting with https://");

const day = z.string().refine(isRealDay, "Use a date like 2026-10-14.");
export const month = z.string().regex(MONTH, "Use a month like 2026-09.");
export const uuid = z.uuid("Not found.");

/** Dollars, at most 2 decimal places. */
const money = (max: number) =>
  z
    .number("Enter an amount.")
    .positive("Must be more than 0.")
    .max(max, "Check this amount.")
    .refine((v) => Math.round(v * 100) === v * 100, "Use at most 2 decimal places.");

/** Hours in a month: at most 24 × 31. */
export const hours = z
  .number("Enter the hours.")
  .positive("Must be more than 0.")
  .max(744, "A month has at most 744 hours.")
  .refine((v) => Math.round(v * 100) === v * 100, "Use at most 2 decimal places.");

// --- clients -------------------------------------------------------------------------

const clientFields = {
  name: name(),
  type: z.enum(["CLIENT", "VENDOR"]),
  endClientName: optionalText(200),
  contactPerson: optionalText(200),
  billingEmail: email,
  vmsPortalName: optionalText(120),
  vmsPortalUrl: httpUrl.nullable().optional(),
  paymentTermsDays: z.number().int().min(0).max(180),
  notes: optionalText(2000),
  autoSendInvoices: z.boolean(),
};

export const clientCreateSchema = z
  .object({ ...clientFields, autoSendInvoices: clientFields.autoSendInvoices.optional(), paymentTermsDays: clientFields.paymentTermsDays.default(30) })
  .strict();
export const clientUpdateSchema = z.object(clientFields).partial().strict();
export type ClientInput = z.infer<typeof clientUpdateSchema>;

export const clientListSchema = z
  .object({ q: z.string().trim().max(100).optional(), archived: z.enum(["true", "false"]).optional() })
  .strict();

// --- placements ----------------------------------------------------------------------

export const EXTENSION_STATUSES = ["ACTIVE", "EXTENSION_PENDING", "EXTENDED", "ENDED"] as const;
export const EMPLOYMENT_TYPES = ["FULL_TIME", "PART_TIME", "CONTRACT", "CONTRACT_TO_HIRE"] as const;

const placementFields = {
  clientId: uuid,
  consultantUserId: z.string().regex(/^[\w:.@|-]{1,128}$/, "Not a valid user id.").nullable().optional(),
  consultantName: name(),
  consultantEmail: email,
  endClientName: optionalText(200),
  role: name(),
  billRate: money(10_000),
  payRate: money(10_000),
  startDate: day,
  endDate: day.nullable().optional(),
  extensionStatus: z.enum(EXTENSION_STATUSES),
  employmentType: z.enum(EMPLOYMENT_TYPES),
};

const datesInOrder = (p: { startDate?: string; endDate?: string | null }) => !p.startDate || !p.endDate || p.endDate >= p.startDate;
const endAfterStart = { message: "The end date can't be before the start date.", path: ["endDate"] };

export const placementCreateSchema = z
  .object({
    ...placementFields,
    extensionStatus: placementFields.extensionStatus.default("ACTIVE"),
    employmentType: placementFields.employmentType.default("CONTRACT"),
  })
  .strict()
  .refine(datesInOrder, endAfterStart);
export const placementUpdateSchema = z.object(placementFields).partial().strict().refine(datesInOrder, endAfterStart);
export type PlacementInput = z.infer<typeof placementUpdateSchema>;

export const placementListSchema = z
  .object({ clientId: uuid.optional(), status: z.enum(EXTENSION_STATUSES).optional(), q: z.string().trim().max(100).optional() })
  .strict();

// --- timesheets ----------------------------------------------------------------------

export const TIMESHEET_STATUSES = ["RECEIVED", "VERIFIED", "VERIFIER_APPROVED", "ACCOUNTS_CHECKED", "INVOICE_RAISED", "SUBMITTED_TO_CLIENT", "REJECTED"] as const;
export const TIMESHEET_MOVES = ["VERIFIED", "VERIFIER_APPROVED", "ACCOUNTS_CHECKED", "SUBMITTED_TO_CLIENT", "REJECTED"] as const;
export type TimesheetMove = (typeof TIMESHEET_MOVES)[number];

export const timesheetListSchema = z
  .object({
    month: month.optional(),
    clientId: uuid.optional(),
    status: z.enum(TIMESHEET_STATUSES).optional(),
    consultant: z.string().trim().max(100).optional(),
  })
  .strict();

export const timesheetMoveSchema = z
  .object({
    status: z.enum(TIMESHEET_MOVES),
    comment: z.string().trim().max(2000).optional(),
    /** Accounts check only: the hours to bill, if not the submitted hours. */
    approvedHours: hours.optional(),
  })
  .strict()
  .refine((b) => b.status !== "REJECTED" || (b.comment && b.comment.length > 0), {
    message: "Say what the consultant needs to fix.",
    path: ["comment"],
  })
  .refine((b) => b.approvedHours === undefined || b.status === "ACCOUNTS_CHECKED", {
    message: "Only the accounts check can change the hours.",
    path: ["approvedHours"],
  });

export const remindersSchema = z.object({ month: month.optional() }).strict();

/** Multipart fields from the student's upload form (strings, coerced). */
export const studentTimesheetSchema = z
  .object({
    month,
    hours: z.coerce.number().pipe(hours),
    leaveDays: z.coerce.number().min(0, "Can't be negative.").max(31, "A month has at most 31 days.").default(0),
    leaveNote: z.string().trim().max(1000).optional(),
    placementId: uuid.optional(),
  })
  .strict()
  .refine((b) => b.leaveDays === 0 || (b.leaveNote && b.leaveNote.length > 0), {
    message: "Add a short note about your leave.",
    path: ["leaveNote"],
  });

// --- invoices and payments ------------------------------------------------------------

export const invoiceGenerateSchema = z.object({ timesheetId: uuid }).strict();
export const invoiceMoveSchema = z
  .object({ status: z.enum(["TIMESHEET_SUBMITTED", "SENT"]), comment: z.string().trim().max(2000).optional() })
  .strict();
export const invoiceSendSchema = z.object({ resend: z.boolean().optional() }).strict();

export const clientPaymentSchema = z.discriminatedUnion("status", [
  z
    .object({
      invoiceId: uuid,
      status: z.literal("expected"),
      expectedDate: day,
      comment: z.string().trim().max(2000).optional(),
    })
    .strict(),
  z
    .object({
      invoiceId: uuid,
      status: z.literal("received"),
      receivedDate: day,
      amount: money(10_000_000).optional(),
      comment: z.string().trim().max(2000).optional(),
    })
    .strict(),
]);

/** Remind a client about one placement's unpaid invoices. `preview: true` returns the email without sending it. */
export const paymentReminderSchema = z.object({ placementId: uuid, preview: z.boolean().optional() }).strict();

export const consultantPaymentSchema = z
  .object({
    invoiceId: uuid,
    paidDate: day,
    amount: money(10_000_000).optional(),
    comment: z.string().trim().max(2000).optional(),
    /** Admins only: pay before the client has paid. */
    overrideReason: z.string().trim().min(10, "Give the reason in a sentence (10+ characters).").max(1000).optional(),
  })
  .strict();

// --- reports ---------------------------------------------------------------------------

export const BILLING_STAGES = ["timesheet_received", "timesheet_submitted", "invoice_sent", "client_paid", "consultant_paid"] as const;
export type BillingStage = (typeof BILLING_STAGES)[number];

export const billingSummarySchema = z
  .object({
    month: month.optional(),
    /** A whole year ("2026"); ignored when a month is given. */
    year: z.string().regex(/^(19|20)\d{2}$/, "Use a year like 2026.").optional(),
    clientId: uuid.optional(),
    status: z.enum([...BILLING_STAGES, "overdue"]).optional(),
    consultant: z.string().trim().max(100).optional(),
    format: z.enum(["json", "csv"]).optional(),
  })
  .strict();
export type BillingFilters = z.infer<typeof billingSummarySchema>;

export const AUDIT_ENTITY_TYPES = ["client", "placement", "timesheet", "invoice", "payment", "report", "email", "audit"] as const;

/** The activity log is filtered, sorted and paged on the server, so it stays fast with any number of entries. */
export const auditListSchema = z
  .object({
    entityType: z.enum(AUDIT_ENTITY_TYPES).optional(),
    entityId: z.string().max(64).optional(),
    /** Part of the person's email. */
    actor: z.string().trim().max(254).optional(),
    /** An exact action, e.g. "invoice.send", or a prefix ending in ".", e.g. "payment.". */
    action: z.string().trim().max(80).regex(/^[a-z_.]+$/, "Not an action name.").optional(),
    from: day.optional(),
    to: day.optional(),
    order: z.enum(["newest", "oldest"]).default("newest"),
    /** Hide views (opened a page, listed records): show only changes. */
    changesOnly: z.enum(["true", "false"]).default("false").transform((v) => v === "true"),
    page: z.coerce.number().int().min(1).max(100_000).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(25),
  })
  .strict()
  .refine((f) => !f.from || !f.to || f.from <= f.to, { message: "The start date is after the end date.", path: ["to"] });
export type AuditFilters = z.infer<typeof auditListSchema>;
