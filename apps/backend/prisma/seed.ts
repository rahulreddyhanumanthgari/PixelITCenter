// Demo data for the client section: clients and a vendor, placements, and
// timesheets at every stage of the workflow, so each admin page has something
// real to show. Run: npm run db:seed (add -- --reset to wipe the client-section
// tables first). Never emails anyone: it uses the "log" mailer.
//
// Everything goes through the real services with the clock set to past dates,
// so history, invoice numbers, PDFs, due dates and audit entries are genuine.
// Demo people: Manas and Rahul (consultants). Every staff step is done by the
// one demo employee login (employee@, an admin).

import "dotenv/config";
import PDFDocument from "pdfkit";
import { createServices } from "../src/app.js";
import { loadEnv } from "../src/config/env.js";
import { devUserId } from "../src/controllers/devAuth.js";
import { createMailer } from "../src/lib/mailer.js";
import { createDb } from "../src/lib/prisma.js";
import type { Actor, Role } from "../src/lib/roles.js";
import { createLocalStore } from "../src/lib/storage.js";

const env = loadEnv();
const db = createDb(env.DATABASE_URL, env.DATABASE_POOL_MAX);
const store = createLocalStore(env.storageDir);
const mailer = createMailer({ provider: "log", from: env.MAIL_FROM });

const person = (email: string, role: Role): Actor => ({ userId: devUserId(email), role, email });
const admin = person("employee@pixelitcenter.com", "admin");
const verifier = admin;
const accounts = admin;
const manas = person("placed@pixelitcenter.com", "student");
const rahul = person("rahul@pixelitcenter.com", "student");

/** The services with the clock at 2pm Eastern on `isoDay`. */
const on = (isoDay: string) => createServices(env, db, { store, mailer, now: () => new Date(`${isoDay}T18:00:00Z`) }).clientSection;

/** A one-page stand-in for a client-approved timesheet. */
function timesheetPdf(name: string, client: string, month: string, hours: number): Promise<Buffer> {
  const doc = new PDFDocument({ size: "LETTER", margin: 54 });
  const chunks: Buffer[] = [];
  const done = new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));
  doc.on("data", (c: Buffer) => chunks.push(c));
  doc.fontSize(18).text("Monthly timesheet (demo)");
  doc.moveDown().fontSize(11).text(`Consultant: ${name}\nClient: ${client}\nMonth: ${month}\nTotal hours: ${hours}`);
  doc.moveDown().text("Approved by the client: signed (demo)");
  doc.end();
  return done;
}

async function submit(isoDay: string, who: Actor, name: string, client: string, month: string, hours: number, leave?: { days: number; note: string }) {
  const buffer = await timesheetPdf(name, client, month, hours);
  return on(isoDay).timesheets.studentSubmit(
    who,
    { month, hours, leaveDays: leave?.days ?? 0, leaveNote: leave?.note },
    { buffer, mimetype: "application/pdf", originalname: `Timesheet_${month}_${name}_signed.pdf` },
  );
}

const step = (isoDay: string, who: Actor, id: string, status: "VERIFIED" | "VERIFIER_APPROVED" | "ACCOUNTS_CHECKED" | "REJECTED", comment?: string) =>
  on(isoDay).timesheets.move(who, id, { status, comment });

async function reset() {
  const files = await db.storedFile.findMany({ select: { storageKey: true } });
  await db.$transaction([
    db.auditLog.deleteMany(),
    db.emailLog.deleteMany(),
    db.payment.deleteMany(),
    db.invoice.deleteMany(),
    db.timesheetStatusHistory.deleteMany(),
    db.timesheet.deleteMany(),
    db.storedFile.deleteMany(),
    db.placement.deleteMany(),
    db.client.deleteMany(),
    db.invoiceCounter.deleteMany(),
    db.notification.deleteMany(),
    db.jobRun.deleteMany(),
  ]);
  await Promise.all(files.map((f) => store.remove(f.storageKey).catch(() => undefined)));
}

