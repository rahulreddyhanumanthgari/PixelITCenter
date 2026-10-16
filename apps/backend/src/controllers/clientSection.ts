import type { Request, Response } from "express";
import { HttpError } from "../lib/errors.js";
import { actorOf } from "../middleware/auth.js";
import type { ClientSection } from "../services/clientSection/index.js";
import {
  auditListSchema,
  billingSummarySchema,
  clientCreateSchema,
  clientListSchema,
  clientPaymentSchema,
  clientUpdateSchema,
  consultantPaymentSchema,
  invoiceGenerateSchema,
  invoiceMoveSchema,
  invoiceSendSchema,
  month as monthSchema,
  paymentReminderSchema,
  placementCreateSchema,
  placementListSchema,
  placementUpdateSchema,
  remindersSchema,
  studentTimesheetSchema,
  timesheetListSchema,
  timesheetMoveSchema,
  uuid,
} from "../validation/billing.js";
import { z } from "zod";

// Handlers for the client section. Each one validates its input (Zod, strict),
// then calls the service with the signed-in actor. Role checks are on the routes
// (routes/clientSection.ts); the services enforce the finer workflow rules.

/** A path id that isn't a UUID gets the same 404 as one that doesn't exist. */
function idOf(req: Request, what: string) {
  const id = uuid.safeParse(req.params.id);
  if (!id.success) throw new HttpError(404, `${what} not found.`);
  return id.data;
}

const noStore = (res: Response) => res.set("Cache-Control", "no-store");

