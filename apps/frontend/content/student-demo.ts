// Demo data for the STUDENT corner of the portal: what a trainee sees after
// signing in (training, resume, jobs, interviews, recruiters). DUMMY data,
// like content/portal-demo.ts; replace with real data when the portal exists.

export const studentStats = [
  { id: "course", label: "Course progress", value: "62%", note: "Module 5 of 8" },
  { id: "applications", label: "Applications", value: "5", note: "1 offer" },
  { id: "interviews", label: "Interviews this week", value: "2", note: "Next: Mon 14:00" },
  { id: "messages", label: "Unread messages", value: "3", note: "From recruiters" },
] as const;

// --- Learning --------------------------------------------------------------

export type ModuleStatus = "Done" | "In progress" | "Locked";

export const course = {
  name: "AWS Cloud Engineering",
  cohort: "Fall 2026",
  trainer: "Leo Martins",
  progress: 62,
  nextClass: { title: "Module 5 live: VPC networking", when: "Tue, Oct 13 · 16:00", link: "Zoom" },
  modules: [
    { id: "m1", title: "Linux and the command line", status: "Done", lessons: 8 },
    { id: "m2", title: "AWS core services (EC2, S3, IAM)", status: "Done", lessons: 10 },
    { id: "m3", title: "Infrastructure as code with Terraform", status: "Done", lessons: 9 },
    { id: "m4", title: "CI/CD with GitHub Actions", status: "Done", lessons: 7 },
    { id: "m5", title: "Networking: VPC, subnets, load balancers", status: "In progress", lessons: 8 },
    { id: "m6", title: "Containers: Docker and EKS", status: "Locked", lessons: 9 },
    { id: "m7", title: "Monitoring and security", status: "Locked", lessons: 6 },
    { id: "m8", title: "Capstone project and mock interviews", status: "Locked", lessons: 4 },
  ] as { id: string; title: string; status: ModuleStatus; lessons: number }[],
};

export const assignments: { id: string; title: string; module: string; due: string; status: "Submitted" | "Due" | "Graded" ; grade?: string }[] = [
  { id: "a1", title: "Build a 3-tier VPC in Terraform", module: "Module 5", due: "Oct 15", status: "Due" },
  { id: "a2", title: "GitHub Actions pipeline to S3", module: "Module 4", due: "Oct 6", status: "Graded", grade: "A" },
  { id: "a3", title: "IAM least-privilege policy", module: "Module 2", due: "Sep 22", status: "Graded", grade: "A-" },
];

export const recordings: { id: string; title: string; length: string; date: string }[] = [
  { id: "r1", title: "Module 4 live: CI/CD pipelines", length: "1h 12m", date: "Oct 6" },
  { id: "r2", title: "Q&A: Terraform state and modules", length: "48m", date: "Sep 29" },
  { id: "r3", title: "Module 3 live: Terraform basics", length: "1h 05m", date: "Sep 22" },
];

// --- Jobs and applications --------------------------------------------------

export type AppStage = "Applied" | "Shortlisted" | "Interview" | "Offer";
export const appStages: AppStage[] = ["Applied", "Shortlisted", "Interview", "Offer"];

export type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  type: "Contract" | "Full-time" | "Contract to hire";
  skills: string[];
  posted: string;
  body: string;
};

