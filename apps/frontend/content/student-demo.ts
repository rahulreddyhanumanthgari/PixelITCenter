// Demo data for the STUDENT corner of the portal: what a job seeker sees
// after signing in (resume, jobs, interviews, recruiters). DUMMY data,
// like content/portal-demo.ts; replace with real data when the portal exists.

import type { CalEvent } from "./portal-demo";

export const studentStats = [
  { id: "jobs", label: "Jobs for you", value: "6", note: "2 new this week" },
  { id: "applications", label: "Applications", value: "5", note: "1 offer" },
  { id: "interviews", label: "Interviews this week", value: "2", note: "Next: Mon 14:00" },
  { id: "messages", label: "Unread messages", value: "3", note: "From recruiters" },
] as const;

// --- Jobs and applications --------------------------------------------------

export type AppStage = "Applied" | "Shortlisted" | "Interview" | "Offer";
export const appStages: AppStage[] = ["Applied", "Shortlisted", "Interview", "Offer"];

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

/** Where each application stands at the start of the demo (job id → stage). */
export const starterApplications: Record<string, AppStage> = {
  j1: "Offer",
  j2: "Interview",
  j3: "Shortlisted",
  j4: "Applied",
  j6: "Applied",
};

// Once an offer is accepted: what has to happen before day one.
export const onboardingSteps: { id: string; title: string; body: string }[] = [
  { id: "o1", title: "Accept the offer", body: "Sign the offer letter from Brightline Finance." },
  { id: "o2", title: "Background check", body: "Fill in the form the screening company emails you." },
  { id: "o3", title: "Employment forms", body: "Upload your ID and the signed tax and payroll forms." },
  { id: "o4", title: "Laptop and accounts", body: "Confirm your shipping address for the work laptop." },
  { id: "o5", title: "Start date", body: "Confirm Monday, Nov 2 with your recruiter." },
];

// --- Interviews -------------------------------------------------------------

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

// --- Calendar ----------------------------------------------------------------

export const studentEvents: CalEvent[] = [
  { id: "s1", date: "2026-10-02", time: "15:00", end: "15:30", title: "Resume review", kind: "Call", with: "Mansingh" },
  { id: "s2", date: "2026-10-07", time: "11:00", end: "11:20", title: "Vertex Retail, recruiter screen", kind: "Interview", with: "Talent partner" },
  { id: "s3", date: "2026-10-11", time: "20:00", title: "Upload resume v3 for review", kind: "Deadline", with: "Resume corner" },
  { id: "s4", date: "2026-10-12", time: "10:00", end: "10:30", title: "Prep call for the Vertex Retail interview", kind: "Call", with: "Hari" },
  { id: "s5", date: "2026-10-12", time: "14:00", end: "15:00", title: "Vertex Retail, technical interview", kind: "Interview", with: "Hiring manager and a senior engineer" },
  { id: "s6", date: "2026-10-13", time: "16:00", end: "16:30", title: "Resume review call", kind: "Call", with: "Mansingh" },
  { id: "s7", date: "2026-10-14", time: "11:00", end: "11:30", title: "Northwind Health, recruiter screen", kind: "Interview", with: "Talent partner" },
  { id: "s8", date: "2026-10-14", time: "18:00", title: "Send two references to Hari", kind: "Deadline", with: "Hari" },
  { id: "s9", date: "2026-10-16", time: "17:00", title: "Accept or decline the Brightline offer", kind: "Deadline", with: "Hari" },
  { id: "s10", date: "2026-10-20", time: "12:00", title: "Background check form due", kind: "Deadline", with: "Onboarding" },
  { id: "s11", date: "2026-10-27", time: "14:00", end: "14:30", title: "Onboarding call, Brightline Finance", kind: "Call", with: "Mansingh" },
  { id: "s12", date: "2026-11-02", time: "09:00", end: "17:00", title: "First day at Brightline Finance", kind: "Meeting", with: "Brightline Finance team" },
];

