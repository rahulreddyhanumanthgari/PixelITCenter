import request from "supertest";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createClientSectionJobs } from "../src/jobs/clientSectionJobs.js";
import { addDays, monthOf, previousMonth, todayIn } from "../src/lib/dates.js";
import type { Role } from "../src/lib/roles.js";
import { createServices } from "../src/app.js";
import { fakeMailer, makeApp, PDF, PNG, tokenFor } from "./helpers.js";

// The client section end to end: role guards on every route, the timesheet
// workflow, automatic invoices, payments and the "client pays first" rule,
// email with retries, the billing summary and CSV, and the scheduled jobs.

const mailer = fakeMailer();
const { app, db, env } = makeApp({ MAIL_RETRY_DELAY_MS: "0", MAIL_MAX_ATTEMPTS: "3" }, { mailer });

const today = todayIn(env.JOBS_TIMEZONE);
const lastMonth = previousMonth(monthOf(today));
const twoMonthsAgo = previousMonth(lastMonth);

const users: Record<string, { sub: string; role: Role }> = {
  admin: { sub: "u-admin", role: "admin" },
  accounts: { sub: "u-accounts", role: "accounts" },
  verifier: { sub: "u-verifier", role: "verifier" },
  recruiter: { sub: "u-recruiter", role: "recruiter" },
  student: { sub: "u-student", role: "student" },
};
const as = (who: keyof typeof users) => ({ Authorization: `Bearer ${tokenFor(users[who]!.sub, users[who]!.role)}` });
const consultantEmail = "u-student@example.com";

let logged = "";
beforeAll(() => {
  for (const m of ["log", "error", "warn", "info"] as const) {
    vi.spyOn(console, m).mockImplementation((...args: unknown[]) => {
      logged += args.map(String).join(" ") + "\n";
    });
  }
});
afterAll(async () => {
  // Request bodies, billing emails and comments never reach the logs.
  expect(logged).toContain('"path":"/api/admin/clients"');
  for (const secret of ["ap@northwind.example", "Signature missing", "Client confirmed wire", "smtp.example.com"]) expect(logged).not.toContain(secret);
  vi.restoreAllMocks();
  await db.$disconnect();
});

const ids: { client?: string; vendor?: string; placement?: string; timesheet?: string; invoice?: string } = {};

async function uploadTimesheet(month: string, file = PDF, name = "timesheet.pdf", type = "application/pdf", hours = "160") {
  return request(app)
    .post("/api/student/timesheets")
    .set(as("student"))
    .field("month", month)
    .field("hours", hours)
    .field("leaveDays", "0")
    .attach("file", file, { filename: name, contentType: type });
}

const move = (id: string, who: keyof typeof users, body: Record<string, unknown>) => request(app).patch(`/api/admin/timesheets/${id}`).set(as(who)).send(body);

describe("roles and access", () => {
  it("needs a token and keeps students out of every admin route", async () => {
    expect((await request(app).get("/api/admin/clients")).status).toBe(401);
    for (const path of ["/api/admin/clients", "/api/admin/placements", "/api/admin/timesheets", "/api/admin/invoices", "/api/admin/reports/billing-summary"]) {
      expect((await request(app).get(path).set(as("student"))).status).toBe(403);
    }
  });

  it("gives recruiters and verifiers no billing data", async () => {
    for (const who of ["recruiter", "verifier"] as const) {
      expect((await request(app).get("/api/admin/invoices").set(as(who))).status).toBe(403);
      expect((await request(app).get("/api/admin/reports/billing-summary").set(as(who))).status).toBe(403);
      expect((await request(app).get("/api/admin/clients").set(as(who))).status).toBe(403);
    }
    expect((await request(app).get("/api/admin/timesheets").set(as("recruiter"))).status).toBe(403);
  });

  it("only admins change client records; there is no client role", async () => {
    expect((await request(app).post("/api/admin/clients").set(as("accounts")).send({ name: "X", type: "CLIENT", billingEmail: "x@x.co" })).status).toBe(403);
    const jwt = await import("jsonwebtoken");
    const clientToken = jwt.default.sign({ role: "client" }, "test-secret-test-secret-test-secret-123", { subject: "c1" });
    expect((await request(app).get("/api/admin/clients").set("Authorization", `Bearer ${clientToken}`)).status).toBe(401);
  });
});

