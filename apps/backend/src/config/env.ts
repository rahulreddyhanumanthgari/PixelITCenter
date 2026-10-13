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
  })
  .refine((e) => !(e.NODE_ENV === "production" && e.DEV_AUTH_ENABLED), {
    message: "DEV_AUTH_ENABLED must be off in production",
    path: ["DEV_AUTH_ENABLED"],
  });

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
  };
}