export const jobs: Job[] = [
  { id: "j1", title: "Cloud Engineer (AWS)", company: "Brightline Finance", location: "Charlotte, NC · Hybrid", type: "Full-time", skills: ["AWS", "Terraform", "Python"], posted: "3 days ago", body: "Build and run the AWS platform behind daily risk reporting." },
  { id: "j2", title: "DevOps Engineer", company: "Vertex Retail", location: "Remote (US)", type: "Contract", skills: ["GitHub Actions", "Docker", "AWS"], posted: "1 week ago", body: "Own CI/CD pipelines and release automation for 30+ services." },
  { id: "j3", title: "Junior Site Reliability Engineer", company: "Northwind Health", location: "Raleigh, NC · On-site", type: "Contract to hire", skills: ["Linux", "Monitoring", "AWS"], posted: "2 weeks ago", body: "Keep patient-facing systems up; on-call rotation after 3 months." },
  { id: "j4", title: "Cloud Support Associate", company: "Atlas Logistics", location: "Remote (US)", type: "Full-time", skills: ["AWS", "Networking"], posted: "2 days ago", body: "Help teams troubleshoot AWS networking and access problems." },
  { id: "j5", title: "Infrastructure Engineer", company: "Oakridge Labs", location: "Durham, NC · Hybrid", type: "Contract", skills: ["Terraform", "Azure", "Kubernetes"], posted: "Today", body: "Move lab systems to infrastructure as code across Azure and AWS." },
  { id: "j6", title: "Build and Release Engineer", company: "Cedar Systems", location: "Remote (US)", type: "Contract", skills: ["Jenkins", "Linux", "Python"], posted: "5 days ago", body: "Keep builds fast and green for a 200-engineer team." },
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

export const interviews: { id: string; company: string; role: string; round: string; when: string; mode: string; with: string; prep: string }[] = [
  { id: "i1", company: "Vertex Retail", role: "DevOps Engineer", round: "Technical round", when: "Mon, Oct 12 · 14:00", mode: "Video call", with: "Hiring manager + senior engineer", prep: "Expect a live pipeline design. Revisit Module 4 and your GitHub Actions project." },
  { id: "i2", company: "Northwind Health", role: "Junior SRE", round: "Recruiter screen", when: "Wed, Oct 14 · 11:00", mode: "Phone", with: "Talent partner", prep: "30 minutes on your background and availability. Keep your story to 2 minutes." },
];

export const mockInterviews: { id: string; topic: string; date: string; trainer: string; result: "Strong" | "Good" | "Practise more"; feedback: string }[] = [
  { id: "mi1", topic: "AWS core services", date: "Oct 2", trainer: "Leo Martins", result: "Strong", feedback: "Clear answers on IAM and S3. Add a real example from your projects." },
  { id: "mi2", topic: "Behavioural", date: "Sep 25", trainer: "Priya Sharma", result: "Practise more", feedback: "Use the STAR format and finish with the result. Slow down a little." },
];

export const questionBank: { topic: string; questions: string[] }[] = [
  { topic: "AWS", questions: ["What is the difference between a security group and a NACL?", "How would you make an S3 bucket private but still share one file?", "Explain how an Auto Scaling group replaces an unhealthy instance."] },
  { topic: "DevOps", questions: ["Walk me through a CI/CD pipeline you built.", "How do you roll back a bad deploy?", "What is blue-green deployment?"] },
  { topic: "Terraform", questions: ["What is Terraform state and where should it live?", "How do modules help a team?", "What happens when someone changes infrastructure by hand?"] },
  { topic: "Behavioural", questions: ["Tell me about a time something broke and you fixed it.", "Why cloud engineering?", "How do you learn a tool you've never used?"] },
];

// --- Calendar ----------------------------------------------------------------

export const studentEvents: { day: string; date: string; items: { time: string; title: string; kind: string; with: string }[] }[] = [
  {
    day: "Today",
    date: "Sun, Oct 11",
    items: [{ time: "20:00", title: "Upload resume v3 for review", kind: "Deadline", with: "Resume corner" }],
  },
  {
    day: "Tomorrow",
    date: "Mon, Oct 12",
    items: [
      { time: "10:00", title: "Mock interview: DevOps", kind: "Mock interview", with: "Leo Martins" },
      { time: "14:00", title: "Vertex Retail, technical round", kind: "Interview", with: "Hiring manager" },
    ],
  },
  {
    day: "Tuesday",
    date: "Tue, Oct 13",
    items: [{ time: "16:00", title: "Module 5 live: VPC networking", kind: "Class", with: "Leo Martins" }],
  },
  {
    day: "Wednesday",
    date: "Wed, Oct 14",
    items: [
      { time: "11:00", title: "Northwind Health, recruiter screen", kind: "Interview", with: "Talent partner" },
      { time: "23:59", title: "Assignment: 3-tier VPC in Terraform", kind: "Deadline", with: "Module 5" },
    ],
  },
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
    id: "daniel",
    name: "Daniel Brooks",
    role: "Your recruiter",
    unread: 2,
    messages: [
      { from: "them", text: "Great news: Brightline Finance sent an offer! Call me when you're free.", time: "09:40" },
      { from: "them", text: "Also, Vertex Retail confirmed Monday 14:00 for the technical round.", time: "09:41" },
    ],
  },
  {
    id: "priya",
    name: "Priya Sharma",
    role: "Placement lead",
    unread: 1,
    messages: [
      { from: "me", text: "I've updated my resume with the Terraform project.", time: "Fri" },
      { from: "them", text: "Looks much better. Move the project above education and it's ready.", time: "Fri" },
    ],
  },
  {
    id: "leo",
    name: "Leo Martins",
    role: "Trainer, AWS course",
    unread: 0,
    messages: [
      { from: "them", text: "Module 5 recording is up. Start the VPC assignment early.", time: "Wed" },
      { from: "me", text: "Will do, thanks!", time: "Wed" },
    ],
  },
];

// --- Resume corner ---------------------------------------------------------------

export const resumes: { id: string; name: string; target: string; updated: string; status: "Reviewed" | "Needs changes" | "Draft" }[] = [
  { id: "cv3", name: "Manas, Cloud Engineer v3.pdf", target: "Cloud / AWS roles", updated: "Oct 9", status: "Reviewed" },
  { id: "cv2", name: "Manas, DevOps v2.pdf", target: "DevOps roles", updated: "Oct 2", status: "Needs changes" },
  { id: "cv1", name: "Manas, General v1.pdf", target: "Any role", updated: "Sep 15", status: "Draft" },
];

