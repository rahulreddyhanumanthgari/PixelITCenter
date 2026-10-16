import request from "supertest";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { EXE, FULL_DRAFT, JPG, makeApp, PDF, PNG, tokenFor } from "./helpers.js";

const { app, db, env } = makeApp();
const auth = (sub: string, role: "student" | "recruiter" | "admin" = "student") => ({ Authorization: `Bearer ${tokenFor(sub, role)}` });

let logged = "";
beforeAll(() => {
  // Capture everything the API logs, to prove PII never reaches it.
  for (const m of ["log", "error", "warn", "info"] as const) {
    vi.spyOn(console, m).mockImplementation((...args: unknown[]) => {
      logged += args.map(String).join(" ") + "\n";
    });
  }
});
afterEach(() => {
  for (const secret of ["Z1234567", "4321", "1995-04-12"]) expect(logged).not.toContain(secret);
});
afterAll(async () => {
  // The check above only means something if logs were really captured.
  expect(logged).toContain('"path":"/api/student/profile"');
  vi.restoreAllMocks();
  await db.$disconnect();
});

async function upload(sub: string, type: string, file: Buffer, name: string, contentType: string) {
  return request(app).post("/api/student/profile/documents").set(auth(sub)).field("type", type).attach("file", file, { filename: name, contentType });
}

async function uploadAll(sub: string) {
  expect((await upload(sub, "resume", PDF, "resume.pdf", "application/pdf")).status).toBe(201);
  expect((await upload(sub, "id", PNG, "dl.png", "image/png")).status).toBe(201);
  expect((await upload(sub, "visa", JPG, "visa.jpg", "image/jpeg")).status).toBe(201);
}

describe("access control", () => {
  it("needs a valid token", async () => {
    expect((await request(app).get("/api/student/profile")).status).toBe(401);
    expect((await request(app).get("/api/student/profile").set("Authorization", "Bearer nonsense")).status).toBe(401);
  });

  it("refuses a token signed with another secret or algorithm", async () => {
    const jwt = await import("jsonwebtoken");
    const forged = jwt.default.sign({ role: "admin" }, "another-secret-another-secret-12345", { subject: "x" });
    expect((await request(app).get("/api/admin/students/x/profile").set("Authorization", `Bearer ${forged}`)).status).toBe(401);
    const none = jwt.default.sign({ role: "admin", sub: "x" }, "", { algorithm: "none" });
    expect((await request(app).get("/api/admin/students/x/profile").set("Authorization", `Bearer ${none}`)).status).toBe(401);
  });

  it("keeps students out of admin routes and staff out of student routes", async () => {
    expect((await request(app).get("/api/admin/students/s1/profile").set(auth("s1"))).status).toBe(403);
    expect((await request(app).get("/api/student/profile").set(auth("r1", "recruiter"))).status).toBe(403);
  });

  it("dev sign-in is off unless enabled", async () => {
    expect((await request(app).post("/api/dev/token").send({ email: "a@b.co" })).status).toBe(404);
  });

  it("sends security headers and only allows the portal origin", async () => {
    const ok = await request(app).get("/health").set("Origin", "http://localhost:3000");
    expect(ok.headers["access-control-allow-origin"]).toBe("http://localhost:3000");
    expect(ok.headers["x-content-type-options"]).toBe("nosniff");
    const bad = await request(app).get("/health").set("Origin", "https://evil.example");
    expect(bad.headers["access-control-allow-origin"]).toBeUndefined();
  });
});

