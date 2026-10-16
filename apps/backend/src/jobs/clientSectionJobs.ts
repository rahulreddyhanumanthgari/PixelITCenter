import cron from "node-cron";
import { daysLeftInMonth, monthOf } from "../lib/dates.js";
import { log } from "../lib/logger.js";
import { SYSTEM_ACTOR } from "../lib/roles.js";
import type { ClientSection } from "../services/clientSection/index.js";

// Scheduled jobs for the client section, run inside the API process with
// node-cron (free; no extra service). Each run is claimed in JobRun by job and
// period first, so a restart or a second instance never sends twice.
//
//   monthly invoices   1st of the month, 09:00 (MONTHLY_INVOICE_CRON): emails every
//                      unsent invoice, with its approved timesheet PDF, to each
//                      client that has auto-send on. Failures are retried and flagged.
//   timesheet reminders daily 09:00 (TIMESHEET_REMINDER_CRON), but only in the last
//                      REMINDER_DAYS_BEFORE_MONTH_END days of the month: emails and
//                      notifies placed consultants with no timesheet for this month.

export function createClientSectionJobs(section: ClientSection, { reminderDays }: { reminderDays: number }) {
  const { ctx } = section;

  return {
    /** Returns null if this month's run already happened. */
    async monthlyInvoices() {
      const month = monthOf(ctx.today());
      return section.onceFor(`monthly-invoices:${month}`, async () => {
        const clients = await ctx.db.client.findMany({ where: { autoSendInvoices: true, archivedAt: null }, select: { id: true } });
        let sent = 0;
        let failed = 0;
        for (const c of clients) {
          const r = await section.invoices.sendPendingForClient(SYSTEM_ACTOR, c.id, "MONTHLY_JOB");
          sent += r.sent;
          failed += r.failed;
        }
        log.info("monthly invoice job done", { month, clients: clients.length, sent, failed });
        return { month, clients: clients.length, sent, failed };
      });
    },

    /** Returns null outside the reminder window, or if today's run already happened. */
    async timesheetReminders() {
      const today = ctx.today();
      if (daysLeftInMonth(today) > reminderDays) return null;
      return section.onceFor(`timesheet-reminders:${today}`, async () => {
        const r = await section.timesheets.sendReminders(SYSTEM_ACTOR, monthOf(today), "REMINDER_JOB");
        log.info("timesheet reminder job done", { month: r.month, reminded: r.reminded });
        return r;
      });
    },
  };
}

export type ClientSectionJobs = ReturnType<typeof createClientSectionJobs>;

export function scheduleClientSectionJobs(jobs: ClientSectionJobs, cfg: { timezone: string; monthlyCron: string; reminderCron: string }) {
  for (const expr of [cfg.monthlyCron, cfg.reminderCron]) {
    if (!cron.validate(expr)) throw new Error(`Invalid cron expression: ${expr}`);
  }
  const run = (name: string, fn: () => Promise<unknown>) => async () => {
    try {
      await fn();
    } catch (e) {
      log.error("scheduled job failed", { job: name, name: (e as Error)?.name });
    }
  };
  const tasks = [
    cron.schedule(cfg.monthlyCron, run("monthly-invoices", jobs.monthlyInvoices), { timezone: cfg.timezone, name: "monthly-invoices", noOverlap: true }),
    cron.schedule(cfg.reminderCron, run("timesheet-reminders", jobs.timesheetReminders), { timezone: cfg.timezone, name: "timesheet-reminders", noOverlap: true }),
  ];
  log.info("client section jobs scheduled", { timezone: cfg.timezone, monthly: cfg.monthlyCron, reminders: cfg.reminderCron });
  return () => tasks.forEach((t) => t.stop());
}