export const resumeFeedback: { from: string; date: string; text: string }[] = [
  { from: "Priya Sharma", date: "Oct 9", text: "Strong summary. Put the Terraform capstone first and add numbers (e.g. 'cut deploy time from 20 to 5 minutes')." },
  { from: "Daniel Brooks", date: "Oct 3", text: "Clients search for 'AWS', 'Terraform' and 'CI/CD'. Make sure all three are in your skills line." },
];

export const resumeChecklist: { id: string; text: string; done: boolean }[] = [
  { id: "c1", text: "One page, clear headings", done: true },
  { id: "c2", text: "Summary in 2–3 lines", done: true },
  { id: "c3", text: "Projects with tools and results", done: true },
  { id: "c4", text: "Certifications with dates", done: false },
  { id: "c5", text: "GitHub and LinkedIn links", done: false },
];

// --- Practice projects (portfolio) ------------------------------------------------

export const practiceProjects: { id: string; name: string; stack: string[]; status: "Reviewed" | "In progress" | "Not started"; progress: number; body: string; review?: string }[] = [
  { id: "p1", name: "3-tier web app on AWS", stack: ["Terraform", "EC2", "RDS", "ALB"], status: "Reviewed", progress: 100, body: "A load-balanced app with a private database, built entirely in Terraform.", review: "Clean modules. Add a diagram to the README." },
  { id: "p2", name: "CI/CD pipeline for a static site", stack: ["GitHub Actions", "S3", "CloudFront"], status: "Reviewed", progress: 100, body: "Every push tests, builds and deploys to S3 behind CloudFront.", review: "Great. This is your strongest interview story." },
  { id: "p3", name: "Containerised API on EKS", stack: ["Docker", "Kubernetes", "EKS"], status: "In progress", progress: 40, body: "A small API in Docker, deployed to EKS with health checks and autoscaling." },
  { id: "p4", name: "Capstone: monitoring dashboard", stack: ["CloudWatch", "Grafana", "Lambda"], status: "Not started", progress: 0, body: "Alerts and dashboards for the 3-tier app. Opens with Module 8." },
];

// --- Documents -----------------------------------------------------------------------

export const studentDocuments: { id: string; name: string; category: string; size: string; updated: string; expires?: string; expiresSoon?: boolean }[] = [
  { id: "sd1", name: "Manas, Cloud Engineer v3.pdf", category: "Resume", size: "142 KB", updated: "Oct 9" },
  { id: "sd2", name: "AWS Cloud Practitioner certificate.pdf", category: "Certificates", size: "310 KB", updated: "Aug 30", expires: "Aug 2029" },
  { id: "sd3", name: "Module 4 certificate.pdf", category: "Certificates", size: "240 KB", updated: "Oct 7" },
  { id: "sd4", name: "Photo ID.pdf", category: "ID", size: "520 KB", updated: "Jul 12", expires: "Dec 2026", expiresSoon: true },
  { id: "sd5", name: "Work authorization.pdf", category: "Work papers", size: "410 KB", updated: "Jul 12", expires: "Mar 2027" },
  { id: "sd6", name: "Offer letter, Brightline Finance.pdf", category: "Offers", size: "188 KB", updated: "Today" },
];

// --- Help & announcements -----------------------------------------------------------

export const studentContacts: { name: string; role: string; email: string }[] = [
  { name: "Daniel Brooks", role: "Your recruiter", email: "daniel.brooks@pixelitcenter.com" },
  { name: "Priya Sharma", role: "Placement lead", email: "priya.sharma@pixelitcenter.com" },
  { name: "Leo Martins", role: "Trainer", email: "leo.martins@pixelitcenter.com" },
];

export const studentFaqs: { q: string; a: string }[] = [
  { q: "How do I apply to a job?", a: "Open Jobs, pick a role and press Apply. Choose which resume to send. Your recruiter sees it straight away." },
  { q: "Can I apply to many jobs at once?", a: "Your recruiter picks the best few with you. Fewer, better-matched applications get more interviews." },
  { q: "I missed a live class. What now?", a: "Every class is recorded. Find it under Learning → Recordings within a day." },
  { q: "My ID is expiring. What should I do?", a: "Upload the new one under Documents before it expires so your placement isn't delayed." },
];

export const studentNotifications: { id: string; title: string; body: string; time: string }[] = [
  { id: "sn1", title: "Offer received", body: "Brightline Finance sent you an offer. See Jobs → My applications.", time: "1h" },
  { id: "sn2", title: "Interview confirmed", body: "Vertex Retail, Mon 14:00, technical round.", time: "2h" },
  { id: "sn3", title: "Recording ready", body: "Module 4 live: CI/CD pipelines.", time: "2d" },
  { id: "sn4", title: "ID expires soon", body: "Your photo ID expires in December. Upload a new one.", time: "3d" },
];

export const announcements: { id: string; title: string; body: string; date: string }[] = [
  { id: "an1", title: "New roles this week", body: "6 new cloud and DevOps openings. Check Jobs.", date: "Oct 10" },
  { id: "an2", title: "Thanksgiving break", body: "No live classes Nov 26–27. Recordings will be posted.", date: "Oct 8" },
];
