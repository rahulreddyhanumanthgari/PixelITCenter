// Demo data for the portal dashboard (/portal/dashboard and the pages next to
// it). Everything here is DUMMY data, so the team can see the shape of the
// universal dashboard before the real portal (AWS Cognito + a database)
// exists. Replace each list with real data per account type later.

export type AccountType = "student" | "employee" | "client";

export const accountTypes: { id: AccountType; label: string; body: string }[] = [
  { id: "student", label: "Student", body: "I'm looking for a job through Pixel IT Center." },
  { id: "employee", label: "Employee", body: "I work for Pixel IT Center." },
  { id: "client", label: "Client", body: "My company works with Pixel IT Center." },
];

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
}[] = [
  { email: "student@pixelitcenter.com", fullName: "Manas", accountType: "student", headline: "Cloud engineer, open to work" },
  { email: "employee@pixelitcenter.com", fullName: "Rahul", accountType: "employee", headline: "Senior DevOps consultant" },
  { email: "client@pixelitcenter.com", fullName: "Joya", accountType: "client", headline: "IT Director, Northwind Health" },
];

export type Status = "On track" | "At risk" | "Completed" | "Starting";

export const projects: {
  id: string;
  name: string;
  org: string;
  area: string;
  status: Status;
  progress: number;
  body: string;
  due: string;
  team: string[];
}[] = [
  {
    id: "aws-migration",
    name: "AWS cloud migration",
    org: "Northwind Health",
    area: "Cloud",
    status: "On track",
    progress: 68,
    body: "Move 40 on-prem services to AWS with zero downtime for patient systems.",
    due: "Dec 12",
    team: ["Rahul", "Mansingh", "Hari"],
  },
  {
    id: "qa-suite",
    name: "QA automation suite",
    org: "Vertex Retail",
    area: "QA Automation",
    status: "At risk",
    progress: 42,
    body: "Replace manual regression tests with a Playwright suite running in CI.",
    due: "Nov 3",
    team: ["Hari", "Manas"],
  },
  {
    id: "gcp-data",
    name: "GCP data platform",
    org: "Brightline Finance",
    area: "Big Data",
    status: "On track",
    progress: 85,
    body: "BigQuery warehouse and dashboards for daily risk reporting.",
    due: "Oct 30",
    team: ["Mansingh", "Hari"],
  },
  {
    id: "security-review",
    name: "Security assessment",
    org: "Atlas Logistics",
    area: "Cybersecurity",
    status: "Starting",
    progress: 12,
    body: "Risk assessment and penetration test ahead of SOC 2 audit.",
    due: "Jan 20",
    team: ["Rahul"],
  },
  {
    id: "devops-pipeline",
    name: "DevOps pipeline rebuild",
    org: "Oakridge Labs",
    area: "DevOps",
    status: "Completed",
    progress: 100,
    body: "GitHub Actions pipeline with blue-green deploys to Azure.",
    due: "Sep 28",
    team: ["Hari", "Rahul"],
  },
];

export const stats = [
  { id: "projects", label: "Active projects", value: "4", trend: "+1", note: "vs last month" },
  { id: "tasks", label: "Open tasks", value: "5", trend: "-3", note: "vs last week" },
  { id: "meetings", label: "Meetings this week", value: "3", note: "Next: Tue 10:00" },
  { id: "messages", label: "Unread messages", value: "4", note: "2 need a reply" },
] as const;

export const activity: { item: string; kind: string; status: string; updated: string; next: string }[] = [
  { item: "Timesheet, week 40", kind: "Timesheet", status: "Approved", updated: "2 days ago", next: "Week 41 due Fri" },
  { item: "Invoice INV-1042", kind: "Billing", status: "Paid", updated: "Yesterday", next: "None" },
  { item: "Offer letter, Vertex Retail", kind: "Document", status: "Signed", updated: "3 days ago", next: "Onboarding Mon" },
  { item: "Background check, Brightline Finance", kind: "Onboarding", status: "In progress", updated: "Today", next: "Results in 3 days" },
  { item: "Interview, Brightline Finance", kind: "Meeting", status: "Scheduled", updated: "1 week ago", next: "Tomorrow 14:00" },
];

export type Priority = "High" | "Medium" | "Normal";
export type Task = { id: string; title: string; priority: Priority; done: boolean; due: string };

export const starterTasks: Task[] = [
  { id: "t1", title: "Submit timesheet for week 41", priority: "High", done: false, due: "Today" },
  { id: "t2", title: "Review AWS migration plan", priority: "Medium", done: true, due: "Today" },
  { id: "t3", title: "Upload signed NDA", priority: "Normal", done: false, due: "Tomorrow" },
  { id: "t4", title: "Sign the updated contractor agreement", priority: "Medium", done: false, due: "Wed" },
  { id: "t5", title: "Reply to Mansingh about the kickoff", priority: "Normal", done: false, due: "Thu" },
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
  {
    id: "joya",
    name: "Joya",
    role: "Client, Northwind Health",
    unread: 0,
    messages: [
      { from: "them", text: "Thanks for the migration update. Can we go through the cutover plan on Tuesday?", time: "Wed" },
      { from: "me", text: "Yes, I'll bring the runbook.", time: "Wed" },
    ],
  },
];

