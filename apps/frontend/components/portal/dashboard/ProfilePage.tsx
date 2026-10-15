"use client";

import { useState, type ReactNode } from "react";
import { Check } from "lucide-react";
import { accountTypes } from "@/content/portal-demo";
import { AccountTypePicker, Field, RoleFields, SkillsField, TextField } from "./ProfileFields";
import { pixelitIdOf, profileCompletion, updateProfile, useSession, type Profile } from "./session";
import { Chip, PageHeader, ProfileRing, useToast } from "./ui";
import { PlacementDetails } from "./student/placement/PlacementDetails";

function Section({ title, body, children }: { title: string; body: string; children: ReactNode }) {
  return (
    <section className="dash-card dash-card-pad grid gap-5 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-8">
      <div>
        <h2 className="text-[0.9375rem] font-semibold">{title}</h2>
        <p className="mt-1 text-sm leading-relaxed text-[var(--dash-muted)]">{body}</p>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

/** Wraps the form so it starts from the saved profile once it has loaded. */
export function ProfilePage() {
  const session = useSession();
  if (!session) return null;
  return (
    <div className="space-y-10">
      <ProfileForm saved={session.profile} pixelitId={pixelitIdOf(session)} />
      {session.profile.accountType === "student" && session.profile.email && <PlacementDetails email={session.profile.email} />}
    </div>
  );
}

/** The whole profile, edited as a draft; the ring follows as you type. */
function ProfileForm({ saved, pixelitId }: { saved: Profile; pixelitId: string | null }) {
  const [draft, setDraft] = useState<Profile>(saved);
  const [toast, showToast] = useToast();
  const edit = (patch: Partial<Profile>) => setDraft((d) => ({ ...d, ...patch }));
  const percent = profileCompletion(draft);
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const type = accountTypes.find((t) => t.id === draft.accountType);

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        updateProfile(draft);
        showToast("Profile saved.");
      }}
    >
      <PageHeader title="Profile" body="This is how Pixel IT Center knows you. Your account type decides your dashboard.">
        <button type="button" className="dash-btn-ghost" disabled={!dirty} onClick={() => setDraft(saved)}>
          Discard
        </button>
        <button type="submit" className="dash-btn" data-tone="orange" disabled={!dirty}>
          <Check className="size-4" aria-hidden="true" /> Save changes
        </button>
      </PageHeader>

      <div className="dash-hero flex flex-wrap items-center gap-4 p-4 sm:p-6">
        <ProfileRing name={draft.fullName || draft.email} percent={percent} size={88} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-semibold">{draft.fullName || "Your name"}</p>
          <p className="truncate text-sm text-[var(--dash-muted)]">{draft.headline || "Add a headline"}</p>
          <p className="mt-2 flex flex-wrap gap-2">
            <Chip tone={type ? "ink" : "warn"}>{type ? `${type.label} account` : "Account type not set"}</Chip>
            <Chip tone={percent === 100 ? "good" : "warn"}>{`${percent}% complete`}</Chip>
          </p>
        </div>
        {pixelitId && (
          <div className="rounded-2xl bg-white/85 px-4 py-3 ring-1 ring-[var(--dash-line)]">
            <p className="text-xs text-[var(--dash-muted)]">Your PixelIT ID</p>
            <p className="text-lg font-bold tracking-wide">{pixelitId}</p>
            <p className="text-xs text-[var(--dash-muted)]">Quote it when you contact us.</p>
          </div>
        )}
        {dirty && <p className="text-xs font-semibold text-[var(--dash-orange-ink)]">Unsaved changes</p>}
      </div>

      <Section title="Account type" body="Are you a student or an employee? The live portal reads this from your account.">
        <AccountTypePicker value={draft.accountType} onChange={(accountType) => edit({ accountType })} />
      </Section>

      <Section title="Personal details" body="Your name and how to reach you.">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField name="fullName" label="Full name" autoComplete="name" profile={draft} onChange={edit} />
          <TextField name="email" label="Email" type="email" autoComplete="email" profile={draft} onChange={edit} />
          <TextField name="phone" label="Phone" type="tel" autoComplete="tel" placeholder="+1 (555) 000-0000" profile={draft} onChange={edit} />
          <TextField name="location" label="Location" placeholder="City, State" profile={draft} onChange={edit} />
        </div>
      </Section>

      <Section title={type ? `${type.label} details` : "Account details"} body="A few details that depend on your account type.">
        <RoleFields profile={draft} onChange={edit} />
      </Section>

      <Section title="About you" body="A short summary, your skills and where to find you online.">
        <TextField name="headline" label="Headline" placeholder="e.g. Senior DevOps consultant" profile={draft} onChange={edit} />
        <Field id="pf-bio" label="Bio">
          <textarea
            id="pf-bio"
            value={draft.bio}
            onChange={(e) => edit({ bio: e.target.value })}
            placeholder="Two or three lines about your work."
            className="dash-input"
            maxLength={400}
          />
        </Field>
        <SkillsField profile={draft} onChange={edit} />
        <TextField name="linkedin" label="LinkedIn" type="url" placeholder="https://linkedin.com/in/…" profile={draft} onChange={edit} />
      </Section>
      {toast}
    </form>
  );
}
