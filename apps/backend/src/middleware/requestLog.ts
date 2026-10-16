import type { NextFunction, Request, Response } from "express";
import { log } from "../lib/logger.js";

/** Method, path (no query string: signed URLs carry their signature there), status, time. Never bodies. */
export function requestLog(req: Request, res: Response, next: NextFunction) {
  const start = process.hrtime.bigint();
  res.on("finish", () => {
    log.info("request", {
      method: req.method,
      path: req.baseUrl + (req.route?.path ?? req.path),
      status: res.statusCode,
      ms: Number((process.hrtime.bigint() - start) / 1_000_000n),
    });
  });
  next();
}
