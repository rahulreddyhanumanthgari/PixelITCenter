// Demo data for the STUDENT corner of the portal: what a job seeker sees
// after signing in (jobs, interviews, resume, documents, timesheets).
// DUMMY data, like content/portal-demo.ts.
//
// Swapping in the real API: each export below stands for one future endpoint
// (noted next to it). Pages read these lists directly and keep what the
// student changes in the demo session (components/portal/dashboard/session.ts),
// so moving to the API means replacing these imports and the session helpers
// with fetches. The page components stay as they are.

import type { CalEvent } from "./portal-demo";

// --- Jobs ------------------------------------------------------------------------
// Posted by admins on the employee/admin side. Students only view them; PixelIT's
// recruiters submit the student's resume. GET /api/student/jobs

export type Employment = "Permanent" | "Contract" | "Part-time";
export type WorkMode = "Remote" | "Hybrid" | "On-site";

export type Job = {
  id: string;
  title: string;
  company: string;
  /** City, State; or "Anywhere in the US" for remote roles. */
  location: string;
  employment: Employment;
  workMode: WorkMode;
  skills: string[];
  posted: string;
  /** Two lines for the card. The full JD is on the job's own page. */
  brief: string;
  // --- the full JD (job page) ---
  pay: string;
  /** Contract length, or hours for part-time. */
  term: string;
  start: string;
  openings: number;
  recruiter: "Hari" | "Mansingh";
  about: string;
  duties: string[];
  mustHave: string[];
  niceToHave: string[];
  /** Steps only, no people's names: "Recruiter screen", "Technical assessment"… */
  interviewSteps: string[];
  companyAbout: string;
};