async function main() {
  if (process.argv.includes("--reset")) {
    await reset();
    console.log("Client-section tables cleared.");
  } else if ((await db.client.count()) > 0) {
    console.log("Already seeded (clients exist). Run with --reset to start over.");
    return;
  }

  const setup = on("2026-01-02");
  const northwind = await setup.clients.create(admin, {
    name: "Northwind Health",
    type: "CLIENT",
    contactPerson: "Accounts Payable",
    billingEmail: "ap@northwind-health.example",
    paymentTermsDays: 30,
    notes: "Invoices by email on the 1st. Quote the PO number on request.",
    autoSendInvoices: true,
  });
  const apex = await setup.clients.create(admin, {
    name: "Apex Staffing Partners",
    type: "VENDOR",
    endClientName: "Brightline Finance",
    contactPerson: "Vendor Management",
    billingEmail: "invoices@apex-staffing.example",
    vmsPortalName: "Beeline",
    vmsPortalUrl: "https://apex.beeline.example",
    paymentTermsDays: 45,
    notes: "Timesheets and invoices go into Beeline; no email.",
    autoSendInvoices: false,
  });
  const vertex = await setup.clients.create(admin, {
    name: "Vertex Retail",
    type: "CLIENT",
    contactPerson: "Finance Operations",
    billingEmail: "payables@vertex-retail.example",
    vmsPortalName: "SAP Fieldglass",
    vmsPortalUrl: "https://vertex.fieldglass.example",
    paymentTermsDays: 45,
    autoSendInvoices: false,
  });

  await setup.placements.create(admin, {
    clientId: vertex.id,
    consultantName: "Rahul",
    consultantEmail: rahul.email!,
    role: "QA Automation Engineer",
    billRate: 85,
    payRate: 60,
    startDate: "2026-01-05",
    endDate: "2026-05-29",
    extensionStatus: "ENDED",
    employmentType: "CONTRACT",
  });
  await setup.placements.create(admin, {
    clientId: northwind.id,
    consultantName: "Rahul",
    consultantEmail: rahul.email!,
    role: "Senior DevOps Engineer",
    billRate: 110,
    payRate: 78,
    startDate: "2026-06-01",
    extensionStatus: "ACTIVE",
    employmentType: "CONTRACT_TO_HIRE",
  });
  await setup.placements.create(admin, {
    clientId: apex.id,
    consultantName: "Manas",
    consultantEmail: manas.email!,
    role: "Cloud Engineer (AWS)",
    billRate: 92,
    payRate: 65,
    startDate: "2026-08-03",
    endDate: "2027-01-29",
    extensionStatus: "EXTENSION_PENDING",
    employmentType: "CONTRACT",
  });

  // Rahul at Vertex Retail, April: the whole flow, paid.
  let t = await submit("2026-05-01", rahul, "Rahul", "Vertex Retail", "2026-04", 168);
  await step("2026-05-04", verifier, t.id, "VERIFIED");
  await step("2026-05-04", verifier, t.id, "VERIFIER_APPROVED");
  let inv = (await step("2026-05-05", accounts, t.id, "ACCOUNTS_CHECKED")).invoice!;
  await on("2026-05-06").invoices.move(accounts, inv.id, { status: "SENT", comment: "Uploaded to SAP Fieldglass" });
  await on("2026-06-18").payments.recordClient(accounts, { invoiceId: inv.id, status: "received", receivedDate: "2026-06-18" });
  await on("2026-06-19").payments.recordConsultant(accounts, { invoiceId: inv.id, paidDate: "2026-06-19" });

  // Rahul at Northwind, July: emailed, paid by the client, consultant paid.
  t = await submit("2026-08-01", rahul, "Rahul", "Northwind Health", "2026-07", 176);
  await step("2026-08-03", verifier, t.id, "VERIFIED");
  await step("2026-08-03", verifier, t.id, "VERIFIER_APPROVED");
  inv = (await step("2026-08-04", accounts, t.id, "ACCOUNTS_CHECKED")).invoice!;
  await on("2026-08-04").invoices.send(accounts, inv.id);
  await on("2026-08-31").payments.recordClient(accounts, { invoiceId: inv.id, status: "received", receivedDate: "2026-08-31" });
  await on("2026-09-01").payments.recordConsultant(accounts, { invoiceId: inv.id, paidDate: "2026-09-01" });

  // Rahul at Northwind, August: hours adjusted by accounts, emailed, now overdue.
  t = await submit("2026-09-01", rahul, "Rahul", "Northwind Health", "2026-08", 168, { days: 1, note: "Personal day on Aug 21." });
  await step("2026-09-02", verifier, t.id, "VERIFIED");
  await step("2026-09-02", verifier, t.id, "VERIFIER_APPROVED");
  inv = (await on("2026-09-03").timesheets.move(accounts, t.id, { status: "ACCOUNTS_CHECKED", approvedHours: 160, comment: "Client sheet shows 160 billable hours." })).invoice!;
  await on("2026-09-03").invoices.send(accounts, inv.id);

  // Rahul at Northwind, September: sent back once (signature missing), uploaded again.
  t = await submit("2026-10-01", rahul, "Rahul", "Northwind Health", "2026-09", 168);
  await step("2026-10-02", verifier, t.id, "REJECTED", "The client's signature is missing on page 2. Please upload the signed copy.");
  await submit("2026-10-03", rahul, "Rahul", "Northwind Health", "2026-09", 168);

  // Manas via Apex (Brightline Finance), August: in Beeline, client payment expected.
  t = await submit("2026-09-01", manas, "Manas", "Brightline Finance", "2026-08", 160, { days: 1, note: "Personal day on Aug 18." });
  await step("2026-09-02", verifier, t.id, "VERIFIED");
  await step("2026-09-02", verifier, t.id, "VERIFIER_APPROVED");
  inv = (await step("2026-09-04", accounts, t.id, "ACCOUNTS_CHECKED")).invoice!;
  await on("2026-09-05").invoices.move(accounts, inv.id, { status: "SENT", comment: "Timesheet and invoice uploaded to Beeline" });
  await on("2026-10-10").payments.recordClient(accounts, { invoiceId: inv.id, status: "expected", expectedDate: "2026-10-20", comment: "Payment processed, expected next week" });

  // Manas, September: approved by the verifier, waiting for accounts.
  t = await submit("2026-10-02", manas, "Manas", "Brightline Finance", "2026-09", 168);
  await step("2026-10-05", verifier, t.id, "VERIFIED", "Hours match the signed sheet.");
  await step("2026-10-06", verifier, t.id, "VERIFIER_APPROVED");

  console.log("Seeded: 3 clients, 3 placements, 6 timesheets, 4 invoices.");
}

main()
  .catch((e) => {
    console.error("Seed failed:", (e as Error).name, (e as Error).message);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
