"use client";

import { useState, type ReactNode } from "react";
import { FileText, Trash2 } from "lucide-react";
import { consultantDocLabels, consultantDocsDemo, type ConsultantDocType } from "@/content/portal-demo";
import type { RegisteredStudent } from "@/content/registered-students";
import { cn } from "@/lib/utils";
import { Chip, useToast } from "../ui";
import { deleteStudent } from "./deletedStudents";
import { date, Detail, EMPLOYMENT, Panel } from "./ui";

// A registered student's profile and documents, as staff see them on an open
// placement and in Talent. FRONT END ONLY for now (demo data).

/**
 * Everything the student filled in on their Profile page (account details and
 * Placement Details), so staff never retype it. FRONT END ONLY: read from the
 * demo student list by email; with the backend it comes from the student's
 * saved profile. Passport, SSN and date of birth stay masked here.
 */
export function StudentProfile({ student: s, email }: { student: RegisteredStudent | undefined; email: string }) {
  if (!s) {
    return (
      <section className="dash-card dash-card-pad">
        <h2 className="dash-section-title">Student profile</h2>
        <p className="mt-3 text-sm text-[var(--dash-muted)]">
          No registered student uses {email}. Students register on the portal first; their profile and PixelIT ID then show here.
        </p>
      </section>
    );
  }
  return (
    <section className="dash-card dash-card-pad" aria-labelledby="student-profile">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="student-profile" className="dash-section-title">
          Student profile
        </h2>
        <p className="text-xs text-[var(--dash-muted)]">
          {s.pixelitId} · registered {date(s.registeredOn)} · from the student&apos;s Profile page
        </p>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <ProfileGroup title="Contact">
          <Detail label="Phone">{s.phone}</Detail>
          <Detail label="Email">{s.email}</Detail>
          <Detail label="Current location">{s.currentLocation}</Detail>
          <Detail label="Open to relocating">{s.relocation}</Detail>
          <Detail label="LinkedIn">
            <a href={s.linkedin} target="_blank" rel="noopener noreferrer" className="break-all text-[var(--dash-orange-ink)] hover:underline">
              {s.linkedin.replace(/^https:\/\/(www\.)?/, "")}
            </a>
          </Detail>
          <Detail label="Skype">{s.skypeId ?? "–"}</Detail>
        </ProfileGroup>

        <ProfileGroup title="Work and visa">
          <Detail label="Visa status">{s.visaStatus}</Detail>
          <Detail label="US entry">
            {s.usEntryVisaType}, {s.usEntryYear}
          </Detail>
          <Detail label="US experience">{s.usExperienceYears} years</Detail>
          <Detail label="Relevant experience">{s.relevantExperienceYears} years</Detail>
          <Detail label="Looking for">{s.targetRole}</Detail>
          <Detail label="Available to start">{s.availableToStart}</Detail>
          <Detail label="Open to">{s.openTo.map((t) => EMPLOYMENT[t].label).join(", ")}</Detail>
          <Detail label="Work mode">{s.workMode}</Detail>
          <div className="sm:col-span-2">
            <Detail label="Skills">
              <span className="mt-1 flex flex-wrap gap-1.5">
                {s.skills.map((k) => (
                  <Chip key={k}>{k}</Chip>
                ))}
              </span>
            </Detail>
          </div>
        </ProfileGroup>

        <ProfileGroup title="Education">
          <Detail label="Bachelor's">
            {s.bachelors.degree}
            <span className="block text-xs font-normal text-[var(--dash-muted)]">
              {s.bachelors.university}, {s.bachelors.year}
            </span>
          </Detail>
          <Detail label="Master's">
            {s.masters ? (
              <>
                {s.masters.degree}
                <span className="block text-xs font-normal text-[var(--dash-muted)]">
                  {s.masters.university}, {s.masters.year}
                </span>
              </>
            ) : (
              "–"
            )}
          </Detail>
        </ProfileGroup>

        <ProfileGroup title="Interviews">
          <Detail label="Best time for calls">{s.bestTimeForCalls}</Detail>
          <Detail label="Preferred interview location">{s.preferredInterviewLocation}</Detail>
        </ProfileGroup>

        <ProfileGroup title="Identity (masked)">
          <Detail label="Passport number">{`•••••${s.passportLast3}`}</Detail>
          <Detail label="SSN last four">{s.ssnLast4Set ? "••••" : "Not given"}</Detail>
          <Detail label="Date of birth">{s.dateOfBirthSet ? "••••-••-••" : "Not given"}</Detail>
        </ProfileGroup>

        <ProfileGroup title="References">
          {s.references.map((r) => (
            <Detail key={r.email} label={`${r.role}, ${r.location}`}>
              {r.name}
              <span className="block text-xs font-normal [overflow-wrap:anywhere] text-[var(--dash-muted)]">
                {r.email} · {r.phone}
              </span>
            </Detail>
          ))}
        </ProfileGroup>
      </div>
    </section>
  );
}

function ProfileGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl bg-[var(--dash-side)] p-4">
      <h3 className="text-sm font-semibold">{title}</h3>
      <dl className="mt-3 grid grid-cols-1 gap-x-5 gap-y-3 sm:grid-cols-2">{children}</dl>
    </div>
  );
}

/**
 * The student's documents, in a small centred window. FRONT END ONLY: demo
 * files from content/portal-demo.ts. In the live portal they come from the
 * student's own Documents page; that wiring is decided with the backend.
 */
export function DocumentsWindow({ name, open, onClose }: { name: string; open: boolean; onClose: () => void }) {
  const [toast, showToast] = useToast();
  const docs = consultantDocsDemo(name);
  return (
    <>
      <Panel center open={open} title={`${name}'s documents`} subtitle="Uploaded by the student from their account." onClose={onClose}>
        <ul className="space-y-2.5">
          {(Object.keys(consultantDocLabels) as ConsultantDocType[]).map((type) => {
            const d = docs.find((x) => x.type === type);
            return (
              <li key={type} className="flex items-center gap-3 rounded-2xl border border-[var(--dash-line)] p-3.5">
                <span className={cn("grid size-10 flex-none place-items-center rounded-xl", d ? "bg-[var(--dash-orange-tint)] text-[var(--dash-orange)]" : "bg-[var(--dash-side)] text-[var(--dash-faint)]")}>
                  <FileText className="size-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{consultantDocLabels[type]}</span>
                  {d ? (
                    <>
                      <span className="block text-xs break-all text-[var(--dash-ink)]">{d.fileName}</span>
                      <span className="block text-xs text-[var(--dash-muted)]">
                        {d.size} · uploaded {d.uploaded}
                        {d.expires && ` · expires ${d.expires}`}
                      </span>
                    </>
                  ) : (
                    <span className="block text-xs text-[var(--dash-muted)]">Not uploaded yet</span>
                  )}
                </span>
                {d ? (
                  <button type="button" className="dash-btn-ghost h-9 min-h-[44px] px-3 sm:min-h-0" onClick={() => showToast("Demo: the file opens once the portal is connected to the backend.")}>
                    View
                  </button>
                ) : (
                  <Chip tone="warn">Missing</Chip>
                )}
              </li>
            );
          })}
        </ul>
        <p className="mt-4 text-xs text-[var(--dash-muted)]">Demo files. In the live portal these are the documents the student uploads under Documents.</p>
      </Panel>
      {toast}
    </>
  );
}

/**
 * Admins only. Deleting needs the word DELETE typed in capitals, so it can't
 * happen by a slip of the mouse. FRONT END ONLY: see deletedStudents.ts.
 */
export function DeleteStudentButton({ student, onDeleted }: { student: RegisteredStudent; onDeleted: (message: string) => void }) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const ready = typed === "DELETE";
  const close = () => {
    setOpen(false);
    setTyped("");
  };
  return (
    <>
      <button type="button" className="dash-btn" data-tone="danger" onClick={() => setOpen(true)}>
        <Trash2 className="size-4" aria-hidden="true" /> Delete student
      </button>
      <Panel
        center
        open={open}
        title={`Delete ${student.fullName} (${student.pixelitId})?`}
        subtitle="Admins only. This can't be undone."
        onClose={close}
        footer={
          <>
            <button type="button" className="dash-btn-ghost mr-auto" onClick={close}>
              Cancel
            </button>
            <button
              type="submit"
              form="delete-student"
              className="dash-btn"
              data-tone="danger"
              disabled={!ready}
            >
              <Trash2 className="size-4" aria-hidden="true" /> Delete for good
            </button>
          </>
        }
      >
        <form
          id="delete-student"
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!ready) return;
            deleteStudent(student.pixelitId);
            close();
            onDeleted(`${student.fullName} (${student.pixelitId}) was deleted.`);
          }}
        >
          <p className="rounded-2xl bg-[var(--dash-red-tint)] p-4 text-sm text-[var(--dash-red-ink)]">
            Their account, profile and documents go away. Check it&apos;s the right person: <strong>{student.fullName}</strong>, {student.pixelitId},{" "}
            {student.email}.
          </p>
          <div>
            <label htmlFor="delete-confirm" className="dash-label">
              Type <span className="font-mono font-bold">DELETE</span> to confirm
            </label>
            <input
              id="delete-confirm"
              className="dash-input font-mono tracking-widest"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              aria-describedby="delete-hint"
            />
            <p id="delete-hint" className="mt-1.5 text-xs text-[var(--dash-muted)]">
              {typed && !ready ? "Type it exactly, in capital letters: DELETE" : "In capital letters."}
            </p>
          </div>
        </form>
      </Panel>
    </>
  );
}
