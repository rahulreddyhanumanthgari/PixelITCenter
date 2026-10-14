import type { Client, Prisma } from "../../generated/prisma/client.js";
import { conflict, notFound } from "../../lib/errors.js";
import type { Actor } from "../../lib/roles.js";
import type { ClientInput } from "../../validation/billing.js";
import type { Ctx } from "./context.js";

// Client and vendor records. Admins create and change them; accounts read them
// (invoices need the billing email and terms). Nothing here creates a login:
// clients never sign in to the portal.

type WithCounts = Client & { _count?: { placements: number; invoices: number } };

const counts = {
  _count: {
    select: {
      placements: { where: { extensionStatus: { not: "ENDED" } } },
      invoices: { where: { sentAt: null } },
    },
  },
} satisfies Prisma.ClientInclude;

export const clientView = (c: WithCounts) => ({
  id: c.id,
  name: c.name,
  type: c.type,
  endClientName: c.endClientName,
  contactPerson: c.contactPerson,
  billingEmail: c.billingEmail,
  vmsPortalName: c.vmsPortalName,
  vmsPortalUrl: c.vmsPortalUrl,
  paymentTermsDays: c.paymentTermsDays,
  notes: c.notes,
  autoSendInvoices: c.autoSendInvoices,
  archived: c.archivedAt !== null,
  activePlacements: c._count?.placements ?? 0,
  unsentInvoices: c._count?.invoices ?? 0,
  createdAt: c.createdAt.toISOString(),
  updatedAt: c.updatedAt.toISOString(),
});

export function createClientsService(ctx: Ctx) {
  const { db, audit } = ctx;

  async function load(id: string) {
    const c = await db.client.findUnique({ where: { id }, include: counts });
    if (!c) throw notFound("Client not found.");
    return c;
  }

  return {
    async list(actor: Actor, { q, archived }: { q?: string; archived?: "true" | "false" }) {
      const where: Prisma.ClientWhereInput = {
        archivedAt: archived === "true" ? { not: null } : null,
        ...(q
          ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { endClientName: { contains: q, mode: "insensitive" } }] }
          : {}),
      };
      const rows = await db.client.findMany({ where, include: counts, orderBy: { name: "asc" } });
      await audit(actor, { action: "client.list", entityType: "client", detail: { count: rows.length } });
      return rows.map(clientView);
    },

    async get(actor: Actor, id: string) {
      const c = await load(id);
      await audit(actor, { action: "client.view", entityType: "client", entityId: id });
      return clientView(c);
    },

    async create(actor: Actor, input: ClientInput & { name: string; type: "CLIENT" | "VENDOR"; billingEmail: string }) {
      const c = await db.$transaction(async (tx) => {
        const created = await tx.client.create({ data: input, include: counts });
        await audit(actor, { action: "client.create", entityType: "client", entityId: created.id }, tx);
        return created;
      });
      return clientView(c);
    },

    async update(actor: Actor, id: string, input: ClientInput) {
      await load(id);
      const c = await db.$transaction(async (tx) => {
        const updated = await tx.client.update({ where: { id }, data: input, include: counts });
        await audit(actor, { action: "client.update", entityType: "client", entityId: id, detail: { fields: Object.keys(input) } }, tx);
        return updated;
      });
      return clientView(c);
    },

    /** Clients are archived, never deleted: invoices and placements point at them. */
    async archive(actor: Actor, id: string) {
      const c = await load(id);
      if (c.archivedAt) throw conflict("This client is already archived.");
      if (c._count.placements > 0) throw conflict("End this client's active placements before archiving it.");
      await db.$transaction(async (tx) => {
        await tx.client.update({ where: { id }, data: { archivedAt: ctx.now(), autoSendInvoices: false } });
        await audit(actor, { action: "client.archive", entityType: "client", entityId: id }, tx);
      });
    },
  };
}

export type ClientsService = ReturnType<typeof createClientsService>;
