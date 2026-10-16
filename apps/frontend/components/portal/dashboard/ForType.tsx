"use client";

import type { ReactNode } from "react";
import { useSession } from "./session";

/**
 * Shows the student version of a page to student accounts and the universal
 * one to everyone else (employees).
 */
export function ForType({ student, other }: { student: ReactNode; other: ReactNode }) {
  const session = useSession();
  if (!session) return null;
  return <>{session.profile.accountType === "student" ? student : other}</>;
}

/** For student-only pages opened from another account type. */
export function StudentOnly() {
  return (
    <div className="dash-card dash-card-pad mx-auto mt-10 max-w-md text-center">
      <p className="text-base font-semibold">This page is in the student corner</p>
      <p className="mt-2 text-sm text-[var(--dash-muted)]">
        Sign in with a student account (for example student@pixelitcenter.com) to see it.
      </p>
    </div>
  );
}
