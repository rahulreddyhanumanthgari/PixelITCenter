import type { FieldCipher } from "../lib/crypto.js";
import { conflict, HttpError, notFound } from "../lib/errors.js";
import type { Db } from "../lib/prisma.js";
import type { FileSigner, FileStore } from "../lib/storage.js";
import type { VirusScanner } from "../lib/virusScan.js";
import { checkFileType, cleanFileName } from "../lib/fileType.js";
import { createHash } from "node:crypto";
import { log } from "../lib/logger.js";
import { Prisma, type DocumentType, type ProfileStatus } from "../generated/prisma/client.js";
import {
  completion,
  NUMBER_FIELDS,
  REFERENCE_FIELDS,
  SENSITIVE_FIELDS,
  submitErrors,
  TEXT_FIELDS,
  YEAR_FIELDS,
  type DocumentTypeName,
  type DraftInput,
  type PlainProfile,
  type SensitiveField,
} from "../validation/profile.js";

// Placement Details: everything the routes do, in one place.
// Every function takes the acting user; a student only ever reaches the
// profile whose userId is their own token's subject.

export type { Actor, Role } from "../lib/roles.js";
import type { Actor } from "../lib/roles.js";

export type Deps = { db: Db; cipher: FieldCipher; store: FileStore; signer: FileSigner; scan: VirusScanner };

const EDITABLE: ProfileStatus[] = ["DRAFT", "NEEDS_UPDATE"];

const ENC_COLUMN = {
  passportNumber: "passportNumberEnc",
  ssnLast4: "ssnLast4Enc",
  dateOfBirth: "dateOfBirthEnc",
} as const satisfies Record<SensitiveField, string>;

const DOC_TYPE: Record<DocumentTypeName, DocumentType> = { resume: "RESUME", id: "ID", visa: "VISA" };
const DOC_NAME: Record<DocumentType, DocumentTypeName> = { RESUME: "resume", ID: "id", VISA: "visa" };

const include = {
  references: { orderBy: { position: "asc" } },
  documents: { orderBy: { uploadedAt: "asc" } },
  statusHistory: { orderBy: { createdAt: "desc" }, take: 20 },
} satisfies Prisma.StudentProfileInclude;

type FullProfile = Prisma.StudentProfileGetPayload<{ include: typeof include }>;

/** AAD for a sensitive value: binds the ciphertext to its owner and field. */
const context = (userId: string, field: SensitiveField) => `studentProfile:${userId}:${field}`;

export const LOCKED_MESSAGE = "Your details are with the recruiters now and can't be changed. They'll ask if anything needs updating.";

// --- masking ------------------------------------------------------------------

export function maskSensitive(field: SensitiveField, value: string) {
  if (field === "passportNumber") return "•".repeat(Math.max(value.length - 3, 3)) + value.slice(-3);
  if (field === "ssnLast4") return "••••";
  return "••••-••-••";
}

// --- service ------------------------------------------------------------------

