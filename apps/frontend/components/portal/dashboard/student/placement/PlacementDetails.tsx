"use client";

import { useEffect, useState } from "react";
import { Check, ChevronLeft, ChevronRight, LoaderCircle, MessageSquareWarning, Save, Send, ShieldCheck } from "lucide-react";
import { Chip, useToast } from "../../ui";
import { ApiError, placementApi, type DraftPayload, type PlacementDocument, type PlacementProfile, type Status } from "./api";
import {
  completionOf,
  EDUCATION,
  formErrors,
  INTERVIEW,
  normaliseDate,
  normaliseUrl,
  PERSONAL,
  REFERENCE,
  SECTIONS,
  sectionOf,
  sectionProgress,
  SENSITIVE_KEYS,
  type FieldDef,
  type FormState,
  type ReferenceValues,
  type SectionId,
  type Values,
} from "./fields";
import { PlacementDocuments } from "./PlacementDocuments";
import { PlacementField } from "./PlacementInputs";

// Placement Details on the student's Profile page: the skill matrix that
// recruiters need before they market a profile. Saved to the portal API as
// a draft; submitted once everything (and the three documents) is in.

const STATUS: Record<Status, { label: string; tone?: "good" | "warn" | "ink"; body: string }> = {
  DRAFT: { label: "Draft", body: "Not sent yet. Save as you go and submit when everything is in." },
  SUBMITTED: { label: "Submitted", tone: "ink", body: "Sent to your recruiter. You'll see their answer here." },
  UNDER_REVIEW: { label: "Under review", tone: "ink", body: "A recruiter is checking your details now." },
  NEEDS_UPDATE: { label: "Needs update", tone: "warn", body: "Your recruiter asked for a few changes. Make them below and submit again." },
  APPROVED: { label: "Approved", tone: "good", body: "All set. Recruiters can now market your profile." },
};

const ALL_FIELDS = [...PERSONAL, ...EDUCATION, ...INTERVIEW];

/** Server profile → what the inputs hold. Sensitive inputs start empty. */
function toForm(p: PlacementProfile): { values: Values; references: [ReferenceValues, ReferenceValues] } {
  const values: Values = {};
  for (const def of ALL_FIELDS) {
    if (def.sensitive) values[def.key] = "";
    else if (def.kind === "yesno") values[def.key] = p.fields[def.key] === true ? "yes" : p.fields[def.key] === false ? "no" : "";
    else values[def.key] = p.fields[def.key] == null ? "" : String(p.fields[def.key]);
  }
  const refs = [1, 2].map((pos) => {
    const r = p.references.find((x) => x.position === pos);
    return Object.fromEntries(REFERENCE.map((d) => [d.key, r?.[d.key] ?? ""]));
  });
  return { values, references: [refs[0]!, refs[1]!] };
}

/** What the inputs hold → PUT body. Unparseable numbers are left out (kept as saved). */
function toPayload(values: Values, references: ReferenceValues[]): DraftPayload {
  const out: DraftPayload = {};
  for (const def of ALL_FIELDS) {
    const v = (values[def.key] ?? "").trim();
    if (def.sensitive) {
      if (!v) continue; // empty = keep what's saved
      out[def.key] = def.key === "dateOfBirth" ? normaliseDate(v) : def.key === "passportNumber" ? v.toUpperCase() : v;
    } else if (def.kind === "yesno") out[def.key] = v === "yes" ? true : v === "no" ? false : null;
    else if (def.kind === "number" || def.kind === "year") {
      if (!v) out[def.key] = null;
      else {
        const n = Number(v);
        const ok = Number.isFinite(n) && n >= 0 && (def.kind === "number" ? n <= 60 : Number.isInteger(n) && n >= 1900 && n <= 2100);
        if (ok) out[def.key] = n;
      }
    } else out[def.key] = def.kind === "url" && v ? normaliseUrl(v) : v || null;
  }
  out.references = references.map((r, i) => ({
    position: i + 1,
    ...Object.fromEntries(REFERENCE.map((d) => [d.key, (r[d.key] ?? "").trim() || null])),
  }));
  return out;
}

