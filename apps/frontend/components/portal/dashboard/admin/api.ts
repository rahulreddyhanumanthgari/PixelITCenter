import type { StaffRole } from "@/content/portal-demo";
import { API_URL, ApiError } from "../student/placement/api";

// The client section's calls to the portal API (apps/backend, /api/admin/...).
// Every route is role-guarded on the server; this file only carries the token.
//
// Sign-in is still the front-end demo, so the token comes from the API's
// dev-only POST /api/dev/token for the signed-in email and staff role. With
// AWS Cognito, replace `tokenFor` with the user's ID token; nothing else changes.

export type Who = { email: string; role: StaffRole };

// Kept in sessionStorage so a page reload doesn't ask for a new dev token each
// time (the endpoint is rate-limited). Dev only: Cognito replaces all of this.
const STORE = "pixelit-dev-api-tokens";
const tokens = {
  all(): Record<string, { token: string; until: number }> {
    try {
      return JSON.parse(sessionStorage.getItem(STORE) ?? "{}");
    } catch {
      return {};
    }
  },
  get(key: string) {
    return this.all()[key];
  },
  set(key: string, value: { token: string; until: number }) {
    try {
      sessionStorage.setItem(STORE, JSON.stringify({ ...this.all(), [key]: value }));
    } catch {
      // Storage blocked: fetch a token each time.
    }
  },
  delete(key: string) {
    const all = this.all();
    delete all[key];
    try {
      sessionStorage.setItem(STORE, JSON.stringify(all));
    } catch {}
  },
};

