"use client";

import { useSyncExternalStore } from "react";
import { demoDirectory, starterTasks, type AccountType, type Task } from "@/content/portal-demo";
import { resumes, starterApplications, type AppStage, type PracticeProject } from "@/content/student-demo";

// DEMO sign-in. The "session" is a JSON blob in this browser's localStorage:
// nothing is sent to a server and any password works. The real portal
// replaces this file with AWS Cognito and reads the account type from the
// database; the pages only use the hooks below, so they stay as they are.

export type Profile = {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  headline: string;
  bio: string;
  linkedin: string;
  skills: string[];
  accountType: AccountType | null;
  // Student
  targetRole: string;
  availability: string;
  // Employee
  department: string;
  employeeId: string;
  manager: string;
  // Client
  company: string;
  industry: string;
  companySize: string;
};

export type Session = {
  profile: Profile;
  tasks: Task[];
  readNotifications: string[];
  method: "password" | "google";
  signedInAt: string;
  // Student corner. Optional: sessions saved before it existed lack them.
  applications?: Record<string, AppStage>; // job id → stage
  onboardingDone?: string[];
  defaultResume?: string;
  addedProjects?: PracticeProject[]; // added from GitHub
};

const KEY = "pixelit-portal-demo";

const blankProfile: Profile = {
  fullName: "",
  email: "",
  phone: "",
  location: "",
  headline: "",
  bio: "",
  linkedin: "",
  skills: [],
  accountType: null,
  targetRole: "",
  availability: "",
  department: "",
  employeeId: "",
  manager: "",
  company: "",
  industry: "",
  companySize: "",
};

// Filled in for the three demo accounts, so their dashboards look lived-in.
const demoDetails: Record<AccountType, Partial<Profile>> = {
  student: {
    phone: "+1 (919) 555-0142",
    location: "Raleigh, NC",
    skills: ["AWS", "Linux", "Python"],
    targetRole: "Cloud Engineer",
    availability: "Immediately",
  },
  employee: {
    phone: "+1 (336) 555-0177",
    location: "Fuquay Varina, NC",
    bio: "Seven years building CI/CD and cloud platforms for healthcare and retail clients.",
    skills: ["DevOps", "Kubernetes", "Terraform", "AWS"],
    department: "Technology Services",
    employeeId: "PIX-0482",
    manager: "Mansingh",
  },
  client: {
    phone: "+1 (704) 555-0119",
    location: "Charlotte, NC",
    company: "Northwind Health",
    industry: "Healthcare",
    companySize: "1,000–5,000",
  },
};

/** Which profile fields count towards "profile complete". */
export function profileFields(p: Profile): (keyof Profile)[] {
  const common: (keyof Profile)[] = ["fullName", "email", "phone", "location", "headline", "bio", "linkedin", "skills", "accountType"];
  if (p.accountType === "student") return [...common, "targetRole", "availability"];
  if (p.accountType === "employee") return [...common, "department", "employeeId", "manager"];
  if (p.accountType === "client") return [...common, "company", "industry", "companySize"];
  return common;
}

export function profileCompletion(p: Profile) {
  const fields = profileFields(p);
  const filled = fields.filter((f) => {
    const v = p[f];
    return Array.isArray(v) ? v.length > 0 : Boolean(v && String(v).trim());
  });
  return Math.round((filled.length / fields.length) * 100);
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

/** "jane.doe@acme.com" → "Jane Doe", for accounts we don't know yet. */
function nameFromEmail(email: string) {
  return email
    .split("@")[0]
    .split(/[._-]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

// --- the store ------------------------------------------------------------

const listeners = new Set<() => void>();
let cachedRaw: string | null | undefined;
let cachedSession: Session | null = null;
let memoryOnly = false; // storage blocked: the session lives in memory only

function read(): Session | null {
  if (memoryOnly) return cachedSession;
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    raw = null;
  }
  if (raw === cachedRaw) return cachedSession;
  cachedRaw = raw;
  try {
    cachedSession = raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    cachedSession = null;
  }
  return cachedSession;
}

function write(session: Session | null) {
  try {
    if (session) window.localStorage.setItem(KEY, JSON.stringify(session));
    else window.localStorage.removeItem(KEY);
  } catch {
    // Private mode / storage blocked: keep it in memory for this tab.
    memoryOnly = true;
  }
  cachedRaw = session ? JSON.stringify(session) : null;
  cachedSession = session;
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => e.key === KEY && listener();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** undefined while loading (server render), null when signed out. */
export function useSession(): Session | null | undefined {
  return useSyncExternalStore(subscribe, read, () => undefined);
}

/** Look the email up (the real portal asks the database) and sign in. */
export function demoSignIn(email: string, method: Session["method"] = "password") {
  const known = demoDirectory.find((d) => d.email === email.trim().toLowerCase());
  const profile: Profile = known
    ? { ...blankProfile, ...demoDetails[known.accountType], email: known.email, fullName: known.fullName, accountType: known.accountType, headline: known.headline }
    : { ...blankProfile, email: email.trim(), fullName: nameFromEmail(email) };
  write({ profile, tasks: starterTasks, readNotifications: [], method, signedInAt: new Date().toISOString() });
  return profile;
}

/** A brand-new account: name and email only; the profile comes next. */
export function demoSignUp(fullName: string, email: string, method: Session["method"] = "password") {
  write({
    profile: { ...blankProfile, fullName: fullName.trim(), email: email.trim() },
    tasks: starterTasks,
    readNotifications: [],
    method,
    signedInAt: new Date().toISOString(),
  });
}

export function signOut() {
  write(null);
}

export function updateSession(change: (s: Session) => Session) {
  const s = read();
  if (s) write(change(s));
}

export function updateProfile(patch: Partial<Profile>) {
  updateSession((s) => ({ ...s, profile: { ...s.profile, ...patch } }));
}

// --- student corner ----------------------------------------------------------

export const applicationsOf = (s: Session) => s.applications ?? starterApplications;
export const onboardingOf = (s: Session) => s.onboardingDone ?? [];
export const defaultResumeOf = (s: Session) => s.defaultResume ?? resumes[0].id;

export function applyToJob(jobId: string, resumeId: string) {
  updateSession((s) => ({ ...s, applications: { ...applicationsOf(s), [jobId]: "Applied" }, defaultResume: resumeId }));
}

export function withdrawApplication(jobId: string) {
  updateSession((s) => {
    const rest = { ...applicationsOf(s) };
    delete rest[jobId];
    return { ...s, applications: rest };
  });
}

export function toggleOnboarding(id: string) {
  updateSession((s) => {
    const done = onboardingOf(s);
    return { ...s, onboardingDone: done.includes(id) ? done.filter((x) => x !== id) : [...done, id] };
  });
}

export const addedProjectsOf = (s: Session) => s.addedProjects ?? [];

export function addProject(project: PracticeProject) {
  updateSession((s) => ({ ...s, addedProjects: [project, ...addedProjectsOf(s)] }));
}

export function removeProject(id: string) {
  updateSession((s) => ({ ...s, addedProjects: addedProjectsOf(s).filter((p) => p.id !== id) }));
}

export function setDefaultResume(id: string) {
  updateSession((s) => ({ ...s, defaultResume: id }));
}

export function setTasks(change: (tasks: Task[]) => Task[]) {
  updateSession((s) => ({ ...s, tasks: change(s.tasks) }));
}
