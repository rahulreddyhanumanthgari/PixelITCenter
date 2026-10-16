import { rateLimit } from "express-rate-limit";

const limiter = (limit: number, minutes: number) =>
  rateLimit({
    windowMs: minutes * 60_000,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: "Too many requests. Wait a few minutes and try again." },
  });

/** Every /api request, per IP. */
export const apiLimiter = () => limiter(300, 15);
/** Uploads are heavier: fewer per window. */
export const uploadLimiter = () => limiter(30, 15);
/** Anything that sends email (invoices, reminders): a slip of the finger can't spam a client. */
export const sendLimiter = () => limiter(30, 15);
/** Dev sign-in tokens. */
export const tokenLimiter = () => limiter(30, 15);
