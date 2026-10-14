import path from "node:path";
import { z } from "zod";

// Every setting the API reads, checked once at start-up. A bad or missing
// value stops the server with the variable's name (never its value).

const base64Key = z
  .string()
  .refine((v) => Buffer.from(v, "base64").length === 32, "must be 32 bytes, base64-encoded (openssl rand -base64 32)");

const bool = z
  .enum(["true", "false", "1", "0", ""])
  .default("false")
  .transform((v) => v === "true" || v === "1");

/** Empty means unset. */
const optionalText = z.preprocess((v) => (v === "" ? undefined : v), z.string().optional());

function isTimeZone(tz: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

const schema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().positive().default(4000),
    DATABASE_URL: z.string().min(1),
    DATABASE_POOL_MAX: z.preprocess((v) => (v === "" ? undefined : v), z.coerce.number().int().positive().optional()),

    JWT_SECRET: z.string().min(32, "must be at least 32 characters"),
    JWT_ISSUER: z.string().optional(),
    JWT_AUDIENCE: z.string().optional(),

    PII_ENCRYPTION_KEY: base64Key,
    PII_ENCRYPTION_KEY_ID: z.string().regex(/^[a-z0-9]{1,16}$/).default("k1"),

    STORAGE_DIR: z.string().default("./storage/uploads"),
    FILE_URL_SECRET: z.string().min(32, "must be at least 32 characters"),
    FILE_URL_TTL_SECONDS: z.coerce.number().int().min(30).max(3600).default(300),
    MAX_UPLOAD_MB: z.coerce.number().positive().max(25).default(5),

    CORS_ORIGINS: z.string().default("http://localhost:3000"),
    TRUST_PROXY: bool,
    DEV_AUTH_ENABLED: bool,

    // Email (src/lib/mailer.ts)
    MAIL_PROVIDER: z.enum(["log", "outbox", "smtp", "gmail"]).default("log"),
    MAIL_FROM: z.string().default("Pixel IT Center Accounts <accounts@pixelitcenter.com>"),
    MAIL_OUTBOX_DIR: z.string().default("./storage/outbox"),
    MAIL_MAX_ATTEMPTS: z.coerce.number().int().min(1).max(10).default(3),
    MAIL_RETRY_DELAY_MS: z.coerce.number().int().min(0).max(60_000).default(2000),
    SMTP_HOST: optionalText,
    SMTP_PORT: z.coerce.number().int().positive().default(587),
    SMTP_SECURE: bool,
    SMTP_USER: optionalText,
    SMTP_PASS: optionalText,
    GMAIL_USER: optionalText,
    GMAIL_CLIENT_ID: optionalText,
    GMAIL_CLIENT_SECRET: optionalText,
    GMAIL_REFRESH_TOKEN: optionalText,

    // Scheduled jobs (src/jobs)
    JOBS_ENABLED: bool,
    JOBS_TIMEZONE: z.string().default("America/New_York"),
    MONTHLY_INVOICE_CRON: z.string().default("0 9 1 * *"),
    TIMESHEET_REMINDER_CRON: z.string().default("0 9 * * *"),
    REMINDER_DAYS_BEFORE_MONTH_END: z.coerce.number().int().min(0).max(15).default(3),

    // On every invoice, and in emails.
    COMPANY_NAME: z.string().default("Pixel IT Center"),
    COMPANY_ADDRESS: z.string().default("189 Tarleton Dr, Fuquay Varina, NC 27526"),
    COMPANY_PHONE: z.string().default("+1 (336) 944-6562"),
    COMPANY_EMAIL: z.string().default("accounts@pixelitcenter.com"),
    COMPANY_REMIT_TO: optionalText,
    PORTAL_URL: z.string().default("http://localhost:3000"),
  })
  .refine((e) => !(e.NODE_ENV === "production" && e.DEV_AUTH_ENABLED), {
    message: "DEV_AUTH_ENABLED must be off in production",
    path: ["DEV_AUTH_ENABLED"],
  })
  .refine((e) => e.MAIL_PROVIDER !== "smtp" || e.SMTP_HOST, { message: "required when MAIL_PROVIDER=smtp", path: ["SMTP_HOST"] })
  .refine((e) => e.MAIL_PROVIDER !== "gmail" || (e.GMAIL_USER && e.GMAIL_CLIENT_ID && e.GMAIL_CLIENT_SECRET && e.GMAIL_REFRESH_TOKEN), {
    message: "GMAIL_USER, GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET and GMAIL_REFRESH_TOKEN are required when MAIL_PROVIDER=gmail",
    path: ["MAIL_PROVIDER"],
  })
  .refine((e) => isTimeZone(e.JOBS_TIMEZONE), { message: "not a time zone, e.g. America/New_York", path: ["JOBS_TIMEZONE"] });

export type Env = ReturnType<typeof loadEnv>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env) {
  const parsed = schema.safeParse(source);
  if (!parsed.success) {
    const problems = parsed.error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Invalid environment:\n${problems}`);
  }
  const e = parsed.data;
  return {
    ...e,
    isProduction: e.NODE_ENV === "production",
    storageDir: path.resolve(e.STORAGE_DIR),
    corsOrigins: e.CORS_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean),
    maxUploadBytes: Math.floor(e.MAX_UPLOAD_MB * 1024 * 1024),
    piiKey: Buffer.from(e.PII_ENCRYPTION_KEY, "base64"),
    mail: {
      provider: e.MAIL_PROVIDER,
      from: e.MAIL_FROM,
      outboxDir: e.MAIL_OUTBOX_DIR,
      smtp: e.SMTP_HOST ? { host: e.SMTP_HOST, port: e.SMTP_PORT, secure: e.SMTP_SECURE, user: e.SMTP_USER, pass: e.SMTP_PASS } : undefined,
      gmail:
        e.GMAIL_USER && e.GMAIL_CLIENT_ID && e.GMAIL_CLIENT_SECRET && e.GMAIL_REFRESH_TOKEN
          ? { user: e.GMAIL_USER, clientId: e.GMAIL_CLIENT_ID, clientSecret: e.GMAIL_CLIENT_SECRET, refreshToken: e.GMAIL_REFRESH_TOKEN }
          : undefined,
    },
    company: { name: e.COMPANY_NAME, address: e.COMPANY_ADDRESS, phone: e.COMPANY_PHONE, email: e.COMPANY_EMAIL, remitTo: e.COMPANY_REMIT_TO },
  };
}
