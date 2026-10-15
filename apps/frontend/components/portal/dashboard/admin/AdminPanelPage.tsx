"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { BarChart3, History, Search, Settings2, ShieldCheck, UserPlus, Users } from "lucide-react";
import type { JobRole, TeamMember } from "@/content/portal-demo";
import { useSession } from "../session";
import { addMember, adminCount, updateMember, useTeam } from "../team";
import { Avatar, Chip, PageHeader, useToast } from "../ui";
import { ActivityLog } from "./ActivityLog";
import { AnalyticsTab } from "./AnalyticsTab";
import { savePortalSettings, usePortalSettings, type PortalSettings } from "./portalSettings";
import { Choice, Empty, Field, Panel, roleLabel } from "./ui";

// The Admin panel: only admins see it (menu, shell guard, and the API for the
// activity log). Three tabs:
//   Team & access  who is on the team, their job role, who is an admin
//   Portal settings company details on invoices, billing and reminder defaults
//   Activity log   every view and change of billing data (the server's audit log)
//
// FRONT END ONLY for team and settings (kept in this browser); the activity log
// is real. With the backend, team and settings become server tables that only
// admins can change, and every change is logged.

const JOB_ROLES: { id: JobRole | ""; label: string; body: string }[] = [
  { id: "", label: "No access", body: "Can't open staff pages yet." },
  { id: "recruiter", label: "Recruiter", body: "Talent and placements, no billing." },
  { id: "verifier", label: "Verifier", body: "Checks timesheets." },
  { id: "accounts", label: "Accounts", body: "Clients, invoices, payments." },
];

type Tab = "analytics" | "team" | "settings" | "activity";

export function AdminPanelPage() {
  const [tab, setTab] = useState<Tab>("analytics");
  const [toast, showToast] = useToast();
  return (
    <div className="space-y-6">
      <PageHeader title="Admin panel" body="Control the portal: how it's doing, who can do what, its settings, and everything that's been done." />
      <div className="dash-scroll-row -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="dash-tabs" role="tablist" aria-label="Admin panel">
          {(
            [
              ["analytics", "Analytics", BarChart3],
              ["team", "Team & access", Users],
              ["settings", "Portal settings", Settings2],
              ["activity", "Activity log", History],
            ] as const
          ).map(([id, label, Icon]) => (
            <button key={id} type="button" role="tab" id={`tab-${id}`} aria-selected={tab === id} aria-controls={`panel-${id}`} className="dash-tab inline-flex items-center gap-1.5" onClick={() => setTab(id)}>
              <Icon className="size-3.5" aria-hidden="true" /> {label}
            </button>
          ))}
        </div>
      </div>
      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === "analytics" ? (
          <AnalyticsTab />
        ) : tab === "team" ? (
          <TeamTab onDone={showToast} />
        ) : tab === "settings" ? (
          <SettingsTab onDone={showToast} />
        ) : (
          <ActivityLog />
        )}
      </div>
      {toast}
    </div>
  );
}

// --- Team & access --------------------------------------------------------------------------

