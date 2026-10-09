"use client";

import { useRef, useState } from "react";
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

/**
 * Google sign-in, then email and password with a slide-to-sign-in control.
 * Not connected to any login service yet: nothing is sent anywhere; the
 * password is cleared and a note explains the portal is still being set up.
 * Wire the real sign-in (AWS Cognito, per the plan; Google through it) into
 * onSubmit and the Google button when the portal exists.
 */
export function PortalLoginForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState(false);

  // From the slider: check the fields first (the browser points at what's
  // missing), then submit.
  const trySignIn = () => {
    const form = formRef.current;
    if (!form) return false;
    if (!form.checkValidity()) {
      form.reportValidity();
      return false;
    }
    form.requestSubmit();
    return true;
  };

  return (
    <div className="mt-8">
      <button type="button" className="portal-google" onClick={() => setNotice(true)}>
        <GoogleMark />
        Continue with Google
      </button>

      <p className="portal-or" aria-hidden="true">
        or
      </p>

      <form
        ref={formRef}
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          setPassword("");
          setNotice(true);
        }}
      >
        <div>
          <label htmlFor="portal-email" className="portal-label">
            Email
          </label>
          <input
            id="portal-email"
            name="email"
            type="email"
            autoComplete="username"
            required
            placeholder="you@company.com"
            className="portal-input"
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="portal-password" className="portal-label">
              Password
            </label>
            <a
              href={`mailto:${site.contact.email}?subject=Portal%20password%20reset`}
              className="portal-link text-sm"
            >
              Forgot password?
            </a>
          </div>
          <div className="relative">
            <input
              id="portal-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="portal-input pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              className="portal-eye"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        {/* Enter in a field still signs in (a form needs a submit button for that). */}
        <button type="submit" className="sr-only" tabIndex={-1} aria-hidden="true">
          Sign in
        </button>
        <SlideToSignIn onComplete={trySignIn} />

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
  );
}
