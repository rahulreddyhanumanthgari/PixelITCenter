"use client";

import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import type { FieldDef } from "./fields";

// One labelled input per field: text, select, yes / no, and the masked
// inputs for passport number, SSN last four and date of birth.

type Props = {
  id: string;
  def: FieldDef;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
  /** Sensitive only: what the server already holds, masked. */
  saved?: { isSet: boolean; masked: string | null };
};

const INPUT_MODE: Partial<Record<FieldDef["kind"], "decimal" | "numeric" | "tel" | "email" | "url">> = {
  number: "decimal",
  year: "numeric",
  tel: "tel",
  email: "email",
  url: "url",
};

const invalidRing = "aria-invalid:border-[var(--dash-red-ink)] aria-invalid:shadow-[0_0_0_3px_rgb(220_38_38/0.12)]";

export function PlacementField({ id, def, value, onChange, onBlur, error, disabled, saved }: Props) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const hint = def.sensitive && saved?.isSet && !disabled ? "Saved and encrypted. Type the full value only if you want to change it." : def.hint;
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") || undefined;
  const common = {
    id,
    disabled,
    onBlur,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy,
    "aria-required": def.required || undefined,
  };

  let control;
  if (def.kind === "yesno") {
    control = (
      <div role="radiogroup" aria-labelledby={`${id}-label`} aria-describedby={describedBy} className="flex gap-2">
        {(["yes", "no"] as const).map((v) => (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={value === v}
            disabled={disabled}
            onClick={() => onChange(v)}
            onBlur={onBlur}
            className={`h-11 flex-1 rounded-xl border text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
              value === v
                ? "border-[var(--dash-orange)] bg-[var(--dash-orange-tint)] text-[var(--dash-ink)]"
                : `bg-white hover:border-[rgb(4_19_39/0.28)] ${error ? "border-[var(--dash-red-ink)]" : "border-[var(--dash-line-strong)]"}`
            }`}
          >
            {v === "yes" ? "Yes" : "No"}
          </button>
        ))}
      </div>
    );
  } else if (def.kind === "select") {
    control = (
      <select {...common} value={value} onChange={(e) => onChange(e.target.value)} className={`dash-input ${invalidRing}`}>
        <option value="">Choose…</option>
        {def.options?.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    );
  } else if (def.sensitive) {
    control = disabled ? (
      <p className="dash-input flex items-center gap-2 bg-[var(--dash-side)] text-[var(--dash-muted)]">
        <Lock className="size-4 flex-none" aria-hidden="true" />
        <span id={id}>{saved?.masked ?? "Not given"}</span>
      </p>
    ) : (
      <SensitiveInput common={common} def={def} value={value} onChange={onChange} saved={saved} />
    );
  } else {
    control = (
      <input
        {...common}
        type={def.kind === "email" ? "email" : def.kind === "url" ? "url" : def.kind === "tel" ? "tel" : "text"}
        inputMode={INPUT_MODE[def.kind]}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={def.placeholder}
        maxLength={def.kind === "year" ? 4 : def.max}
        autoComplete={def.autoComplete}
        className={`dash-input ${invalidRing} disabled:bg-[var(--dash-side)] disabled:text-[var(--dash-muted)]`}
      />
    );
  }

  return (
    <div className={def.wide ? "sm:col-span-2" : undefined}>
      <label id={`${id}-label`} htmlFor={def.kind === "yesno" ? undefined : id} className="dash-label">
        {def.label}
        {def.required ? (
          <span className="text-[var(--dash-orange-ink)]" aria-hidden="true">
            {" "}*
          </span>
        ) : (
          <span className="font-normal text-[var(--dash-faint)]"> (optional)</span>
        )}
      </label>
      {control}
      {error ? (
        <p id={errorId} className="mt-1 text-xs font-medium text-[var(--dash-red-ink)]">
          {error}
        </p>
      ) : (
        hint && (
          <p id={hintId} className="mt-1 text-xs text-[var(--dash-faint)]">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

/** Hidden by default; the eye shows what you typed. Saved values never come back from the server. */
function SensitiveInput({
  common,
  def,
  value,
  onChange,
  saved,
}: {
  common: Record<string, unknown>;
  def: FieldDef;
  value: string;
  onChange: (v: string) => void;
  saved?: { isSet: boolean; masked: string | null };
}) {
  const [shown, setShown] = useState(false);
  const placeholder = saved?.isSet ? `Saved: ${saved.masked}` : def.key === "dateOfBirth" ? "MM/DD/YYYY" : def.key === "ssnLast4" ? "••••" : "";
  return (
    <div className="relative">
      <input
        {...common}
        type={shown ? "text" : "password"}
        inputMode={def.key === "ssnLast4" ? "numeric" : undefined}
        value={value}
        onChange={(e) => onChange(def.key === "ssnLast4" ? e.target.value.replace(/\D/g, "") : e.target.value)}
        placeholder={placeholder}
        maxLength={def.max}
        autoComplete="off"
        spellCheck={false}
        data-1p-ignore
        className={`dash-input pr-12 ${invalidRing}`}
      />
      <button
        type="button"
        onClick={() => setShown((s) => !s)}
        aria-label={shown ? `Hide ${def.label.toLowerCase()}` : `Show ${def.label.toLowerCase()}`}
        aria-pressed={shown}
        className="absolute top-1/2 right-1.5 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-[var(--dash-muted)] hover:bg-[var(--dash-side)] hover:text-[var(--dash-ink)]"
      >
        {shown ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
      </button>
    </div>
  );
}
