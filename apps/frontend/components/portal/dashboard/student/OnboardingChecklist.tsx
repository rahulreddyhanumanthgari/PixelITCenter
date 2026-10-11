"use client";

import Link from "next/link";
import { Check, PartyPopper } from "lucide-react";
import { onboardingSteps } from "@/content/student-demo";
import { onboardingOf, toggleOnboarding, useSession } from "../session";

/**
 * Shows once a student has an offer: the steps before day one. When every
 * step is done the live portal would switch the account to Employee.
 * `compact` (dashboard) shows the progress and the next step only.
 */
export function OnboardingChecklist({ company, compact = false }: { company: string; compact?: boolean }) {
  const session = useSession();
  if (!session) return null;
  const done = onboardingOf(session);
  const count = onboardingSteps.filter((s) => done.includes(s.id)).length;
  const next = onboardingSteps.find((s) => !done.includes(s.id));
  const percent = Math.round((count / onboardingSteps.length) * 100);

  return (
    <section aria-labelledby="onboard-heading" className="dash-card dash-card-pad border-[rgb(12_177_223/0.35)] bg-[linear-gradient(135deg,rgb(12_177_223/0.08),#fff_60%)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid size-10 flex-none place-items-center rounded-xl bg-[var(--dash-cyan-tint)] text-[var(--dash-cyan-ink)]">
            <PartyPopper className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h2 id="onboard-heading" className="text-[0.9375rem] font-semibold">
              You have an offer from {company}!
            </h2>
            <p className="text-sm text-[var(--dash-muted)]">
              {count === onboardingSteps.length
                ? "All set. Your account moves to Employee on your start date."
                : `Onboarding: ${count} of ${onboardingSteps.length} steps done.`}
            </p>
          </div>
        </div>
        {compact && (
          <Link href="/portal/jobs?tab=mine" className="dash-btn-ghost h-9">
            Open checklist
          </Link>
        )}
      </div>
      <div className="dash-bar mt-4" data-tone="good">
        <span style={{ width: `${percent}%` }} />
      </div>

      {compact ? (
        next && (
          <p className="mt-3 text-sm">
            <span className="text-[var(--dash-muted)]">Next: </span>
            <span className="font-semibold">{next.title}.</span> <span className="text-[var(--dash-muted)]">{next.body}</span>
          </p>
        )
      ) : (
        <ul className="mt-4 divide-y divide-[var(--dash-line)]">
          {onboardingSteps.map((s) => {
            const on = done.includes(s.id);
            return (
              <li key={s.id} className="flex items-start gap-3 py-3">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={on}
                  aria-label={s.title}
                  className="dash-check mt-0.5"
                  onClick={() => toggleOnboarding(s.id)}
                >
                  {on && <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />}
                </button>
                <span>
                  <span className={`block text-sm font-semibold ${on ? "text-[var(--dash-faint)] line-through" : ""}`}>{s.title}</span>
                  <span className="block text-sm text-[var(--dash-muted)]">{s.body}</span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