export const jobs: Job[] = [
  {
    id: "j1",
    title: "Cloud Engineer (AWS)",
    company: "Brightline Finance",
    location: "Charlotte, NC",
    employment: "Permanent",
    workMode: "Hybrid",
    skills: ["AWS", "Terraform", "Python"],
    posted: "3 days ago",
    brief: "Build and run the AWS platform behind daily risk reporting, with a small team that owns it end to end.",
    pay: "$115,000 – $130,000 a year",
    term: "Permanent, full time",
    start: "Nov 2",
    openings: 2,
    recruiter: "Hari",
    about:
      "Brightline's risk team runs reports every morning before the markets open. You'll keep the AWS platform under those reports fast, secure and cheap to run, and help move the last on-prem jobs to the cloud.",
    duties: [
      "Build and change AWS infrastructure with Terraform.",
      "Automate deploys and checks with GitHub Actions.",
      "Watch cost and performance; fix what slows the morning run.",
      "Work with data engineers on new reporting pipelines.",
    ],
    mustHave: ["1+ year with AWS (EC2, S3, IAM, VPC)", "Terraform in a real project", "Python or Bash scripting", "Comfortable on Linux"],
    niceToHave: ["AWS certification", "Experience in finance or other regulated work"],
    interviewSteps: ["Recruiter screen (20 min)", "Online technical assessment (60 min)", "Technical interview 1: AWS and Terraform (60 min)", "Technical interview 2: system design (60 min)", "Final round: team fit (45 min)"],
    companyAbout: "A mid-size financial services firm in Charlotte. Hybrid: 2 days a week in the office.",
  },
  {
    id: "j2",
    title: "DevOps Engineer",
    company: "Vertex Retail",
    location: "Anywhere in the US",
    employment: "Contract",
    workMode: "Remote",
    skills: ["GitHub Actions", "Docker", "AWS"],
    posted: "1 week ago",
    brief: "Own the CI/CD pipelines and release automation for 30+ services behind Vertex's online store.",
    pay: "$65 – $75 an hour",
    term: "12-month contract, likely to extend",
    start: "As soon as possible",
    openings: 1,
    recruiter: "Hari",
    about:
      "Vertex ships its online store many times a day. You'll keep the pipelines that build, test and deploy it reliable, and make releases quicker and safer.",
    duties: [
      "Maintain and improve GitHub Actions pipelines.",
      "Package services with Docker and deploy them to AWS.",
      "Cut build times and flaky tests.",
      "Help developers when a deploy goes wrong.",
    ],
    mustHave: ["CI/CD pipelines you built or ran", "Docker", "AWS basics", "Git and pull-request workflow"],
    niceToHave: ["Kubernetes", "Experience with retail or e-commerce sites"],
    interviewSteps: ["Recruiter screen (20 min)", "Technical assessment: take-home pipeline task", "Technical interview: pipeline design (60 min)", "Final round with the hiring manager (30 min)"],
    companyAbout: "A national retailer with 400 stores and a fast-growing online shop. Fully remote team.",
  },
  {
    id: "j3",
    title: "Junior Site Reliability Engineer",
    company: "Northwind Health",
    location: "Raleigh, NC",
    employment: "Permanent",
    workMode: "On-site",
    skills: ["Linux", "Monitoring", "AWS"],
    posted: "2 weeks ago",
    brief: "Keep patient-facing systems up and fast. Join the on-call rotation after your first 3 months.",
    pay: "$85,000 – $95,000 a year",
    term: "Permanent, full time",
    start: "Dec 1",
    openings: 1,
    recruiter: "Mansingh",
    about:
      "Northwind's patient portal and scheduling systems have to work around the clock. You'll learn the systems from senior SREs, then help keep them healthy and respond when they aren't.",
    duties: [
      "Watch dashboards and alerts; fix issues before patients notice.",
      "Write runbooks for common problems.",
      "Automate routine tasks with scripts.",
      "Join the on-call rotation after 3 months (paid extra).",
    ],
    mustHave: ["Linux administration", "Basic networking (DNS, HTTP, TCP)", "Scripting in Bash or Python"],
    niceToHave: ["Grafana or CloudWatch", "Healthcare or other always-on systems"],
    interviewSteps: ["Recruiter screen (30 min)", "Technical assessment: Linux and networking (45 min)", "Technical interview (60 min)", "Final round: on-site visit"],
    companyAbout: "A regional healthcare network with 12 hospitals. On-site at the Raleigh tech centre.",
  },
  {
    id: "j4",
    title: "Cloud Support Associate",
    company: "Atlas Logistics",
    location: "Anywhere in the US",
    employment: "Part-time",
    workMode: "Remote",
    skills: ["AWS", "Networking"],
    posted: "2 days ago",
    brief: "Help Atlas teams fix AWS networking and access problems. Flexible weekday hours.",
    pay: "$35 – $40 an hour",
    term: "20–25 hours a week",
    start: "Oct 26",
    openings: 2,
    recruiter: "Mansingh",
    about:
      "Atlas teams open tickets when they can't reach a server or don't have the right access. You'll answer them, fix what you can and pass the rest on with clear notes.",
    duties: [
      "Answer AWS support tickets from internal teams.",
      "Fix IAM permissions and security-group rules.",
      "Write short how-to guides for repeat questions.",
    ],
    mustHave: ["AWS basics (IAM, VPC, EC2)", "Clear written English", "Patient with non-technical people"],
    niceToHave: ["AWS Cloud Practitioner", "Help-desk experience"],
    interviewSteps: ["Recruiter screen (20 min)", "Technical assessment: 3 sample tickets (45 min)", "Final round (30 min)"],
    companyAbout: "A freight and warehousing company moving its systems to AWS. Fully remote support team.",
  },
  {
    id: "j5",
    title: "Infrastructure Engineer",
    company: "Oakridge Labs",
    location: "Durham, NC",
    employment: "Contract",
    workMode: "Hybrid",
    skills: ["Terraform", "Azure", "Kubernetes"],
    posted: "Today",
    brief: "Move lab systems to infrastructure as code across Azure and AWS, then hand over clean runbooks.",
    pay: "$70 – $80 an hour",
    term: "6-month contract",
    start: "Nov 9",
    openings: 1,
    recruiter: "Hari",
    about:
      "Oakridge's lab systems were set up by hand over many years. You'll rebuild them as Terraform so they can be recreated in minutes, on Azure first and AWS later.",
    duties: [
      "Write Terraform for existing Azure systems.",
      "Run small workloads on Kubernetes.",
      "Document every system you move.",
    ],
    mustHave: ["Terraform", "Azure or AWS", "Kubernetes basics"],
    niceToHave: ["Lab or research environments", "Ansible"],
    interviewSteps: ["Recruiter screen (20 min)", "Technical assessment: take-home Terraform task", "Technical interview (60 min)"],
    companyAbout: "A life-sciences research company. Hybrid: Tuesdays and Thursdays in Durham.",
  },
  {
    id: "j6",
    title: "Build and Release Engineer",
    company: "Cedar Systems",
    location: "Anywhere in the US",
    employment: "Contract",
    workMode: "Remote",
    skills: ["Jenkins", "Linux", "Python"],
    posted: "5 days ago",
    brief: "Keep builds fast and green for a 200-engineer team, and plan the move from Jenkins to GitHub Actions.",
    pay: "$60 – $70 an hour",
    term: "9-month contract",
    start: "Nov 16",
    openings: 1,
    recruiter: "Mansingh",
    about:
      "Cedar's engineers wait too long for builds. You'll speed up the Jenkins setup they have today and plan the move to GitHub Actions.",
    duties: [
      "Look after Jenkins jobs and build agents.",
      "Find and fix slow or flaky builds.",
      "Plan and start the move to GitHub Actions.",
    ],
    mustHave: ["Jenkins or another CI tool", "Linux", "Python scripting"],
    niceToHave: ["GitHub Actions", "Large codebases"],
    interviewSteps: ["Recruiter screen (20 min)", "Technical assessment: build-pipeline task (60 min)", "Technical interview (60 min)", "Final round with the engineering manager (30 min)"],
    companyAbout: "A software company making scheduling tools for clinics. Fully remote.",
  },
];