export function createProfileService({ db, cipher, store, signer, scan }: Deps) {
  const decrypt = (p: FullProfile, field: SensitiveField) => {
    const stored = p[ENC_COLUMN[field]];
    return stored ? cipher.decrypt(stored, context(p.userId, field)) : null;
  };

  const plain = (p: FullProfile): PlainProfile => {
    const out: Partial<PlainProfile> = { relocation: p.relocation, references: p.references };
    for (const f of TEXT_FIELDS) out[f] = p[f];
    for (const f of [...NUMBER_FIELDS, ...YEAR_FIELDS]) out[f] = p[f];
    for (const f of SENSITIVE_FIELDS) out[f] = decrypt(p, f);
    return out as PlainProfile;
  };

  const docView = (d: FullProfile["documents"][number]) => ({
    id: d.id,
    type: DOC_NAME[d.type],
    fileName: d.originalName,
    mimeType: d.mimeType,
    sizeBytes: d.sizeBytes,
    uploadedAt: d.uploadedAt.toISOString(),
    scanStatus: d.scanStatus,
    ...signer.sign(d.id),
  });

  const fieldsOf = (p: FullProfile) => {
    const fields: Record<string, string | number | boolean | null> = { relocation: p.relocation };
    for (const f of TEXT_FIELDS) fields[f] = p[f];
    for (const f of [...NUMBER_FIELDS, ...YEAR_FIELDS]) fields[f] = p[f];
    return fields;
  };

  const referencesOf = (p: FullProfile) =>
    [1, 2].map((position) => {
      const r = p.references.find((x) => x.position === position);
      return { position, ...Object.fromEntries(REFERENCE_FIELDS.map((f) => [f, r?.[f] ?? null])) };
    });

  const completionOf = (p: FullProfile) =>
    completion(
      (f) => {
        if (f in ENC_COLUMN) return Boolean(p[ENC_COLUMN[f as SensitiveField]]);
        const v = p[f as keyof FullProfile];
        return v !== null && v !== undefined && !(typeof v === "string" && v.trim() === "");
      },
      p.references,
      p.documents.map((d) => DOC_NAME[d.type]),
    );

  const historyOf = (p: FullProfile) =>
    p.statusHistory.map((h) => ({ status: h.toStatus, comment: h.comment, at: h.createdAt.toISOString() }));

  /** What the student sees: sensitive values masked, never in full. */
  const studentView = (p: FullProfile) => {
    const sensitive: Record<string, { isSet: boolean; masked: string | null }> = {};
    for (const f of SENSITIVE_FIELDS) {
      const value = f === "passportNumber" ? decrypt(p, f) : p[ENC_COLUMN[f]] ? "set" : null;
      sensitive[f] = { isSet: value !== null, masked: value === null ? null : maskSensitive(f, value) };
    }
    const lastNeedsUpdate = p.statusHistory.find((h) => h.toStatus === "NEEDS_UPDATE");
    return {
      status: p.status,
      canEdit: EDITABLE.includes(p.status),
      submittedAt: p.submittedAt?.toISOString() ?? null,
      updatedAt: p.updatedAt.toISOString(),
      fields: fieldsOf(p),
      sensitive,
      references: referencesOf(p),
      documents: p.documents.map(docView),
      completion: completionOf(p),
      reviewerComment: p.status === "NEEDS_UPDATE" ? (lastNeedsUpdate?.comment ?? null) : null,
      history: historyOf(p),
    };
  };

  async function load(userId: string) {
    return db.studentProfile.findUnique({ where: { userId }, include });
  }

  async function getOrCreate(actor: Actor): Promise<FullProfile> {
    const existing = await load(actor.userId);
    if (existing) return existing;
    try {
      return await db.studentProfile.create({ data: { userId: actor.userId, email: actor.email ?? null }, include });
    } catch (e) {
      // Two first requests at once: the other one created it.
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        const p = await load(actor.userId);
        if (p) return p;
      }
      throw e;
    }
  }

  /**
   * Runs `work` only while the profile is editable. The conditional update
   * locks the row, so a recruiter's status change can't slip in between.
   */
  async function whileEditable<T>(profileId: string, work: (tx: Prisma.TransactionClient) => Promise<T>) {
    return db.$transaction(async (tx) => {
      const { count } = await tx.studentProfile.updateMany({
        where: { id: profileId, status: { in: EDITABLE } },
        data: { updatedAt: new Date() },
      });
      if (count === 0) throw conflict(LOCKED_MESSAGE);
      return work(tx);
    });
  }

  return {
    async get(actor: Actor) {
      return studentView(await getOrCreate(actor));
    },

    async saveDraft(actor: Actor, input: DraftInput) {
      const profile = await getOrCreate(actor);
      const data: Prisma.StudentProfileUpdateManyMutationInput = {};
      for (const f of TEXT_FIELDS) if (input[f] !== undefined) data[f] = input[f];
      for (const f of [...NUMBER_FIELDS, ...YEAR_FIELDS]) if (input[f] !== undefined) data[f] = input[f];
      if (input.relocation !== undefined) data.relocation = input.relocation;
      for (const f of SENSITIVE_FIELDS) {
        const v = input[f];
        if (v === undefined) continue;
        data[ENC_COLUMN[f]] = v === null ? null : cipher.encrypt(v, context(actor.userId, f));
      }

      await whileEditable(profile.id, async (tx) => {
        await tx.studentProfile.update({ where: { id: profile.id }, data });
        for (const ref of input.references ?? []) {
          const { position, ...values } = ref;
          await tx.reference.upsert({
            where: { profileId_position: { profileId: profile.id, position } },
            create: { profileId: profile.id, position, ...values },
            update: values,
          });
        }
      });
      return studentView((await load(actor.userId))!);
    },

    async submit(actor: Actor) {
      const profile = await getOrCreate(actor);
      if (!EDITABLE.includes(profile.status)) throw conflict(LOCKED_MESSAGE);

      const fields = submitErrors(plain(profile));
      const have = profile.documents.map((d) => DOC_NAME[d.type]);
      const missingDocuments = (["resume", "id", "visa"] as const).filter((t) => !have.includes(t));
      if (Object.keys(fields).length || missingDocuments.length) {
        throw new HttpError(422, "Some details are missing or need fixing.", { fields, missingDocuments });
      }

      await db.$transaction(async (tx) => {
        const { count } = await tx.studentProfile.updateMany({
          where: { id: profile.id, status: { in: EDITABLE } },
          data: { status: "SUBMITTED", submittedAt: new Date() },
        });
        if (count === 0) throw conflict(LOCKED_MESSAGE);
        await tx.profileStatusHistory.create({
          data: { profileId: profile.id, fromStatus: profile.status, toStatus: "SUBMITTED", actorUserId: actor.userId, actorRole: actor.role },
        });
      });
      return studentView((await load(actor.userId))!);
    },

    // --- documents ---

    async listDocuments(actor: Actor) {
      const profile = await getOrCreate(actor);
      return profile.documents.map(docView);
    },

    async uploadDocument(actor: Actor, type: DocumentTypeName, file: { buffer: Buffer; mimetype: string; originalname: string }) {
      const checked = checkFileType(file.buffer, file.mimetype, file.originalname);
      if (!checked.ok) throw new HttpError(415, checked.reason);
      const scanStatus = await scan(file.buffer);
      if (scanStatus === "INFECTED") throw new HttpError(422, "This file was flagged by the virus scan and was not saved.");

      const profile = await getOrCreate(actor);
      if (!EDITABLE.includes(profile.status)) throw conflict(LOCKED_MESSAGE);

      const storageKey = await store.put(file.buffer);
      let replacedKey: string | undefined;
      try {
        const doc = await whileEditable(profile.id, async (tx) => {
          const old = await tx.profileDocument.findUnique({ where: { profileId_type: { profileId: profile.id, type: DOC_TYPE[type] } } });
          if (old) {
            await tx.profileDocument.delete({ where: { id: old.id } });
            replacedKey = old.storageKey;
          }
          return tx.profileDocument.create({
            data: {
              profileId: profile.id,
              type: DOC_TYPE[type],
              originalName: cleanFileName(file.originalname),
              storageKey,
              mimeType: checked.mime,
              sizeBytes: file.buffer.length,
              sha256: createHash("sha256").update(file.buffer).digest("hex"),
              scanStatus,
            },
          });
        });
        if (replacedKey) await store.remove(replacedKey).catch(() => log.warn("old file not removed", { documentType: type }));
        return docView(doc);
      } catch (e) {
        await store.remove(storageKey).catch(() => undefined);
        throw e;
      }
    },

    async deleteDocument(actor: Actor, documentId: string) {
      const profile = await getOrCreate(actor);
      // Someone else's document id looks exactly like a missing one.
      const doc = profile.documents.find((d) => d.id === documentId);
      if (!doc) throw notFound("Document not found.");
      await whileEditable(profile.id, (tx) => tx.profileDocument.deleteMany({ where: { id: doc.id, profileId: profile.id } }));
      await store.remove(doc.storageKey).catch(() => log.warn("file not removed", { documentType: DOC_NAME[doc.type] }));
    },

    /** For GET /api/files/:id once the signature has been checked. */
    async readDocument(documentId: string) {
      const doc = await db.profileDocument.findUnique({ where: { id: documentId } });
      if (!doc) throw notFound("File not found.");
      return { doc, data: await store.read(doc.storageKey) };
    },

    // --- recruiter / admin ---

    /** Full values, for recruiters. Every call is written to the access log. */
    async adminGet(actor: Actor, studentUserId: string) {
      const p = await load(studentUserId);
      if (!p) throw notFound("This student hasn't started their placement details.");
      const values = plain(p);
      const revealed = [
        ...SENSITIVE_FIELDS.filter((f) => values[f] !== null),
        ...p.documents.map((d) => `document:${d.type}`),
      ];
      if (revealed.length) {
        await db.piiAccessLog.create({
          data: {
            profileId: p.id,
            actorUserId: actor.userId,
            actorRole: actor.role,
            fields: revealed,
            ipAddress: actor.ip ?? null,
            userAgent: actor.userAgent?.slice(0, 300) ?? null,
          },
        });
      }
      return {
        studentUserId: p.userId,
        status: p.status,
        submittedAt: p.submittedAt?.toISOString() ?? null,
        updatedAt: p.updatedAt.toISOString(),
        fields: fieldsOf(p),
        sensitive: Object.fromEntries(SENSITIVE_FIELDS.map((f) => [f, values[f]])),
        references: referencesOf(p),
        documents: p.documents.map(docView),
        completion: completionOf(p),
        history: p.statusHistory.map((h) => ({
          from: h.fromStatus,
          status: h.toStatus,
          comment: h.comment,
          by: h.actorUserId,
          role: h.actorRole,
          at: h.createdAt.toISOString(),
        })),
      };
    },

    async adminSetStatus(actor: Actor, studentUserId: string, to: "UNDER_REVIEW" | "NEEDS_UPDATE" | "APPROVED", comment?: string) {
      const allowedFrom: Record<typeof to, ProfileStatus[]> = {
        UNDER_REVIEW: ["SUBMITTED"],
        NEEDS_UPDATE: ["SUBMITTED", "UNDER_REVIEW", "APPROVED"],
        APPROVED: ["SUBMITTED", "UNDER_REVIEW"],
      };
      return db.$transaction(async (tx) => {
        const p = await tx.studentProfile.findUnique({ where: { userId: studentUserId }, select: { id: true, status: true } });
        if (!p) throw notFound("This student hasn't started their placement details.");
        const { count } = await tx.studentProfile.updateMany({
          where: { id: p.id, status: { in: allowedFrom[to] } },
          data: { status: to },
        });
        if (count === 0) throw conflict(`Can't move a profile from ${p.status} to ${to}.`);
        await tx.profileStatusHistory.create({
          data: { profileId: p.id, fromStatus: p.status, toStatus: to, comment: comment || null, actorUserId: actor.userId, actorRole: actor.role },
        });
        return { status: to, previousStatus: p.status };
      });
    },
  };
}

export type ProfileService = ReturnType<typeof createProfileService>;
