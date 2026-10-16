import type { Prisma } from "../generated/prisma/client.js";
import type { Db } from "../lib/prisma.js";
import type { Actor } from "../lib/roles.js";

// The billing audit log: every view and change of client-section data, with who,
// what, which record and when. `detail` holds small, non-sensitive context only
// (status moves, filters, an override reason): never bank details or file contents.

export type AuditEntry = {
  action: string;
  entityType: "client" | "placement" | "timesheet" | "invoice" | "payment" | "report" | "email" | "audit";
  entityId?: string | null;
  detail?: Prisma.InputJsonValue;
};

type Writer = Pick<Db, "auditLog"> | Prisma.TransactionClient;

export function createAudit(db: Db, now: () => Date = () => new Date()) {
  return (actor: Actor, entry: AuditEntry, client: Writer = db) =>
    client.auditLog.create({
      data: {
        actorUserId: actor.userId,
        actorRole: actor.role,
        actorEmail: actor.email ?? null,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId ?? null,
        detail: entry.detail,
        ipAddress: actor.ip ?? null,
        createdAt: now(),
      },
    });
}

export type Audit = ReturnType<typeof createAudit>;
