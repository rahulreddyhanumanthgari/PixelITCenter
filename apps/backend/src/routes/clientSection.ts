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
//   admin     everything
//   accounts  clients (read), placements, timesheets (accounts steps), invoices, payments, reports
//   verifier  placements (no rates), timesheets (verifier steps)
//   recruiter placements (no rates), nothing else
//   student   only their own placement (client + their hourly rate) and timesheets

const admin = requireRole("admin");
const finance = requireRole("admin", "accounts");
const timesheetStaff = requireRole("admin", "verifier", "accounts");
const staff = requireRole("admin", "accounts", "verifier", "recruiter");

export function clientSectionRoutes(section: ClientSection, { authed, maxUploadBytes }: { authed: RequestHandler; maxUploadBytes: number }) {
  const c = clientSectionController(section);

  const a = Router();
  a.use(authed);
  a.get("/overview", staff, c.overview);

  a.get("/clients", finance, c.listClients);
  a.post("/clients", admin, c.createClient);
  a.get("/clients/:id", finance, c.getClient);
  a.patch("/clients/:id", admin, c.updateClient);
  a.delete("/clients/:id", admin, c.archiveClient);
  a.post("/clients/:id/send-invoices", finance, sendLimiter(), c.sendClientInvoices);

  a.get("/placements", staff, c.listPlacements);
  a.post("/placements", admin, c.createPlacement);
  a.get("/placements/:id", staff, c.getPlacement);
  a.patch("/placements/:id", admin, c.updatePlacement);

  a.get("/timesheets", timesheetStaff, c.listTimesheets);
  a.post("/timesheets/reminders", timesheetStaff, sendLimiter(), c.sendReminders);
  a.get("/timesheets/:id", timesheetStaff, c.getTimesheet);
  a.patch("/timesheets/:id", timesheetStaff, c.moveTimesheet);

  a.get("/invoices", finance, c.listInvoices);
  a.post("/invoices", finance, c.generateInvoice);
  a.get("/invoices/:id", finance, c.getInvoice);
  a.patch("/invoices/:id", finance, c.moveInvoice);
  a.get("/invoices/:id/pdf", finance, c.invoicePdf);
  a.post("/invoices/:id/send", finance, sendLimiter(), c.sendInvoice);

  a.post("/payments/client", finance, c.recordClientPayment);
  a.post("/payments/consultant", finance, c.recordConsultantPayment);

  a.get("/reports/billing-summary", finance, c.billingSummary);
  a.get("/audit-log", admin, c.auditLog);

  const s = Router();
  s.use(authed, requireRole("student"));
  s.get("/placement", c.studentPlacement);
  s.get("/timesheets", c.studentTimesheets);
  s.post("/timesheets", uploadLimiter(), singleUpload(maxUploadBytes, { fields: 6 }), c.studentSubmitTimesheet);
  s.get("/notifications", c.notifications);
  s.post("/notifications/:id/read", c.markNotificationRead);

  return { admin: a, student: s };
}
