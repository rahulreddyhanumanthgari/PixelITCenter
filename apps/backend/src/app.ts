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

export function createApp(env: Env, db: Db, overrides: { store?: FileStore; scan?: VirusScanner } = {}) {
  const cipher = createFieldCipher({ [env.PII_ENCRYPTION_KEY_ID]: env.piiKey }, env.PII_ENCRYPTION_KEY_ID);
  const signer = createFileSigner(env.FILE_URL_SECRET, env.FILE_URL_TTL_SECONDS);
  const store = overrides.store ?? createLocalStore(env.storageDir);
  const service = createProfileService({ db, cipher, store, signer, scan: overrides.scan ?? skipScan });

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
    apiRoutes(service, signer, {
      auth: { secret: env.JWT_SECRET, issuer: env.JWT_ISSUER, audience: env.JWT_AUDIENCE },
      maxUploadBytes: env.maxUploadBytes,
      devAuth: env.DEV_AUTH_ENABLED && !env.isProduction,
    }),
  );

  app.use((_req, _res, next) => next(new HttpError(404, "Not found.")));
  app.use(errorHandler(env.MAX_UPLOAD_MB));
  return app;
}
