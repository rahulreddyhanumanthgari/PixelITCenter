"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Monitor, Smartphone } from "lucide-react";
import { signOut, useSession } from "./session";
import { PageHeader, useToast } from "./ui";

function Toggle({ label, body, on, onChange }: { label: string; body: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5">
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        <span className="block text-xs text-[var(--dash-muted)]">{body}</span>
      </span>
      <button type="button" role="switch" aria-checked={on} aria-label={label} className="dash-switch" onClick={() => onChange(!on)} />
    </div>
  );
}

/** Notifications, preferences, security and sign out. Nothing here is saved (demo). */
export function SettingsPage() {
  const router = useRouter();
  const session = useSession();
  const [toast, showToast] = useToast();
  const [prefs, setPrefs] = useState({ email: true, sms: false, weekly: true, product: false, twoFactor: false });
  const set = (k: keyof typeof prefs) => (v: boolean) => setPrefs((p) => ({ ...p, [k]: v }));

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" body="Notifications, preferences and security." />

      <div className="grid gap-6 xl:grid-cols-2">
        <section aria-labelledby="notif-heading" className="dash-card dash-card-pad min-w-0">
          <h2 id="notif-heading" className="dash-section-title">
            Notifications
          </h2>
          <div className="mt-1 divide-y divide-[var(--dash-line)]">
            <Toggle label="Email updates" body="Messages, documents and approvals." on={prefs.email} onChange={set("email")} />
            <Toggle label="Text messages" body="Only for meetings starting soon." on={prefs.sms} onChange={set("sms")} />
            <Toggle label="Weekly summary" body="A Monday email with your week ahead." on={prefs.weekly} onChange={set("weekly")} />
            <Toggle label="News from Pixel IT" body="New roles, services and company news." on={prefs.product} onChange={set("product")} />
          </div>
        </section>

        <section aria-labelledby="pref-heading" className="dash-card dash-card-pad min-w-0">
          <h2 id="pref-heading" className="dash-section-title">
            Preferences
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="s-tz" className="dash-label">
                Time zone
              </label>
              <select id="s-tz" className="dash-input" defaultValue="America/New_York">
                <option value="America/New_York">Eastern (New York)</option>
                <option value="America/Chicago">Central (Chicago)</option>
                <option value="America/Los_Angeles">Pacific (Los Angeles)</option>
                <option value="Asia/Kolkata">India (Kolkata)</option>
              </select>
            </div>
            <div>
              <label htmlFor="s-lang" className="dash-label">
                Language
              </label>
              <select id="s-lang" className="dash-input" defaultValue="en">
                <option value="en">English</option>
                <option value="es">Español</option>
              </select>
            </div>
          </div>
        </section>

        <section aria-labelledby="sec-heading" className="dash-card dash-card-pad min-w-0">
          <h2 id="sec-heading" className="dash-section-title">
            Security
          </h2>
          <div className="divide-y divide-[var(--dash-line)]">
            <Toggle label="Two-step sign-in" body="A code on your phone each time you sign in." on={prefs.twoFactor} onChange={set("twoFactor")} />
            <div className="flex items-center justify-between gap-4 py-3.5">
              <span>
                <span className="block text-sm font-semibold">Password</span>
                <span className="block text-xs text-[var(--dash-muted)]">
                  {session?.method === "google" ? "You sign in with Google." : "Last changed 3 months ago."}
                </span>
              </span>
              <button type="button" className="dash-btn-ghost h-9" onClick={() => showToast("Demo: password changes open when sign-in is live.")}>
                Change
              </button>
            </div>
          </div>
          <h3 className="mt-4 text-sm font-semibold">Where you&apos;re signed in</h3>
          <ul className="mt-2 space-y-2 text-sm">
            <li className="flex items-center gap-3">
              <Monitor className="size-4 text-[var(--dash-muted)]" aria-hidden="true" />
              <span className="flex-1">This browser</span>
              <span className="dash-chip" data-tone="good">
                Now
              </span>
            </li>
            <li className="flex items-center gap-3">
              <Smartphone className="size-4 text-[var(--dash-muted)]" aria-hidden="true" />
              <span className="flex-1">iPhone · Raleigh, NC</span>
              <span className="text-xs text-[var(--dash-faint)]">2 days ago</span>
            </li>
          </ul>
        </section>

        <section aria-labelledby="out-heading" className="dash-card dash-card-pad min-w-0">
          <h2 id="out-heading" className="dash-section-title">
            Sign out
          </h2>
          <p className="mt-2 text-sm text-[var(--dash-muted)]">
            Signs you out of this browser. In this demo it also resets your profile and tasks.
          </p>
          <button
            type="button"
            className="dash-btn mt-4"
            onClick={() => {
              signOut();
              router.replace("/portal");
            }}
          >
            <LogOut className="size-4" aria-hidden="true" /> Sign out
          </button>
        </section>
      </div>
      {toast}
    </div>
  );
}