describe("clients", () => {
  it("validates input strictly", async () => {
    let res = await request(app).post("/api/admin/clients").set(as("admin")).send({ name: "Northwind", type: "CLIENT", billingEmail: "not-an-email" });
    expect(res.status).toBe(400);
    expect(res.body.fields.billingEmail).toBeTruthy();
    res = await request(app).post("/api/admin/clients").set(as("admin")).send({ name: "Northwind", type: "CLIENT", billingEmail: "a@b.co", password: "x" });
    expect(res.status).toBe(400);
  });

  it("creates a client and a vendor with an end client, VMS and terms", async () => {
    let res = await request(app).post("/api/admin/clients").set(as("admin")).send({
      name: "Northwind Health",
      type: "CLIENT",
      contactPerson: "Joya",
      billingEmail: "AP@Northwind.example",
      paymentTermsDays: 30,
      autoSendInvoices: true,
    });
    expect(res.status).toBe(201);
    expect(res.body.billingEmail).toBe("ap@northwind.example");
    ids.client = res.body.id;

    res = await request(app).post("/api/admin/clients").set(as("admin")).send({
      name: "=Apex Staffing",
      type: "VENDOR",
      endClientName: "Brightline Finance",
      billingEmail: "invoices@apex.example",
      vmsPortalName: "Beeline",
      vmsPortalUrl: "https://apex.beeline.example",
      paymentTermsDays: 45,
    });
    expect(res.status).toBe(201);
    expect(res.body.autoSendInvoices).toBe(false);
    ids.vendor = res.body.id;

    const list = await request(app).get("/api/admin/clients").set(as("accounts"));
    expect(list.status).toBe(200);
    expect(list.body.clients.map((c: { name: string }) => c.name)).toEqual(expect.arrayContaining(["Northwind Health", "=Apex Staffing"]));
  });
});

describe("placements", () => {
  it("stores bill and pay rates; only admins see them", async () => {
    const res = await request(app).post("/api/admin/placements").set(as("admin")).send({
      clientId: ids.client,
      consultantName: "Manas",
      consultantEmail: consultantEmail,
      role: "Cloud Engineer (AWS)",
      billRate: 95,
      payRate: 65,
      startDate: `${twoMonthsAgo}-03`,
    });
    expect(res.status).toBe(201);
    expect(res.body.marginPerHour).toBe(30);
    expect(res.body.employmentType).toBe("CONTRACT");
    ids.placement = res.body.id;

    const recruiter = await request(app).get("/api/admin/placements").set(as("recruiter"));
    expect(recruiter.status).toBe(200);
    expect(recruiter.body.placements[0].consultantName).toBeTruthy();
    expect(JSON.stringify(recruiter.body)).not.toMatch(/billRate|payRate|marginPerHour/);

    const accounts = await request(app).get("/api/admin/placements").set(as("accounts"));
    expect(accounts.body.placements.find((p: { id: string }) => p.id === ids.placement).billRate).toBeUndefined();
    const admin = await request(app).get("/api/admin/placements").set(as("admin"));
    expect(admin.body.placements.find((p: { id: string }) => p.id === ids.placement).billRate).toBe(95);
  });

  it("stores the employment type and refuses unknown ones", async () => {
    let res = await request(app).patch(`/api/admin/placements/${ids.placement}`).set(as("admin")).send({ employmentType: "FULL_TIME" });
    expect(res.status).toBe(200);
    expect(res.body.employmentType).toBe("FULL_TIME");
    res = await request(app).patch(`/api/admin/placements/${ids.placement}`).set(as("admin")).send({ employmentType: "FREELANCE" });
    expect(res.status).toBe(400);
  });

  it("only admins delete a placement, and only one with no timesheets", async () => {
    const res = await request(app).post("/api/admin/placements").set(as("admin")).send({
      clientId: ids.client,
      consultantName: "Typo",
      consultantEmail: "typo@example.com",
      role: "Wrong entry",
      billRate: 10,
      payRate: 5,
      startDate: `${twoMonthsAgo}-01`,
    });
    expect((await request(app).delete(`/api/admin/placements/${res.body.id}`).set(as("accounts"))).status).toBe(403);
    expect((await request(app).delete(`/api/admin/placements/${res.body.id}`).set(as("admin"))).status).toBe(204);
    expect((await request(app).get(`/api/admin/placements/${res.body.id}`).set(as("admin"))).status).toBe(404);
  });

  it("refuses an end date before the start", async () => {
    const res = await request(app).patch(`/api/admin/placements/${ids.placement}`).set(as("admin")).send({ endDate: `${twoMonthsAgo}-01` });
    expect(res.status).toBe(400);
    expect(res.body.fields.endDate).toBeTruthy();
  });

  it("shows the consultant only their client and their own hourly rate", async () => {
    const res = await request(app).get("/api/student/placement").set(as("student"));
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ client: "Northwind Health", hourlyRate: 65, role: "Cloud Engineer (AWS)" });
    expect(Object.keys(res.body).sort()).toEqual(["client", "employmentType", "endDate", "hourlyRate", "id", "role", "startDate", "status"]);
    expect(Object.values(res.body)).not.toContain(95);
  });
});