/** Where PixelIT is with the student's resume for each job. */
export type SubmissionStatus = "Not Submitted" | "Resume Submitted" | "Under Review" | "Interview Scheduled" | "Placed" | "Rejected";

export const submissionStatuses: { status: SubmissionStatus; help: string }[] = [
  { status: "Not Submitted", help: "Your recruiter hasn't sent your resume for this role yet." },
  { status: "Resume Submitted", help: "Your recruiter sent your resume to the client." },
  { status: "Under Review", help: "The client is looking at your resume." },
  { status: "Interview Scheduled", help: "The client wants to meet you. See Interviews." },
  { status: "Placed", help: "You got the role. Congratulations!" },
  { status: "Rejected", help: "The client chose someone else this time. Your recruiter keeps looking." },
];

/** Status per job (job id → status). Missing = Not Submitted. Part of GET /api/student/jobs. */
export const jobStatuses: Record<string, SubmissionStatus> = {
  j1: "Under Review",
  j2: "Interview Scheduled",
  j3: "Interview Scheduled",
  j4: "Resume Submitted",
  j6: "Rejected",
};

/** The placed demo student (placed@pixelitcenter.com) got the Brightline role. */
export const placedJobStatuses: Record<string, SubmissionStatus> = {
  j1: "Placed",
  j2: "Rejected",
  j4: "Resume Submitted",
};

// --- Interviews -------------------------------------------------------------
// GET /api/student/interviews

export type Interview = {
  id: string;
  company: string;
  role: string;
  round: string;
  /** Calendar-style date block. */
  weekday: string;
  day: string;
  month: string;
  date: string;
  time: string;
  /** "Tomorrow", "In 3 days". */
  relative: string;
  format: string;
  with: string;
  /**
   * The meeting link is shared 1 day before the interview. Until then it's
   * null and the card says when it will appear (`linkOn`). The live portal
   * works this out from the date; here it's fixed for the demo.
   */
  link: string | null;
  linkOn: string;
  prep: string;
};

