import { describe, expect, it } from "vitest";
import { loadEnv } from "../src/config/env.js";
import { createFieldCipher } from "../src/lib/crypto.js";
import { checkFileType, cleanFileName } from "../src/lib/fileType.js";
import { createFileSigner } from "../src/lib/storage.js";
import { maskSensitive } from "../src/services/profileService.js";
import { draftSchema, submitErrors, type PlainProfile } from "../src/validation/profile.js";
import { EXE, FULL_DRAFT, JPG, PDF, PNG } from "./helpers.js";

const key = Buffer.alloc(32, 1);

describe("field encryption", () => {
  const cipher = createFieldCipher({ k1: key }, "k1");

  it("round-trips and never stores the plain value", () => {
    const stored = cipher.encrypt("Z1234567", "studentProfile:u1:passportNumber");
    expect(stored).not.toContain("Z1234567");
    expect(stored.startsWith("v1.k1.")).toBe(true);
    expect(cipher.decrypt(stored, "studentProfile:u1:passportNumber")).toBe("Z1234567");
  });

  it("uses a new IV every time", () => {
    expect(cipher.encrypt("4321", "c")).not.toBe(cipher.encrypt("4321", "c"));
  });

  it("refuses a value moved to another user or field", () => {
    const stored = cipher.encrypt("4321", "studentProfile:u1:ssnLast4");
    expect(() => cipher.decrypt(stored, "studentProfile:u2:ssnLast4")).toThrow();
    expect(() => cipher.decrypt(stored, "studentProfile:u1:passportNumber")).toThrow();
  });

  it("refuses a tampered value", () => {
    const stored = cipher.encrypt("4321", "c");
    const parts = stored.split(".");
    parts[4] = Buffer.from("9999").toString("base64url");
    expect(() => cipher.decrypt(parts.join("."), "c")).toThrow();
  });

  it("refuses an unknown key id and a short key", () => {
    const other = createFieldCipher({ k2: Buffer.alloc(32, 2) }, "k2");
    expect(() => cipher.decrypt(other.encrypt("x", "c"), "c")).toThrow(/key id/);
    expect(() => createFieldCipher({ k1: Buffer.alloc(16) }, "k1")).toThrow();
  });
});

describe("environment", () => {
  const base = {
    DATABASE_URL: "postgresql://x",
    JWT_SECRET: "x".repeat(32),
    PII_ENCRYPTION_KEY: key.toString("base64"),
    FILE_URL_SECRET: "y".repeat(32),
  };
  it("refuses dev sign-in in production", () => {
    expect(() => loadEnv({ ...base, NODE_ENV: "production", DEV_AUTH_ENABLED: "true" })).toThrow(/DEV_AUTH_ENABLED/);
  });
  it("refuses a key that isn't 32 bytes, without printing it", () => {
    expect(() => loadEnv({ ...base, PII_ENCRYPTION_KEY: "c2hvcnQ=" })).toThrow(/PII_ENCRYPTION_KEY/);
    try {
      loadEnv({ ...base, PII_ENCRYPTION_KEY: "c2hvcnQ=" });
    } catch (e) {
      expect(String(e)).not.toContain("c2hvcnQ=");
    }
  });
});

describe("file type check", () => {
  it("accepts PDF, PNG and JPG whose type, name and bytes agree", () => {
    expect(checkFileType(PDF, "application/pdf", "resume.pdf")).toEqual({ ok: true, mime: "application/pdf" });
    expect(checkFileType(PNG, "image/png", "dl.PNG")).toEqual({ ok: true, mime: "image/png" });
    expect(checkFileType(JPG, "image/jpg", "visa.jpeg")).toEqual({ ok: true, mime: "image/jpeg" });
  });
  it("refuses a renamed executable", () => {
    expect(checkFileType(EXE, "application/pdf", "resume.pdf").ok).toBe(false);
  });
  it("refuses a PNG sent as a PDF, and a wrong extension", () => {
    expect(checkFileType(PNG, "application/pdf", "resume.pdf").ok).toBe(false);
    expect(checkFileType(PDF, "application/pdf", "resume.png").ok).toBe(false);
    expect(checkFileType(PDF, "text/html", "resume.pdf").ok).toBe(false);
  });
  it("cleans file names", () => {
    expect(cleanFileName("../../etc/pass\"wd.pdf")).toBe("pass_wd.pdf");
    expect(cleanFileName("C:\\Users\\me\\My Resume.pdf")).toBe("My Resume.pdf");
  });
});

