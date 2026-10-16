import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { HttpError } from "../lib/errors.js";
import type { Actor, Role } from "../services/profileService.js";

// Bearer-token auth. Tokens are HS256 JWTs signed with JWT_SECRET carrying
// { sub, role, email }.
//
// TODO(auth): the portal plans AWS Cognito. When it lands, verify Cognito
// ID tokens here instead (RS256 against the user pool's JWKS) and map the
// user's group to `role`. Nothing else in the API changes.

declare module "express-serve-static-core" {
  interface Request {
    actor?: Actor;
  }
}

const claims = z.object({
  sub: z.string().min(1).max(128),
  role: z.enum(["student", "recruiter", "admin"]),
  email: z.email().optional(),
});

export type AuthOptions = { secret: string; issuer?: string; audience?: string };

export function requireAuth({ secret, issuer, audience }: AuthOptions) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const header = req.get("authorization") ?? "";
    const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
    if (!token) return next(new HttpError(401, "Sign in to continue."));
    try {
      const payload = jwt.verify(token, secret, {
        algorithms: ["HS256"],
        ...(issuer ? { issuer } : {}),
        ...(audience ? { audience } : {}),
      });
      const c = claims.parse(payload);
      req.actor = { userId: c.sub, role: c.role, email: c.email, ip: req.ip, userAgent: req.get("user-agent") };
      next();
    } catch {
      next(new HttpError(401, "Your session has expired. Sign in again."));
    }
  };
}

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.actor) return next(new HttpError(401, "Sign in to continue."));
    if (!roles.includes(req.actor.role)) return next(new HttpError(403, "You don't have access to this."));
    next();
  };
}

/** The signed-in actor; only call after requireAuth. */
export function actorOf(req: Request): Actor {
  if (!req.actor) throw new HttpError(401, "Sign in to continue.");
  return req.actor;
}