export const interviews: Interview[] = [
  {
    id: "i1",
    company: "Vertex Retail",
    role: "DevOps Engineer",
    round: "Technical interview",
    weekday: "Mon",
    day: "12",
    month: "Oct",
    date: "Mon, Oct 12",
    time: "14:00 – 15:00 (ET)",
    relative: "Tomorrow",
    format: "Video call · Google Meet",
    with: "Hiring manager and a senior engineer",
    link: "meet.google.com/vtx-dvop-1412",
    linkOn: "Sun, Oct 11",
    prep: "Expect a live pipeline design. Go over your GitHub Actions project: it's your best example.",
  },
  {
    id: "i2",
    company: "Northwind Health",
    role: "Junior Site Reliability Engineer",
    round: "Recruiter screen",
    weekday: "Wed",
    day: "14",
    month: "Oct",
    date: "Wed, Oct 14",
    time: "11:00 – 11:30 (ET)",
    relative: "In 3 days",
    format: "Video call · Microsoft Teams",
    with: "Talent partner",
    link: null,
    linkOn: "Tue, Oct 13",
    prep: "30 minutes on your background and availability. Keep your story to 2 minutes.",
  },
];

export type PastInterview = { id: string; company: string; role: string; round: string; date: string; time: string; format: string };

export const pastInterviews: PastInterview[] = [
  { id: "p1", company: "Vertex Retail", role: "DevOps Engineer", round: "Recruiter screen", date: "Wed, Oct 7", time: "11:00 – 11:20 (ET)", format: "Phone call" },
  { id: "p2", company: "Cedar Systems", role: "Build and Release Engineer", round: "Technical interview", date: "Tue, Sep 29", time: "15:00 – 16:00 (ET)", format: "Video call · Zoom" },
];

/** Email reminders for interviews. UI only for now. PUT /api/student/notification-settings */
export const defaultReminders = { onSchedule: true, before24h: true, before1h: true };

// --- Calendar ----------------------------------------------------------------
// GET /api/student/calendar

export const studentEvents: CalEvent[] = [
  { id: "s1", date: "2026-10-02", time: "15:00", end: "15:30", title: "Resume review", kind: "Call", with: "Mansingh" },
  { id: "s2", date: "2026-10-07", time: "11:00", end: "11:20", title: "Vertex Retail, recruiter screen", kind: "Interview", with: "Talent partner" },
  { id: "s4", date: "2026-10-12", time: "10:00", end: "10:30", title: "Prep call for the Vertex Retail interview", kind: "Call", with: "Hari" },
  { id: "s5", date: "2026-10-12", time: "14:00", end: "15:00", title: "Vertex Retail, technical interview", kind: "Interview", with: "Hiring manager and a senior engineer" },
  { id: "s6", date: "2026-10-13", time: "16:00", end: "16:30", title: "PixelIT check-in call", kind: "Call", with: "Mansingh" },
  { id: "s7", date: "2026-10-14", time: "11:00", end: "11:30", title: "Northwind Health, recruiter screen", kind: "Interview", with: "Talent partner" },
  { id: "s8", date: "2026-10-14", time: "18:00", title: "Send two references to Hari", kind: "Deadline", with: "Hari" },
  { id: "s9", date: "2026-10-13", time: "09:30", end: "10:00", title: "Prep call for the Northwind Health interview", kind: "Call", with: "Hari" },
];

/**
 * Times the student says they can take interviews. Recruiters read these
 * instead of calling when a client asks for times.
 * GET / POST / DELETE /api/student/availability (recruiters: GET /api/admin/students/:id/availability)
 */
export type AvailabilitySlot = { id: string; date: string; start: string; end: string; timezone: string };

export const TIMEZONES = ["ET", "CT", "MT", "PT", "AKT", "HT"];

export const starterAvailability: AvailabilitySlot[] = [
  { id: "a1", date: "2026-10-15", start: "09:00", end: "12:00", timezone: "ET" },
  { id: "a2", date: "2026-10-16", start: "13:00", end: "17:00", timezone: "ET" },
];

// --- Messages (front-end placeholder) -------------------------------------------

