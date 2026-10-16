import multer from "multer";

// Multipart uploads are held in memory (max one file of MAX_UPLOAD_MB) so the
// type check and virus scan run before anything touches disk. The stored
// copy gets a random name in private storage (src/lib/storage.ts).

export function singleUpload(maxBytes: number) {
  return multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxBytes, files: 1, fields: 4, fieldSize: 1024, parts: 6, headerPairs: 50 },
  }).single("file");
}
