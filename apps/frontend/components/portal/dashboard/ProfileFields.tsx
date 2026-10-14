"use client";

import { useState, type ReactNode } from "react";
import { BriefcaseBusiness, Check, GraduationCap, X } from "lucide-react";
import { accountTypes, type AccountType } from "@/content/portal-demo";
import type { Profile } from "./session";

// Profile form pieces, shared by the Profile page and the sign-up
// onboarding: the account type cards, the fields for each type, skills.

const TYPE_ICONS = { student: GraduationCap, employee: BriefcaseBusiness };

export const targetRoles = ["Cloud Engineer", "DevOps Engineer", "Data Engineer", "QA Automation Engineer", "Security Analyst"];
export const departments = ["Technology Services", "Talent & Staffing", "Sales", "Finance", "Operations"];

export function Field({
  id,
  label,
  children,
  hint,
}: {
  id: string;
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="dash-label">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-[var(--dash-faint)]">{hint}</p>}
    </div>
  );
}

type Edit = (patch: Partial<Profile>) => void;

/** Text box bound to one profile field. */
export function TextField({
  name,
  label,
  profile,
  onChange,
  type = "text",
  placeholder,
  autoComplete,
}: {
  name: keyof Profile;
  label: string;
  profile: Profile;
  onChange: Edit;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
}) {
  const id = `pf-${name}`;
  return (
    <Field id={id} label={label}>
      <input
        id={id}
        type={type}
        value={String(profile[name] ?? "")}
        onChange={(e) => onChange({ [name]: e.target.value } as Partial<Profile>)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="dash-input"
      />
    </Field>
  );
}

function SelectField({
  name,
  label,
  options,
  profile,
  onChange,
}: {
  name: keyof Profile;
  label: string;
  options: string[];
  profile: Profile;
  onChange: Edit;
}) {
  const id = `pf-${name}`;
  return (
    <Field id={id} label={label}>
      <select
        id={id}
        value={String(profile[name] ?? "")}
        onChange={(e) => onChange({ [name]: e.target.value } as Partial<Profile>)}
        className="dash-input"
      >
        <option value="">Choose…</option>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </Field>
  );
}

/** Student / Employee, as two cards (a radio group). Clients never sign in. */
export function AccountTypePicker({ value, onChange }: { value: AccountType | null; onChange: (t: AccountType) => void }) {
  return (
    <div role="radiogroup" aria-label="Account type" className="grid gap-3 sm:grid-cols-2">
      {accountTypes.map((t) => {
        const Icon = TYPE_ICONS[t.id];
        const on = value === t.id;
        return (
          <button
            key={t.id}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(t.id)}
            className={`relative flex items-start gap-3 rounded-2xl border p-4 text-left transition ${
              on
                ? "border-[var(--dash-orange)] bg-[var(--dash-orange-tint)] shadow-[0_0_0_3px_rgb(252_101_13/0.12)]"
                : "border-[var(--dash-line-strong)] bg-white hover:border-[rgb(4_19_39/0.28)]"
            }`}
          >
            <span className={`grid size-10 flex-none place-items-center rounded-xl ${on ? "bg-[var(--dash-orange)] text-white" : "bg-[var(--dash-side)]"}`}>
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold">{t.label}</span>
              <span className="block text-xs leading-relaxed text-[var(--dash-muted)]">{t.body}</span>
            </span>
            {on && <Check className="absolute top-3 right-3 size-4 text-[var(--dash-orange)]" aria-hidden="true" />}
          </button>
        );
      })}
    </div>
  );
}

/** The extra fields each account type fills in. */
export function RoleFields({ profile, onChange }: { profile: Profile; onChange: Edit }) {
  if (profile.accountType === "student")
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField name="targetRole" label="Role you're looking for" options={targetRoles} profile={profile} onChange={onChange} />
        <SelectField name="availability" label="Available to start" options={["Immediately", "In 2 weeks", "In a month", "Later"]} profile={profile} onChange={onChange} />
      </div>
    );
  if (profile.accountType === "employee")
    return (
      <div className="grid gap-4 sm:grid-cols-3">
        <SelectField name="department" label="Department" options={departments} profile={profile} onChange={onChange} />
        <TextField name="employeeId" label="Employee ID" placeholder="PIX-0000" profile={profile} onChange={onChange} />
        <TextField name="manager" label="Manager" placeholder="Who you report to" profile={profile} onChange={onChange} />
      </div>
    );
  return <p className="text-sm text-[var(--dash-muted)]">Choose an account type above to see its details.</p>;
}

/** Skills as removable chips; Enter or comma adds one. */
export function SkillsField({ profile, onChange }: { profile: Profile; onChange: Edit }) {
  const [text, setText] = useState("");
  const add = () => {
    const skill = text.trim().replace(/,$/, "");
    if (skill && !profile.skills.includes(skill)) onChange({ skills: [...profile.skills, skill] });
    setText("");
  };
  return (
    <Field id="pf-skills" label="Skills" hint="Press Enter after each one.">
      <div className="flex min-h-[2.75rem] flex-wrap items-center gap-1.5 rounded-xl border border-[var(--dash-line-strong)] bg-white p-1.5 focus-within:border-[var(--dash-orange)] focus-within:shadow-[0_0_0_3px_rgb(252_101_13/0.16)]">
        {profile.skills.map((s) => (
          <span key={s} className="dash-chip h-7 bg-[var(--dash-side)] pr-1">
            {s}
            <button
              type="button"
              aria-label={`Remove ${s}`}
              onClick={() => onChange({ skills: profile.skills.filter((x) => x !== s) })}
              className="grid size-5 place-items-center rounded-full hover:bg-white"
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          id="pf-skills"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add();
            } else if (e.key === "Backspace" && !text && profile.skills.length) {
              onChange({ skills: profile.skills.slice(0, -1) });
            }
          }}
          onBlur={add}
          placeholder={profile.skills.length ? "" : "e.g. AWS, Python, Agile"}
          className="h-8 min-w-[8rem] flex-1 bg-transparent px-1.5 text-base outline-none sm:text-sm"
        />
      </div>
    </Field>
  );
}
