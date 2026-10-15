import { Router, type RequestHandler } from "express";
import { clientSectionController } from "../controllers/clientSection.js";
import { requireRole } from "../middleware/auth.js";
import { sendLimiter, uploadLimiter } from "../middleware/rateLimit.js";
import { singleUpload } from "../middleware/upload.js";
import type { ClientSection } from "../services/clientSection/index.js";

// The client section: /api/admin/... for PixelIT staff, /api/student/... for the
// consultant's own placement and timesheets. Every route needs a signed-in user
// with the right role; it is checked here, on the server, for every request.
//
//   admin     everything, including billing (invoices, payments, reports, reminders)
//   accounts  clients (read), placements (no rates), timesheets (the accounts check)
//   verifier  placements (no rates), timesheets (verifier steps)
//   recruiter placements (no rates), nothing else
//   student   only their own placement (client + their hourly rate) and timesheets

const admin = requireRole("admin");
const clientReaders = requireRole("admin", "accounts");
/** Billing (invoices, payments, reports, reminders): admins only. */
const billing = admin;
const timesheetStaff = requireRole("admin", "verifier", "accounts");
const staff = requireRole("admin", "accounts", "verifier", "recruiter");

export function clientSectionRoutes(section: ClientSection, { authed, maxUploadBytes }: { authed: RequestHandler; maxUploadBytes: number }) {
  const c = clientSectionController(section);

  const a = Router();
  a.use(authed);
  a.get("/overview", staff, c.overview);

  a.get("/clients", clientReaders, c.listClients);
  a.post("/clients", admin, c.createClient);
  a.get("/clients/:id", clientReaders, c.getClient);
  a.patch("/clients/:id", admin, c.updateClient);
  a.delete("/clients/:id", admin, c.archiveClient);
  a.post("/clients/:id/send-invoices", billing, sendLimiter(), c.sendClientInvoices);

  a.get("/placements", staff, c.listPlacements);
  a.post("/placements", admin, c.createPlacement);
  a.get("/placements/:id", staff, c.getPlacement);
  a.patch("/placements/:id", admin, c.updatePlacement);
  a.delete("/placements/:id", admin, c.deletePlacement);

  a.get("/timesheets", timesheetStaff, c.listTimesheets);
  a.post("/timesheets/reminders", timesheetStaff, sendLimiter(), c.sendReminders);
  a.get("/timesheets/:id", timesheetStaff, c.getTimesheet);
  a.patch("/timesheets/:id", timesheetStaff, c.moveTimesheet);

  a.get("/invoices", billing, c.listInvoices);
  a.post("/invoices", billing, c.generateInvoice);
  a.get("/invoices/:id", billing, c.getInvoice);
  a.patch("/invoices/:id", billing, c.moveInvoice);
  a.get("/invoices/:id/pdf", billing, c.invoicePdf);
  a.post("/invoices/:id/send", billing, sendLimiter(), c.sendInvoice);

  a.post("/payments/client", billing, c.recordClientPayment);
  a.post("/payments/consultant", billing, c.recordConsultantPayment);
  a.post("/payments/reminders", billing, sendLimiter(), c.paymentReminder);

  a.get("/reports/billing-summary", billing, c.billingSummary);
  a.get("/audit-log", admin, c.auditLog);
  a.get("/audit-log/summary", admin, c.auditSummary);

  const s = Router();
  s.use(authed, requireRole("student"));
  s.get("/placement", c.studentPlacement);
  s.get("/timesheets", c.studentTimesheets);
  s.post("/timesheets", uploadLimiter(), singleUpload(maxUploadBytes, { fields: 6 }), c.studentSubmitTimesheet);
  s.get("/notifications", c.notifications);
  s.post("/notifications/:id/read", c.markNotificationRead);

  return { admin: a, student: s };
}
