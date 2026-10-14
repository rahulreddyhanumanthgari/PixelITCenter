import cors from "cors";
import express from "express";
import helmet from "helmet";
import type { Env } from "./config/env.js";
import { createFieldCipher } from "./lib/crypto.js";
import { HttpError } from "./lib/errors.js";
import type { Db } from "./lib/prisma.js";
import { createFileSigner, createLocalStore, type FileStore } from "./lib/storage.js";
import { skipScan, type VirusScanner } from "./lib/virusScan.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { apiLimiter } from "./middleware/rateLimit.js";
import { requestLog } from "./middleware/requestLog.js";
import { apiRoutes } from "./routes/index.js";
import { createProfileService } from "./services/profileService.js";
import { createClientSection } from "./services/clientSection/index.js";
import { createMailer, type Mailer } from "./lib/mailer.js";
import type { FileReader } from "./controllers/files.js";

type Overrides = { store?: FileStore; scan?: VirusScanner; mailer?: Mailer; now?: () => Date };

/** The services, shared by the HTTP app, the scheduled jobs and the seed script. */
export function createServices(env: Env, db: Db, overrides: Overrides = {}) {
  const cipher = createFieldCipher({ [env.PII_ENCRYPTION_KEY_ID]: env.piiKey }, env.PII_ENCRYPTION_KEY_ID);
  const signer = createFileSigner(env.FILE_URL_SECRET, env.FILE_URL_TTL_SECONDS);
  const store = overrides.store ?? createLocalStore(env.storageDir);
  const scan = overrides.scan ?? skipScan;
  const profile = createProfileService({ db, cipher, store, signer, scan });
  const clientSection = createClientSection({
    db,
    store,
    signer,
    scan,
    mailer: overrides.mailer ?? createMailer(env.mail),
    company: env.company,
    timeZone: env.JOBS_TIMEZONE,
    portalUrl: env.PORTAL_URL.replace(/\/$/, ""),
    mail: { maxAttempts: env.MAIL_MAX_ATTEMPTS, retryDelayMs: env.MAIL_RETRY_DELAY_MS },
    now: overrides.now,
  });
  /** Signed links can point at a profile document or a client-section file. */
  const readFile: FileReader = async (id) => {
    try {
      return await profile.readDocument(id);
    } catch (e) {
      if (e instanceof HttpError && e.status === 404) return clientSection.readFile(id);
      throw e;
    }
  };
  return { signer, profile, clientSection, readFile };
}

export function createApp(env: Env, db: Db, overrides: Overrides = {}, services = createServices(env, db, overrides)) {
  const { signer, profile: service, clientSection, readFile } = services;

  const app = express();
  app.disable("x-powered-by");
  if (env.TRUST_PROXY) app.set("trust proxy", 1);

  app.use(helmet());
  app.use(
    cors({
      origin: env.corsOrigins,
      methods: ["GET", "PUT", "POST", "PATCH", "DELETE"],
      allowedHeaders: ["Authorization", "Content-Type"],
      maxAge: 600,
    }),
  );
  app.use(requestLog);
  app.use(express.json({ limit: "64kb" }));

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.use(
    "/api",
    apiLimiter(),
    apiRoutes(service, clientSection, signer, readFile, {
      auth: { secret: env.JWT_SECRET, issuer: env.JWT_ISSUER, audience: env.JWT_AUDIENCE },
      maxUploadBytes: env.maxUploadBytes,
      devAuth: env.DEV_AUTH_ENABLED && !env.isProduction,
    }),
  );

  app.use((_req, _res, next) => next(new HttpError(404, "Not found.")));
  app.use(errorHandler(env.MAX_UPLOAD_MB));
  return app;
}