describe("timesheet upload (student)", () => {
  it("accepts only one PDF, for a month that has started", async () => {
    expect((await uploadTimesheet(lastMonth, PNG, "sheet.png", "image/png")).status).toBe(415);
    expect((await uploadTimesheet(lastMonth, PDF, "sheet.png", "application/pdf")).status).toBe(415);
    const future = monthOf(addDays(`${monthOf(today)}-28`, 10));
    expect((await uploadTimesheet(future)).status).toBe(400);
  });

  it("requires a note when there is leave", async () => {
    const res = await request(app)
      .post("/api/student/timesheets")
      .set(as("student"))
      .field("month", lastMonth)
      .field("hours", "152")
      .field("leaveDays", "1")
      .attach("file", PDF, { filename: "t.pdf", contentType: "application/pdf" });
    expect(res.status).toBe(400);
    expect(res.body.fields.leaveNote).toBeTruthy();
  });

  it("takes the month once; staff see it as Received", async () => {
    const res = await uploadTimesheet(lastMonth);
    expect(res.status).toBe(201);
    expect(res.body.status).toBe("Submitted");
    expect((await uploadTimesheet(lastMonth)).status).toBe(409);

    const list = await request(app).get(`/api/admin/timesheets?month=${lastMonth}`).set(as("verifier"));
    expect(list.status).toBe(200);
    const t = list.body.timesheets.find((x: { consultant: { name: string } }) => x.consultant.name === "Manas");
    expect(t.status).toBe("RECEIVED");
    ids.timesheet = t.id;
  });
});

