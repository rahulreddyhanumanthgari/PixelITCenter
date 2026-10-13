import type { DocumentType, SensitiveKey } from "./fields";

// Talks to the portal API (apps/backend). Set NEXT_PUBLIC_PORTAL_API_URL;
// locally it defaults to http://localhost:4000.
//
// Sign-in is still the front-end demo (../../session.ts), so there is no real
// token yet. Until AWS Cognito lands, the token comes from the API's dev-only
// POST /api/dev/token for the signed-in demo email. With Cognito, replace
// `tokenFor` with the user's ID token; nothing else here changes.

export const API_URL = (process.env.NEXT_PUBLIC_PORTAL_API_URL || "http://localhost:4000").replace(/\/$/, "");

export type Status = "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "NEEDS_UPDATE" | "APPROVED";

export type PlacementDocument = {
  id: string;
  type: DocumentType;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
  url: string;
  expiresAt: string;
};

export type PlacementProfile = {
  status: Status;
  canEdit: boolean;
  submittedAt: string | null;
  updatedAt: string;
  fields: Record<string, string | number | boolean | null>;
  sensitive: Record<SensitiveKey, { isSet: boolean; masked: string | null }>;
  references: ({ position: number } & Record<string, string | null>)[];
  documents: PlacementDocument[];
  completion: { percent: number; missing: string[] };
  reviewerComment: string | null;
  history: { status: Status; comment: string | null; at: string }[];
};

export type DraftPayload = Record<string, string | number | boolean | null | object[]>;

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly fields: Record<string, string> = {},
    readonly missingDocuments: string[] = [],
  ) {
    super(message);
  }
}

let cached: { email: string; token: string; until: number } | null = null;

async function tokenFor(email: string) {
  if (cached && cached.email === email && cached.until > Date.now()) return cached.token;
  const res = await fetch(`${API_URL}/api/dev/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, role: "student" }),
  });
  if (!res.ok) throw new ApiError(res.status, "Couldn't sign in to the placement service.");
  const body = (await res.json()) as { token: string; expiresIn: number };
  cached = { email, token: body.token, until: Date.now() + (body.expiresIn - 60) * 1000 };
  return body.token;
}

async function call<T>(email: string, path: string, init: RequestInit = {}, retry = true): Promise<T> {
  let res: Response;
  try {
    const token = await tokenFor(email);
    res = await fetch(`${API_URL}${path}`, { ...init, headers: { ...init.headers, Authorization: `Bearer ${token}` } });
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw new ApiError(0, "Can't reach the placement service. Check your connection and try again.");
  }
  if (res.status === 401 && retry) {
    cached = null;
    return call(email, path, init, false);
  }
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, body.error ?? "Something went wrong.", body.fields, body.missingDocuments);
  return body as T;
}

const json = (method: string, body?: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: body === undefined ? undefined : JSON.stringify(body),
});

export const placementApi = {
  get: (email: string) => call<PlacementProfile>(email, "/api/student/profile"),
  save: (email: string, draft: DraftPayload) => call<PlacementProfile>(email, "/api/student/profile", json("PUT", draft)),
  submit: (email: string) => call<PlacementProfile>(email, "/api/student/profile/submit", json("POST")),
  documents: (email: string) => call<{ documents: PlacementDocument[] }>(email, "/api/student/profile/documents"),
  upload: (email: string, type: DocumentType, file: File) => {
    const form = new FormData();
    form.append("type", type);
    form.append("file", file);
    return call<PlacementDocument>(email, "/api/student/profile/documents", { method: "POST", body: form });
  },
  remove: (email: string, id: string) => call<void>(email, `/api/student/profile/documents/${encodeURIComponent(id)}`, { method: "DELETE" }),
};

/** Absolute link for a document's short-lived signed URL. */
export const fileUrl = (doc: PlacementDocument) => `${API_URL}${doc.url}`;
