"use client";

import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";
import { demoDirectory } from "@/content/portal-demo";
import { site } from "@/content/site";
import { SigningIn, type SignInRequest } from "./SigningIn";
import { SlideToSignIn } from "./SlideToSignIn";

/** Google's four-colour "G" mark. */
function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className="size-5">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

type Mode = "signin" | "signup";
type FieldError = { id: string; text: string };

// What the form says when a field is missing or wrong: friendly, but it
// always names the field.
const ERROR_TEXT = {
  badEmail: "That email looks a little off. Check for a typo?",
  shortPassword: "Make your password at least 8 characters. Stronger is safer.",
  mismatch: "Your two passwords don't match yet. Give it another go.",
};

function missingText(name: string, signup: boolean) {
  switch (name) {
    case "name":
      return "What should we call you? Add your full name.";
    case "email":
      return signup
        ? "Add your work email so we know where to reach you."
        : "Pop in your email so we can find your account.";
    case "password":
      return signup
        ? "Pick a password to keep your account safe."
        : "Your password is the key. We can't open the door without it.";
    case "confirm-password":
      return "Type your password once more, just to be sure.";
    default:
      return "This field is still empty.";
  }
}

const MODES: { id: Mode; label: string }[] = [
  { id: "signin", label: "Sign in" },
  { id: "signup", label: "Sign up" },
];

/** A password box with its own show / hide eye. */
function PasswordField({
  id,
  label,
  autoComplete,
  aside,
  hint,
  minLength,
}: {
  id: string;
  label: string;
  autoComplete: string;
  aside?: ReactNode;
  hint?: string;
  minLength?: number;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="portal-label">
          {label}
        </label>
        {aside}
      </div>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          required
          minLength={minLength}
          aria-describedby={hint ? `${id}-hint` : undefined}
          className="portal-input pr-12"
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          aria-pressed={show}
          className="portal-eye"
        >
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {hint && (
        <p id={`${id}-hint`} className="type-body-sm mt-1.5">
          {hint}
        </p>
      )}
    </div>
  );
}

/**
 * Sign in / Sign up tabs. Each shows its own form: a Google button, then
 * the fields (sign up adds name and confirm password) and the slide control.
 * DEMO sign-in: nothing is sent anywhere. A valid form hands over to
 * SigningIn, which finds the account type from the email (demo directory),
 * then opens the dashboard (sign in) or the profile steps (sign up). Wire
 * the real sign-in (AWS Cognito, per the plan; Google through it) into
 * onSubmit and the Google button when the portal exists.
 */