export function PlacementDetails({ email }: { email: string }) {
  const [state, setState] = useState<{ kind: "loading" } | { kind: "error"; message: string } | { kind: "ready"; profile: PlacementProfile }>({ kind: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let live = true;
    placementApi
      .get(email)
      .then((profile) => live && setState({ kind: "ready", profile }))
      .catch((e) => live && setState({ kind: "error", message: e instanceof ApiError ? e.message : "Couldn't load your placement details." }));
    return () => {
      live = false;
    };
  }, [email, attempt]);

  const load = () => {
    setState({ kind: "loading" });
    setAttempt((n) => n + 1);
  };

  return (
    <section aria-labelledby="placement-title" className="space-y-4">
      {state.kind === "ready" ? (
        <PlacementForm email={email} initial={state.profile} />
      ) : (
        <div className="dash-card dash-card-pad">
          <Heading />
          {state.kind === "loading" ? (
            <p className="mt-4 flex items-center gap-2 text-sm text-[var(--dash-muted)]" role="status">
              <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> Loading your details…
            </p>
          ) : (
            <div className="mt-4 rounded-xl bg-[var(--dash-red-tint)] p-4 text-sm text-[var(--dash-red-ink)]" role="alert">
              <p className="font-semibold">{state.message}</p>
              <button type="button" className="dash-btn-ghost mt-3" onClick={load}>
                Try again
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function Heading({ status }: { status?: Status }) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h2 id="placement-title" className="text-lg font-semibold">
          Placement details
        </h2>
        {status && <Chip tone={STATUS[status].tone}>{STATUS[status].label}</Chip>}
      </div>
      <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-[var(--dash-muted)]">
        Please provide the following details and attach your updated resume, Driver&apos;s License (DL), and Visa copy to proceed.
      </p>
    </>
  );
}

function PlacementForm({ email, initial }: { email: string; initial: PlacementProfile }) {
  const [profile, setProfile] = useState(initial);
  const [baseline, setBaseline] = useState(() => toForm(initial));
  const [values, setValues] = useState(baseline.values);
  const [references, setReferences] = useState(baseline.references);
  const [step, setStep] = useState<SectionId>("personal");
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [triedSubmit, setTriedSubmit] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<"save" | "submit" | null>(null);
  const [toast, showToast] = useToast({ raised: true });

  const canEdit = profile.canEdit;
  const dirty = JSON.stringify({ values, references }) !== JSON.stringify(baseline);

  const form: FormState = {
    values,
    references,
    savedSensitive: {
      passportNumber: profile.sensitive.passportNumber.isSet,
      ssnLast4: profile.sensitive.ssnLast4.isSet,
      dateOfBirth: profile.sensitive.dateOfBirth.isSet,
    },
    documents: profile.documents.map((d) => d.type),
  };
  const formatErrors = formErrors(form, { required: false });
  const allErrors = formErrors(form, { required: true });
  const percent = completionOf(form);
  const ready = canEdit && Object.keys(allErrors).length === 0;
  const left = Object.keys(allErrors).length;

  // Show an error once the field was left, or after Submit was tried; server errors until the field changes.
  const errorFor = (key: string) =>
    serverErrors[key] ?? (triedSubmit ? allErrors[key] : touched.has(key) ? (formatErrors[key] ?? (allErrors[key] === "Required." ? undefined : allErrors[key])) : undefined);

  // Leaving with unsaved changes asks first.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const clearServerError = (key: string) =>
    setServerErrors((e) => {
      if (!(key in e)) return e;
      const next = { ...e };
      delete next[key];
      return next;
    });

  const setValue = (key: string, v: string) => {
    setValues((s) => ({ ...s, [key]: v }));
    clearServerError(key);
  };
  const setRef = (i: 0 | 1, key: string, v: string) => {
    setReferences((rs) => {
      const next = [...rs] as [ReferenceValues, ReferenceValues];
      next[i] = { ...next[i], [key]: v };
      return next;
    });
    clearServerError(`references.${i + 1}.${key}`);
  };
  const touch = (key: string) => setTouched((t) => (t.has(key) ? t : new Set(t).add(key)));

  function accept(p: PlacementProfile) {
    const next = toForm(p);
    setProfile(p);
    setBaseline(next);
    setValues(next.values);
    setReferences(next.references);
  }

  async function save(quiet = false) {
    setBusy("save");
    try {
      const p = await placementApi.save(email, toPayload(values, references));
      accept(p);
      if (!quiet) showToast(Object.keys(formatErrors).length ? "Draft saved. Fix the highlighted fields before you submit." : "Draft saved.");
      return true;
    } catch (e) {
      if (e instanceof ApiError && Object.keys(e.fields).length) setServerErrors(e.fields);
      showToast(e instanceof ApiError ? e.message : "Couldn't save. Try again.");
      return false;
    } finally {
      setBusy(null);
    }
  }

  function jumpToFirst(errors: Record<string, string>) {
    const first = Object.keys(errors)[0];
    if (first) setStep(sectionOf(first));
  }

  async function submit() {
    setTriedSubmit(true);
    if (left) {
      jumpToFirst(allErrors);
      showToast("A few things are missing. They're marked in red.");
      return;
    }
    if (dirty && !(await save(true))) return;
    setBusy("submit");
    try {
      accept(await placementApi.submit(email));
      setTriedSubmit(false);
      setTouched(new Set());
      showToast("Submitted. Your recruiter will review it.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      if (e instanceof ApiError) {
        const errs = { ...e.fields, ...Object.fromEntries(e.missingDocuments.map((t) => [`document:${t}`, "Required."])) };
        setServerErrors(errs);
        jumpToFirst(errs);
        showToast(e.message);
      } else showToast("Couldn't submit. Try again.");
    } finally {
      setBusy(null);
    }
  }

  const stepIndex = SECTIONS.findIndex((s) => s.id === step);
  const section = SECTIONS[stepIndex]!;
  const shownErrors = { ...serverErrors, ...(triedSubmit ? allErrors : {}) };
  const sectionHasError = new Set(Object.keys(shownErrors).map(sectionOf));

  const field = (def: FieldDef) => (
    <PlacementField
      key={def.key}
      id={`pl-${def.key}`}
      def={def}
      value={values[def.key] ?? ""}
      onChange={(v) => setValue(def.key, v)}
      onBlur={() => {
        touch(def.key);
        if (def.kind === "url" && values[def.key]?.trim()) setValue(def.key, normaliseUrl(values[def.key]!));
      }}
      error={errorFor(def.key)}
      disabled={!canEdit}
      saved={SENSITIVE_KEYS.includes(def.key as (typeof SENSITIVE_KEYS)[number]) ? profile.sensitive[def.key as (typeof SENSITIVE_KEYS)[number]] : undefined}
    />
  );

  const status = STATUS[profile.status];
  const latest = profile.history[0];

  return (
    <>
      {/* Heading, status and progress */}
      <div className="dash-card dash-card-pad">
        <Heading status={profile.status} />
        <div className="mt-4 flex items-center gap-3">
          <div className="dash-bar flex-1" data-tone={percent === 100 ? "good" : undefined} role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label="Placement details complete">
            <span style={{ width: `${percent}%`, transition: "width 0.4s ease" }} />
          </div>
          <span className="text-sm font-semibold tabular-nums">{percent}% complete</span>
        </div>

        {profile.status !== "DRAFT" && (
          <div
            className={`mt-4 rounded-xl p-4 text-sm ${profile.status === "NEEDS_UPDATE" ? "bg-[var(--dash-orange-tint)]" : profile.status === "APPROVED" ? "bg-[var(--dash-cyan-tint)]" : "bg-[var(--dash-side)]"}`}
            role="status"
          >
            <p className="font-semibold">{status.body}</p>
            {latest && <p className="mt-0.5 text-xs text-[var(--dash-muted)]">Updated {new Date(latest.at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</p>}
            {profile.reviewerComment && (
              <div className="mt-3 flex gap-2.5 rounded-lg bg-white p-3">
                <MessageSquareWarning className="mt-0.5 size-4 flex-none text-[var(--dash-orange-ink)]" aria-hidden="true" />
                <div>
                  <p className="text-xs font-semibold tracking-wide text-[var(--dash-muted)] uppercase">Recruiter&apos;s comment</p>
                  <p className="mt-1 whitespace-pre-line">{profile.reviewerComment}</p>
                </div>
              </div>
            )}
          </div>
        )}
        <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-[var(--dash-muted)]">
          <ShieldCheck className="mt-px size-4 flex-none text-[var(--dash-cyan-ink)]" aria-hidden="true" />
          Your passport number, SSN digits and date of birth are encrypted and only shown to your recruiter. Fields marked * are required.
        </p>
      </div>

      {/* Steps */}
      <div className="dash-card overflow-hidden">
        <div className="overflow-x-auto border-b border-[var(--dash-line)] px-3 pt-3 sm:px-4">
          <div role="tablist" aria-label="Placement details sections" className="flex min-w-max gap-1 pb-3">
            {SECTIONS.map((s, i) => {
              const [done, total] = sectionProgress(form, s.id);
              const complete = done === total;
              const hasError = sectionHasError.has(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  id={`pl-tab-${s.id}`}
                  aria-selected={s.id === step}
                  aria-controls="pl-panel"
                  onClick={() => setStep(s.id)}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition ${
                    s.id === step ? "bg-[var(--dash-side)] font-semibold text-[var(--dash-ink)]" : "text-[var(--dash-muted)] hover:bg-[var(--dash-hover)]"
                  }`}
                >
                  <span
                    className={`grid size-6 flex-none place-items-center rounded-full text-xs font-bold ${
                      hasError ? "bg-[var(--dash-red-tint)] text-[var(--dash-red-ink)]" : complete ? "bg-[var(--dash-cyan-tint)] text-[var(--dash-cyan-ink)]" : "bg-white ring-1 ring-[var(--dash-line-strong)]"
                    }`}
                  >
                    {complete && !hasError ? <Check className="size-3.5" aria-hidden="true" /> : i + 1}
                  </span>
                  <span>
                    {s.title}
                    <span className="ml-1.5 text-xs font-normal text-[var(--dash-faint)] tabular-nums">
                      {done}/{total}
                    </span>
                    {hasError && <span className="sr-only"> (needs attention)</span>}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div id="pl-panel" role="tabpanel" aria-labelledby={`pl-tab-${step}`} className="dash-card-pad">
          <h3 className="text-[0.9375rem] font-semibold">{section.title}</h3>
          <p className="mt-1 mb-5 text-sm text-[var(--dash-muted)]">{section.body}</p>

          {step === "personal" && <div className="grid gap-4 sm:grid-cols-2">{PERSONAL.map(field)}</div>}

          {step === "education" && (
            <div className="space-y-6">
              <fieldset>
                <legend className="mb-3 text-sm font-semibold">Bachelor&apos;s</legend>
                <div className="grid gap-4 sm:grid-cols-3">{EDUCATION.slice(0, 3).map(field)}</div>
              </fieldset>
              <fieldset>
                <legend className="mb-3 text-sm font-semibold">
                  Master&apos;s <span className="font-normal text-[var(--dash-faint)]">(optional)</span>
                </legend>
                <div className="grid gap-4 sm:grid-cols-3">{EDUCATION.slice(3).map(field)}</div>
              </fieldset>
            </div>
          )}

          {step === "interview" && <div className="grid gap-4 sm:grid-cols-2">{INTERVIEW.map(field)}</div>}

          {step === "references" && (
            <div className="grid gap-5 lg:grid-cols-2">
              {([0, 1] as const).map((i) => (
                <fieldset key={i} className="rounded-2xl border border-[var(--dash-line-strong)] p-4">
                  <legend className="px-1 text-sm font-semibold">Reference {i + 1}</legend>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {REFERENCE.map((def) => {
                      const key = `references.${i + 1}.${def.key}`;
                      return (
                        <PlacementField
                          key={key}
                          id={`pl-ref${i + 1}-${def.key}`}
                          def={def}
                          value={references[i][def.key] ?? ""}
                          onChange={(v) => setRef(i, def.key, v)}
                          onBlur={() => touch(key)}
                          error={errorFor(key)}
                          disabled={!canEdit}
                        />
                      );
                    })}
                  </div>
                </fieldset>
              ))}
            </div>
          )}

          {step === "attachments" && (
            <PlacementDocuments
              email={email}
              documents={profile.documents}
              canEdit={canEdit}
              errors={shownErrors}
              onChange={(docs: PlacementDocument[]) => {
                setProfile((p) => ({ ...p, documents: docs }));
                for (const d of docs) clearServerError(`document:${d.type}`);
              }}
              notify={showToast}
            />
          )}

          <div className="mt-6 flex justify-between gap-2 border-t border-[var(--dash-line)] pt-4">
            <button type="button" className="dash-btn-ghost" disabled={stepIndex === 0} onClick={() => setStep(SECTIONS[stepIndex - 1]!.id)}>
              <ChevronLeft className="size-4" aria-hidden="true" /> Back
            </button>
            {stepIndex < SECTIONS.length - 1 && (
              <button type="button" className="dash-btn-ghost" onClick={() => setStep(SECTIONS[stepIndex + 1]!.id)}>
                Next: {SECTIONS[stepIndex + 1]!.title} <ChevronRight className="size-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Save / submit, always in view while editing. */}
      {canEdit && (
        <div className="sticky bottom-4 z-20">
          <div className="dash-card flex flex-wrap items-center justify-between gap-3 px-4 py-3 shadow-[0_16px_40px_-18px_rgb(4_19_39/0.45)] sm:px-5">
            <p className="min-w-0 flex-1 basis-56 text-xs leading-relaxed text-[var(--dash-muted)]">
              {dirty ? (
                <span className="font-semibold text-[var(--dash-orange-ink)]">Unsaved changes. </span>
              ) : null}
              {ready ? "Everything is in. Submit to send it to your recruiter." : `${left} ${left === 1 ? "item" : "items"} left before you can submit.`}
              {!ready && !triedSubmit && (
                <>
                  {" "}
                  <button
                    type="button"
                    className="font-semibold text-[var(--dash-ink)] underline underline-offset-2"
                    onClick={() => {
                      setTriedSubmit(true);
                      jumpToFirst(allErrors);
                    }}
                  >
                    Show what&apos;s missing
                  </button>
                </>
              )}
            </p>
            <div className="ml-auto flex gap-2">
              <button type="button" className="dash-btn-ghost" disabled={!dirty || busy !== null} onClick={() => save()}>
                {busy === "save" ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Save className="size-4" aria-hidden="true" />}
                Save draft
              </button>
              <button type="button" className="dash-btn" data-tone="orange" disabled={!ready || busy !== null} onClick={submit}>
                {busy === "submit" ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Send className="size-4" aria-hidden="true" />}
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
      {toast}
    </>
  );
}
