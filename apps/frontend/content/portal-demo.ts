// Demo data for the portal dashboard (/portal/dashboard and the pages next to
// it). Everything here is DUMMY data, so the team can see the shape of the
// universal dashboard before the real portal (AWS Cognito + a database)
// exists. Replace each list with real data per account type later.

// Clients and vendors never sign in: they use their own VMS portals or email.
// The client section is an internal tool for PixelIT staff (see staffRoles).
export type AccountType = "student" | "employee";

export const accountTypes: { id: AccountType; label: string; body: string }[] = [
  { id: "student", label: "Student", body: "I'm looking for a job through Pixel IT Center." },
  { id: "employee", label: "Employee", body: "I work for Pixel IT Center." },
];

/**
 * What a PixelIT employee may do in the client section. Set by an admin in
 * the live portal (never chosen at sign-up); the API checks it on every request.
 */
export type StaffRole = "admin" | "accounts" | "verifier" | "recruiter";

export const staffRoles: Record<StaffRole, { label: string; body: string }> = {
  admin: { label: "Admin", body: "Everything, including client records and payment overrides." },
  accounts: { label: "Accounts", body: "Confirms hours, raises invoices, records payments." },
  verifier: { label: "Verifier", body: "Checks timesheet hours against the client-approved PDF." },
  recruiter: { label: "Recruiter", body: "Sees placements. No billing data." },
};

/**
 * Demo sign-in: the email decides the account type, the way the real portal
 * will look it up in the database. Any password works. An email that isn't
 * listed signs in as a new account that still has to finish its profile.
 */
export const demoDirectory: {
  email: string;
  fullName: string;
  accountType: AccountType;
  headline: string;
  /** Students only: placed with a client, so Timesheets shows. */
  isPlaced?: boolean;
  /** Employees only: their client-section role. */
  staffRole?: StaffRole;
}[] = [
  { email: "student@pixelitcenter.com", fullName: "Manas", accountType: "student", headline: "Cloud engineer, open to work" },
  { email: "placed@pixelitcenter.com", fullName: "Manas", accountType: "student", headline: "Cloud Engineer at Brightline Finance", isPlaced: true },
  // One employee login. As admin it sees the whole client section. The other
  // staff roles exist in the API for when real accounts (Cognito) arrive.
  { email: "employee@pixelitcenter.com", fullName: "Rahul", accountType: "employee", headline: "Admin, Pixel IT Center", staffRole: "admin" },
];

export const activity: { item: string; kind: string; status: string; updated: string; next: string }[] = [
  { item: "Timesheet, September", kind: "Timesheet", status: "Approved", updated: "2 days ago", next: "October due Oct 31" },
  { item: "Offer letter, Vertex Retail", kind: "Document", status: "Signed", updated: "3 days ago", next: "Onboarding Mon" },
  { item: "Background check, Brightline Finance", kind: "Onboarding", status: "In progress", updated: "Today", next: "Results in 3 days" },
  { item: "Interview, Brightline Finance", kind: "Meeting", status: "Scheduled", updated: "1 week ago", next: "Tomorrow 14:00" },
];

export type Conversation = {
  id: string;
  name: string;
  role: string;
  unread: number;
  messages: { from: "them" | "me"; text: string; time: string }[];
};

export const conversations: Conversation[] = [
  {
    id: "mansingh",
    name: "Mansingh",
    role: "Account manager",
    unread: 2,
    messages: [
      { from: "them", text: "Hi! The Northwind kickoff moved to Tuesday 10:00.", time: "09:12" },
      { from: "them", text: "Can you confirm you can make it?", time: "09:13" },
    ],
  },
  {
    id: "hari",
    name: "Hari",
    role: "Recruiter",
    unread: 1,
    messages: [
      { from: "me", text: "Thanks for sending the Vertex Retail role.", time: "Fri" },
      { from: "them", text: "Of course. They'd like a call on Monday, does 15:00 work?", time: "Fri" },
    ],
  },
  {
    id: "support",
    name: "Pixel IT Support",
    role: "Help desk",
    unread: 1,
    messages: [{ from: "them", text: "Your VPN access request is approved.", time: "Thu" }],
  },
];

/**
 * "Today" in the demo. The demo data is written around this date (the
 * "Tomorrow" interview, the link shared 1 day before). The live portal uses
 * the real date.
 */
export const demoToday = "2026-10-11";

