import type { Prisma } from "../../generated/prisma/client.js";
import { day, isoDay, monthEnd, monthStart } from "../../lib/dates.js";
import { conflict, HttpError, notFound } from "../../lib/errors.js";
import { num } from "../../lib/money.js";
import { canSeeMoney, type Actor } from "../../lib/roles.js";
import type { PlacementInput } from "../../validation/billing.js";
import type { Ctx } from "./context.js";

// Placements: who is placed where, at what rates, until when. Admins write them.
// Bill and pay rates are financial data: only admin and accounts get them; the
// recruiter and verifier views leave them out (not masked, absent).

const include = { client: true } satisfies Prisma.PlacementInclude;
type Full = Prisma.PlacementGetPayload<{ include: typeof include }>;

export function placementView(p: Full, withMoney: boolean) {
  return {
    id: p.id,
    client: { id: p.client.id, name: p.client.name, type: p.client.type },
    endClientName: p.endClientName ?? p.client.endClientName,
    consultantName: p.consultantName,
    consultantEmail: p.consultantEmail,
    consultantLinked: p.consultantUserId !== null,
    role: p.role,
    startDate: isoDay(p.startDate),
    endDate: p.endDate ? isoDay(p.endDate) : null,
    extensionStatus: p.extensionStatus,
    ...(withMoney ? { billRate: num(p.billRate), payRate: num(p.payRate), marginPerHour: num(p.billRate.sub(p.payRate)) } : {}),
  };
}

/** Placements that cover any day of `month` (and haven't been marked ended before it). */
export const activeIn = (month: string): Prisma.PlacementWhereInput => ({
  startDate: { lte: day(monthEnd(month)) },
  OR: [{ endDate: null }, { endDate: { gte: day(monthStart(month)) } }],
});

export function createPlacementsService(ctx: Ctx) {
  const { db, audit } = ctx;

  async function load(id: string) {
    const p = await db.placement.findUnique({ where: { id }, include });
    if (!p) throw notFound("Placement not found.");
    return p;
  }

  async function usableClient(clientId: string) {
    const c = await db.client.findUnique({ where: { id: clientId }, select: { archivedAt: true } });
    if (!c) throw new HttpError(400, "Pick a client.", { fields: { clientId: "Client not found." } });
    if (c.archivedAt) throw conflict("That client is archived.");
  }

  /**
   * The signed-in consultant's placements. One created before they first signed in
   * is matched on their email and linked to their user id here.
   */
  async function forConsultant(actor: Actor) {
    if (actor.email) {
      await db.placement.updateMany({ where: { consultantUserId: null, consultantEmail: actor.email.toLowerCase() }, data: { consultantUserId: actor.userId } });
    }
    return db.placement.findMany({ where: { consultantUserId: actor.userId }, include, orderBy: { startDate: "desc" } });
  }

  const toData = (input: PlacementInput) => {
    const { startDate, endDate, ...rest } = input;
    return {
      ...rest,
      ...(startDate !== undefined ? { startDate: day(startDate) } : {}),
      ...(endDate !== undefined ? { endDate: endDate === null ? null : day(endDate) } : {}),
    };
  };

  return {
    async list(actor: Actor, { clientId, status, q }: { clientId?: string; status?: Full["extensionStatus"]; q?: string }) {
      const money = canSeeMoney(actor.role);
      const rows = await db.placement.findMany({
        where: {
          ...(clientId ? { clientId } : {}),
          ...(status ? { extensionStatus: status } : {}),
          ...(q
            ? {
                OR: [
                  { consultantName: { contains: q, mode: "insensitive" } },
                  { role: { contains: q, mode: "insensitive" } },
                  { client: { name: { contains: q, mode: "insensitive" } } },
                ],
              }
            : {}),
        },
        include,
        orderBy: [{ startDate: "desc" }],
      });
      await audit(actor, { action: "placement.list", entityType: "placement", detail: { count: rows.length, rates: money } });
      return rows.map((p) => placementView(p, money));
    },

    async get(actor: Actor, id: string) {
      const p = await load(id);
      const money = canSeeMoney(actor.role);
      await audit(actor, { action: "placement.view", entityType: "placement", entityId: id, detail: { rates: money } });
      return placementView(p, money);
    },

    async create(actor: Actor, input: PlacementInput & { clientId: string }) {
      await usableClient(input.clientId);
      const p = await db.$transaction(async (tx) => {
        const created = await tx.placement.create({ data: toData(input) as Prisma.PlacementUncheckedCreateInput, include });
        await audit(actor, { action: "placement.create", entityType: "placement", entityId: created.id }, tx);
        return created;
      });
      return placementView(p, true);
    },

    /** Rate changes apply to invoices raised from now on; raised invoices keep their copy. */
    async update(actor: Actor, id: string, input: PlacementInput) {
      const before = await load(id);
      if (input.clientId && input.clientId !== before.clientId) await usableClient(input.clientId);
      const start = input.startDate ?? isoDay(before.startDate);
      const end = input.endDate === undefined ? (before.endDate ? isoDay(before.endDate) : null) : input.endDate;
      if (end && end < start) throw new HttpError(400, "Some details aren't in the right format.", { fields: { endDate: "The end date can't be before the start date." } });

      const p = await db.$transaction(async (tx) => {
        const updated = await tx.placement.update({ where: { id }, data: toData(input), include });
        const ratesChanged = input.billRate !== undefined || input.payRate !== undefined;
        await audit(actor, { action: "placement.update", entityType: "placement", entityId: id, detail: { fields: Object.keys(input), ratesChanged } }, tx);
        return updated;
      });
      return placementView(p, true);
    },

    forConsultant,

    /** What the consultant sees: their client and their own hourly rate. Never the bill rate. */
    async studentView(actor: Actor) {
      const all = await forConsultant(actor);
      const current = all.find((p) => p.extensionStatus !== "ENDED") ?? all[0];
      if (!current) throw notFound("You don't have a placement yet.");
      return {
        id: current.id,
        client: current.endClientName ?? current.client.endClientName ?? current.client.name,
        role: current.role,
        hourlyRate: num(current.payRate),
        startDate: isoDay(current.startDate),
        endDate: current.endDate ? isoDay(current.endDate) : null,
        status: current.extensionStatus,
      };
    },
  };
}

export type PlacementsService = ReturnType<typeof createPlacementsService>;
