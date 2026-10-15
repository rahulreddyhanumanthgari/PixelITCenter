"use client";

import { useSyncExternalStore } from "react";
import { demoDirectory, type AccountType, type StaffRole } from "@/content/portal-demo";
import { firstFreePicNumber, formatPic, studentByEmail } from "@/content/registered-students";
import {
  defaultReminders,
  jobStatuses,
  placedFromPixelitDocs,
  placedJobStatuses,
  placedNotifications,
  fromPixelitDocs,
  resumeStatus,
  resumeVersions,
  starterAvailability,
  starterStudentDocs,
  starterTimesheets,
  studentNotifications,
  type AvailabilitySlot,
  type ResumeStatus,
  type ResumeVersion,
  type StudentDoc,
  type Timesheet,
} from "@/content/student-demo";

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
};

export type Session = {
  profile: Profile;
  readNotifications: string[];
  method: "password" | "google";
  signedInAt: string;
  /** Employees: their client-section role. Set by an admin in the live portal. */
  staffRole?: StaffRole;
  /** Students: their unique PixelIT ID ("PIC-1005"), given when they register. */
  pixelitId?: string;
  // Student corner. Optional: sessions saved before they existed lack them.
  /** Placed with a client: Timesheets shows. Set by admins in the live portal. */
  isPlaced?: boolean;
  availability?: AvailabilitySlot[];
  reminders?: typeof defaultReminders;
  resume?: { versions: ResumeVersion[]; status: ResumeStatus };
  documents?: StudentDoc[];
  /** "I have neither a DL nor a State ID": a utility bill is asked for instead. */
  noIdDocument?: boolean;
  timesheets?: Timesheet[];
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
};

// Filled in for the demo accounts, so their dashboards look lived-in.
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
};

/** Which profile fields count towards "profile complete". */
export function profileFields(p: Profile): (keyof Profile)[] {
  const common: (keyof Profile)[] = ["fullName", "email", "phone", "location", "headline", "bio", "linkedin", "skills", "accountType"];
  if (p.accountType === "student") return [...common, "targetRole", "availability"];
  if (p.accountType === "employee") return [...common, "department", "employeeId", "manager"];
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
  // Client accounts no longer exist: a session saved before that is signed out.
  if ((cachedSession?.profile.accountType as string) === "client") cachedSession = null;
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
  write({
    profile,
    readNotifications: [],
    method,
    signedInAt: new Date().toISOString(),
    isPlaced: known?.isPlaced,
    staffRole: known?.staffRole,
    // An email we don't know stands for someone who registered earlier: give them an ID.
    pixelitId: known ? undefined : (studentByEmail(email)?.pixelitId ?? nextDemoPic()),
  });
  return profile;
}

/** A brand-new account: name and email only; the profile comes next. */
export function demoSignUp(fullName: string, email: string, method: Session["method"] = "password") {
  write({
    profile: { ...blankProfile, fullName: fullName.trim(), email: email.trim() },
    readNotifications: [],
    method,
    signedInAt: new Date().toISOString(),
    pixelitId: nextDemoPic(),
  });
}

// DEMO: the next free PIC number, counted in this browser. The live portal's
// server gives out the number when the student registers, so it's unique for everyone.
const PIC_KEY = "pixelit-demo-next-pic";
function nextDemoPic() {
  let n = firstFreePicNumber();
  try {
    n = Math.max(n, Number(window.localStorage.getItem(PIC_KEY)) || 0);
    window.localStorage.setItem(PIC_KEY, String(n + 1));
  } catch {
    // Storage blocked: the number is still unique among the demo students.
  }
  return formatPic(n);
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
// Each helper stands in for an API call (see content/student-demo.ts).

export const isPlaced = (s: Session) => s.profile.accountType === "student" && Boolean(s.isPlaced);

/** A student's unique PixelIT ID ("PIC-1002"), or null for everyone else. */
export const pixelitIdOf = (s: Session): string | null =>
  s.profile.accountType === "student" ? (studentByEmail(s.profile.email)?.pixelitId ?? s.pixelitId ?? null) : null;

/** An employee's client-section role, or null (students and other employees). */
export const staffRoleOf = (s: Session): StaffRole | null =>
  s.profile.accountType === "employee"
    ? (s.staffRole ?? demoDirectory.find((d) => d.email === s.profile.email.toLowerCase())?.staffRole ?? null)
    : null;

/** Where PixelIT is with this student's resume, per job. */
export const jobStatusesOf = (s: Session) => (isPlaced(s) ? placedJobStatuses : jobStatuses);

export const notificationsOf = (s: Session) => (isPlaced(s) ? [...placedNotifications, ...studentNotifications] : studentNotifications);

export const fromPixelitOf = (s: Session) => (isPlaced(s) ? placedFromPixelitDocs : fromPixelitDocs);

export const availabilityOf = (s: Session) => s.availability ?? starterAvailability;

export function addAvailability(slot: AvailabilitySlot) {
  updateSession((s) => ({ ...s, availability: [...availabilityOf(s), slot] }));
}

export function removeAvailability(id: string) {
  updateSession((s) => ({ ...s, availability: availabilityOf(s).filter((a) => a.id !== id) }));
}

export const remindersOf = (s: Session) => s.reminders ?? defaultReminders;

export function setReminders(patch: Partial<typeof defaultReminders>) {
  updateSession((s) => ({ ...s, reminders: { ...remindersOf(s), ...patch } }));
}

export const resumeOf = (s: Session) => s.resume ?? { versions: resumeVersions, status: resumeStatus };

/** A new version goes on top and waits for the recruiter again. */
export function addResumeVersion(v: Omit<ResumeVersion, "version">) {
  updateSession((s) => {
    const r = resumeOf(s);
    return { ...s, resume: { versions: [{ ...v, version: (r.versions[0]?.version ?? 0) + 1 }, ...r.versions], status: "Pending Review" } };
  });
}

export const studentDocsOf = (s: Session) => s.documents ?? starterStudentDocs;

export function setStudentDocs(change: (docs: StudentDoc[]) => StudentDoc[]) {
  updateSession((s) => ({ ...s, documents: change(studentDocsOf(s)) }));
}

export function setNoIdDocument(on: boolean) {
  updateSession((s) => ({ ...s, noIdDocument: on }));
}

export const timesheetsOf = (s: Session) => s.timesheets ?? starterTimesheets;

export function addTimesheet(t: Timesheet) {
  updateSession((s) => ({ ...s, timesheets: [t, ...timesheetsOf(s)] }));
}
