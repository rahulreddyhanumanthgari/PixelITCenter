"use client";

import Link from "next/link";
import { AlertTriangle, Banknote, Clock, FileCheck2, Handshake, Hourglass, Send, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { adminApi } from "./api";
import { ErrorNote, Loading, useApi, useWho } from "./ui";

// The staff dashboard's work queue: counts from GET /api/admin/overview, each
// linking to the page where the work is. The API returns only the counts the
// role may see (null for the rest), so each person sees their own queue.

type Card = { key: string; label: string; note: string; value: number | null; href: string; icon: LucideIcon; urgent?: boolean };

export function StaffQueue() {
  const who = useWho();
  const overview = useApi(who ? () => adminApi.overview(who) : null, [who?.email, who?.role]);
  const o = overview.data;

  const cards: Card[] = o
    ? [
        { key: "verify", label: "Timesheets to verify", note: "Received or verified, waiting for the verifier", value: o.timesheetsToVerify, href: "/portal/admin/timesheets", icon: FileCheck2 },
        { key: "accounts", label: "Waiting for accounts", note: "Approved by the verifier", value: o.timesheetsForAccounts, href: "/portal/admin/timesheets", icon: Hourglass },
        { key: "missing", label: "Missing timesheets", note: `No timesheet yet for ${monthName(o.lastMonth)}`, value: o.missingTimesheetsLastMonth, href: "/portal/admin/timesheets", icon: Clock, urgent: true },
        { key: "send", label: "Invoices to send", note: "Raised, not emailed or uploaded yet", value: o.invoicesToSend, href: "/portal/admin/billing", icon: Send },
        { key: "overdue", label: "Overdue invoices", note: "Past due, client hasn't paid", value: o.overdueInvoices, href: "/portal/admin/billing", icon: AlertTriangle, urgent: true },
        { key: "pay", label: "Consultants to pay", note: "Client paid, consultant not yet", value: o.consultantsToPay, href: "/portal/admin/billing", icon: Banknote },
        { key: "placements", label: "Active placements", note: "Not ended", value: o.activePlacements, href: "/portal/admin/placements", icon: Handshake },
      ]
    : [];

  return (
    <section aria-labelledby="queue-heading">
      <h2 id="queue-heading" className="dash-section-title">
        Client section
      </h2>
      <div className="mt-3">
        {overview.error && <ErrorNote text={overview.error} onRetry={overview.reload} />}
        {overview.loading && !o ? (
          <Loading />
        ) : (
          <ul className="grid gap-2.5 sm:grid-cols-2 sm:gap-3 xl:grid-cols-4">
            {cards
              .filter((c) => c.value !== null)
              .map(({ key, label, note, value, href, icon: Icon, urgent }) => {
                const hot = Boolean(urgent && value);
                return (
                  <li key={key}>
                    <Link href={href} className={cn("dash-card block h-full p-4", hot && "border-[rgb(220_38_38/0.35)] bg-[var(--dash-red-tint)]")}>
                      <p className="flex items-center gap-2 text-[0.8125rem] font-medium">
                        <span className={cn("dash-stat-icon", hot && "bg-white text-[var(--dash-red-ink)]")}>
                          <Icon className="size-3.5" aria-hidden="true" />
                        </span>
                        {label}
                      </p>
                      <p className={cn("mt-2.5 text-2xl font-semibold", hot && "text-[var(--dash-red-ink)]")}>{value}</p>
                      <p className="mt-0.5 text-xs text-[var(--dash-muted)]">{note}</p>
                    </Link>
                  </li>
                );
              })}
          </ul>
        )}
      </div>
    </section>
  );
}

const monthName = (m: string) => new Date(`${m}-01T12:00:00Z`).toLocaleDateString("en-US", { month: "long", timeZone: "UTC" });