// --- Recruiter chat -------------------------------------------------------------

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
      { from: "them", text: "Great news: Brightline Finance sent an offer! Call me when you're free.", time: "09:40" },
      { from: "them", text: "Also, Vertex Retail confirmed Monday 14:00 for the technical round.", time: "09:41" },
    ],
  },
  {
    id: "mansingh",
    name: "Mansingh",
    role: "Placement lead",
    unread: 1,
    messages: [
      { from: "me", text: "I've updated my resume with the Terraform project.", time: "Fri" },
      { from: "them", text: "Looks much better. Move the project above education and it's ready.", time: "Fri" },
    ],
  },
  {
    id: "support",
    name: "Pixel IT Support",
    role: "Help desk",
    unread: 0,
    messages: [
      { from: "them", text: "Your background-check form link is in your email.", time: "Wed" },
      { from: "me", text: "Got it, thanks!", time: "Wed" },
    ],
  },
];

// --- Resume corner ---------------------------------------------------------------

export const resumes: { id: string; name: string; target: string; updated: string; status: "Reviewed" | "Needs changes" | "Draft" }[] = [
  { id: "cv3", name: "Manas, Cloud Engineer v3.pdf", target: "Cloud / AWS roles", updated: "Oct 9", status: "Reviewed" },
  { id: "cv2", name: "Manas, DevOps v2.pdf", target: "DevOps roles", updated: "Oct 2", status: "Needs changes" },
  { id: "cv1", name: "Manas, General v1.pdf", target: "Any role", updated: "Sep 15", status: "Draft" },
];

/** Recruiter notes on a resume. `resumeId` says which resume the note is about. */
export const resumeFeedback: { id: string; resumeId: string; from: "Hari" | "Mansingh"; role: string; date: string; text: string }[] = [
  { id: "f1", resumeId: "cv3", from: "Hari", role: "Recruiter", date: "Oct 10", text: "Approved. This is the one I'll send to Brightline Finance and Vertex Retail." },
  { id: "f2", resumeId: "cv3", from: "Mansingh", role: "Placement lead", date: "Oct 9", text: "Strong summary. Put the Terraform project first and add numbers (e.g. 'cut deploy time from 20 to 5 minutes')." },
  { id: "f3", resumeId: "cv2", from: "Mansingh", role: "Placement lead", date: "Oct 4", text: "Two pages is too long for DevOps roles. Cut your older jobs to one line each." },
  { id: "f4", resumeId: "cv2", from: "Hari", role: "Recruiter", date: "Oct 3", text: "Clients search for 'AWS', 'Terraform' and 'CI/CD'. Make sure all three are in your skills line." },
];

export const resumeChecklist: { id: string; text: string; done: boolean }[] = [
  { id: "c1", text: "One page, clear headings", done: true },
  { id: "c2", text: "Summary in 2–3 lines", done: true },
  { id: "c3", text: "Projects with tools and results", done: true },
  { id: "c4", text: "Certifications with dates", done: false },
  { id: "c5", text: "GitHub and LinkedIn links", done: false },
];

// --- Practice projects (portfolio) ------------------------------------------------

export type PracticeProject = {
  id: string;
  name: string;
  stack: string[];
  status: "Reviewed" | "In progress" | "Not started" | "In review";
  progress: number;
  body: string;
  review?: string;
  /** "github.com/owner/repo". Demo projects' repos are made up, so they don't open. */
  repo?: string;
  /** Added by the student from GitHub (opens the real link). */
  fromGithub?: boolean;
};

