"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, LoaderCircle } from "lucide-react";
import { accountTypes } from "@/content/portal-demo";
import { Logo } from "@/components/site/layout/Logo";
import { AccountTypePicker, RoleFields, SkillsField, TextField } from "./ProfileFields";
import { profileCompletion, updateProfile, useSession, type Profile } from "./session";

const STEPS = ["Who you are", "Your details", "About you"];

/**
 * After sign-up: complete the profile in three short steps. Step 1 asks
 * student / employee / client, which is what decides the dashboard later.
 */
export function Onboarding() {
  const session = useSession();
  const router = useRouter();
  useEffect(() => {
    if (session === null) router.replace("/portal");
  }, [session, router]);

  if (!session) {
    return (
      <div className="grid flex-1 place-items-center">
        <LoaderCircle className="size-6 animate-spin text-[var(--dash-orange)]" aria-label="Loading" />
      </div>
    );
  }
  return <OnboardingSteps saved={session.profile} />;
}

function OnboardingSteps({ saved }: { saved: Profile }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Profile>(saved);
  const edit = (patch: Partial<Profile>) => setDraft((d) => ({ ...d, ...patch }));
  const type = accountTypes.find((t) => t.id === draft.accountType);
  const last = step === STEPS.length - 1;

  const next = () => {
    updateProfile(draft);
    if (last) router.push("/portal/dashboard");
    else setStep(step + 1);
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="portal-card">
        <Logo priority className="mx-auto block h-9" />
        <h1 className="dash-title mt-6 text-center">
          Complete your <span className="highlight">profile</span>
        </h1>
        <p className="mt-2 text-center text-sm text-[var(--dash-muted)]">
          Welcome, {draft.fullName.split(" ")[0] || "there"}. A few details and your dashboard is ready.
        </p>

        <ol className="mt-6 grid grid-cols-3 gap-2" aria-label="Steps">
          {STEPS.map((s, i) => (
            <li key={s} aria-current={i === step ? "step" : undefined}>
              <span className="dash-bar block" data-tone={i < step ? "good" : undefined}>
                <span style={{ width: i <= step ? "100%" : "0%" }} />
              </span>
              <span className={`mt-1.5 block text-xs ${i === step ? "font-semibold" : "text-[var(--dash-faint)]"}`}>
                {i + 1}. {s}
              </span>
            </li>
          ))}
        </ol>

        <form
          className="mt-7 space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            next();
          }}
        >
          {step === 0 && (
            <>
              <p className="text-sm font-semibold">Which of these are you?</p>
              <AccountTypePicker value={draft.accountType} onChange={(accountType) => edit({ accountType })} />
            </>
          )}
          {step === 1 && (
            <>
              <p className="text-sm font-semibold">{type ? `${type.label} details` : "Your details"}</p>
              <RoleFields profile={draft} onChange={edit} />
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField name="phone" label="Phone" type="tel" autoComplete="tel" profile={draft} onChange={edit} />
                <TextField name="location" label="Location" placeholder="City, State" profile={draft} onChange={edit} />
              </div>
            </>
          )}
          {step === 2 && (
            <>
              <TextField name="headline" label="Headline" placeholder="e.g. Cloud engineer, open to work" profile={draft} onChange={edit} />
              <SkillsField profile={draft} onChange={edit} />
              <TextField name="linkedin" label="LinkedIn" type="url" placeholder="https://linkedin.com/in/…" profile={draft} onChange={edit} />
            </>
          )}

          <div className="flex items-center justify-between gap-3 border-t border-[var(--dash-line)] pt-5">
            {step > 0 ? (
              <button type="button" className="dash-btn-ghost" onClick={() => setStep(step - 1)}>
                <ArrowLeft className="size-4" aria-hidden="true" /> Back
              </button>
            ) : (
              <span />
            )}
            <span className="hidden text-xs text-[var(--dash-muted)] sm:inline">{profileCompletion(draft)}% complete</span>
            <button type="submit" className="dash-btn" data-tone="orange" disabled={step === 0 && !draft.accountType}>
              {last ? "Go to my dashboard" : "Continue"} <ArrowRight className="size-4" aria-hidden="true" />
            </button>
          </div>
          {step > 0 && (
            <p className="text-center">
              <button
                type="button"
                className="text-xs font-semibold text-[var(--dash-muted)] hover:underline"
                onClick={() => {
                  updateProfile(draft);
                  router.push("/portal/dashboard");
                }}
              >
                Skip for now, I&apos;ll finish later
              </button>
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
