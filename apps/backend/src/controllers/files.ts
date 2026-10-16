import type { Request, Response } from "express";
import { z } from "zod";
import { HttpError } from "../lib/errors.js";
import type { FileSigner } from "../lib/storage.js";

const id = z.uuid();

/** Finds a stored file by id: a profile document, a timesheet PDF or an invoice PDF. */
export type FileReader = (id: string) => Promise<{ doc: { mimeType: string; originalName: string }; data: Buffer }>;

/**
 * GET /api/files/:id?expires=&signature=
 * The URL is handed out only by authenticated, authorised endpoints and
 * works for FILE_URL_TTL_SECONDS. A link that is expired, altered or for
 * another file gets the same 404 as a file that doesn't exist.
 */
export function filesController(read: FileReader, signer: FileSigner) {
  return {
    download: async (req: Request, res: Response) => {
      const docId = id.safeParse(req.params.id);
      const expires = typeof req.query.expires === "string" ? req.query.expires : "";
      const signature = typeof req.query.signature === "string" ? req.query.signature : "";
      if (!docId.success || !signer.verify(docId.data, expires, signature)) throw new HttpError(404, "This link has expired. Open the file again from the portal.");

      const { doc, data } = await read(docId.data);
      res.set({
        "Content-Type": doc.mimeType,
        "Content-Length": String(data.length),
        "Content-Disposition": `inline; filename="${doc.originalName.replace(/"/g, "")}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        // A PDF opened inline can't run script against this origin.
        "Content-Security-Policy": "sandbox; default-src 'none'; img-src 'self'; object-src 'self'",
        "Cross-Origin-Resource-Policy": "cross-origin",
      });
      res.send(data);
    },
  };
}