export const practiceProjects: PracticeProject[] = [
  { id: "p1", repo: "github.com/manas-demo/aws-3-tier-app", name: "3-tier web app on AWS", stack: ["Terraform", "EC2", "RDS", "ALB"], status: "Reviewed", progress: 100, body: "A load-balanced app with a private database, built entirely in Terraform.", review: "Clean modules. Add a diagram to the README." },
  { id: "p2", repo: "github.com/manas-demo/static-site-pipeline", name: "CI/CD pipeline for a static site", stack: ["GitHub Actions", "S3", "CloudFront"], status: "Reviewed", progress: 100, body: "Every push tests, builds and deploys to S3 behind CloudFront.", review: "Great. This is your strongest interview story." },
  { id: "p3", repo: "github.com/manas-demo/eks-api", name: "Containerised API on EKS", stack: ["Docker", "Kubernetes", "EKS"], status: "In progress", progress: 40, body: "A small API in Docker, deployed to EKS with health checks and autoscaling." },
  { id: "p4", name: "Monitoring dashboard", stack: ["CloudWatch", "Grafana", "Lambda"], status: "Not started", progress: 0, body: "Alerts and dashboards for the 3-tier app. Planned next." },
];

// --- Documents -----------------------------------------------------------------------

export const studentDocuments: { id: string; name: string; category: string; size: string; updated: string; expires?: string; expiresSoon?: boolean }[] = [
  { id: "sd1", name: "Manas, Cloud Engineer v3.pdf", category: "Resume", size: "142 KB", updated: "Oct 9" },
  { id: "sd2", name: "AWS Cloud Practitioner certificate.pdf", category: "Certificates", size: "310 KB", updated: "Aug 30", expires: "Aug 2029" },
  { id: "sd3", name: "Terraform Associate certificate.pdf", category: "Certificates", size: "240 KB", updated: "Oct 7" },
  { id: "sd4", name: "Photo ID.pdf", category: "ID", size: "520 KB", updated: "Jul 12", expires: "Dec 2026", expiresSoon: true },
  { id: "sd5", name: "Work authorization.pdf", category: "Work papers", size: "410 KB", updated: "Jul 12", expires: "Mar 2027" },
  { id: "sd6", name: "Offer letter, Brightline Finance.pdf", category: "Offers", size: "188 KB", updated: "Today" },
];

// --- Help & announcements -----------------------------------------------------------

export const studentContacts: { name: string; role: string; email: string }[] = [
  { name: "Hari", role: "Your recruiter", email: "hari@pixelitcenter.com" },
  { name: "Mansingh", role: "Placement lead", email: "mansingh@pixelitcenter.com" },
];

export const studentFaqs: { q: string; a: string }[] = [
  { q: "How do I apply to a job?", a: "Open Jobs, pick a role and press Apply. Choose which resume to send. Your recruiter sees it straight away." },
  { q: "Can I apply to many jobs at once?", a: "Your recruiter picks the best few with you. Fewer, better-matched applications get more interviews." },
  { q: "When do I get the interview link?", a: "One day before the interview. It appears on the Interviews page, and your recruiter emails it too." },
  { q: "My ID is expiring. What should I do?", a: "Upload the new one under Documents before it expires so your placement isn't delayed." },
];

export const studentNotifications: { id: string; title: string; body: string; time: string }[] = [
  { id: "sn1", title: "Offer received", body: "Brightline Finance sent you an offer. See Jobs → My applications.", time: "1h" },
  { id: "sn2", title: "Interview confirmed", body: "Vertex Retail, Mon 14:00, technical round.", time: "2h" },
  { id: "sn3", title: "Resume reviewed", body: "Mansingh reviewed Cloud Engineer v3.", time: "2d" },
  { id: "sn4", title: "ID expires soon", body: "Your photo ID expires in December. Upload a new one.", time: "3d" },
];

export const announcements: { id: string; title: string; body: string; date: string }[] = [
  { id: "an1", title: "New roles this week", body: "6 new cloud and DevOps openings. Check Jobs.", date: "Oct 10" },
  { id: "an2", title: "Thanksgiving break", body: "Office closed Nov 26–27. Recruiters reply again on Nov 30.", date: "Oct 8" },
];
