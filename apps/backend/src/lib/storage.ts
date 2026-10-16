import { randomBytes } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { hmac, safeEqual } from "./crypto.js";

// Private file storage for student documents.
//
// Files live in STORAGE_DIR, outside any web root, under random names that
// carry no user input. They are only reachable through GET /api/files/:id
// with a short-lived signed URL that an authorised endpoint hands out.
//
// TODO(storage): add an S3 / private object storage driver with the same
// interface (put / read / remove) and pre-signed GETs for production.

export type FileStore = {
  put(data: Buffer): Promise<string>;
  read(key: string): Promise<Buffer>;
  remove(key: string): Promise<void>;
};

const KEY_PATTERN = /^[a-f0-9]{48}$/;

export function createLocalStore(dir: string): FileStore {
  const fileFor = (key: string) => {
    if (!KEY_PATTERN.test(key)) throw new Error("Bad storage key");
    return path.join(dir, key);
  };
  return {
    async put(data) {
      await mkdir(dir, { recursive: true, mode: 0o700 });
      const key = randomBytes(24).toString("hex");
      await writeFile(fileFor(key), data, { mode: 0o600, flag: "wx" });
      return key;
    },
    read: (key) => readFile(fileFor(key)),
    remove: (key) => rm(fileFor(key), { force: true }),
  };
}

// --- signed URLs ---------------------------------------------------------------

export type FileSigner = {
  /** Relative URL valid for `ttlSeconds`. */
  sign(documentId: string): { url: string; expiresAt: string };
  verify(documentId: string, expires: string, signature: string): boolean;
};

export function createFileSigner(secret: string, ttlSeconds: number, now = () => Date.now()): FileSigner {
  const payload = (id: string, exp: string) => `file:${id}:${exp}`;
  return {
    sign(documentId) {
      const exp = String(Math.floor(now() / 1000) + ttlSeconds);
      const sig = hmac(secret, payload(documentId, exp));
      return {
        url: `/api/files/${documentId}?expires=${exp}&signature=${sig}`,
        expiresAt: new Date(Number(exp) * 1000).toISOString(),
      };
    },
    verify(documentId, expires, signature) {
      if (!/^\d{1,12}$/.test(expires) || Number(expires) * 1000 < now()) return false;
      return safeEqual(hmac(secret, payload(documentId, expires)), signature);
    },
  };
}
