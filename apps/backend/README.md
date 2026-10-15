# Pixel IT Center portal API

Node.js (Express 5) + PostgreSQL (Prisma 7). Two features:

- **Placement Details** (the skill matrix) on the student Profile page. Recruiters
  need these details before they market a student's profile.
- **Client section** (internal, staff only): clients and vendors, placements,
  timesheet approval, invoices, payments, monthly emails. See
  [Client section](#client-section) below.

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

## Client section

Clients and vendors **never sign in**: they use their own VMS portals or email.
This is an internal tool for PixelIT staff to track placements, timesheets,
invoices and payments. Every route is role-guarded on the server
(`src/routes/clientSection.ts`); the UI only hides what the role can't open.

### Setup

```bash
npm run db:deploy            # applies 20261014000000_client_section
npm run db:seed              # demo clients, placements, timesheets at every stage
npm run db:seed -- --reset   # wipe the client-section tables and seed again
```

The seed never emails anyone (it uses the `log` mailer). The portal has two demo
logins (any password): `employee@pixelitcenter.com` (an admin: sees the whole
client section) and `student@` / `placed@pixelitcenter.com` (students). The other
staff roles below are enforced by the API and are used once real accounts
(Cognito) arrive.

### Roles

| Role | Can |
|---|---|
| admin | Everything: client records, placements, both timesheet roles, payments, the consultant-payment override, the audit log. |
| accounts | Read clients; see placements with rates; the accounts check (only after the verifier approves); invoices; payments; reports; CSV. |
| verifier | See placements **without rates**; verify, approve or send back timesheets. |
| recruiter | See placements **without rates**. Nothing else in this section. |
| student | Only their own placement (client name and their own hourly pay rate, never the bill rate) and their own timesheets. |

There is no client role. A token with `role: "client"` is refused (401).

### Timesheet workflow

`Received → Verified → Approved by verifier → Accounts checked → Invoice raised → Submitted to client`

- Each move is stored in `TimesheetStatusHistory` (who, role, email, when, comment).
- Verifier and accounts are separate roles: a verifier can't do the accounts
  check, and accounts acts only after the verifier approves. An admin can do
  every step.
- Accounts can change the hours to bill; a comment is then required.
- Before the invoice, any step can **send it back** with a comment (required). The
  consultant is told by email and in-portal notification, uploads again, and it
  starts over at Received.
- The accounts check **raises the invoice automatically** in the same transaction:
  approved hours × bill rate, due after the client's payment terms, numbered
  `PIX-<year>-0001` from a per-year counter. The PDF is rendered right after (and
  again on demand if that failed). Nobody types an amount.
- Reminders: in the last `REMINDER_DAYS_BEFORE_MONTH_END` days of the month, placed
  consultants with no timesheet for the month get an email and a notification
  (also on demand: `POST /api/admin/timesheets/reminders`).

### Billing flow (per consultant per month)

`1 Timesheet received → 2 Timesheet submitted to client → 3 Invoice sent → 4 Payment received from client → 5 Consultant paid`

- Stages 2 and 3 are set by emailing the invoice (invoice PDF + approved timesheet
  PDF to the client's billing email), or by hand for VMS clients.
- Client payment: record an **expected** date and comment ("payment processed,
  expected next week") and later the **received** date and amount (a different
  amount needs a comment).
- **Consultant paid is blocked (409 `client_payment_missing`) until the client's
  payment is recorded.** Only an admin can override, with a written reason (10+
  characters); it is stored on the payment and in the audit log.
- Summary: hours, billed, received, paid, margin (billed − paid, as specified) and
  expected margin (billed − hours × pay rate), per row and per consultant; overdue
  invoices flagged with days overdue; filter by month, client, stage, consultant;
  CSV export (formula-looking cells are neutralised).

### Endpoints

All need `Authorization: Bearer <token>`. `admin` is always allowed.

| Method | Path | Roles | What |
|---|---|---|---|
| GET | `/api/admin/overview` | all staff | Work-queue counts for the dashboard (only what the role may see). |
| GET / POST | `/api/admin/clients` | read: accounts · write: admin | List (`?q`, `?archived=true`) / create. |
| GET / PATCH / DELETE | `/api/admin/clients/:id` | read: accounts · write: admin | Get / update / archive (refused while it has active placements). |
| POST | `/api/admin/clients/:id/send-invoices` | accounts | "Send now" for all of a client's unsent invoices. |
| GET / POST | `/api/admin/placements` | read: all staff · write: admin | List (`?clientId&status&q`); rates only for admin/accounts. |
| GET / PATCH | `/api/admin/placements/:id` | read: all staff · write: admin | Get / update. |
| GET | `/api/admin/timesheets` | verifier, accounts | List (`?month&clientId&status&consultant`). |
| GET | `/api/admin/timesheets/:id` | verifier, accounts | Detail, history, signed PDF link, the moves this user may make. |
| PATCH | `/api/admin/timesheets/:id` | verifier, accounts | `{ status, comment?, approvedHours? }`. |
| POST | `/api/admin/timesheets/reminders` | verifier, accounts | `{ month? }`: remind consultants with no timesheet. |
| GET / POST | `/api/admin/invoices` | accounts | List (`?month&clientId&status`) / `{ timesheetId }` raise one if missing. |
| GET / PATCH | `/api/admin/invoices/:id` | accounts | Detail with payments and email log / `{ status: TIMESHEET_SUBMITTED \| SENT }` for VMS. |
| GET | `/api/admin/invoices/:id/pdf` | accounts | Short-lived signed link to the PDF. |
| POST | `/api/admin/invoices/:id/send` | accounts | Email it now (`{ resend: true }` to send again). |
| POST | `/api/admin/payments/client` | accounts | `{ invoiceId, status: "expected", expectedDate, comment? }` or `{ …, status: "received", receivedDate, amount?, comment? }`. |
| POST | `/api/admin/payments/consultant` | accounts | `{ invoiceId, paidDate, amount?, comment?, overrideReason? }` (override: admin only). |
| GET | `/api/admin/reports/billing-summary` | accounts | `?month&clientId&status&consultant&format=csv`. |
| GET | `/api/admin/audit-log` | admin | `?entityType&entityId&limit`. |
| GET | `/api/student/placement` | student | Own client + own hourly rate. |
| GET / POST | `/api/student/timesheets` | student | Own timesheets / upload: multipart `month, hours, leaveDays, leaveNote?, file` (one PDF). |
| GET | `/api/student/notifications` | student | Reminders and send-backs. |
| POST | `/api/student/notifications/:id/read` | student | Mark read. |

Placements are linked to a consultant's account by `consultantEmail` the first
time that student signs in (their token's verified email), then by user id.

### Data

`ClientType`, `Client`, `Placement` (with `employmentType`: FULL_TIME, PART_TIME, CONTRACT, CONTRACT_TO_HIRE; default CONTRACT), `StoredFile` (timesheet and invoice PDFs),
`Timesheet`, `TimesheetStatusHistory`, `Invoice` (client, rates and terms copied in
at issue time), `InvoiceCounter`, `Payment`, `EmailLog` (one row per send attempt:
to, subject, time, status, safe error code), `AuditLog` (every view and change of
billing data: who, action, record, when), `Notification`, `JobRun` (stops a
scheduled job running twice for the same period). Money is `Decimal`, never float.

### Security

- Rates, invoices, payments and reports: admin and accounts only. Recruiter and
  verifier responses leave rates out entirely (not masked).
- Timesheet PDFs and invoices are in private storage and only reachable through
  `/api/files/:id` with an HMAC-signed link that expires (`FILE_URL_TTL_SECONDS`).
- Logs carry method, route, status and time. No bodies, emails, comments or
  amounts; email failures are stored as an error name/code only.
- Zod validation (strict: unknown keys refused), Prisma for every query, Helmet,
  CORS limited to `CORS_ORIGINS`, rate limits (sending email: 30 per 15 minutes).

### Email and jobs

Provider behind one interface (`src/lib/mailer.ts`), chosen by `MAIL_PROVIDER`:
`log`, `outbox` (.eml files to check locally), `smtp`, `gmail` (OAuth2). Every
attempt is logged in `EmailLog` and shown on the invoice. A send is tried
`MAIL_MAX_ATTEMPTS` times with a growing wait; after the last failure the invoice
is flagged (`emailFailed`) and shows in Billing until a send succeeds.

Jobs (`src/jobs/clientSectionJobs.ts`) run with node-cron inside this process when
`JOBS_ENABLED=true`: the monthly invoice email (clients with auto-send on) and the
month-end reminders.

### Monthly cost (as of mid-2026; check current prices before choosing)

| Piece | Option | Cost |
|---|---|---|
| Scheduler | node-cron in the API process | $0 |
| PDF invoices | PDFKit (open source) | $0 |
| Email | Gmail / Google Workspace mailbox you already have (`gmail`) | $0 extra; Workspace sending limit about 2,000 a day, free Gmail about 500 |
| Email | Amazon SES over SMTP (`smtp`) | about $0.10 per 1,000 emails, so cents a month at this volume |
| Email | Mailgun / Brevo free tiers over SMTP | $0 up to their free daily limits |
| Database | Existing Postgres (Railway / Neon free tier for small data) | $0 to about $5 |
| File storage | Local disk now; private S3 later | S3: about $0.023 per GB a month |

Recommended to start: `gmail` with the accounts@ Workspace mailbox ($0 extra), or
SES if delivery volume or deliverability becomes a concern.

## TODO

- **Student Timesheets page:** still front-end demo data. The API it needs exists
  (`/api/student/placement`, `/api/student/timesheets`, `/api/student/notifications`);
  wiring it was left out because this task didn't change the student dashboard.
- **Staff roles:** come from the demo directory / dev token. With Cognito, map
  Cognito groups to admin / accounts / verifier / recruiter.
- **Client archive:** archived clients can't be restored from the UI yet.
- **Partial payments:** one client receipt and one payout per invoice for now.

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
