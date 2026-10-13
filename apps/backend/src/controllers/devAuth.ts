import { createHash } from "node:crypto";
import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";

// DEV ONLY. The portal's sign-in is still a front-end demo, so there is no
// real identity provider to issue tokens. When DEV_AUTH_ENABLED=true this
// hands out a short-lived token for any email, so the Profile page can talk
// to the API locally. It is never mounted in production (env.ts refuses to
// start with it on). Replace with Cognito: see middleware/auth.ts.

const body = z
  .object({
    email: z.email(),
    role: z.enum(["student", "recruiter", "admin"]).default("student"),
  })
  .strict();

/** Same email → same user id, so a returning demo user finds their draft. */
export const devUserId = (email: string) => `dev-${createHash("sha256").update(email.toLowerCase()).digest("hex").slice(0, 24)}`;

export function devAuthController(secret: string, opts: { issuer?: string; audience?: string }) {
  return {
    token: (req: Request, res: Response) => {
      const { email, role } = body.parse(req.body);
      const userId = devUserId(email);
      const token = jwt.sign({ role, email: email.toLowerCase() }, secret, {
        algorithm: "HS256",
        subject: userId,
        expiresIn: "8h",
        ...(opts.issuer ? { issuer: opts.issuer } : {}),
        ...(opts.audience ? { audience: opts.audience } : {}),
      });
      res.json({ token, userId, role, expiresIn: 8 * 3600 });
    },
  };
}
