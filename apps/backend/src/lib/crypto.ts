import { createCipheriv, createDecipheriv, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

// Field-level encryption for PII at rest: AES-256-GCM.
//
// Stored format: "v1.<keyId>.<iv>.<tag>.<ciphertext>", each part base64url.
//   - iv: 12 random bytes, new for every value.
//   - tag: GCM auth tag; decryption fails if the value was altered.
//   - AAD ("context"): who and which field the value belongs to, e.g.
//     "studentProfile:<userId>:passportNumber". A ciphertext copied into
//     another row or column fails to decrypt instead of being read as valid.
//   - keyId: which key encrypted it, so keys can be rotated later.

const ALGORITHM = "aes-256-gcm";
const VERSION = "v1";

export type FieldCipher = {
  encrypt(plain: string, context: string): string;
  decrypt(stored: string, context: string): string;
};

export function createFieldCipher(keys: Record<string, Buffer>, currentKeyId: string): FieldCipher {
  for (const [id, key] of Object.entries(keys)) {
    if (key.length !== 32) throw new Error(`Encryption key ${id} must be 32 bytes`);
  }
  const current = keys[currentKeyId];
  if (!current) throw new Error("Current encryption key is missing");

  return {
    encrypt(plain, context) {
      const iv = randomBytes(12);
      const cipher = createCipheriv(ALGORITHM, current, iv);
      cipher.setAAD(Buffer.from(context, "utf8"));
      const ciphertext = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
      const tag = cipher.getAuthTag();
      return [VERSION, currentKeyId, iv.toString("base64url"), tag.toString("base64url"), ciphertext.toString("base64url")].join(".");
    },

    decrypt(stored, context) {
      const [version, keyId, iv, tag, ciphertext] = stored.split(".");
      if (version !== VERSION || !keyId || !iv || !tag || ciphertext === undefined) throw new Error("Unrecognised ciphertext");
      const key = keys[keyId];
      if (!key) throw new Error("Unknown encryption key id");
      const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(iv, "base64url"));
      decipher.setAAD(Buffer.from(context, "utf8"));
      decipher.setAuthTag(Buffer.from(tag, "base64url"));
      return Buffer.concat([decipher.update(Buffer.from(ciphertext, "base64url")), decipher.final()]).toString("utf8");
    },
  };
}

/** HMAC-SHA256, base64url. */
export function hmac(secret: string, data: string) {
  return createHmac("sha256", secret).update(data).digest("base64url");
}

export function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