describe("student draft", () => {
  it("creates a draft on first visit, with the account email filled in", async () => {
    const res = await request(app).get("/api/student/profile").set(auth("s-draft"));
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("DRAFT");
    expect(res.body.canEdit).toBe(true);
    expect(res.body.fields.email).toBe("s-draft@example.com");
    expect(res.body.completion.percent).toBeGreaterThan(0);
    expect(res.body.completion.missing).toContain("document:resume");
  });

  it("saves partial updates; sensitive values come back masked and are encrypted in the database", async () => {
    const res = await request(app)
      .put("/api/student/profile")
      .set(auth("s-draft"))
      .send({ currentLocation: "Raleigh, NC", passportNumber: "Z1234567", ssnLast4: "4321", dateOfBirth: "1995-04-12", references: [{ position: 1, name: "Rahul" }] });
    expect(res.status).toBe(200);
    expect(res.body.fields.currentLocation).toBe("Raleigh, NC");
    expect(res.body.sensitive.passportNumber).toEqual({ isSet: true, masked: "•••••567" });
    expect(res.body.sensitive.ssnLast4).toEqual({ isSet: true, masked: "••••" });
    expect(JSON.stringify(res.body)).not.toMatch(/Z1234567|4321|1995-04-12/);
    expect(res.body.references[0].name).toBe("Rahul");

    const rows = await db.$queryRawUnsafe<Record<string, string>[]>(
      `SELECT "passportNumberEnc", "ssnLast4Enc", "dateOfBirthEnc" FROM "StudentProfile" WHERE "userId" = $1`,
      "s-draft",
    );
    const raw = JSON.stringify(rows);
    expect(raw).not.toMatch(/Z1234567|4321|1995-04-12/);
    expect(rows[0]!.passportNumberEnc).toMatch(/^v1\.k1\./);
  });

  it("leaving a sensitive field out keeps it; null clears it", async () => {
    let res = await request(app).put("/api/student/profile").set(auth("s-draft")).send({ visaStatus: "H1B" });
    expect(res.body.sensitive.passportNumber.isSet).toBe(true);
    res = await request(app).put("/api/student/profile").set(auth("s-draft")).send({ passportNumber: null });
    expect(res.body.sensitive.passportNumber).toEqual({ isSet: false, masked: null });
  });

  it("refuses unknown fields and wrong types", async () => {
    expect((await request(app).put("/api/student/profile").set(auth("s-draft")).send({ status: "APPROVED" })).status).toBe(400);
    const res = await request(app).put("/api/student/profile").set(auth("s-draft")).send({ usExperienceYears: "three" });
    expect(res.status).toBe(400);
    expect(res.body.fields.usExperienceYears).toBeTruthy();
  });

  it("submit lists what is missing", async () => {
    const res = await request(app).post("/api/student/profile/submit").set(auth("s-draft"));
    expect(res.status).toBe(422);
    expect(res.body.fields.contactNumber).toBe("Required.");
    expect(res.body.missingDocuments).toEqual(["resume", "id", "visa"]);
  });

  it("one student can't see another's profile", async () => {
    const res = await request(app).get("/api/student/profile").set(auth("s-other"));
    expect(res.body.fields.currentLocation).toBeNull();
    expect(res.body.sensitive.ssnLast4.isSet).toBe(false);
  });
});

describe("documents", () => {
  it("refuses files that aren't really PDF / JPG / PNG", async () => {
    expect((await upload("s-docs", "resume", EXE, "resume.pdf", "application/pdf")).status).toBe(415);
    expect((await upload("s-docs", "resume", PNG, "resume.pdf", "application/pdf")).status).toBe(415);
    expect((await upload("s-docs", "resume", PDF, "resume.exe", "application/pdf")).status).toBe(415);
    expect((await upload("s-docs", "passport", PDF, "x.pdf", "application/pdf")).status).toBe(400);
  });

  it("refuses files over the size limit", async () => {
    const big = Buffer.concat([PDF, Buffer.alloc(env.maxUploadBytes)]);
    const res = await upload("s-docs", "resume", big, "big.pdf", "application/pdf");
    expect(res.status).toBe(413);
  });

  it("stores, lists, serves through a signed link, and replaces by type", async () => {
    const first = await upload("s-docs", "resume", PDF, "My Resume.pdf", "application/pdf");
    expect(first.status).toBe(201);
    expect(first.body).toMatchObject({ type: "resume", fileName: "My Resume.pdf", mimeType: "application/pdf", scanStatus: "SKIPPED" });

    const file = await request(app).get(first.body.url);
    expect(file.status).toBe(200);
    expect(file.headers["content-type"]).toBe("application/pdf");
    expect(file.headers["cache-control"]).toBe("private, no-store");
    expect(Buffer.from(file.body).subarray(0, 5).toString()).toBe("%PDF-");

    // Change the signature's first character to a different one (never a no-op).
    const tampered = first.body.url.replace(/signature=(.)/, (_: string, c: string) => `signature=${c === "A" ? "B" : "A"}`);
    expect((await request(app).get(tampered)).status).toBe(404);
    expect((await request(app).get(`/api/files/${first.body.id}`)).status).toBe(404);

    const second = await upload("s-docs", "resume", PDF, "resume-v2.pdf", "application/pdf");
    const list = await request(app).get("/api/student/profile/documents").set(auth("s-docs"));
    expect(list.body.documents).toHaveLength(1);
    expect(list.body.documents[0].id).toBe(second.body.id);
    expect((await request(app).get(first.body.url)).status).toBe(404); // the old file is gone
  });

  it("a student can't delete someone else's document", async () => {
    const mine = await upload("s-docs", "visa", JPG, "visa.jpg", "image/jpeg");
    expect((await request(app).delete(`/api/student/profile/documents/${mine.body.id}`).set(auth("s-other"))).status).toBe(404);
    expect((await request(app).delete(`/api/student/profile/documents/${mine.body.id}`).set(auth("s-docs"))).status).toBe(204);
    expect((await request(app).delete("/api/student/profile/documents/not-a-uuid").set(auth("s-docs"))).status).toBe(404);
  });
});

