// Uploads must be PDF, JPEG or PNG. A file passes only when its declared
// MIME type, its extension and its first bytes (the file signature) all
// agree. Renaming virus.exe to resume.pdf fails the signature check.

export type AllowedMime = "application/pdf" | "image/jpeg" | "image/png";

const SIGNATURES: { mime: AllowedMime; bytes: number[] }[] = [
  { mime: "application/pdf", bytes: [0x25, 0x50, 0x44, 0x46, 0x2d] }, // %PDF-
  { mime: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { mime: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
];

const EXTENSIONS: Record<AllowedMime, string[]> = {
  "application/pdf": [".pdf"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
};

// Browsers and OSes don't always send the canonical name.
const MIME_ALIASES: Record<string, AllowedMime> = {
  "application/pdf": "application/pdf",
  "application/x-pdf": "application/pdf",
  "image/jpeg": "image/jpeg",
  "image/jpg": "image/jpeg",
  "image/pjpeg": "image/jpeg",
  "image/png": "image/png",
  "image/x-png": "image/png",
};

export function sniffMime(buf: Buffer): AllowedMime | null {
  const match = SIGNATURES.find((s) => buf.length >= s.bytes.length && s.bytes.every((b, i) => buf[i] === b));
  return match?.mime ?? null;
}

/** The checked type, or why the file was refused. */
export function checkFileType(buf: Buffer, declaredMime: string, originalName: string): { ok: true; mime: AllowedMime } | { ok: false; reason: string } {
  const declared = MIME_ALIASES[declaredMime.toLowerCase()];
  if (!declared) return { ok: false, reason: "Only PDF, JPG and PNG files are accepted." };
  const sniffed = sniffMime(buf);
  if (!sniffed) return { ok: false, reason: "This file's contents are not a PDF, JPG or PNG." };
  if (sniffed !== declared) return { ok: false, reason: "The file's contents don't match its type." };
  const ext = originalName.toLowerCase().match(/\.[a-z0-9]+$/)?.[0] ?? "";
  if (!EXTENSIONS[sniffed].includes(ext)) return { ok: false, reason: "The file name's extension doesn't match its contents." };
  return { ok: true, mime: sniffed };
}

/** A filename that is safe to show and to put in a Content-Disposition header. */
export function cleanFileName(name: string) {
  const base = name.split(/[\\/]/).pop() ?? "file";
  const cleaned = base.replace(/[^\w.\- ()]+/g, "_").replace(/^\.+/, "").slice(0, 120);
  return cleaned || "file";
}
