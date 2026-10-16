import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { ZodError } from "zod";
import { HttpError } from "../lib/errors.js";
import { log } from "../lib/logger.js";

/** Field errors keyed by path, e.g. { "references.0.email": "Invalid email" }. */
export function zodFields(error: ZodError) {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "body";
    // Unknown keys are reported by name only; zod's messages never echo values.
    fields[key] ??= issue.message;
  }
  return fields;
}

export function errorHandler(maxUploadMb: number) {
  return (err: unknown, req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof HttpError) {
      res.status(err.status).json({ error: err.message, ...err.details });
      return;
    }
    if (err instanceof ZodError) {
      res.status(400).json({ error: "Some details aren't in the right format.", fields: zodFields(err) });
      return;
    }
    if (err instanceof multer.MulterError) {
      const tooBig = err.code === "LIMIT_FILE_SIZE";
      res.status(tooBig ? 413 : 400).json({ error: tooBig ? `Files can be up to ${maxUploadMb} MB.` : "Send one file in the \"file\" field." });
      return;
    }
    // express.json() parse errors and body-size limits.
    const status = (err as { status?: number; type?: string })?.status;
    if (status && status >= 400 && status < 500) {
      res.status(status).json({ error: status === 413 ? "Request is too large." : "Bad request." });
      return;
    }
    // Name and code only: database errors can include the values they were given.
    const e = err as { name?: string; code?: string };
    log.error("unhandled error", { name: e?.name ?? typeof err, code: e?.code, method: req.method, path: req.route?.path ?? "unmatched" });
    res.status(500).json({ error: "Something went wrong on our side. Try again in a minute." });
  };
}
