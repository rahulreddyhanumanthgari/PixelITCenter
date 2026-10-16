# Pixel IT Center portal API

Node.js (Express 5) + PostgreSQL (Prisma 7). First feature: **Placement Details**
(the skill matrix) on the student Profile page. Recruiters need these details
before they market a student's profile.

## Setup

```bash
cd apps/backend
npm install
cp .env.example .env        # then fill in the secrets (commands are in the file)
npm run db:local            # optional: embedded Postgres on :55433, no install needed
npm run db:deploy           # apply migrations (prisma migrate deploy)
npm run dev                 # http://localhost:4000
```

The portal (`apps/frontend`) calls `NEXT_PUBLIC_PORTAL_API_URL`, default
`http://localhost:4000`. Add the portal's origin to `CORS_ORIGINS`.

Sign-in is still a front-end demo, so for local work set `DEV_AUTH_ENABLED=true`:
`POST /api/dev/token { email, role }` hands out a token. The server will not start
with it on in production.

```bash
npm test          # unit + API tests against an in-memory Postgres (PGlite)
npm run typecheck
npm run build && npm start
```

## Endpoints

All need `Authorization: Bearer <token>` (HS256 JWT: `sub`, `role`, `email`).
A student's profile is picked by the token's `sub`, never by the URL, so a
student can only ever reach their own.

| Method | Path | Who | What |
|---|---|---|---|
| GET | `/api/student/profile` | student | The profile (created on first visit, email from the token). Sensitive fields masked. |
| PUT | `/api/student/profile` | student | Save a draft. Any subset of fields. Sensitive: a string sets it, `null` clears it, left out keeps it. |
| POST | `/api/student/profile/submit` | student | Checks everything; `422 { fields, missingDocuments }` if not ready. Sets **Submitted**. |
| POST | `/api/student/profile/documents` | student | multipart: `type` = `resume` \| `id` \| `visa`, `file`. Replaces that type's file. |
| GET | `/api/student/profile/documents` | student | Documents with short-lived signed links. |
| DELETE | `/api/student/profile/documents/:id` | student | Only while Draft or Needs Update. |
| GET | `/api/admin/students/:id/profile` | recruiter, admin | Full values. Every call is written to `PiiAccessLog`. `:id` is the student's user id. |
| PATCH | `/api/admin/students/:id/profile/status` | recruiter, admin | `{ status: UNDER_REVIEW \| NEEDS_UPDATE \| APPROVED, comment? }`. Needs Update requires a comment. |
| GET | `/api/files/:id?expires&signature` | signed link | Streams the file. Expired or altered links get 404. |

**Status flow:** Draft → Submitted (student) → Under Review → Approved or Needs
Update (recruiter) → Submitted again (student). The student can edit, upload and
delete only in Draft or Needs Update. Every change is in `ProfileStatusHistory`.

## Data

`prisma/schema.prisma`, migration in `prisma/migrations/`:

- `StudentProfile`: one per student; the form's fields, status.
- `Reference`: two per profile (`position` 1 and 2).
- `ProfileDocument`: one current file per type.
- `ProfileStatusHistory`: who moved the status, when, with what comment.
- `PiiAccessLog`: each time a recruiter or admin saw decrypted values or documents.

## How the sensitive data is protected

- **Encryption at rest.** Passport number, SSN last four and date of birth are
  encrypted with AES-256-GCM (`src/lib/crypto.ts`) before they reach the database.
  Key: `PII_ENCRYPTION_KEY` (32 bytes, base64). Each value gets a random 12-byte IV
  and an auth tag, so altered values fail to decrypt. The value is bound to its
  owner and field (`studentProfile:<userId>:<field>` as GCM associated data), so a
  ciphertext copied to another student or column won't decrypt either. Stored as
  `v1.<keyId>.<iv>.<tag>.<ciphertext>`; the key id leaves room for rotation.
- **Masked for students.** The API never sends these back to the student: passport
  shows its last 3 characters, SSN and date of birth show only dots. Recruiters and
  admins get full values, and each view is logged in `PiiAccessLog`.
- **No PII in logs.** Request logs carry method, route pattern, status and time only:
  no bodies, no query strings. Errors are logged by name and code. Prisma query
  logging is off.
- **Files.** Held in memory (max `MAX_UPLOAD_MB`, one file), checked by declared
  MIME type, extension and file signature (magic bytes), passed to the virus-scan
  hook, then written to `STORAGE_DIR` under a random 48-hex name with mode 600. They
  are never served statically: only via `/api/files/:id` with an HMAC-signed link
  that expires after `FILE_URL_TTL_SECONDS` (default 5 minutes), served with
  `nosniff`, `no-store` and a sandbox CSP.
- **HTTP.** Helmet, CORS limited to `CORS_ORIGINS`, rate limits (300 requests per 15
  minutes per IP, 30 uploads), 64 KB JSON limit, Zod validation that refuses unknown
  keys, Prisma for every query (parameterised).

## TODO

- **Auth:** replace the dev token with AWS Cognito (verify RS256 ID tokens against the
  pool's JWKS in `src/middleware/auth.ts`, map the group to `role`).
- **Virus scan:** wire ClamAV or the storage provider's scanner into
  `src/lib/virusScan.ts`. Files are stored with `scanStatus: "SKIPPED"` until then.
- **Storage:** add a private S3 driver to `src/lib/storage.ts` for production; local
  disk is not shared between instances.
- **Key rotation:** add old keys to the cipher's key map and a re-encrypt job.
- **Recruiter UI:** the admin endpoints exist; there is no recruiter screen yet.
- **CI:** `.github/workflows/ci.yml` checks only the frontend; add `npm ci && npm test
  && npm run build` for this folder.
- **Retention:** decide how long documents and the access log are kept.
