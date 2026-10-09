"use client";

import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";
import { portal, site } from "@/content/site";
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
  onInput,
}: {
  id: string;
  label: string;
  autoComplete: string;
  aside?: ReactNode;
  hint?: string;
  minLength?: number;
  onInput?: () => void;
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
          onInput={onInput}
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
 * Not connected to any login service yet: nothing is sent anywhere; the
 * passwords are cleared and a note explains the portal is still being set
 * up. Wire the real sign-in (AWS Cognito, per the plan; Google through it)
 * into onSubmit and the Google button when the portal exists.
 */
export function PortalLoginForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [mode, setMode] = useState<Mode>("signin");
  const [notice, setNotice] = useState(false);
  const signup = mode === "signup";
  const action = signup ? "Sign up" : "Sign in";

  const switchTo = (next: Mode) => {
    setMode(next);
    setNotice(false);
  };

  // Tabs pattern: Left / Right arrows move between Sign in and Sign up.
  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const j = (i + (e.key === "ArrowRight" ? 1 : MODES.length - 1)) % MODES.length;
    switchTo(MODES[j].id);
    tabRefs.current[j]?.focus();
  };

  // Sign up: the two passwords must match.
  const checkConfirm = () => {
    const form = formRef.current;
    const confirm = form?.elements.namedItem("confirm-password") as HTMLInputElement | null;
    const password = form?.elements.namedItem("password") as HTMLInputElement | null;
    if (!confirm || !password) return;
    confirm.setCustomValidity(confirm.value && confirm.value !== password.value ? "Passwords don't match." : "");
  };

  // From the slider: check the fields first (the browser points at what's
  // missing), then submit.
  const trySubmit = () => {
    const form = formRef.current;
    if (!form) return false;
    checkConfirm();
    if (!form.checkValidity()) {
      form.reportValidity();
      return false;
    }
    form.requestSubmit();
    return true;
  };

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
        <button type="button" className="portal-google" onClick={() => setNotice(true)}>
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
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            for (const name of ["password", "confirm-password"]) {
              const input = e.currentTarget.elements.namedItem(name) as HTMLInputElement | null;
              if (input) input.value = "";
            }
            setNotice(true);
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
                onInput={checkConfirm}
              />
              <PasswordField
                id="confirm-password"
                label="Confirm password"
                autoComplete="new-password"
                onInput={checkConfirm}
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
          <SlideToSignIn onComplete={trySubmit} action={action} />

          {/* Always in the page, so screen readers announce the text when it appears. */}
          <div role="status">
            {notice && (
              <p className="portal-notice">
                {portal.notReady}{" "}
                <a href={`mailto:${site.contact.email}`} className="portal-link">
                  {site.contact.email}
                </a>
                .
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
