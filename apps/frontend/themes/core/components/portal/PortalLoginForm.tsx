"use client";

import { useState } from "react";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { portal, site } from "@/content/site";
import { buttonVariants } from "@/themes/core/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * The sign-in form. Not connected to any login service yet: submitting
 * sends nothing anywhere, clears the password and explains that the portal
 * is still being set up. Swap the submit handler for the real sign-in
 * (AWS Cognito, per the plan) when the portal exists.
 */
export function PortalLoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <form
      className="mt-8 space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        setPassword("");
        setSubmitted(true);
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

      <button type="submit" className={cn(buttonVariants(), "cta-pill w-full justify-between rounded-full")}>
        Sign in
        <ArrowRight aria-hidden="true" />
      </button>

      {/* Always in the page, so screen readers announce the text when it appears. */}
      <div role="status">
        {submitted && (
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
  );
}
