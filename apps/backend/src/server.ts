import "dotenv/config";
import { createApp, createServices } from "./app.js";
import { loadEnv } from "./config/env.js";
import { createClientSectionJobs, scheduleClientSectionJobs } from "./jobs/clientSectionJobs.js";
import { log } from "./lib/logger.js";
import { createDb } from "./lib/prisma.js";

const env = loadEnv();
const db = createDb(env.DATABASE_URL, env.DATABASE_POOL_MAX);
const services = createServices(env, db);
const server = createApp(env, db, {}, services).listen(env.PORT, () => {
  log.info("portal api listening", { port: env.PORT, env: env.NODE_ENV, devAuth: env.DEV_AUTH_ENABLED, mail: env.MAIL_PROVIDER });
});

if (env.isProduction && (env.MAIL_PROVIDER === "log" || env.MAIL_PROVIDER === "outbox")) {
  log.warn("MAIL_PROVIDER does not send real email in production; invoices and reminders stay in the log", { mail: env.MAIL_PROVIDER });
}

// Monthly invoices and timesheet reminders. Turn on in ONE place (JOBS_ENABLED=true);
// a second instance with it on is harmless (runs are claimed in JobRun) but pointless.
const stopJobs = env.JOBS_ENABLED
  ? scheduleClientSectionJobs(createClientSectionJobs(services.clientSection, { reminderDays: env.REMINDER_DAYS_BEFORE_MONTH_END }), {
      timezone: env.JOBS_TIMEZONE,
      monthlyCron: env.MONTHLY_INVOICE_CRON,
      reminderCron: env.TIMESHEET_REMINDER_CRON,
    })
  : () => undefined;

async function shutdown() {
  stopJobs();
  server.close();
  await db.$disconnect();
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