describe("timesheet workflow", () => {
  it("accounts can't act before the verifier approves", async () => {
    expect((await move(ids.timesheet!, "accounts", { status: "VERIFIED" })).status).toBe(403);
    expect((await move(ids.timesheet!, "accounts", { status: "ACCOUNTS_CHECKED" })).status).toBe(409);
    expect((await move(ids.timesheet!, "accounts", { status: "REJECTED", comment: "x" })).status).toBe(403);
  });

  it("the verifier verifies and approves, with who and when recorded", async () => {
    expect((await move(ids.timesheet!, "verifier", { status: "VERIFIER_APPROVED" })).status).toBe(409);
    let res = await move(ids.timesheet!, "verifier", { status: "VERIFIED", comment: "Hours match the signed PDF" });
    expect(res.status).toBe(200);
    res = await move(ids.timesheet!, "verifier", { status: "VERIFIER_APPROVED" });
    expect(res.body.status).toBe("VERIFIER_APPROVED");
    expect(res.body.history.map((h: { to: string }) => h.to)).toEqual(["RECEIVED", "VERIFIED", "VERIFIER_APPROVED"]);
    expect(res.body.history[1]).toMatchObject({ role: "verifier", by: "u-verifier@example.com", comment: "Hours match the signed PDF" });
    // The verifier can't do the accounts step.
    expect((await move(ids.timesheet!, "verifier", { status: "ACCOUNTS_CHECKED" })).status).toBe(403);
  });

  it("changed hours need a reason", async () => {
    const res = await move(ids.timesheet!, "accounts", { status: "ACCOUNTS_CHECKED", approvedHours: 150 });
    expect(res.status).toBe(400);
    expect(res.body.fields.comment).toBeTruthy();
  });

  it("the accounts check raises the invoice: approved hours × bill rate, due on the client's terms", async () => {
    const res = await move(ids.timesheet!, "accounts", { status: "ACCOUNTS_CHECKED" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("INVOICE_RAISED");
    expect(res.body.invoice.number).toMatch(/^PIX-\d{4}-\d{4}$/);
    // Accounts does the check but doesn't see money; the admin view below has the amount.
    expect(res.body.invoice.amount).toBeUndefined();
    ids.invoice = res.body.invoice.id;

    const inv = await request(app).get(`/api/admin/invoices/${ids.invoice}`).set(as("admin"));
    expect(inv.body).toMatchObject({ hours: 160, billRate: 95, amount: 15200, paymentTermsDays: 30, status: "RAISED", consultantName: "Manas" });
    expect(inv.body.dueDate).toBe(addDays(inv.body.issueDate, 30));
  });

  it("one admin can do every step, from verify to invoice", async () => {
    const p = await request(app).post("/api/admin/placements").set(as("admin")).send({
      clientId: ids.vendor,
      consultantName: "Rahul",
      consultantEmail: "rahul.c@example.com",
      role: "DevOps Engineer",
      billRate: 80.5,
      payRate: 60,
      startDate: `${twoMonthsAgo}-01`,
    });
    const t = await db.storedFile.create({ data: { kind: "TIMESHEET", originalName: "t.pdf", storageKey: "a".repeat(48), mimeType: "application/pdf", sizeBytes: 1, sha256: "x" } });
    const ts = await db.timesheet.create({ data: { placementId: p.body.id, month: lastMonth, hours: 100, fileId: t.id } });
    await move(ts.id, "admin", { status: "VERIFIED" });
    await move(ts.id, "admin", { status: "VERIFIER_APPROVED" });
    const res = await move(ts.id, "admin", { status: "ACCOUNTS_CHECKED" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("INVOICE_RAISED");
  });

  it("send back needs a comment, tells the consultant, and the consultant can upload again", async () => {
    const res = await uploadTimesheet(twoMonthsAgo, PDF, "t.pdf", "application/pdf", "120");
    expect(res.status).toBe(201);
    const id = res.body.id as string;

    expect((await move(id, "verifier", { status: "REJECTED" })).status).toBe(400);
    const before = mailer.sent.length;
    const rejected = await move(id, "verifier", { status: "REJECTED", comment: "Signature missing on page 2" });
    expect(rejected.body.status).toBe("REJECTED");
    expect(mailer.sent.length).toBe(before + 1);
    expect(mailer.sent.at(-1)!.to).toBe(consultantEmail);

    const notes = await request(app).get("/api/student/notifications").set(as("student"));
    expect(notes.body.notifications[0].body).toContain("Signature missing on page 2");
    const mine = await request(app).get("/api/student/timesheets").set(as("student"));
    expect(mine.body.timesheets.find((t: { id: string }) => t.id === id)).toMatchObject({ status: "Needs Resubmission", comment: "Signature missing on page 2" });

    const again = await uploadTimesheet(twoMonthsAgo, PDF, "t2.pdf", "application/pdf", "121");
    expect(again.status).toBe(201);
    const detail = await request(app).get(`/api/admin/timesheets/${id}`).set(as("verifier"));
    expect(detail.body.status).toBe("RECEIVED");
    expect(detail.body.hours).toBe(121);
    expect(detail.body.history.map((h: { to: string }) => h.to)).toEqual(["RECEIVED", "REJECTED", "RECEIVED"]);
  });
});

describe("placement with timesheets", () => {
  it("can't be deleted", async () => {
    const res = await request(app).delete(`/api/admin/placements/${ids.placement}`).set(as("admin"));
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/Ended/);
  });
});

describe("invoices", () => {
  it("serves the PDF through a short-lived signed link only", async () => {
    const link = await request(app).get(`/api/admin/invoices/${ids.invoice}/pdf`).set(as("admin"));
    expect(link.status).toBe(200);
    const file = await request(app).get(link.body.url);
    expect(file.status).toBe(200);
    expect(file.headers["content-type"]).toBe("application/pdf");
    expect(file.body.subarray(0, 5).toString()).toBe("%PDF-");
    expect((await request(app).get(link.body.url.replace(/signature=[^&]+/, "signature=forged"))).status).toBe(404);
  });

  it("a failed send is retried, logged per attempt and flagged", async () => {
    mailer.fail(true);
    const res = await request(app).post(`/api/admin/invoices/${ids.invoice}/send`).set(as("admin")).send({});
    mailer.fail(false);
    expect(res.status).toBe(502);
    const inv = await request(app).get(`/api/admin/invoices/${ids.invoice}`).set(as("admin"));
    expect(inv.body.emailFailed).toBe(true);
    expect(inv.body.sentAt).toBeNull();
    expect(inv.body.emails.filter((e: { status: string }) => e.status === "FAILED")).toHaveLength(3);
    expect(inv.body.emails[0]).toMatchObject({ to: "ap@northwind.example", error: "SMTPError:ECONNECTION" });
  });

  it("Send now emails the invoice and the approved timesheet to the billing email", async () => {
    const before = mailer.sent.length;
    const res = await request(app).post(`/api/admin/invoices/${ids.invoice}/send`).set(as("admin")).send({});
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: "SENT", emailFailed: false });
    expect(res.body.timesheet.status).toBe("SUBMITTED_TO_CLIENT");
    const mail = mailer.sent[before]!;
    expect(mail.to).toBe("ap@northwind.example");
    expect(mail.attachments?.map((a) => a.contentType)).toEqual(["application/pdf", "application/pdf"]);
    expect(mail.subject).toContain(res.body.number);

    expect((await request(app).post(`/api/admin/invoices/${ids.invoice}/send`).set(as("admin")).send({})).status).toBe(409);
  });
});

describe("payments", () => {
  it("blocks paying the consultant before the client pays; only an admin can override, with a reason", async () => {
    let res = await request(app).post("/api/admin/payments/consultant").set(as("admin")).send({ invoiceId: ids.invoice, paidDate: today });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe("client_payment_missing");
    // Billing is admins only: accounts can't record payments at all.
    res = await request(app).post("/api/admin/payments/consultant").set(as("accounts")).send({ invoiceId: ids.invoice, paidDate: today, overrideReason: "Consultant hardship, approved by Mansingh" });
    expect(res.status).toBe(403);
    res = await request(app).post("/api/admin/payments/consultant").set(as("admin")).send({ invoiceId: ids.invoice, paidDate: today, overrideReason: "short" });
    expect(res.status).toBe(400);
    res = await request(app).post("/api/admin/payments/consultant").set(as("admin")).send({ invoiceId: ids.invoice, paidDate: today, overrideReason: "Client confirmed wire, consultant needs pay today" });
    expect(res.status).toBe(200);
    expect(res.body.consultantPaidAt).toBe(today);
    expect(res.body.payments[0]).toMatchObject({ kind: "CONSULTANT_PAYOUT", amount: 10400, overrideReason: "Client confirmed wire, consultant needs pay today" });

    const audit = await request(app).get(`/api/admin/audit-log?entityType=payment&pageSize=100`).set(as("admin"));
    expect(audit.body.entries.some((e: { action: string; detail: { reason?: string } }) => e.action === "payment.consultant.override" && e.detail.reason)).toBe(true);
    expect((await request(app).get("/api/admin/audit-log").set(as("accounts"))).status).toBe(403);
  });

  it("records an expected date and comment, then the received payment", async () => {
    let res = await request(app).post("/api/admin/payments/client").set(as("admin")).send({ invoiceId: ids.invoice, status: "expected", expectedDate: addDays(today, 7), comment: "Payment processed, expected next week" });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ clientPaymentExpectedDate: addDays(today, 7), clientPaymentComment: "Payment processed, expected next week" });

    res = await request(app).post("/api/admin/payments/client").set(as("admin")).send({ invoiceId: ids.invoice, status: "received", receivedDate: today, amount: 15000 });
    expect(res.status).toBe(400);
    expect(res.body.fields.comment).toBeTruthy();
    res = await request(app).post("/api/admin/payments/client").set(as("admin")).send({ invoiceId: ids.invoice, status: "received", receivedDate: today });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("CONSULTANT_PAID");
    expect((await request(app).post("/api/admin/payments/client").set(as("admin")).send({ invoiceId: ids.invoice, status: "received", receivedDate: today })).status).toBe(409);
  });

  it("can't record the client's payment before the invoice goes out", async () => {
    const inv = await db.invoice.findFirstOrThrow({ where: { sentAt: null } });
    const res = await request(app).post("/api/admin/payments/client").set(as("admin")).send({ invoiceId: inv.id, status: "received", receivedDate: today });
    expect(res.status).toBe(409);
  });
});

