// Who can sign in to the portal, and as what. Clients and vendors are not on this
// list: they never sign in (they use their own VMS portals or email).
//
//   student   a job seeker; once placed, a consultant who uploads timesheets
//   recruiter markets students; sees placements, never billing data
//   verifier  checks timesheet hours against the client-approved PDF
//   accounts  confirms timesheet hours (the accounts check); reads clients; no money
//   admin     everything, including billing, client records and payment overrides

export const ROLES = ["student", "recruiter", "verifier", "accounts", "admin"] as const;

export type Role = (typeof ROLES)[number];

export type Actor = { userId: string; role: Role; email?: string; ip?: string; userAgent?: string };

/** Who may see money: bill rates, pay rates, invoices, payments, billing reports. Admins only. */
export const FINANCE_ROLES = ["admin"] as const satisfies readonly Role[];

export const canSeeMoney = (role: Role) => (FINANCE_ROLES as readonly Role[]).includes(role);

/** Scheduled jobs act as this user in logs and audit trails. */
export const SYSTEM_ACTOR: Actor = { userId: "system", role: "admin" };