export function clientSectionController(s: ClientSection) {
  return {
    // --- clients ---
    listClients: async (req: Request, res: Response) => {
      noStore(res).json({ clients: await s.clients.list(actorOf(req), clientListSchema.parse(req.query)) });
    },
    getClient: async (req: Request, res: Response) => {
      noStore(res).json(await s.clients.get(actorOf(req), idOf(req, "Client")));
    },
    createClient: async (req: Request, res: Response) => {
      res.status(201).json(await s.clients.create(actorOf(req), clientCreateSchema.parse(req.body)));
    },
    updateClient: async (req: Request, res: Response) => {
      res.json(await s.clients.update(actorOf(req), idOf(req, "Client"), clientUpdateSchema.parse(req.body)));
    },
    archiveClient: async (req: Request, res: Response) => {
      await s.clients.archive(actorOf(req), idOf(req, "Client"));
      res.status(204).end();
    },
    sendClientInvoices: async (req: Request, res: Response) => {
      res.json(await s.invoices.sendPendingForClient(actorOf(req), idOf(req, "Client")));
    },

    // --- placements ---
    listPlacements: async (req: Request, res: Response) => {
      noStore(res).json({ placements: await s.placements.list(actorOf(req), placementListSchema.parse(req.query)) });
    },
    getPlacement: async (req: Request, res: Response) => {
      noStore(res).json(await s.placements.get(actorOf(req), idOf(req, "Placement")));
    },
    createPlacement: async (req: Request, res: Response) => {
      res.status(201).json(await s.placements.create(actorOf(req), placementCreateSchema.parse(req.body)));
    },
    deletePlacement: async (req: Request, res: Response) => {
      await s.placements.remove(actorOf(req), idOf(req, "Placement"));
      res.status(204).end();
    },
    updatePlacement: async (req: Request, res: Response) => {
      res.json(await s.placements.update(actorOf(req), idOf(req, "Placement"), placementUpdateSchema.parse(req.body)));
    },

    // --- timesheets ---
    listTimesheets: async (req: Request, res: Response) => {
      noStore(res).json({ timesheets: await s.timesheets.list(actorOf(req), timesheetListSchema.parse(req.query)) });
    },
    getTimesheet: async (req: Request, res: Response) => {
      noStore(res).json(await s.timesheets.get(actorOf(req), idOf(req, "Timesheet")));
    },
    moveTimesheet: async (req: Request, res: Response) => {
      res.json(await s.timesheets.move(actorOf(req), idOf(req, "Timesheet"), timesheetMoveSchema.parse(req.body)));
    },
    sendReminders: async (req: Request, res: Response) => {
      const { month } = remindersSchema.parse(req.body ?? {});
      res.json(await s.timesheets.sendReminders(actorOf(req), month ?? s.ctx.today().slice(0, 7), "MANUAL"));
    },

    // --- invoices ---
    listInvoices: async (req: Request, res: Response) => {
      const f = z
        .object({ month: monthSchema.optional(), clientId: uuid.optional(), status: z.enum(["RAISED", "TIMESHEET_SUBMITTED", "SENT", "CLIENT_PAID", "CONSULTANT_PAID"]).optional() })
        .strict()
        .parse(req.query);
      noStore(res).json({ invoices: await s.invoices.list(actorOf(req), f) });
    },
    getInvoice: async (req: Request, res: Response) => {
      noStore(res).json(await s.invoices.get(actorOf(req), idOf(req, "Invoice")));
    },
    generateInvoice: async (req: Request, res: Response) => {
      const { timesheetId } = invoiceGenerateSchema.parse(req.body);
      const r = await s.invoices.generate(actorOf(req), timesheetId);
      res.status(r.created ? 201 : 200).json(r.invoice);
    },
    moveInvoice: async (req: Request, res: Response) => {
      res.json(await s.invoices.move(actorOf(req), idOf(req, "Invoice"), invoiceMoveSchema.parse(req.body)));
    },
    invoicePdf: async (req: Request, res: Response) => {
      noStore(res).json(await s.invoices.pdfLink(actorOf(req), idOf(req, "Invoice")));
    },
    sendInvoice: async (req: Request, res: Response) => {
      const { resend } = invoiceSendSchema.parse(req.body ?? {});
      res.json(await s.invoices.send(actorOf(req), idOf(req, "Invoice"), { resend }));
    },

    // --- payments ---
    recordClientPayment: async (req: Request, res: Response) => {
      res.json(await s.payments.recordClient(actorOf(req), clientPaymentSchema.parse(req.body)));
    },
    paymentReminder: async (req: Request, res: Response) => {
      res.json(await s.payments.remind(actorOf(req), paymentReminderSchema.parse(req.body)));
    },
    recordConsultantPayment: async (req: Request, res: Response) => {
      res.json(await s.payments.recordConsultant(actorOf(req), consultantPaymentSchema.parse(req.body)));
    },

    // --- reports ---
    billingSummary: async (req: Request, res: Response) => {
      const { format, ...filters } = billingSummarySchema.parse(req.query);
      noStore(res);
      if (format === "csv") {
        const csv = await s.reports.billingSummaryCsv(actorOf(req), filters);
        res.set({ "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="billing-summary${filters.month ? `-${filters.month}` : ""}.csv"` });
        res.send(csv);
        return;
      }
      res.json(await s.reports.billingSummary(actorOf(req), filters));
    },
    overview: async (req: Request, res: Response) => {
      noStore(res).json(await s.reports.overview(actorOf(req)));
    },
    auditLog: async (req: Request, res: Response) => {
      noStore(res).json(await s.auditLog(actorOf(req), auditListSchema.parse(req.query)));
    },
    auditSummary: async (req: Request, res: Response) => {
      noStore(res).json(await s.auditSummary(actorOf(req)));
    },

    // --- the consultant (student role) ---
    studentPlacement: async (req: Request, res: Response) => {
      noStore(res).json(await s.placements.studentView(actorOf(req)));
    },
    studentTimesheets: async (req: Request, res: Response) => {
      noStore(res).json({ timesheets: await s.timesheets.studentList(actorOf(req)) });
    },
    studentSubmitTimesheet: async (req: Request, res: Response) => {
      if (!req.file) throw new HttpError(400, 'Attach the timesheet PDF in the "file" field.');
      const input = studentTimesheetSchema.parse(req.body ?? {});
      res.status(201).json(await s.timesheets.studentSubmit(actorOf(req), input, req.file));
    },
    notifications: async (req: Request, res: Response) => {
      noStore(res).json({ notifications: await s.timesheets.notifications(actorOf(req)) });
    },
    markNotificationRead: async (req: Request, res: Response) => {
      await s.timesheets.markRead(actorOf(req), idOf(req, "Notification"));
      res.status(204).end();
    },
  };
}
