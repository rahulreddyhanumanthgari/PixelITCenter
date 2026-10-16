import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import jwt from "jsonwebtoken";
import { inject } from "vitest";
import { createApp } from "../src/app.js";
import { loadEnv } from "../src/config/env.js";
import { createDb } from "../src/lib/prisma.js";

export const JWT_SECRET = "test-secret-test-secret-test-secret-123";

export function testEnv(overrides: Record<string, string> = {}) {
  return loadEnv({
    NODE_ENV: "test",
    DATABASE_URL: inject("databaseUrl"),
    JWT_SECRET,
    PII_ENCRYPTION_KEY: Buffer.alloc(32, 7).toString("base64"),
    FILE_URL_SECRET: "file-secret-file-secret-file-secret-123",
    STORAGE_DIR: mkdtempSync(path.join(tmpdir(), "pixelit-uploads-")),
    CORS_ORIGINS: "http://localhost:3000",
    ...overrides,
  });
}

export function makeApp(overrides: Record<string, string> = {}) {
  const env = testEnv(overrides);
  const db = createDb(env.DATABASE_URL, 1);
  return { env, db, app: createApp(env, db) };
}

export function tokenFor(sub: string, role: "student" | "recruiter" | "admin" = "student", email = `${sub}@example.com`) {
  return jwt.sign({ role, email }, JWT_SECRET, { algorithm: "HS256", subject: sub, expiresIn: "1h" });
}

// Smallest files that pass the signature check.
export const PDF = Buffer.concat([Buffer.from("%PDF-1.4\n"), Buffer.alloc(200, 0x20), Buffer.from("\n%%EOF\n")]);
export const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(100)]);
export const JPG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(100)]);
export const EXE = Buffer.concat([Buffer.from("MZ"), Buffer.alloc(100)]);

/** A complete, valid draft. */
export const FULL_DRAFT = {
  currentLocation: "Raleigh, NC",
  relocation: true,
  relocationNote: "Anywhere on the East Coast",
  visaStatus: "H1B",
  contactNumber: "+1 (919) 555-0142",
  email: "manas@example.com",
  skypeId: null,
  linkedinUrl: "https://www.linkedin.com/in/manas-demo",
  usExperienceYears: 3,
  relevantExperienceYears: 5.5,
  passportNumber: "Z1234567",
  ssnLast4: "4321",
  dateOfBirth: "1995-04-12",
  usEntryVisaType: "F1",
  usEntryYear: 2018,
  bachelorsDegree: "B.Tech Computer Science",
  bachelorsUniversity: "JNTU Hyderabad",
  bachelorsYear: 2017,
  availability: "Immediately",
  bestTimeForCalls: "Weekdays 10am–2pm ET",
  preferredInterviewLocation: "Raleigh, NC",
  references: [
    { position: 1, name: "Rahul", role: "Tech Lead", location: "Charlotte, NC", email: "rahul@example.com", phone: "+1 704 555 0119" },
    { position: 2, name: "Joya", role: "Manager", location: "Durham, NC", email: "joya@example.com", phone: "919-555-0177" },
  ],
};