describe("payment reminders", () => {
  it("previews, then emails the client the placement's unpaid invoices; admins only", async () => {
    const inv = await db.invoice.findFirstOrThrow({ where: { clientId: ids.vendor, clientPaidAt: null } });
    const body = { placementId: inv.placementId };
    expect((await request(app).post("/api/admin/payments/reminders").set(as("accounts")).send(body)).status).toBe(403);

    const before = mailer.sent.length;
    const preview = await request(app).post("/api/admin/payments/reminders").set(as("admin")).send({ ...body, preview: true });
    expect(preview.status).toBe(200);
    expect(preview.body).toMatchObject({ sent: false, to: "invoices@apex.example", invoices: 1, total: 8050 });
    expect(preview.body.text).toContain(inv.number);
    expect(mailer.sent.length).toBe(before);

    const sent = await request(app).post("/api/admin/payments/reminders").set(as("admin")).send(body);
    expect(sent.body.sent).toBe(true);
    expect(mailer.sent.at(-1)).toMatchObject({ to: "invoices@apex.example" });
    expect(mailer.sent.at(-1)!.subject).toMatch(/^Payment reminder: 1 invoice, \$8,050\.00/);
    const log = await db.emailLog.findFirstOrThrow({ where: { kind: "PAYMENT_REMINDER" } });
    expect(log.status).toBe("SENT");
  });

  it("refuses when nothing is unpaid", async () => {
    const paid = await db.invoice.findUniqueOrThrow({ where: { id: ids.invoice } });
    const res = await request(app).post("/api/admin/payments/reminders").set(as("admin")).send({ placementId: paid.placementId, preview: true });
    // Its only invoice so far is paid in full.
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/Nothing is unpaid/);
  });
});

