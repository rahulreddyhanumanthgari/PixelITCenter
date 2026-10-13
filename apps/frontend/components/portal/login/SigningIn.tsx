"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, LoaderCircle } from "lucide-react";
import { accountTypes, demoDirectory } from "@/content/portal-demo";
import { homeFor } from "@/components/portal/dashboard/nav";
import { demoSignIn, demoSignUp } from "@/components/portal/dashboard/session";

export type SignInRequest = {
  mode: "signin" | "signup";
  method: "password" | "google";
  email: string;
  name: string;
};

const STEP_MS = 750;

/**
 * DEMO: what signing in will look like. Walks through the steps the real
 * portal takes (check the email, find the account type in the database,
 * open the right dashboard), then signs in to the demo session and moves
 * on: sign in → the dashboard, sign up → the profile steps.
 */
export function SigningIn({ request }: { request: SignInRequest }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const signup = request.mode === "signup";
  const known = demoDirectory.find((d) => d.email === request.email.toLowerCase());
  const type = accountTypes.find((t) => t.id === known?.accountType);

  const steps = signup
    ? [`Creating an account for ${request.email}`, "Saving your name and email", "Next: complete your profile"]
    : [
        request.method === "google" ? "Signing in with Google" : `Checking ${request.email}`,
        !type ? "New here: we'll ask who you are" : `Found a ${type.label.toLowerCase()} account`,
        "Opening your dashboard",
      ];

  useEffect(() => {
    if (step < steps.length) {
      const t = window.setTimeout(() => setStep((s) => s + 1), STEP_MS);
      return () => window.clearTimeout(t);
    }
    if (signup) {
      demoSignUp(request.name, request.email, request.method);
      router.push("/portal/onboarding");
    } else {
      const profile = demoSignIn(request.email, request.method);
      router.push(homeFor(profile.accountType));
    }
  }, [step, steps.length, signup, request, router]);

  return (
    <div className="py-4" role="status" aria-live="polite">
      <p className="text-center text-lg font-semibold text-[var(--dash-ink)]">
        {signup ? "Setting up your account" : "Signing you in"}
      </p>
      <p className="mt-1 text-center text-sm text-[var(--dash-muted)]">Demo: nothing leaves this browser.</p>
      <ol className="portal-steps mt-7 space-y-4">
        {steps.map((s, i) => {
          const state = i < step ? "done" : i === step ? "active" : "waiting";
          return (
            <li key={s} data-state={state}>
              <span className="step-dot" aria-hidden="true">
                {state === "done" ? (
                  <Check className="size-3.5" strokeWidth={3} />
                ) : state === "active" ? (
                  <LoaderCircle className="size-3.5 animate-spin" />
                ) : null}
              </span>
              {s}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