describe("submit and review", () => {
  const S = "s-flow";

  it("a complete profile with all three documents submits", async () => {
    expect((await request(app).put("/api/student/profile").set(auth(S)).send(FULL_DRAFT)).status).toBe(200);
    let res = await request(app).post("/api/student/profile/submit").set(auth(S));
    expect(res.status).toBe(422);
    expect(res.body.fields).toEqual({});
    await uploadAll(S);
    res = await request(app).post("/api/student/profile/submit").set(auth(S));
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("SUBMITTED");
    expect(res.body.canEdit).toBe(false);
    expect(res.body.completion.percent).toBe(100);
  });

  it("locks the profile and its documents once submitted", async () => {
    expect((await request(app).put("/api/student/profile").set(auth(S)).send({ currentLocation: "Austin, TX" })).status).toBe(409);
    expect((await upload(S, "resume", PDF, "new.pdf", "application/pdf")).status).toBe(409);
    const docs = await request(app).get("/api/student/profile/documents").set(auth(S));
    expect((await request(app).delete(`/api/student/profile/documents/${docs.body.documents[0].id}`).set(auth(S))).status).toBe(409);
    expect((await request(app).post("/api/student/profile/submit").set(auth(S))).status).toBe(409);
  });

  it("recruiters see full values, and each view is written to the access log", async () => {
    const res = await request(app).get(`/api/admin/students/${S}/profile`).set(auth("hari", "recruiter"));
    expect(res.status).toBe(200);
    expect(res.body.sensitive).toEqual({ passportNumber: "Z1234567", ssnLast4: "4321", dateOfBirth: "1995-04-12" });
    expect(res.body.documents).toHaveLength(3);
    expect(res.headers["cache-control"]).toBe("no-store");

    const logs = await db.piiAccessLog.findMany({ where: { actorUserId: "hari" } });
    expect(logs).toHaveLength(1);
    expect(logs[0]!.fields).toEqual(expect.arrayContaining(["passportNumber", "ssnLast4", "dateOfBirth", "document:RESUME"]));
    expect((await request(app).get("/api/admin/students/nobody/profile").set(auth("hari", "recruiter"))).status).toBe(404);
  });

  it("Needs Update requires a comment, shows it to the student and unlocks editing", async () => {
    const admin = auth("mansingh", "admin");
    expect((await request(app).patch(`/api/admin/students/${S}/profile/status`).set(admin).send({ status: "NEEDS_UPDATE" })).status).toBe(400);
    expect((await request(app).patch(`/api/admin/students/${S}/profile/status`).set(admin).send({ status: "UNDER_REVIEW" })).body.status).toBe("UNDER_REVIEW");
    const res = await request(app)
      .patch(`/api/admin/students/${S}/profile/status`)
      .set(admin)
      .send({ status: "NEEDS_UPDATE", comment: "Please upload a clearer visa copy." });
    expect(res.status).toBe(200);

    const mine = await request(app).get("/api/student/profile").set(auth(S));
    expect(mine.body.status).toBe("NEEDS_UPDATE");
    expect(mine.body.canEdit).toBe(true);
    expect(mine.body.reviewerComment).toBe("Please upload a clearer visa copy.");
    expect(mine.body.history.map((h: { status: string }) => h.status)).toEqual(["NEEDS_UPDATE", "UNDER_REVIEW", "SUBMITTED"]);
  });

  it("the student fixes it and resubmits; the recruiter approves", async () => {
    expect((await upload(S, "visa", PNG, "visa-clear.png", "image/png")).status).toBe(201);
    expect((await request(app).post("/api/student/profile/submit").set(auth(S))).body.status).toBe("SUBMITTED");
    const res = await request(app).patch(`/api/admin/students/${S}/profile/status`).set(auth("hari", "recruiter")).send({ status: "APPROVED" });
    expect(res.body.status).toBe("APPROVED");
    const mine = await request(app).get("/api/student/profile").set(auth(S));
    expect(mine.body.reviewerComment).toBeNull();
  });

  it("refuses transitions that don't make sense", async () => {
    const res = await request(app).patch(`/api/admin/students/${S}/profile/status`).set(auth("hari", "recruiter")).send({ status: "UNDER_REVIEW" });
    expect(res.status).toBe(409);
    expect((await request(app).patch("/api/admin/students/s-draft/profile/status").set(auth("hari", "recruiter")).send({ status: "APPROVED" })).status).toBe(409);
    expect((await request(app).patch(`/api/admin/students/${S}/profile/status`).set(auth("hari", "recruiter")).send({ status: "DRAFT" })).status).toBe(400);
  });
});

describe("dev sign-in", () => {
  it("issues working tokens when enabled", async () => {
    const dev = makeApp({ DEV_AUTH_ENABLED: "true" });
    const t = await request(dev.app).post("/api/dev/token").send({ email: "Manas@PixelITCenter.com" });
    expect(t.status).toBe(200);
    const again = await request(dev.app).post("/api/dev/token").send({ email: "manas@pixelitcenter.com" });
    expect(again.body.userId).toBe(t.body.userId);
    const res = await request(dev.app).get("/api/student/profile").set("Authorization", `Bearer ${t.body.token}`);
    expect(res.status).toBe(200);
    expect(res.body.fields.email).toBe("manas@pixelitcenter.com");
    await dev.db.$disconnect();
  });
});
