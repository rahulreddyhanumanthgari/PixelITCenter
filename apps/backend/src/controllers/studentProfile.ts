import type { Request, Response } from "express";
import { z } from "zod";
import { HttpError } from "../lib/errors.js";
import { actorOf } from "../middleware/auth.js";
import type { ProfileService } from "../services/profileService.js";
import { documentTypeSchema, draftSchema } from "../validation/profile.js";

const documentId = z.uuid();

export function studentProfileController(service: ProfileService) {
  return {
    get: async (req: Request, res: Response) => {
      res.json(await service.get(actorOf(req)));
    },

    saveDraft: async (req: Request, res: Response) => {
      res.json(await service.saveDraft(actorOf(req), draftSchema.parse(req.body)));
    },

    submit: async (req: Request, res: Response) => {
      res.json(await service.submit(actorOf(req)));
    },

    listDocuments: async (req: Request, res: Response) => {
      res.json({ documents: await service.listDocuments(actorOf(req)) });
    },

    uploadDocument: async (req: Request, res: Response) => {
      const type = documentTypeSchema.safeParse(req.body?.type);
      if (!type.success) throw new HttpError(400, "Say which document this is: resume, id or visa.");
      if (!req.file) throw new HttpError(400, "Attach a file in the \"file\" field.");
      const doc = await service.uploadDocument(actorOf(req), type.data, req.file);
      res.status(201).json(doc);
    },

    deleteDocument: async (req: Request, res: Response) => {
      const id = documentId.safeParse(req.params.id);
      if (!id.success) throw new HttpError(404, "Document not found.");
      await service.deleteDocument(actorOf(req), id.data);
      res.status(204).end();
    },
  };
}