export type EventKind = "Interview" | "Call" | "Meeting" | "Deadline";

/** One thing on the calendar. `date` is YYYY-MM-DD; times are 24-hour, ET. */
export type CalEvent = {
  id: string;
  date: string;
  time: string;
  end?: string;
  title: string;
  kind: EventKind;
  with: string;
};

export const events: CalEvent[] = [
  { id: "e1", date: "2026-10-06", time: "11:00", end: "12:00", title: "AWS migration plan review", kind: "Meeting", with: "Rahul, Mansingh" },
  { id: "e2", date: "2026-10-09", time: "17:00", title: "Week 40 timesheet due", kind: "Deadline", with: "Payroll" },
  { id: "e3", date: "2026-10-11", time: "18:00", title: "Week 41 timesheet closes", kind: "Deadline", with: "Payroll" },
  { id: "e4", date: "2026-10-12", time: "14:00", end: "15:00", title: "Interview, Brightline Finance", kind: "Interview", with: "Hiring panel" },
  { id: "e5", date: "2026-10-12", time: "15:00", end: "15:30", title: "Call about the Vertex Retail role", kind: "Call", with: "Hari" },
  { id: "e6", date: "2026-10-13", time: "10:00", end: "11:00", title: "Northwind Health kickoff", kind: "Meeting", with: "Mansingh, Rahul" },
  { id: "e7", date: "2026-10-13", time: "16:00", end: "17:00", title: "Quarterly review, Northwind Health", kind: "Meeting", with: "Mansingh" },
  { id: "e8", date: "2026-10-16", time: "17:00", title: "Week 42 timesheet due", kind: "Deadline", with: "Payroll" },
  { id: "e9", date: "2026-10-20", time: "11:00", end: "11:45", title: "Sprint review, Vertex Retail", kind: "Meeting", with: "Hari" },
  { id: "e10", date: "2026-10-23", time: "15:00", end: "15:30", title: "Check-in with your account manager", kind: "Call", with: "Mansingh" },
  { id: "e11", date: "2026-10-30", time: "09:00", title: "GCP data platform go-live", kind: "Deadline", with: "Mansingh" },
];

export const documents: { id: string; name: string; category: string; size: string; updated: string; by: string }[] = [
  { id: "d1", name: "Offer letter, Vertex Retail.pdf", category: "Contracts", size: "182 KB", updated: "Oct 8", by: "Hari" },
  { id: "d2", name: "NDA, Northwind Health.pdf", category: "Contracts", size: "96 KB", updated: "Oct 6", by: "Mansingh" },
  { id: "d3", name: "AWS migration plan v2.docx", category: "Projects", size: "1.4 MB", updated: "Oct 5", by: "Rahul" },
  { id: "d4", name: "Statement of work, Brightline Finance.pdf", category: "Contracts", size: "240 KB", updated: "Oct 1", by: "Mansingh" },
  { id: "d5", name: "Timesheet, week 40.xlsx", category: "Timesheets", size: "48 KB", updated: "Oct 4", by: "You" },
];

export const notifications: { id: string; title: string; body: string; time: string }[] = [
  { id: "n1", title: "Kickoff moved", body: "Northwind Health kickoff is now Tue 10:00.", time: "1h" },
  { id: "n2", title: "Timesheet approved", body: "September was approved by Accounts.", time: "2d" },
  { id: "n3", title: "New document", body: "Hari shared the Vertex Retail offer letter.", time: "3d" },
];

export const faqs: { q: string; a: string }[] = [
  { q: "Where are timesheets and invoices?", a: "Staff with a client-section role (admin, accounts, verifier) find them in the menu under Client section. Clients never sign in here." },
  { q: "Who do I contact about an invoice?", a: "The accounts team, at accounts@pixelitcenter.com. Quote the invoice number (PIX-…)." },
  { q: "How do I change my account type?", a: "Your account type comes from your profile. Email support if it is wrong and we'll fix it." },
  { q: "Is my data safe?", a: "Yes. The live portal will sign you in through a secure provider. This page is a demo and saves nothing to a server." },
];

export const tickets: { id: string; subject: string; status: "Open" | "Resolved"; updated: string }[] = [
  { id: "SUP-214", subject: "VPN access for Northwind", status: "Resolved", updated: "Thu" },
  { id: "SUP-219", subject: "Laptop for the Vertex Retail start", status: "Open", updated: "Today" },
];