export function PortalLoginForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [mode, setMode] = useState<Mode>("signin");
  const [request, setRequest] = useState<SignInRequest | null>(null);
  const [errors, setErrors] = useState<FieldError[]>([]);
  const signup = mode === "signup";
  const action = signup ? "Sign up" : "Sign in";

  const switchTo = (next: Mode) => {
    setMode(next);
    setErrors([]);
  };

  // Tabs pattern: Left / Right arrows move between Sign in and Sign up.
  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const j = (i + (e.key === "ArrowRight" ? 1 : MODES.length - 1)) % MODES.length;
    switchTo(MODES[j].id);
    tabRefs.current[j]?.focus();
  };

  // Check every field and say in words what's wrong with each ("Email is
  // not filled"). Wrong fields get a red outline until they're typed in.
  const validate = () => {
    const form = formRef.current;
    if (!form) return false;
    const password = form.elements.namedItem("password") as HTMLInputElement | null;
    const found: FieldError[] = [];
    for (const input of Array.from(form.querySelectorAll<HTMLInputElement>("input[required]"))) {
      const value = input.value.trim();
      let text = "";
      if (!value) text = missingText(input.name, signup);
      else if (input.type === "email" && input.validity.typeMismatch) text = ERROR_TEXT.badEmail;
      else if (input.minLength > 0 && input.value.length < input.minLength) text = ERROR_TEXT.shortPassword;
      else if (input.name === "confirm-password" && input.value !== password?.value) text = ERROR_TEXT.mismatch;
      input.toggleAttribute("aria-invalid", Boolean(text));
      if (text) found.push({ id: input.id, text });
    }
    setErrors(found);
    return found.length === 0;
  };

  // Typing in a field clears its own error.
  const clearError = (id: string) => {
    document.getElementById(id)?.removeAttribute("aria-invalid");
    setErrors((list) => list.filter((e) => e.id !== id));
  };

  // Demo: put a demo account's email in the box (any password works).
  const fillEmail = (email: string) => {
    const input = formRef.current?.elements.namedItem("email") as HTMLInputElement | null;
    if (!input) return;
    input.value = email;
    clearError(input.id);
    (formRef.current?.elements.namedItem("password") as HTMLInputElement | null)?.focus();
  };

  if (request) return <SigningIn request={request} />;

  return (
    <div>
      <div role="tablist" aria-label="Sign in or sign up" className="portal-tabs">
        {MODES.map((m, i) => (
          <button
            key={m.id}
            ref={(el) => {
              tabRefs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`portal-tab-${m.id}`}
            aria-selected={mode === m.id}
            aria-controls="portal-panel"
            tabIndex={mode === m.id ? 0 : -1}
            onClick={() => switchTo(m.id)}
            onKeyDown={(e) => onTabKey(e, i)}
            className="portal-tab"
          >
            {m.label}
          </button>
        ))}
      </div>

      <div id="portal-panel" role="tabpanel" aria-labelledby={`portal-tab-${mode}`} className="mt-7">
        <button
          type="button"
          className="portal-google"
          // Demo: a made-up Google account, new to the portal.
          onClick={() => setRequest({ mode, method: "google", email: "hari.demo@gmail.com", name: "Hari" })}
        >
          <GoogleMark />
          {signup ? "Sign up with Google" : "Continue with Google"}
        </button>

        <p className="portal-or" aria-hidden="true">
          or
        </p>

        {/* key: switching tabs starts a fresh, empty form. */}
        <form
          key={mode}
          ref={formRef}
          noValidate
          className="space-y-5"
          onInput={(e) => clearError((e.target as HTMLElement).id)}
          onSubmit={(e) => {
            e.preventDefault();
            if (!validate()) return;
            const field = (name: string) =>
              (e.currentTarget.elements.namedItem(name) as HTMLInputElement | null)?.value.trim() ?? "";
            setRequest({ mode, method: "password", email: field("email"), name: field("name") });
          }}
        >
          {signup && (
            <div>
              <label htmlFor="portal-name" className="portal-label">
                Full name
              </label>
              <input id="portal-name" name="name" type="text" autoComplete="name" required className="portal-input" />
            </div>
          )}

          <div>
            <label htmlFor="portal-email" className="portal-label">
              {signup ? "Work email" : "Email"}
            </label>
            <input
              id="portal-email"
              name="email"
              type="email"
              autoComplete={signup ? "email" : "username"}
              required
              placeholder="you@company.com"
              className="portal-input"
            />
          </div>

          {signup ? (
            <>
              <PasswordField
                id="password"
                label="Password"
                autoComplete="new-password"
                hint="At least 8 characters."
                minLength={8}
              />
              <PasswordField
                id="confirm-password"
                label="Confirm password"
                autoComplete="new-password"
              />
            </>
          ) : (
            <PasswordField
              id="password"
              label="Password"
              autoComplete="current-password"
              aside={
                <a
                  href={`mailto:${site.contact.email}?subject=Portal%20password%20reset`}
                  className="portal-link text-sm"
                >
                  Forgot password?
                </a>
              }
            />
          )}

          {/* Enter in a field still submits (a form needs a submit button for that). */}
          <button type="submit" className="sr-only" tabIndex={-1} aria-hidden="true">
            {action}
          </button>
          <SlideToSignIn
            validate={validate}
            // A beat so the tick shows before the card moves on.
            onComplete={() => window.setTimeout(() => formRef.current?.requestSubmit(), 450)}
            action={action}
          />

          {/* Always in the page, so screen readers announce the text when it appears. */}
          <div role="alert">
            {errors.length > 0 && (
              <ul className="portal-error">
                {errors.map((e) => (
                  <li key={e.id}>{e.text}</li>
                ))}
              </ul>
            )}
          </div>
          {!signup && (
            <div className="portal-demo-hint">
              <p>
                <strong>Demo:</strong> any password works. Your email decides the account type. Try{" "}
                {demoDirectory.map((d, i) => (
                  <span key={d.email}>
                    {i > 0 && (i === demoDirectory.length - 1 ? " or " : ", ")}
                    <button type="button" onClick={() => fillEmail(d.email)}>
                      {d.email}
                    </button>
                  </span>
                ))}
                .
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