describe("activity log", () => {
  it("filters, sorts and pages on the server", async () => {
    const all = await request(app).get("/api/admin/audit-log?pageSize=5").set(as("admin"));
    expect(all.status).toBe(200);
    expect(all.body.entries).toHaveLength(5);
    expect(all.body.total).toBeGreaterThan(5);
    const at = (r: { body: { entries: { at: string }[] } }) => r.body.entries.map((e) => e.at);
    expect(at(all)).toEqual([...at(all)].sort().reverse());

    const page2 = await request(app).get("/api/admin/audit-log?pageSize=5&page=2").set(as("admin"));
    expect(page2.body.entries[0].id).not.toBe(all.body.entries[0].id);

    const oldest = await request(app).get("/api/admin/audit-log?pageSize=5&order=oldest").set(as("admin"));
    expect(at(oldest)).toEqual([...at(oldest)].sort());

    const changes = await request(app).get("/api/admin/audit-log?changesOnly=true&pageSize=100").set(as("admin"));
    expect(changes.body.entries.some((e: { action: string }) => /\.(view|list)$/.test(e.action))).toBe(false);

    const payments = await request(app).get("/api/admin/audit-log?action=payment.&pageSize=100").set(as("admin"));
    expect(payments.body.entries.length).toBeGreaterThan(0);
    expect(payments.body.entries.every((e: { action: string }) => e.action.startsWith("payment."))).toBe(true);

    const byPerson = await request(app).get("/api/admin/audit-log?actor=u-verifier&pageSize=100").set(as("admin"));
    expect(byPerson.body.entries.every((e: { by: string }) => e.by.includes("u-verifier"))).toBe(true);

    expect((await request(app).get("/api/admin/audit-log?from=2026-12-01&to=2026-01-01").set(as("admin"))).status).toBe(400);
    expect((await request(app).get("/api/admin/audit-log?entityType=nonsense").set(as("admin"))).status).toBe(400);
  });

  it("summarises each area for the admin panel, admins only", async () => {
    const res = await request(app).get("/api/admin/audit-log/summary").set(as("admin"));
    expect(res.status).toBe(200);
    expect(res.body.changes.invoice).toBeGreaterThan(0);
    expect(res.body.people).toContain("u-verifier@example.com");
    expect((await request(app).get("/api/admin/audit-log/summary").set(as("accounts"))).status).toBe(403);
  });
});

