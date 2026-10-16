import multer from "multer";

// Multipart uploads are held in memory (max one file of MAX_UPLOAD_MB) so the
// type check and virus scan run before anything touches disk. The stored
// copy gets a random name in private storage (src/lib/storage.ts).

export function singleUpload(maxBytes: number, { fields = 4 }: { fields?: number } = {}) {
  return multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxBytes, files: 1, fields, fieldSize: 1024, parts: fields + 2, headerPairs: 50 },
  }).single("file");
}