async function tokenFor({ email, role }: Who) {
  const key = `${role}:${email}`;
  const cached = tokens.get(key);
  if (cached && cached.until > Date.now()) return cached.token;
  const res = await fetch(`${API_URL}/api/dev/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, role }),
  });
  if (!res.ok) throw new ApiError(res.status, "Couldn't sign in to the portal API.");
  const body = (await res.json()) as { token: string; expiresIn: number };
  tokens.set(key, { token: body.token, until: Date.now() + (body.expiresIn - 60) * 1000 });
  return body.token;
}

async function send(who: Who, path: string, init: RequestInit = {}, retry = true): Promise<Response> {
  let res: Response;
  try {
    const token = await tokenFor(who);
    res = await fetch(`${API_URL}${path}`, { ...init, headers: { ...init.headers, Authorization: `Bearer ${token}` } });
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw new ApiError(0, "Can't reach the portal API. Start it with `npm run dev` in apps/backend, then try again.");
  }
  if (res.status === 401 && retry) {
    tokens.delete(`${who.role}:${who.email}`);
    return send(who, path, init, false);
  }
  return res;
}

async function call<T>(who: Who, path: string, init: RequestInit = {}): Promise<T> {
  const res = await send(who, path, init);
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, body.error ?? "Something went wrong.", body.fields);
  return body as T;
}

const json = (method: string, body?: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: body === undefined ? undefined : JSON.stringify(body),
});

const query = (params: Record<string, string | undefined>) => {
  const q = new URLSearchParams(Object.entries(params).filter((e): e is [string, string] => Boolean(e[1])));
  return q.size ? `?${q}` : "";
};

// --- types (as the API returns them) ----------------------------------------------------

export type ClientType = "CLIENT" | "VENDOR";

export type Client = {
  id: string;
  name: string;
  type: ClientType;
  endClientName: string | null;
  contactPerson: string | null;
  billingEmail: string;
  vmsPortalName: string | null;
  vmsPortalUrl: string | null;
  paymentTermsDays: number;
  notes: string | null;
  autoSendInvoices: boolean;
  archived: boolean;
  activePlacements: number;
  unsentInvoices: number;
};

export type ClientInput = Omit<Client, "id" | "archived" | "activePlacements" | "unsentInvoices">;

export type ExtensionStatus = "ACTIVE" | "EXTENSION_PENDING" | "EXTENDED" | "ENDED";
export type EmploymentType = "FULL_TIME" | "PART_TIME" | "CONTRACT" | "CONTRACT_TO_HIRE";

export type Placement = {
  id: string;
  client: { id: string; name: string; type: ClientType };
  endClientName: string | null;
  consultantName: string;
  consultantEmail: string;
  consultantLinked: boolean;
  role: string;
  startDate: string;
  endDate: string | null;
  extensionStatus: ExtensionStatus;
  employmentType: EmploymentType;
  /** Admin and accounts only. */
  billRate?: number;
  payRate?: number;
  marginPerHour?: number;
};

export type PlacementInput = {
  clientId: string;
  consultantName: string;
  consultantEmail: string;
  endClientName: string | null;
  role: string;
  billRate: number;
  payRate: number;
  startDate: string;
  endDate: string | null;
  extensionStatus: ExtensionStatus;
  employmentType: EmploymentType;
};

export type TimesheetStatus = "RECEIVED" | "VERIFIED" | "VERIFIER_APPROVED" | "ACCOUNTS_CHECKED" | "INVOICE_RAISED" | "SUBMITTED_TO_CLIENT" | "REJECTED";
export type TimesheetMove = "VERIFIED" | "VERIFIER_APPROVED" | "ACCOUNTS_CHECKED" | "SUBMITTED_TO_CLIENT" | "REJECTED";

export type TimesheetRow = {
  id: string;
  month: string;
  monthLabel: string;
  status: TimesheetStatus;
  statusLabel: string;
  hours: number;
  approvedHours: number | null;
  leaveDays: number;
  leaveNote: string | null;
  submittedAt: string;
  consultant: { name: string; email: string };
  placement: { id: string; role: string };
  client: { id: string; name: string; type: ClientType };
  endClientName: string | null;
  file: { name: string; sizeBytes: number };
  rejectionComment: string | null;
  invoice: { id: string; number: string; status?: InvoiceStatus; amount?: number } | null;
};

export type TimesheetDetail = TimesheetRow & {
  fileLink: { url: string; expiresAt: string };
  history: { from: TimesheetStatus | null; to: TimesheetStatus; toLabel: string; comment: string | null; by: string; role: string; at: string }[];
  actions: TimesheetMove[];
};

export type InvoiceStatus = "RAISED" | "TIMESHEET_SUBMITTED" | "SENT" | "CLIENT_PAID" | "CONSULTANT_PAID";

export type Invoice = {
  id: string;
  number: string;
  month: string;
  monthLabel: string;
  status: InvoiceStatus;
  consultantName: string;
  role: string;
  client: { id: string; name: string; type: ClientType; billingEmail: string; autoSendInvoices: boolean };
  endClientName: string | null;
  timesheet: { id: string; status: TimesheetStatus; statusLabel: string };
  hours: number;
  billRate: number;
  payRate: number;
  amount: number;
  consultantPay: number;
  paymentTermsDays: number;
  issueDate: string;
  dueDate: string;
  overdue: boolean;
  timesheetSubmittedAt: string | null;
  sentAt: string | null;
  clientPaymentExpectedDate: string | null;
  clientPaymentComment: string | null;
  clientPaidAt: string | null;
  consultantPaidAt: string | null;
  emailFailed: boolean;
  payments: { id: string; kind: "CLIENT_RECEIPT" | "CONSULTANT_PAYOUT"; amount: number; date: string; comment: string | null; overrideReason: string | null; by: string; role: string; at: string }[];
  emails: { id: string; to: string; subject: string; status: "SENT" | "FAILED"; attempt: number; error: string | null; trigger: string; at: string }[];
};

export type BillingStage = "timesheet_received" | "timesheet_submitted" | "invoice_sent" | "client_paid" | "consultant_paid";

export type SummaryRow = {
  timesheetId: string;
  invoiceId: string | null;
  invoiceNumber: string | null;
  month: string;
  monthLabel: string;
  consultantName: string;
  consultantKey: string;
  client: { id: string; name: string; type: ClientType };
  endClientName: string | null;
  timesheetStatus: TimesheetStatus;
  timesheetStatusLabel: string;
  hours: number;
  billed: number;
  received: number;
  paid: number;
  margin: number;
  expectedMargin: number;
  dueDate: string | null;
  overdue: boolean;
  daysOverdue: number;
  stage: BillingStage;
  stageLabel: string;
  steps: Record<BillingStage, string | null>;
  paidBeforeClient: boolean;
  clientPaymentExpectedDate: string | null;
  clientPaymentComment: string | null;
  emailFailed: boolean;
};

type Totals = { hours: number; billed: number; received: number; paid: number; margin: number; expectedMargin: number; overdueInvoices: number };

export type BillingSummary = {
  rows: SummaryRow[];
  byConsultant: (Totals & { consultantName: string; clients: string[]; months: number })[];
  totals: Totals & { rows: number; overdueAmount: number };
};

export type BillingFilters = { month?: string; clientId?: string; status?: BillingStage | "overdue"; consultant?: string };

export type Overview = {
  role: StaffRole;
  today: string;
  lastMonth: string;
  activePlacements: number;
  timesheetsToVerify: number | null;
  timesheetsForAccounts: number | null;
  missingTimesheetsLastMonth: number | null;
  invoicesToSend: number | null;
  overdueInvoices: number | null;
  consultantsToPay: number | null;
};

// --- calls -------------------------------------------------------------------------------

export const adminApi = {
  overview: (who: Who) => call<Overview>(who, "/api/admin/overview"),

  clients: (who: Who, archived = false) => call<{ clients: Client[] }>(who, `/api/admin/clients${query({ archived: archived ? "true" : undefined })}`),
  createClient: (who: Who, input: Partial<ClientInput>) => call<Client>(who, "/api/admin/clients", json("POST", input)),
  updateClient: (who: Who, id: string, input: Partial<ClientInput>) => call<Client>(who, `/api/admin/clients/${id}`, json("PATCH", input)),
  archiveClient: (who: Who, id: string) => call<void>(who, `/api/admin/clients/${id}`, { method: "DELETE" }),
  sendClientInvoices: (who: Who, id: string) => call<{ sent: number; failed: number }>(who, `/api/admin/clients/${id}/send-invoices`, json("POST")),

  placements: (who: Who, f: { clientId?: string; status?: ExtensionStatus; q?: string } = {}) =>
    call<{ placements: Placement[] }>(who, `/api/admin/placements${query(f)}`),
  createPlacement: (who: Who, input: PlacementInput) => call<Placement>(who, "/api/admin/placements", json("POST", input)),
  updatePlacement: (who: Who, id: string, input: Partial<PlacementInput>) => call<Placement>(who, `/api/admin/placements/${id}`, json("PATCH", input)),
  deletePlacement: (who: Who, id: string) => call<void>(who, `/api/admin/placements/${id}`, { method: "DELETE" }),

  timesheets: (who: Who, f: { month?: string; clientId?: string; status?: TimesheetStatus; consultant?: string } = {}) =>
    call<{ timesheets: TimesheetRow[] }>(who, `/api/admin/timesheets${query(f)}`),
  timesheet: (who: Who, id: string) => call<TimesheetDetail>(who, `/api/admin/timesheets/${id}`),
  moveTimesheet: (who: Who, id: string, body: { status: TimesheetMove; comment?: string; approvedHours?: number }) =>
    call<TimesheetDetail>(who, `/api/admin/timesheets/${id}`, json("PATCH", body)),
  sendReminders: (who: Who, month?: string) => call<{ month: string; reminded: number }>(who, "/api/admin/timesheets/reminders", json("POST", month ? { month } : {})),

  invoice: (who: Who, id: string) => call<Invoice>(who, `/api/admin/invoices/${id}`),
  invoicePdf: (who: Who, id: string) => call<{ url: string; fileName: string }>(who, `/api/admin/invoices/${id}/pdf`),
  sendInvoice: (who: Who, id: string, resend = false) => call<Invoice>(who, `/api/admin/invoices/${id}/send`, json("POST", resend ? { resend } : {})),
  moveInvoice: (who: Who, id: string, status: "TIMESHEET_SUBMITTED" | "SENT", comment?: string) =>
    call<Invoice>(who, `/api/admin/invoices/${id}`, json("PATCH", comment ? { status, comment } : { status })),

  clientPayment: (
    who: Who,
    body:
      | { invoiceId: string; status: "expected"; expectedDate: string; comment?: string }
      | { invoiceId: string; status: "received"; receivedDate: string; amount?: number; comment?: string },
  ) => call<Invoice>(who, "/api/admin/payments/client", json("POST", body)),
  consultantPayment: (who: Who, body: { invoiceId: string; paidDate: string; amount?: number; comment?: string; overrideReason?: string }) =>
    call<Invoice>(who, "/api/admin/payments/consultant", json("POST", body)),

  billingSummary: (who: Who, f: BillingFilters = {}) => call<BillingSummary>(who, `/api/admin/reports/billing-summary${query(f)}`),

  /** Downloads the billing summary as CSV (fetched with the token, then saved). */
  async billingCsv(who: Who, f: BillingFilters = {}) {
    const res = await send(who, `/api/admin/reports/billing-summary${query({ ...f, format: "csv" })}`);
    if (!res.ok) throw new ApiError(res.status, "Couldn't export the CSV.");
    const blob = await res.blob();
    const name = /filename="([^"]+)"/.exec(res.headers.get("content-disposition") ?? "")?.[1] ?? "billing-summary.csv";
    const href = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), { href, download: name });
    a.click();
    setTimeout(() => URL.revokeObjectURL(href), 1000);
  },
};

/** An absolute link for a short-lived signed file URL (timesheet or invoice PDF). */
export const signedHref = (url: string) => `${API_URL}${url}`;

/**
 * Opens a signed file link that has to be fetched first. The tab opens right
 * away (inside the click), so pop-up blockers allow it, then goes to the file.
 */
export async function openSignedFrom(get: () => Promise<{ url: string }>) {
  const tab = window.open("about:blank", "_blank");
  try {
    const { url } = await get();
    if (tab) {
      tab.opener = null;
      tab.location.href = signedHref(url);
    } else window.location.assign(signedHref(url));
  } catch (e) {
    tab?.close();
    throw e;
  }
}

export { ApiError };
