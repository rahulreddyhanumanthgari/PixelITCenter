"use client";

import { useSyncExternalStore } from "react";
import { launchTeam, type JobRole, type StaffRole, type TeamMember } from "@/content/portal-demo";
import { useSession, type Session } from "./session";

// The PixelIT team and who may do what. Admin is a switch on top of the job
// role: an admin can do everything, including giving access to others. A new
// employee joins with no access; only an admin can change that.
//
// DEMO: kept in this browser's localStorage, starting from the launch team.
// With the backend this is a server table: only admins can change it, every
// change is logged, and the API reads the role from it (not from the browser).

const KEY = "pixelit-demo-team";
const listeners = new Set<() => void>();
let cachedRaw: string | null | undefined;
let cached: TeamMember[] = launchTeam;

function read(): TeamMember[] {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    raw = null;
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      cached = raw ? (JSON.parse(raw) as TeamMember[]) : launchTeam;
    } catch {
      cached = launchTeam;
    }
  }
  return cached;
}

function write(team: TeamMember[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(team));
  } catch {
    // Storage blocked: lasts until the page reloads.
  }
  cachedRaw = JSON.stringify(team);
  cached = team;
  listeners.forEach((l) => l());
}

export function useTeam(): TeamMember[] {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    read,
    () => launchTeam,
  );
}

const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

export const memberOf = (team: TeamMember[], email: string) => team.find((m) => same(m.email, email));

/** What the member may do: everything as admin, else their job role, else nothing. */
export const effectiveRole = (m: TeamMember | undefined): StaffRole | null => (m ? (m.isAdmin ? "admin" : m.jobRole) : null);

/** The signed-in employee's role. Students and people not on the team get null. */
export function staffRoleIn(team: TeamMember[], s: Session): StaffRole | null {
  return s.profile.accountType === "employee" ? effectiveRole(memberOf(team, s.profile.email)) : null;
}

/** Hook form, for components: re-renders when an admin changes the team. */
export function useStaffRole(): StaffRole | null {
  const session = useSession();
  const team = useTeam();
  return session ? staffRoleIn(team, session) : null;
}

export const adminCount = (team: TeamMember[]) => team.filter((m) => m.isAdmin).length;

export function updateMember(email: string, patch: Partial<Pick<TeamMember, "jobRole" | "isAdmin" | "title">>) {
  const team = read();
  const target = memberOf(team, email);
  // The portal always keeps at least one admin.
  if (target?.isAdmin && patch.isAdmin === false && adminCount(team) <= 1) throw new Error("There must always be at least one admin.");
  write(team.map((m) => (same(m.email, email) ? { ...m, ...patch } : m)));
}

/** An admin adds an employee. They start with the job role given here, never as admin. */
export function addMember(input: { email: string; fullName: string; title: string; jobRole: JobRole | null }) {
  const team = read();
  if (memberOf(team, input.email)) throw new Error("This email is already on the team.");
  write([...team, { ...input, email: input.email.trim().toLowerCase(), isAdmin: false, addedOn: new Date().toISOString().slice(0, 10) }]);
}

/** An employee who signs up joins the team with no access. */
export function joinTeam(email: string, fullName: string) {
  const team = read();
  if (!email || memberOf(team, email)) return;
  write([...team, { email: email.trim().toLowerCase(), fullName: fullName || email, title: "", jobRole: null, isAdmin: false, addedOn: new Date().toISOString().slice(0, 10) }]);
}