export const studentConversations: {
  id: string;
  name: string;
  role: string;
  unread: number;
  messages: { from: "them" | "me"; text: string; time: string }[];
}[] = [
  {
    id: "hari",
    name: "Hari",
    role: "Your recruiter",
    unread: 2,
    messages: [
      { from: "them", text: "I sent your resume to Atlas Logistics for the Cloud Support Associate role.", time: "09:40" },
      { from: "them", text: "Also, Vertex Retail confirmed Monday 14:00 for the technical round.", time: "09:41" },
    ],
  },
  {
    id: "mansingh",
    name: "Mansingh",
    role: "Placement lead",
    unread: 1,
    messages: [
      { from: "me", text: "I've uploaded a new version of my resume.", time: "Fri" },
      { from: "them", text: "Thanks. I left feedback in the Resume corner.", time: "Fri" },
    ],
  },
  {
    id: "support",
    name: "Pixel IT Support",
    role: "Help desk",
    unread: 0,
    messages: [
      { from: "them", text: "Your visa copy is uploaded and checked.", time: "Wed" },
      { from: "me", text: "Got it, thanks!", time: "Wed" },
    ],
  },
];

// --- Resume corner -----------------------------------------------------------------
// One resume with its versions. Recruiters review the latest version and leave
// feedback; students only read it.
// GET /api/student/resume, POST /api/student/resume/versions

export type ResumeStatus = "Pending Review" | "Needs Changes" | "Approved";

export type ResumeVersion = { id: string; version: number; fileName: string; size: string; uploaded: string };

export const resumeVersions: ResumeVersion[] = [
  { id: "v2", version: 2, fileName: "Manas_Resume_v2.pdf", size: "148 KB", uploaded: "Oct 9" },
  { id: "v1", version: 1, fileName: "Manas_Resume.docx", size: "96 KB", uploaded: "Sep 15" },
];

/** Status of the latest version. Set by the recruiter; a new upload resets it to Pending Review. */
export const resumeStatus: ResumeStatus = "Needs Changes";

export type ResumeFeedback = { id: string; versionId: string; author: string; role: string; date: string; text: string };

export const resumeFeedback: ResumeFeedback[] = [
  { id: "f1", versionId: "v2", author: "Mansingh", role: "Placement lead", date: "Oct 10", text: "Strong summary. Put the Terraform project first and add numbers, e.g. 'cut deploy time from 20 to 5 minutes'." },
  { id: "f2", versionId: "v2", author: "Hari", role: "Recruiter", date: "Oct 10", text: "Clients search for 'AWS', 'Terraform' and 'CI/CD'. Make sure all three are in your skills line." },
  { id: "f3", versionId: "v1", author: "Mansingh", role: "Placement lead", date: "Sep 17", text: "Two pages is too long. Cut your older jobs to one line each and send a PDF." },
];

export const resumeChecklist: { id: string; text: string; done: boolean }[] = [
  { id: "c1", text: "One page, clear headings", done: true },
  { id: "c2", text: "Summary in 2–3 lines", done: true },
  { id: "c3", text: "Projects with tools and results", done: true },
  { id: "c4", text: "Certifications with dates", done: false },
  { id: "c5", text: "LinkedIn link", done: false },
];

// --- Documents -------------------------------------------------------------------------
// Only these types. GET / POST / DELETE /api/student/documents

export type StudentDocType = "resume" | "id" | "utility" | "passport" | "visa";

export type StudentDoc = { id: string; type: StudentDocType; fileName: string; size: string; uploaded: string; expires?: string };

export const starterStudentDocs: StudentDoc[] = [
  { id: "d1", type: "resume", fileName: "Manas_Resume_v2.pdf", size: "148 KB", uploaded: "Oct 9" },
  { id: "d2", type: "id", fileName: "Drivers_License.jpg", size: "520 KB", uploaded: "Jul 12", expires: "Dec 2026" },
  { id: "d3", type: "visa", fileName: "H1B_Visa.pdf", size: "410 KB", uploaded: "Jul 12", expires: "Mar 2027" },
];

/** Sent by PixelIT (offer letters, agreements). Students download only. GET /api/student/documents/from-pixelit */
export const fromPixelitDocs: { id: string; name: string; size: string; sent: string; by: string }[] = [
  { id: "x1", name: "Welcome to PixelIT.pdf", size: "120 KB", sent: "Jul 10", by: "Mansingh" },
  { id: "x2", name: "Marketing consent form.pdf", size: "84 KB", sent: "Jul 12", by: "Hari" },
];

