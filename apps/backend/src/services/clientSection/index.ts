import { Prisma } from "../../generated/prisma/client.js";
import { addDays, day } from "../../lib/dates.js";
import type { AuditFilters } from "../../validation/billing.js";
import { notFound } from "../../lib/errors.js";
import type { Actor } from "../../lib/roles.js";
import { createClientsService } from "./clients.js";
import { createContext, type ClientSectionDeps } from "./context.js";
import { createDelivery } from "./email.js";
import { createInvoicesService } from "./invoices.js";
import { createPaymentsService } from "./payments.js";
import { createPlacementsService } from "./placements.js";
import { createReportsService } from "./reports.js";
import { createTimesheetsService } from "./timesheets.js";

// The client section (admin only): clients, placements, timesheets, invoices,
// payments and reports, wired together once per app (and by the seed script).

export function createClientSection(deps: ClientSectionDeps) {
  const ctx = createContext(deps);
  const deliver = createDelivery(ctx);
  const clients = createClientsService(ctx);
  const placements = createPlacementsService(ctx);
  const invoices = createInvoicesService(ctx, deliver);
  const timesheets = createTimesheetsService(ctx, deliver, invoices, placements);
  const payments = createPaymentsService(ctx, invoices, deliver);
  const reports = createReportsService(ctx);

  return {
    ctx,
    clients,
    placements,
    timesheets,
    invoices,
    payments,
    reports,

    /** Admin only: the audit trail, filtered, sorted and paged on the server. Reading it is logged too. */
    async auditLog(actor: Actor, f: AuditFilters) {
      const where = auditWhere(f);
      const [total, rows] = await Promise.all([
        ctx.db.auditLog.count({ where }),
        ctx.db.auditLog.findMany({
          where,
          orderBy: [{ createdAt: f.order === "oldest" ? "asc" : "desc" }, { id: "asc" }],
          skip: (f.page - 1) * f.pageSize,
          take: f.pageSize,
        }),
      ]);
      await ctx.audit(actor, { action: "audit.view", entityType: "audit", detail: { entityType: f.entityType ?? null, page: f.page } });
      return { total, page: f.page, pageSize: f.pageSize, entries: rows.map((r) => ({
        id: r.id,
        at: r.createdAt.toISOString(),
        by: r.actorEmail ?? r.actorUserId,
        role: r.actorRole,
        action: r.action,
        entityType: r.entityType,
        entityId: r.entityId,
        detail: r.detail,
      })) };
    },

    /** Admin only: how much happened in each area (all time and the last 30 days), and who did things. */
    async auditSummary(actor: Actor) {
      const since = day(addDays(ctx.today(), -30));
      const changes = { NOT: VIEW_ACTIONS };
      const [all, recent, people] = await Promise.all([
        ctx.db.auditLog.groupBy({ by: ["entityType"], where: changes, _count: { _all: true } }),
        ctx.db.auditLog.groupBy({ by: ["entityType"], where: { ...changes, createdAt: { gte: since } }, _count: { _all: true } }),
        ctx.db.auditLog.findMany({ where: { actorEmail: { not: null } }, distinct: ["actorEmail"], select: { actorEmail: true }, orderBy: { actorEmail: "asc" }, take: 200 }),
      ]);
      const counts = (groups: { entityType: string; _count: { _all: number } }[]) => Object.fromEntries(groups.map((g) => [g.entityType, g._count._all]));
      await ctx.audit(actor, { action: "audit.view", entityType: "audit", detail: { summary: true } });
      return { changes: counts(all), last30Days: counts(recent), people: people.map((p) => p.actorEmail!) };
    },

    /** For GET /api/files/:id once the signature has been checked. */
    async readFile(id: string) {
      const file = await ctx.db.storedFile.findUnique({ where: { id } });
      if (!file) throw notFound("File not found.");
      return { doc: file, data: await ctx.store.read(file.storageKey) };
    },

    /** Runs a job at most once per key (e.g. "monthly-invoices:2026-11"), across restarts and instances. */
    async onceFor<T extends Prisma.InputJsonValue>(key: string, work: () => Promise<T>): Promise<T | null> {
      try {
        await ctx.db.jobRun.create({ data: { key } });
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return null;
        throw e;
      }
      const summary = await work();
      await ctx.db.jobRun.update({ where: { key }, data: { finishedAt: ctx.now(), summary } });
      return summary;
    },
  };
}

export type ClientSection = ReturnType<typeof createClientSection>;

/** Page views and lists: hidden when only changes are wanted. */
const VIEW_ACTIONS: Prisma.AuditLogWhereInput[] = [
  { action: { endsWith: ".view" } },
  { action: { endsWith: ".list" } },
  { action: { endsWith: ".pdf" } },
  { action: { in: ["report.overview", "report.billing_summary"] } },
];

function auditWhere(f: AuditFilters): Prisma.AuditLogWhereInput {
  return {
    ...(f.entityType ? { entityType: f.entityType } : {}),
    ...(f.entityId ? { entityId: f.entityId } : {}),
    ...(f.actor ? { actorEmail: { contains: f.actor, mode: "insensitive" } } : {}),
    ...(f.action ? (f.action.endsWith(".") ? { action: { startsWith: f.action } } : { action: f.action }) : {}),
    ...(f.from || f.to
      ? { createdAt: { ...(f.from ? { gte: day(f.from) } : {}), ...(f.to ? { lt: day(addDays(f.to, 1)) } : {}) } }
      : {}),
    ...(f.changesOnly ? { NOT: VIEW_ACTIONS } : {}),
  };
}
