import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import nodemailer from "nodemailer";
import { log } from "./logger.js";

// Outgoing email behind one small interface, so the provider can be swapped by
// configuration alone (MAIL_PROVIDER):
//
//   log     nothing leaves the server; each send succeeds (default for local work)
//   outbox  writes each email as a .eml file to MAIL_OUTBOX_DIR, to open and check
//   smtp    any SMTP server: Amazon SES, Google Workspace SMTP relay, Mailgun, ...
//   gmail   a Gmail / Google Workspace mailbox over OAuth2 (refresh token)
//
// Credentials come from the environment only. Nothing here logs addresses,
// subjects or bodies.

export type MailAttachment = { filename: string; content: Buffer; contentType: string };
export type Mail = { to: string; subject: string; text: string; attachments?: MailAttachment[] };
export type Mailer = { provider: string; send(mail: Mail): Promise<{ messageId: string }> };

export type MailConfig = {
  provider: "log" | "outbox" | "smtp" | "gmail";
  from: string;
  outboxDir?: string;
  smtp?: { host: string; port: number; secure: boolean; user?: string; pass?: string };
  gmail?: { user: string; clientId: string; clientSecret: string; refreshToken: string };
};

export function createMailer(config: MailConfig): Mailer {
  if (config.provider === "log") {
    return {
      provider: "log",
      async send(mail) {
        log.info("email not sent (MAIL_PROVIDER=log)", { attachments: mail.attachments?.length ?? 0 });
        return { messageId: `log-${randomBytes(8).toString("hex")}` };
      },
    };
  }

  if (config.provider === "outbox") {
    const dir = path.resolve(config.outboxDir ?? "./storage/outbox");
    const transport = nodemailer.createTransport({ streamTransport: true, buffer: true, newline: "unix" });
    return {
      provider: "outbox",
      async send(mail) {
        const info = await transport.sendMail({ from: config.from, ...mail });
        await mkdir(dir, { recursive: true, mode: 0o700 });
        const name = `${new Date().toISOString().replace(/[:.]/g, "-")}-${randomBytes(4).toString("hex")}.eml`;
        await writeFile(path.join(dir, name), info.message as Buffer, { mode: 0o600 });
        return { messageId: info.messageId };
      },
    };
  }

  const transport =
    config.provider === "gmail" && config.gmail
      ? nodemailer.createTransport({
          service: "gmail",
          auth: { type: "OAuth2", ...config.gmail },
        })
      : nodemailer.createTransport({
          host: config.smtp?.host,
          port: config.smtp?.port,
          secure: config.smtp?.secure,
          auth: config.smtp?.user ? { user: config.smtp.user, pass: config.smtp.pass } : undefined,
        });

  return {
    provider: config.provider,
    async send(mail) {
      const info = await transport.sendMail({ from: config.from, ...mail });
      return { messageId: info.messageId };
    },
  };
}

/** A short reason that is safe to store and show: error name and SMTP code, never the message. */
export function safeMailError(e: unknown) {
  const err = e as { name?: string; code?: string; responseCode?: number };
  return [err?.name ?? "Error", err?.code, err?.responseCode].filter(Boolean).join(":").slice(0, 120);
}
