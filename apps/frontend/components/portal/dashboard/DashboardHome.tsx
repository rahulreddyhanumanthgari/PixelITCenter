"use client";

import Link from "next/link";
import { ChevronRight, UserRoundPlus } from "lucide-react";
import { accountTypes, activity, staffRoles } from "@/content/portal-demo";
import { StaffQueue } from "./admin/StaffQueue";
import { profileCompletion, staffRoleOf, useSession } from "./session";
import { Chip, PageHeader, ProfileRing } from "./ui";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

/**
 * The dashboard home for employees: profile card, then the client-section
 * work queue for staff (admin, accounts, verifier, recruiter) or recent
 * activity for everyone else. Students have no dashboard page.
 */
export function DashboardHome() {
  const session = useSession();
  if (!session) return null;
  const { profile } = session;
  const percent = profileCompletion(profile);
  const type = accountTypes.find((t) => t.id === profile.accountType);
  const role = staffRoleOf(session);
  const firstName = profile.fullName.split(" ")[0] || "there";

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        body={
          <>
            {greeting()}, {firstName}. Here&apos;s what&apos;s happening today.
          </>
        }
      />

      <section className="dash-hero p-4 sm:p-6" aria-labelledby="profile-heading">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 id="profile-heading" className="text-sm font-semibold">
              Profile
            </h2>
            <div className="mt-3 flex items-center gap-4">
              <ProfileRing name={profile.fullName || profile.email} percent={percent} />
              <div>
                <p className="flex items-baseline gap-1 text-[2rem] leading-none font-semibold">
                  {percent}
                  <span className="text-sm text-[var(--dash-muted)]">%</span>
                </p>
                <p className="mt-1.5 text-sm text-[var(--dash-muted)]">
                  {percent < 100 ? "Finish your profile to tailor your dashboard" : "Your profile is complete"}
                </p>
                <p className="mt-2 flex flex-wrap gap-1.5">
                  <Chip tone={type ? "ink" : "warn"}>{type ? `${type.label} account` : "Account type not set"}</Chip>
                  {role && <Chip tone="warn">{staffRoles[role].label}</Chip>}
                </p>
              </div>
            </div>
          </div>
          <Link href="/portal/profile" className="dash-btn">
            Update profile
          </Link>
        </div>

        {!type && (
          <Link
            href="/portal/onboarding"
            className="mt-5 flex items-center gap-3 rounded-2xl bg-white/80 p-3.5 text-sm ring-1 ring-[var(--dash-line)] hover:bg-white"
          >
            <UserRoundPlus className="size-5 flex-none text-[var(--dash-orange)]" aria-hidden="true" />
            <span className="flex-1">
              <span className="font-semibold">Tell us who you are.</span>{" "}
              <span className="text-[var(--dash-muted)]">Student or employee: it decides what your dashboard shows.</span>
            </span>
            <ChevronRight className="size-4 flex-none" aria-hidden="true" />
          </Link>
        )}
      </section>

      {role ? (
        <StaffQueue />
      ) : (
        <section aria-labelledby="activity-heading" className="min-w-0">
          <h2 id="activity-heading" className="dash-section-title">
            Recent activity <span className="dash-count">{activity.length}</span>
          </h2>
          <div className="dash-card mt-3 p-2 sm:p-3">
            <div className="dash-table-wrap">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th scope="col">Item</th>
                    <th scope="col">Type</th>
                    <th scope="col">Status</th>
                    <th scope="col">Last update</th>
                    <th scope="col">Next step</th>
                  </tr>
                </thead>
                <tbody>
                  {activity.map((a) => (
                    <tr key={a.item}>
                      <td>{a.item}</td>
                      <td>{a.kind}</td>
                      <td>
                        <Chip>{a.status}</Chip>
                      </td>
                      <td>{a.updated}</td>
                      <td>{a.next}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
