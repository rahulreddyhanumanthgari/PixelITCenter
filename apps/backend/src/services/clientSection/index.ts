import { Prisma } from "../../generated/prisma/client.js";
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
  const payments = createPaymentsService(ctx, invoices);
  const reports = createReportsService(ctx);

  return {
    ctx,
    clients,
    placements,
    timesheets,
    invoices,
    payments,
    reports,

    /** Admin only: the billing audit trail, newest first. Reading it is logged too. */
    async auditLog(actor: Actor, { entityType, entityId, limit = 100 }: { entityType?: string; entityId?: string; limit?: number }) {
      const rows = await ctx.db.auditLog.findMany({
        where: { ...(entityType ? { entityType } : {}), ...(entityId ? { entityId } : {}) },
        orderBy: { createdAt: "desc" },
        take: limit,
      });
      await ctx.audit(actor, { action: "audit.view", entityType: "audit", detail: { entityType: entityType ?? null, entityId: entityId ?? null } });
      return rows.map((r) => ({
        id: r.id,
        at: r.createdAt.toISOString(),
        by: r.actorEmail ?? r.actorUserId,
        role: r.actorRole,
        action: r.action,
        entityType: r.entityType,
        entityId: r.entityId,
        detail: r.detail,
      }));
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
