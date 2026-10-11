// Demo data for the STUDENT corner of the portal: what a job seeker sees
// after signing in (resume, jobs, interviews, recruiters). DUMMY data,
// like content/portal-demo.ts; replace with real data when the portal exists.

export const studentStats = [
  { id: "jobs", label: "Jobs for you", value: "6", note: "2 new this week" },
  { id: "applications", label: "Applications", value: "5", note: "1 offer" },
  { id: "interviews", label: "Interviews this week", value: "2", note: "Next: Mon 14:00" },
  { id: "messages", label: "Unread messages", value: "3", note: "From recruiters" },
] as const;

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
  { id: "i1", company: "Vertex Retail", role: "DevOps Engineer", round: "Technical round", when: "Mon, Oct 12 · 14:00", mode: "Video call", with: "Hiring manager + senior engineer", prep: "Expect a live pipeline design. Go over your GitHub Actions project: it's your best example." },
  { id: "i2", company: "Northwind Health", role: "Junior SRE", round: "Recruiter screen", when: "Wed, Oct 14 · 11:00", mode: "Phone", with: "Talent partner", prep: "30 minutes on your background and availability. Keep your story to 2 minutes." },
];

export const mockInterviews: { id: string; topic: string; date: string; with: string; result: "Strong" | "Good" | "Practise more"; feedback: string }[] = [
  { id: "mi1", topic: "AWS core services", date: "Oct 2", with: "Hari", result: "Strong", feedback: "Clear answers on IAM and S3. Add a real example from your projects." },
  { id: "mi2", topic: "Behavioural", date: "Sep 25", with: "Mansingh", result: "Practise more", feedback: "Use the STAR format and finish with the result. Slow down a little." },
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
      { time: "10:00", title: "Mock interview: DevOps", kind: "Mock interview", with: "Hari" },
      { time: "14:00", title: "Vertex Retail, technical round", kind: "Interview", with: "Hiring manager" },
    ],
  },
  {
    day: "Tuesday",
    date: "Tue, Oct 13",
    items: [{ time: "16:00", title: "Resume review call", kind: "Call", with: "Mansingh" }],
  },
  {
    day: "Wednesday",
    date: "Wed, Oct 14",
    items: [
      { time: "11:00", title: "Northwind Health, recruiter screen", kind: "Interview", with: "Talent partner" },
      { time: "18:00", title: "Send two references to Hari", kind: "Deadline", with: "Hari" },
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

export const resumeFeedback: { from: string; date: string; text: string }[] = [
  { from: "Mansingh", date: "Oct 9", text: "Strong summary. Put the Terraform project first and add numbers (e.g. 'cut deploy time from 20 to 5 minutes')." },
  { from: "Hari", date: "Oct 3", text: "Clients search for 'AWS', 'Terraform' and 'CI/CD'. Make sure all three are in your skills line." },
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
  { q: "How do mock interviews work?", a: "Book one under Interviews. Hari or Mansingh plays the interviewer and sends you feedback the same day." },
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