export const placedFromPixelitDocs = [{ id: "x3", name: "Offer letter, Brightline Finance.pdf", size: "188 KB", sent: "Jul 28", by: "Hari" }, ...fromPixelitDocs];

// --- Timesheets (placed students only) ------------------------------------------------

/** Set by admins; read-only for the student. GET /api/student/placement */
export const placement = { client: "Brightline Finance", role: "Cloud Engineer (AWS)", hourlyRate: 65, startDate: "Aug 3, 2026" };

export type TimesheetStatus = "Submitted" | "Under Verification" | "Approved" | "Invoiced" | "Paid";

export const timesheetStatuses: { status: TimesheetStatus; help: string }[] = [
  { status: "Submitted", help: "We have it. Accounts checks it next." },
  { status: "Under Verification", help: "Accounts is checking your hours against the client-approved sheet." },
  { status: "Approved", help: "Hours confirmed. The invoice is made next." },
  { status: "Invoiced", help: "PixelIT has invoiced the client for this month." },
  { status: "Paid", help: "Paid. Check your payslip." },
];

export type Timesheet = { id: string; month: string; hours: number; leaveDays: number; leaveNote: string; fileName: string; submitted: string; status: TimesheetStatus };

/** GET / POST /api/student/timesheets */
export const starterTimesheets: Timesheet[] = [
  { id: "t2", month: "2026-09", hours: 160, leaveDays: 1, leaveNote: "Personal day on Sep 18.", fileName: "Timesheet_Sep_2026_signed.pdf", submitted: "Oct 1", status: "Under Verification" },
  { id: "t1", month: "2026-08", hours: 168, leaveDays: 0, leaveNote: "", fileName: "Timesheet_Aug_2026_signed.pdf", submitted: "Sep 1", status: "Paid" },
];

// --- Help ----------------------------------------------------------------------------

export const studentContacts: { name: string; role: string; email: string }[] = [
  { name: "Hari", role: "Your recruiter", email: "hari@pixelitcenter.com" },
  { name: "Mansingh", role: "Placement lead", email: "mansingh@pixelitcenter.com" },
  { name: "Accounts", role: "Timesheets and pay", email: "accounts@pixelitcenter.com" },
];

/** Office hours, Eastern Time, Monday to Friday. */
export const officeHours = { open: 9, close: 18, label: "Mon–Fri, 9am–6pm ET" };

export const studentFaqs: { q: string; a: string }[] = [
  { q: "How do I apply to a job?", a: "You don't need to. PixelIT's recruiters send your resume to matching openings. Open Jobs to see where it has been sent and how it's going." },
  { q: "When do I get the interview link?", a: "One day before the interview. It appears on the Interviews page, and your recruiter emails it too." },
  { q: "A client wants interview times. Do I need to call?", a: "No. Add the times you're free under Calendar → Availability. Your recruiter checks them there." },
  { q: "My ID is expiring. What should I do?", a: "Upload the new one under Documents before it expires so nothing is delayed." },
];

// --- Notifications --------------------------------------------------------------------
// GET /api/student/notifications. In-app only for now; email delivery of the
// same events comes later.

export type StudentNotification = {
  id: string;
  kind: "interview" | "resume-feedback" | "resume-status" | "timesheet";
  title: string;
  body: string;
  time: string;
  href: string;
};

export const studentNotifications: StudentNotification[] = [
  { id: "sn1", kind: "interview", title: "Interview scheduled", body: "Vertex Retail, Mon Oct 12, 14:00 ET, technical round.", time: "2h", href: "/portal/interviews" },
  { id: "sn2", kind: "resume-feedback", title: "Resume feedback received", body: "Mansingh left feedback on version 2.", time: "1d", href: "/portal/resume" },
  { id: "sn3", kind: "resume-status", title: "Resume status changed", body: "Version 2 needs changes. See the feedback.", time: "1d", href: "/portal/resume" },
];

/** Only placed students get these. */
export const placedNotifications: StudentNotification[] = [
  { id: "sn4", kind: "timesheet", title: "Timesheet status changed", body: "September is under verification.", time: "3d", href: "/portal/timesheets" },
];