describe("billing summary", () => {
  it("per consultant per month: hours, billed, received, paid, margin, stage, overdue", async () => {
    // Make the vendor invoice overdue.
    await db.invoice.updateMany({ where: { sentAt: null }, data: { dueDate: new Date(`${addDays(today, -5)}T00:00:00Z`) } });
    const res = await request(app).get("/api/admin/reports/billing-summary").set(as("admin"));
    expect(res.status).toBe(200);
    const manas = res.body.rows.find((r: { invoiceId: string }) => r.invoiceId === ids.invoice);
    expect(manas).toMatchObject({ hours: 160, billed: 15200, received: 15200, paid: 10400, margin: 4800, expectedMargin: 4800, stage: "consultant_paid", paidBeforeClient: false });
    const overdue = res.body.rows.find((r: { overdue: boolean }) => r.overdue);
    // 100 h × $80.50 billed, 100 h × $60 owed: nothing paid yet.
    expect(overdue).toMatchObject({ consultantName: "Rahul", daysOverdue: 5, billed: 8050, paid: 0, margin: 8050, expectedMargin: 2050 });
    expect(res.body.totals.overdueInvoices).toBe(1);
    expect(res.body.byConsultant.find((c: { consultantName: string }) => c.consultantName === "Manas").margin).toBe(4800);

    const filtered = await request(app).get("/api/admin/reports/billing-summary?status=overdue").set(as("admin"));
    expect(filtered.body.rows).toHaveLength(1);
  });

  it("filters a whole year", async () => {
    const year = lastMonth.slice(0, 4);
    const res = await request(app).get(`/api/admin/reports/billing-summary?year=${year}`).set(as("admin"));
    expect(res.status).toBe(200);
    expect(res.body.rows.length).toBeGreaterThan(0);
    expect(res.body.rows.every((r: { month: string }) => r.month.startsWith(`${year}-`))).toBe(true);
    expect((await request(app).get("/api/admin/reports/billing-summary?year=1890").set(as("admin"))).body.rows).toBeUndefined();
    expect((await request(app).get("/api/admin/reports/billing-summary?year=2999").set(as("admin"))).status).toBe(400);
  });

  it("exports CSV with formula-looking cells neutralised", async () => {
    const res = await request(app).get(`/api/admin/reports/billing-summary?format=csv&month=${lastMonth}`).set(as("admin"));
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/text\/csv/);
    expect(res.headers["content-disposition"]).toContain(`billing-summary-${lastMonth}.csv`);
    expect(res.text.split("\r\n")[0]).toMatch(/^Month,Consultant,Client \/ vendor/);
    expect(res.text).toContain("'=Apex Staffing");
    expect(res.text).not.toMatch(/,=Apex/);
  });
});

describe("scheduled jobs", () => {
  it("the monthly job emails unsent invoices to auto-send clients, once per month", async () => {
    // A fresh invoice for the auto-send client.
    const ts = await db.timesheet.findFirstOrThrow({ where: { month: twoMonthsAgo, placement: { consultantEmail } } });
    await move(ts.id, "verifier", { status: "VERIFIED" });
    await move(ts.id, "verifier", { status: "VERIFIER_APPROVED" });
    const checked = await move(ts.id, "accounts", { status: "ACCOUNTS_CHECKED" });
    expect(checked.body.status).toBe("INVOICE_RAISED");

    const services = createServices(env, db, { mailer });
    const jobs = createClientSectionJobs(services.clientSection, { reminderDays: 3 });
    const before = mailer.sent.length;
    const run = await jobs.monthlyInvoices();
    expect(run).toMatchObject({ sent: 1, failed: 0 });
    expect(mailer.sent.length).toBe(before + 1);
    expect(mailer.sent.at(-1)!.to).toBe("ap@northwind.example");
    // The vendor has auto-send off: its invoice is still unsent.
    expect(await db.invoice.count({ where: { clientId: ids.vendor, sentAt: null } })).toBe(1);
    expect(await jobs.monthlyInvoices()).toBeNull();
  });

  it("reminds placed consultants with no timesheet near month end", async () => {
    const thisMonth = monthOf(today);
    const lastDay = addDays(`${monthOf(addDays(`${thisMonth}-28`, 7))}-01`, -1);
    const services = createServices(env, db, { mailer, now: () => new Date(`${lastDay}T15:00:00Z`) });
    const jobs = createClientSectionJobs(services.clientSection, { reminderDays: 3 });
    const before = mailer.sent.length;
    const run = await jobs.timesheetReminders();
    expect(run).toMatchObject({ month: thisMonth, reminded: 2 });
    expect(mailer.sent.slice(before).map((m) => m.to).sort()).toEqual(["rahul.c@example.com", consultantEmail].sort());
    expect(await jobs.timesheetReminders()).toBeNull();

    const early = createServices(env, db, { mailer, now: () => new Date(`${thisMonth}-10T15:00:00Z`) });
    expect(await createClientSectionJobs(early.clientSection, { reminderDays: 3 }).timesheetReminders()).toBeNull();
  });
});