export const events: { day: string; date: string; items: { time: string; title: string; kind: string; with: string }[] }[] = [
  {
    day: "Today",
    date: "Sun, Oct 11",
    items: [{ time: "18:00", title: "Week 41 timesheet closes", kind: "Deadline", with: "Payroll" }],
  },
  {
    day: "Tomorrow",
    date: "Mon, Oct 12",
    items: [
      { time: "14:00", title: "Interview, Brightline Finance", kind: "Interview", with: "Hiring panel" },
      { time: "15:00", title: "Call about the Vertex Retail role", kind: "Call", with: "Hari" },
    ],
  },
  {
    day: "Tuesday",
    date: "Tue, Oct 13",
    items: [
      { time: "10:00", title: "Northwind Health kickoff", kind: "Meeting", with: "Mansingh, Rahul" },
      { time: "16:00", title: "Quarterly review, Northwind Health", kind: "Meeting", with: "Joya" },
    ],
  },
];

export const documents: { id: string; name: string; category: string; size: string; updated: string; by: string }[] = [
  { id: "d1", name: "Offer letter, Vertex Retail.pdf", category: "Contracts", size: "182 KB", updated: "Oct 8", by: "Hari" },
  { id: "d2", name: "NDA, Northwind Health.pdf", category: "Contracts", size: "96 KB", updated: "Oct 6", by: "Mansingh" },
  { id: "d3", name: "AWS migration plan v2.docx", category: "Projects", size: "1.4 MB", updated: "Oct 5", by: "Rahul" },
  { id: "d4", name: "Statement of work, Brightline Finance.pdf", category: "Contracts", size: "240 KB", updated: "Oct 1", by: "Mansingh" },
  { id: "d5", name: "Timesheet, week 40.xlsx", category: "Timesheets", size: "48 KB", updated: "Oct 4", by: "You" },
];

export const invoices: { id: string; title: string; amount: string; issued: string; due: string; status: "Paid" | "Due" | "Overdue" }[] = [
  { id: "INV-1045", title: "AWS migration, October", amount: "$12,400.00", issued: "Oct 1", due: "Oct 31", status: "Due" },
  { id: "INV-1042", title: "QA automation, September", amount: "$8,250.00", issued: "Sep 1", due: "Sep 30", status: "Paid" },
  { id: "INV-1038", title: "Security assessment, deposit", amount: "$3,000.00", issued: "Aug 20", due: "Sep 19", status: "Overdue" },
  { id: "INV-1031", title: "DevOps pipeline, final", amount: "$6,900.00", issued: "Aug 1", due: "Aug 31", status: "Paid" },
];

export const billingSummary = [
  { label: "Outstanding", value: "$15,400", note: "2 invoices" },
  { label: "Paid this year", value: "$48,150", note: "11 invoices" },
  { label: "Next due", value: "Oct 31", note: "INV-1045" },
] as const;

export const notifications: { id: string; title: string; body: string; time: string }[] = [
  { id: "n1", title: "Kickoff moved", body: "Northwind Health kickoff is now Tue 10:00.", time: "1h" },
  { id: "n2", title: "Timesheet approved", body: "Week 40 was approved by Payroll.", time: "2d" },
  { id: "n3", title: "New document", body: "Hari shared the Vertex Retail offer letter.", time: "3d" },
  { id: "n4", title: "Invoice paid", body: "INV-1042 was paid. Thank you!", time: "4d" },
];

export const faqs: { q: string; a: string }[] = [
  { q: "How do I submit a timesheet?", a: "Open Tasks, pick the timesheet task and upload it under Documents. Payroll approves it within two working days." },
  { q: "Who do I contact about an invoice?", a: "Your account manager, or info@pixelitcenter.com. Quote the invoice number (INV-…)." },
  { q: "How do I change my account type?", a: "Your account type comes from your profile. Email support if it is wrong and we'll fix it." },
  { q: "Is my data safe?", a: "Yes. The live portal will sign you in through a secure provider. This page is a demo and saves nothing to a server." },
];

export const tickets: { id: string; subject: string; status: "Open" | "Resolved"; updated: string }[] = [
  { id: "SUP-214", subject: "VPN access for Northwind", status: "Resolved", updated: "Thu" },
  { id: "SUP-219", subject: "Laptop for the Vertex Retail start", status: "Open", updated: "Today" },
];