function TeamTab({ onDone }: { onDone: (message: string) => void }) {
  const team = useTeam();
  const session = useSession();
  const me = session?.profile.email.toLowerCase() ?? "";
  const [filter, setFilter] = useState<"all" | "admins" | "none">("all");
  const [q, setQ] = useState("");
  const [adding, setAdding] = useState(false);
  const [adminChange, setAdminChange] = useState<TeamMember | null>(null);

  const needle = q.trim().toLowerCase();
  const shown = team
    .filter((m) => filter === "all" || (filter === "admins" ? m.isAdmin : !m.isAdmin && !m.jobRole))
    .filter((m) => !needle || m.fullName.toLowerCase().includes(needle) || m.email.includes(needle))
    .sort((a, b) => Number(b.isAdmin) - Number(a.isAdmin) || a.fullName.localeCompare(b.fullName));
  const waiting = team.filter((m) => !m.isAdmin && !m.jobRole).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="dash-tabs" role="group" aria-label="Show">
          {(
            [
              ["all", `Everyone`, team.length],
              ["admins", "Admins", adminCount(team)],
              ["none", "No access yet", waiting],
            ] as const
          ).map(([id, label, n]) => (
            <button key={id} type="button" className="dash-tab" aria-pressed={filter === id} onClick={() => setFilter(id)}>
              {label} <span className="ml-1 text-[var(--dash-faint)]">{n}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row lg:ml-auto">
          <div className="relative sm:w-64">
            <label htmlFor="team-search" className="sr-only">
              Search the team
            </label>
            <input id="team-search" type="search" className="dash-input pr-10" placeholder="Name or email" value={q} onChange={(e) => setQ(e.target.value)} />
            <Search className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-[var(--dash-muted)]" aria-hidden="true" />
          </div>
          <button type="button" className="dash-btn" data-tone="orange" onClick={() => setAdding(true)}>
            <UserPlus className="size-4" aria-hidden="true" /> Add employee
          </button>
        </div>
      </div>

      <p className="text-sm text-[var(--dash-muted)]">
        New employees start with no access. Give them a job role, and make someone an admin only if they should control the whole portal.
      </p>

      {shown.length === 0 ? (
        <div className="dash-card">
          <Empty title="No one here" body="Try another filter." />
        </div>
      ) : (
        <ul className="space-y-3">
          {shown.map((m) => (
            <li key={m.email} className="dash-card flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-3.5">
                <Avatar name={m.fullName} size={48} />
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 font-semibold">
                    {m.fullName}
                    {m.email === me && <Chip tone="ink">You</Chip>}
                    {m.isAdmin && (
                      <Chip tone="warn">
                        Admin
                      </Chip>
                    )}
                    {!m.isAdmin && !m.jobRole && <Chip>No access yet</Chip>}
                  </p>
                  <p className="text-sm [overflow-wrap:anywhere] text-[var(--dash-muted)] sm:truncate">
                    {m.email}
                    {m.title && ` · ${m.title}`}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="sm:w-48">
                  <label htmlFor={`role-${m.email}`} className="dash-label">
                    Job role
                  </label>
                  <select
                    id={`role-${m.email}`}
                    className="dash-input"
                    value={m.jobRole ?? ""}
                    onChange={(e) => {
                      const jobRole = (e.target.value || null) as JobRole | null;
                      updateMember(m.email, { jobRole });
                      onDone(`${m.fullName} is now ${jobRole ? JOB_ROLES.find((r) => r.id === jobRole)!.label : "without a job role"}.`);
                    }}
                  >
                    {JOB_ROLES.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex min-h-[44px] items-center gap-3 sm:min-w-[9.5rem] sm:pb-1.5">
                  <span id={`admin-${m.email}`} className="text-sm font-semibold">
                    Admin
                  </span>
                  <button type="button" role="switch" aria-checked={m.isAdmin} aria-labelledby={`admin-${m.email}`} className="dash-switch" onClick={() => setAdminChange(m)} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <AdminChangeWindow
        member={adminChange}
        isMe={adminChange?.email === me}
        lastAdmin={Boolean(adminChange?.isAdmin && adminCount(team) <= 1)}
        onClose={() => setAdminChange(null)}
        onDone={(message) => {
          setAdminChange(null);
          onDone(message);
        }}
      />
      <AddEmployeeWindow
        open={adding}
        onClose={() => setAdding(false)}
        onDone={(message) => {
          setAdding(false);
          onDone(message);
        }}
      />
    </div>
  );
}

/** Making someone an admin (or taking it away) always asks first. */
function AdminChangeWindow({
  member,
  isMe,
  lastAdmin,
  onClose,
  onDone,
}: {
  member: TeamMember | null;
  isMe: boolean;
  lastAdmin: boolean;
  onClose: () => void;
  onDone: (message: string) => void;
}) {
  const granting = member ? !member.isAdmin : false;
  return (
    <Panel
      center
      open={Boolean(member)}
      title={member ? (granting ? `Make ${member.fullName} an admin?` : `Remove admin from ${member.fullName}?`) : ""}
      subtitle={member?.email}
      onClose={onClose}
      footer={
        member && (
          <>
            <button type="button" className="dash-btn-ghost mr-auto" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="dash-btn"
              data-tone={granting ? "orange" : "danger"}
              disabled={lastAdmin}
              onClick={() => {
                updateMember(member.email, { isAdmin: granting });
                onDone(granting ? `${member.fullName} is now an admin.` : `${member.fullName} is no longer an admin.`);
              }}
            >
              <ShieldCheck className="size-4" aria-hidden="true" /> {granting ? "Make admin" : "Remove admin"}
            </button>
          </>
        )
      }
    >
      {member &&
        (lastAdmin ? (
          <p className="rounded-2xl bg-[var(--dash-red-tint)] p-4 text-sm text-[var(--dash-red-ink)]">
            {member.fullName} is the only admin. Make someone else an admin first; the portal always needs at least one.
          </p>
        ) : granting ? (
          <div className="space-y-3 text-sm">
            <p>Admins control the whole portal. {member.fullName} will be able to:</p>
            <ul className="list-disc space-y-1 pl-5 text-[var(--dash-muted)]">
              <li>give and take away access, and make other admins</li>
              <li>change the portal&apos;s settings</li>
              <li>see and change every client, placement, timesheet and invoice</li>
              <li>delete students and placements</li>
            </ul>
          </div>
        ) : (
          <p className="text-sm">
            {isMe
              ? "You'll lose the Admin panel straight away. You keep your job role."
              : `${member.fullName} keeps their job role (${member.jobRole ? roleLabel(member.jobRole) : "none"}) but loses the Admin panel.`}
          </p>
        ))}
    </Panel>
  );
}

function AddEmployeeWindow({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: (message: string) => void }) {
  const [draft, setDraft] = useState({ fullName: "", email: "", title: "", jobRole: "" as JobRole | "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setDraft({ fullName: "", email: "", title: "", jobRole: "" });
      setErrors({});
    }
  }

  function save(e: FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!draft.fullName.trim()) next.fullName = "Required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())) next.email = "Enter a valid email address.";
    setErrors(next);
    if (Object.keys(next).length) return;
    try {
      addMember({ fullName: draft.fullName.trim(), email: draft.email.trim(), title: draft.title.trim(), jobRole: draft.jobRole || null });
      onDone(`${draft.fullName.trim()} was added${draft.jobRole ? ` as ${roleLabel(draft.jobRole)}` : " with no access yet"}.`);
    } catch (err) {
      setErrors({ email: err instanceof Error ? err.message : "Couldn't add them." });
    }
  }

  return (
    <Panel
      center
      open={open}
      title="Add an employee"
      subtitle="They sign in with this email. New employees are never admins; switch that on separately if needed."
      onClose={onClose}
      footer={
        <>
          <button type="button" className="dash-btn-ghost mr-auto" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="add-employee" className="dash-btn" data-tone="orange">
            <UserPlus className="size-4" aria-hidden="true" /> Add employee
          </button>
        </>
      }
    >
      <form id="add-employee" onSubmit={save} className="space-y-4" noValidate>
        <Field id="ae-name" label="Full name" error={errors.fullName}>
          <input id="ae-name" className="dash-input" value={draft.fullName} onChange={(e) => setDraft({ ...draft, fullName: e.target.value })} autoComplete="off" aria-invalid={Boolean(errors.fullName) || undefined} />
        </Field>
        <Field id="ae-email" label="Work email" error={errors.email}>
          <input id="ae-email" type="email" inputMode="email" className="dash-input" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} autoComplete="off" aria-invalid={Boolean(errors.email) || undefined} />
        </Field>
        <Field id="ae-title" label="Job title (optional)">
          <input id="ae-title" className="dash-input" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="e.g. Senior recruiter" />
        </Field>
        <div role="radiogroup" aria-label="Job role" className="grid gap-2 sm:grid-cols-2">
          {JOB_ROLES.map((r) => (
            <Choice key={r.id} on={draft.jobRole === r.id} onClick={() => setDraft({ ...draft, jobRole: r.id })} title={r.label} body={r.body} />
          ))}
        </div>
      </form>
    </Panel>
  );
}

// --- Portal settings ----------------------------------------------------------------------

function SettingsTab({ onDone }: { onDone: (message: string) => void }) {
  const saved = usePortalSettings();
  const [draft, setDraft] = useState<PortalSettings>(saved);
  const [last, setLast] = useState(saved);
  if (saved !== last) {
    setLast(saved);
    setDraft(saved);
  }
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const text = (k: keyof PortalSettings) => ({
    id: `ps-${k}`,
    className: "dash-input",
    value: String(draft[k]),
    onChange: (e: { target: { value: string } }) => setDraft({ ...draft, [k]: e.target.value }),
  });

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        savePortalSettings(draft);
        onDone("Portal settings saved.");
      }}
    >
      <SettingsCard title="Company details" body="Printed on every invoice and in emails to clients and students.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="ps-companyName" label="Company name">
            <input {...text("companyName")} />
          </Field>
          <Field id="ps-companyEmail" label="Accounts email">
            <input {...text("companyEmail")} type="email" inputMode="email" />
          </Field>
          <Field id="ps-companyPhone" label="Phone">
            <input {...text("companyPhone")} type="tel" />
          </Field>
          <Field id="ps-companyAddress" label="Address">
            <input {...text("companyAddress")} />
          </Field>
          <Field id="ps-remitTo" label="Remit to (optional)" hint="Bank or remittance line printed under the total." className="sm:col-span-2">
            <input {...text("remitTo")} />
          </Field>
        </div>
      </SettingsCard>

      <SettingsCard title="Billing and reminders" body="Defaults for new clients, and when students are reminded about timesheets.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="ps-defaultTerms" label="Payment terms for new clients" hint="Pre-selected when an admin adds a client.">
            <select id="ps-defaultTerms" className="dash-input" value={draft.defaultPaymentTermsDays} onChange={(e) => setDraft({ ...draft, defaultPaymentTermsDays: Number(e.target.value) })}>
              {[15, 30, 45, 60, 90].map((d) => (
                <option key={d} value={d}>
                  Net {d}
                </option>
              ))}
            </select>
          </Field>
          <Field id="ps-reminder" label="Timesheet reminders start" hint="Students without a timesheet get an email and a notification each day from then.">
            <select id="ps-reminder" className="dash-input" value={draft.reminderDaysBeforeMonthEnd} onChange={(e) => setDraft({ ...draft, reminderDaysBeforeMonthEnd: Number(e.target.value) })}>
              {[1, 2, 3, 5, 7].map((d) => (
                <option key={d} value={d}>
                  {d} day{d === 1 ? "" : "s"} before the month ends
                </option>
              ))}
            </select>
          </Field>
        </div>
        <p className="mt-4 text-sm text-[var(--dash-muted)]">Invoices for clients with auto-send on are emailed on the 1st of each month.</p>
      </SettingsCard>

      <p className="rounded-2xl bg-[var(--dash-side)] p-4 text-xs text-[var(--dash-muted)]">
        Demo: saved in this browser. Today the server reads these from its own settings file; they move here when the settings API is built.
      </p>

      <div className="flex justify-end gap-2">
        <button type="button" className="dash-btn-ghost" disabled={!dirty} onClick={() => setDraft(saved)}>
          Discard
        </button>
        <button type="submit" className="dash-btn" data-tone="orange" disabled={!dirty}>
          Save settings
        </button>
      </div>
    </form>
  );
}

function SettingsCard({ title, body, children }: { title: string; body: string; children: ReactNode }) {
  return (
    <section className="dash-card dash-card-pad grid gap-5 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-8">
      <div>
        <h2 className="text-[0.9375rem] font-semibold">{title}</h2>
        <p className="mt-1 text-sm leading-relaxed text-[var(--dash-muted)]">{body}</p>
      </div>
      <div>{children}</div>
    </section>
  );
}