describe("signed file links", () => {
  it("work until they expire and only for their file", () => {
    let now = 1_800_000_000_000;
    const signer = createFileSigner("s".repeat(32), 300, () => now);
    const { url } = signer.sign("doc-1");
    const q = new URL(url, "http://x").searchParams;
    expect(signer.verify("doc-1", q.get("expires")!, q.get("signature")!)).toBe(true);
    expect(signer.verify("doc-2", q.get("expires")!, q.get("signature")!)).toBe(false);
    expect(signer.verify("doc-1", String(Number(q.get("expires")) + 1000), q.get("signature")!)).toBe(false);
    now += 301_000;
    expect(signer.verify("doc-1", q.get("expires")!, q.get("signature")!)).toBe(false);
  });
});

describe("masking", () => {
  it("shows only the passport's last 3 and nothing of SSN or DOB", () => {
    expect(maskSensitive("passportNumber", "Z1234567")).toBe("•••••567");
    expect(maskSensitive("ssnLast4", "4321")).toBe("••••");
    expect(maskSensitive("dateOfBirth", "1995-04-12")).not.toMatch(/\d/);
  });
});

describe("validation", () => {
  const full = (): PlainProfile => {
    const { references, ...rest } = draftSchema.parse(FULL_DRAFT);
    return { ...rest, mastersDegree: null, mastersUniversity: null, mastersYear: null, references } as unknown as PlainProfile;
  };

  it("a complete profile has no errors", () => {
    expect(submitErrors(full())).toEqual({});
  });

  it("drafts trim text, turn empty into null and refuse unknown keys", () => {
    expect(draftSchema.parse({ currentLocation: "  Raleigh  ", skypeId: "" })).toEqual({ currentLocation: "Raleigh", skypeId: null });
    expect(draftSchema.safeParse({ isAdmin: true }).success).toBe(false);
    expect(draftSchema.safeParse({ ssnLast4: "12345" }).success).toBe(false);
  });

  it("checks formats on submit", () => {
    const p = full();
    p.email = "not-an-email";
    p.contactNumber = "12345";
    p.linkedinUrl = "https://example.com/me";
    p.ssnLast4 = "12a4";
    p.passportNumber = "AB 12";
    p.usExperienceYears = -1;
    p.bachelorsYear = 1900;
    const e = submitErrors(p);
    for (const k of ["email", "contactNumber", "linkedinUrl", "ssnLast4", "passportNumber", "usExperienceYears", "bachelorsYear"]) {
      expect(e[k], k).toBeTruthy();
    }
  });

  it("date of birth must be real, in the past and 18+", () => {
    const p = full();
    const year = new Date().getUTCFullYear();
    p.dateOfBirth = `${year - 10}-01-01`;
    expect(submitErrors(p).dateOfBirth).toMatch(/18/);
    p.dateOfBirth = `${year + 1}-01-01`;
    expect(submitErrors(p).dateOfBirth).toMatch(/past/);
    p.dateOfBirth = "1995-02-30";
    expect(submitErrors(p).dateOfBirth).toMatch(/exist/);
  });

  it("master's is optional but all-or-nothing, and not before the bachelor's", () => {
    const p = full();
    p.mastersDegree = "MS CS";
    expect(Object.keys(submitErrors(p)).sort()).toEqual(["mastersUniversity", "mastersYear"]);
    p.mastersUniversity = "UNC Charlotte";
    p.mastersYear = 2015;
    expect(submitErrors(p).mastersYear).toMatch(/bachelor/);
  });

  it("needs both references, with valid email and phone", () => {
    const p = full();
    p.references = [{ position: 1, name: "Rahul", role: "Lead", location: "NC", email: "bad", phone: "1" }];
    const e = submitErrors(p);
    expect(e["references.1.email"]).toBeTruthy();
    expect(e["references.1.phone"]).toBeTruthy();
    expect(e["references.2.name"]).toBe("Required.");
  });
});
