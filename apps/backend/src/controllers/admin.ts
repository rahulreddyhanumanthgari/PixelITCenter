import type { Request, Response } from "express";
import { z } from "zod";
import { HttpError } from "../lib/errors.js";
import { actorOf } from "../middleware/auth.js";
import type { ProfileService } from "../services/profileService.js";
import { statusChangeSchema } from "../validation/profile.js";

/** The student's user id (their token's `sub`). */
const studentId = z.string().regex(/^[\w:.@|-]{1,128}$/);

function studentIdOf(req: Request) {
  const id = studentId.safeParse(req.params.id);
  if (!id.success) throw new HttpError(404, "Student not found.");
  return id.data;
}

export function adminController(service: ProfileService) {
  return {
    getProfile: async (req: Request, res: Response) => {
      res.set("Cache-Control", "no-store");
      res.json(await service.adminGet(actorOf(req), studentIdOf(req)));
    },

    setStatus: async (req: Request, res: Response) => {
      const body = statusChangeSchema.parse(req.body);
      res.json(await service.adminSetStatus(actorOf(req), studentIdOf(req), body.status, body.comment));
    },
  };
}
