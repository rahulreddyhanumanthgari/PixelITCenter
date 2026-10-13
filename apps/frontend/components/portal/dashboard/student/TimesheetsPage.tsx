"use client";

import { useRef, useState, type DragEvent, type ReactNode } from "react";
import { Building2, CalendarDays, ChevronDown, CircleCheck, DollarSign, FileText, Lock, Send, Upload, X } from "lucide-react";
import { demoToday } from "@/content/portal-demo";
import { placement, timesheetStatuses, type TimesheetStatus } from "@/content/student-demo";
import { addTimesheet, isPlaced, timesheetsOf, useSession } from "../session";
import { PageHeader, useToast } from "../ui";

// Timesheets: placed students only (the dashboard shell hides the page and
// its menu item from everyone else). Once a month the student sends the
// CLIENT-APPROVED timesheet as one PDF with their hours and leave.
//
// The student never makes or edits the invoice.
// TODO(backend): invoices are generated on the admin / accounts side,
// automatically from approved hours × the hourly rate. Submissions go to
// POST /api/student/timesheets; the PDF is checked again on the server.

const MAX_MB = 5;

const TONE: Record<TimesheetStatus, "good" | "warn" | "ink" | undefined> = {
  Submitted: "ink",
  "Under Verification": "warn",
  Approved: "good",
  Invoiced: "good",
  Paid: "good",
};

const help = (s: TimesheetStatus) => timesheetStatuses.find((x) => x.status === s)?.help ?? "";

/** "2026-09" → "September 2026" */
const monthName = (ym: string) => new Date(`${ym}-01T12:00:00`).toLocaleDateString("en-US", { month: "long", year: "numeric" });

function sizeLabel(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** One PDF only. Photos are refused on purpose: the client-approved sheet must be a PDF. */
async function checkTimesheetFile(files: FileList | File[]): Promise<{ file?: File; error?: string }> {
  const list = Array.from(files);
  if (list.length === 0) return {};
  if (list.length > 1) return { error: "Upload one PDF only. If your timesheet has several pages, combine them into a single PDF." };
  const file = list[0]!;
  if (/\.(png|jpe?g|heic|webp)$/i.test(file.name) || file.type.startsWith("image/"))
    return { error: "Images (PNG, JPG) aren't accepted. Upload the client-approved timesheet as a PDF. Your phone's scanner app can save it as one." };
  if (!/\.pdf$/i.test(file.name) || (file.type && file.type !== "application/pdf")) return { error: "Upload the timesheet as a PDF file." };
  if (file.size > MAX_MB * 1024 * 1024) return { error: `This PDF is over ${MAX_MB} MB. Try saving it at a smaller size.` };
  // The first bytes of a real PDF are "%PDF-"; a renamed file fails here.
  const head = await file.slice(0, 5).text();
  if (head !== "%PDF-") return { error: "This file isn't a real PDF. Export or scan the timesheet to PDF and try again." };
  return { file };
}

export function TimesheetsPage() {
  const session = useSession();
  const currentMonth = demoToday.slice(0, 7);
  const history = session ? timesheetsOf(session) : [];
  const [month, setMonth] = useState(currentMonth);
  const [hours, setHours] = useState("");
  const [leave, setLeave] = useState("0");
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [tried, setTried] = useState(false);
  const [monthTouched, setMonthTouched] = useState(false);
  const [dragging, setDragging] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const [toast, showToast] = useToast();
  if (!session || !isPlaced(session)) return null;

  const hoursNum = Number(hours);
  const leaveNum = Number(leave);
  const errors: Record<string, string> = {};
  if (!month) errors.month = "Pick the month.";
  else if (month > currentMonth) errors.month = "You can't submit a month that hasn't started.";
  else if (history.some((t) => t.month === month)) errors.month = `${monthName(month)} is already submitted. Each month has one timesheet; ask Accounts if it needs a change.`;
  if (hours.trim() === "" || !Number.isFinite(hoursNum)) errors.hours = "Enter the total hours, e.g. 160.";
  else if (hoursNum < 0 || hoursNum > 744) errors.hours = "Check the hours: between 0 and 744.";
  if (!Number.isFinite(leaveNum) || leaveNum < 0 || leaveNum > 31) errors.leave = "Enter 0 to 31 days.";
  else if (leaveNum > 0 && !note.trim()) errors.note = "Say which days and why, e.g. 'Sep 18, personal day'.";
  if (!file) errors.file = fileError ?? "Attach the client-approved timesheet (one PDF).";
  const show = (k: string) => (tried || (k === "month" && monthTouched) ? errors[k] : undefined);
  const upToDate = history.some((t) => t.month === currentMonth);

  async function pick(files: FileList | File[]) {
    const { file: ok, error } = await checkTimesheetFile(files);
    setFileError(error ?? null);
    setFile(ok ?? null);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    void pick(e.dataTransfer.files);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Timesheets" body="Once a month, send the timesheet your client approved. PixelIT's accounts team does the rest." />

      {/* The placement, set by PixelIT */}
      <section aria-label="Your placement" className="dash-hero grid gap-3 p-4 sm:grid-cols-3 sm:p-6">
        <p className="flex items-start gap-3">
          <Building2 className="mt-0.5 size-5 flex-none text-[var(--dash-cyan-ink)]" aria-hidden="true" />
          <span>
            <span className="block text-xs text-[var(--dash-muted)]">Current client</span>
            <span className="block font-semibold">{placement.client}</span>
            <span className="block text-xs text-[var(--dash-muted)]">{placement.role}</span>
          </span>
        </p>
        <p className="flex items-start gap-3">
          <DollarSign className="mt-0.5 size-5 flex-none text-[var(--dash-cyan-ink)]" aria-hidden="true" />
          <span>
            <span className="block text-xs text-[var(--dash-muted)]">Hourly rate</span>
            <span className="flex items-center gap-1.5 font-semibold">
              ${placement.hourlyRate}/hour
              <Lock className="size-3.5 text-[var(--dash-faint)]" aria-label="Read only" />
            </span>
            <span className="block text-xs text-[var(--dash-muted)]" title="Set by PixelIT. If it looks wrong, email Accounts from the Help page.">
              Set by PixelIT
            </span>
          </span>
        </p>
        <p className="flex items-start gap-3">
          <CalendarDays className="mt-0.5 size-5 flex-none text-[var(--dash-cyan-ink)]" aria-hidden="true" />
          <span>
            <span className="block text-xs text-[var(--dash-muted)]">Started</span>
            <span className="block font-semibold">{placement.startDate}</span>
          </span>
        </p>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        {/* Submit */}
        <section aria-labelledby="submit-heading" className="dash-card dash-card-pad min-w-0">
          <h2 id="submit-heading" className="text-base font-semibold">
            Submit a timesheet
          </h2>
          <p className="mt-1 text-sm text-[var(--dash-muted)]">One per month. You don&apos;t make an invoice: PixelIT creates it from your approved hours.</p>
          {upToDate && !monthTouched && (
            <p className="mt-4 flex items-start gap-2 rounded-xl bg-[var(--dash-cyan-tint)] p-3 text-sm text-[var(--dash-cyan-ink)]" role="status">
              <CircleCheck className="mt-0.5 size-4 flex-none" aria-hidden="true" />
              <span>
                <span className="font-semibold">You&apos;re up to date.</span> {monthName(currentMonth)} is submitted; the next one is due when this month ends.
              </span>
            </p>
          )}

          <form
            className="mt-5 space-y-4"
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              setTried(true);
              if (Object.keys(errors).length || !file) return;
              addTimesheet({
                id: `t${Date.now()}`,
                month,
                hours: hoursNum,
                leaveDays: leaveNum,
                leaveNote: note.trim(),
                fileName: file.name,
                submitted: "Just now",
                status: "Submitted",
              });
              showToast(`${monthName(month)} submitted. Accounts will check it next.`);
              setHours("");
              setLeave("0");
              setNote("");
              setFile(null);
              setTried(false);
              setMonthTouched(false);
            }}
          >
            <Field id="ts-month" label="Month" error={show("month")}>
              <input
                id="ts-month"
                type="month"
                max={currentMonth}
                value={month}
                onChange={(e) => {
                  setMonth(e.target.value);
                  setMonthTouched(true);
                }}
                className="dash-input sm:max-w-xs"
                aria-invalid={show("month") ? true : undefined}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="ts-hours" label="Total hours worked" error={show("hours")}>
                <input id="ts-hours" type="text" inputMode="decimal" placeholder="e.g. 160" value={hours} onChange={(e) => setHours(e.target.value)} className="dash-input" aria-invalid={show("hours") ? true : undefined} />
              </Field>
              <Field id="ts-leave" label="Leave days taken" error={show("leave")}>
                <input id="ts-leave" type="text" inputMode="decimal" value={leave} onChange={(e) => setLeave(e.target.value)} className="dash-input" aria-invalid={show("leave") ? true : undefined} />
              </Field>
            </div>
            <Field id="ts-note" label={leaveNum > 0 ? "Leave note" : "Leave note (optional)"} error={show("note")}>
              <textarea id="ts-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder="Which days, and why. e.g. 'Sep 18, personal day'." className="dash-input min-h-20" />
            </Field>

            <div>
              <p id="ts-file-label" className="dash-label">
                Client-approved timesheet
              </p>
              {file ? (
                <div className="flex items-center gap-3 rounded-2xl border border-[var(--dash-line-strong)] p-3">
                  <FileText className="size-5 flex-none text-[var(--dash-cyan-ink)]" aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{file.name}</span>
                    <span className="block text-xs text-[var(--dash-muted)]">PDF · {sizeLabel(file.size)}</span>
                  </span>
                  <button type="button" className="grid size-8 place-items-center rounded-full hover:bg-[var(--dash-hover)]" aria-label="Remove file" onClick={() => setFile(null)}>
                    <X className="size-4" />
                  </button>
                </div>
              ) : (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={onDrop}
                  className={`rounded-2xl border-2 border-dashed p-5 text-center transition ${
                    dragging ? "border-[var(--dash-orange)] bg-[var(--dash-orange-tint)]" : (tried && errors.file) || fileError ? "border-[var(--dash-red-ink)]" : "border-[var(--dash-line-strong)]"
                  }`}
                >
                  <Upload className="mx-auto size-6 text-[var(--dash-muted)]" aria-hidden="true" />
                  <p className="mt-2 text-sm">
                    Drop the PDF here or{" "}
                    <button type="button" className="font-semibold text-[var(--dash-orange-ink)] underline underline-offset-2" onClick={() => input.current?.click()}>
                      choose a file
                    </button>
                  </p>
                  <p className="mt-1 text-xs text-[var(--dash-muted)]">One PDF, signed or approved by your client, up to {MAX_MB} MB. No photos.</p>
                </div>
              )}
              <input
                ref={input}
                type="file"
                accept=".pdf,application/pdf"
                className="sr-only"
                tabIndex={-1}
                aria-labelledby="ts-file-label"
                onChange={(e) => {
                  if (e.target.files) void pick(e.target.files);
                  e.target.value = "";
                }}
              />
              {(fileError || show("file")) && (
                <p className="mt-1.5 text-xs font-medium text-[var(--dash-red-ink)]" role="alert">
                  {fileError ?? show("file")}
                </p>
              )}
            </div>

            <button type="submit" className="dash-btn" data-tone="orange">
              <Send className="size-4" aria-hidden="true" /> Submit {month && !errors.month ? monthName(month) : "timesheet"}
            </button>
          </form>
        </section>

        {/* History */}
        <section aria-labelledby="history-heading" className="min-w-0">
          <h2 id="history-heading" className="dash-section-title">
            Past submissions <span className="dash-count">{history.length}</span>
          </h2>
          <details className="group mt-1">
            <summary className="inline-flex cursor-pointer list-none items-center gap-1 text-xs font-semibold text-[var(--dash-muted)] [&::-webkit-details-marker]:hidden">
              What do the statuses mean?
              <ChevronDown className="size-3.5 transition group-open:rotate-180" aria-hidden="true" />
            </summary>
            <ul className="mt-2 space-y-1.5">
              {timesheetStatuses.map((s) => (
                <li key={s.status} className="flex flex-wrap items-center gap-2 text-xs text-[var(--dash-muted)]">
                  <span className="dash-chip" data-tone={TONE[s.status]}>
                    {s.status}
                  </span>
                  {s.help}
                </li>
              ))}
            </ul>
          </details>
          {history.length ? (
            <ul className="mt-3 space-y-3">
              {history.map((t) => (
                <li key={t.id} className="dash-card dash-card-pad">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{monthName(t.month)}</p>
                      <p className="text-xs text-[var(--dash-muted)]">
                        {t.hours} hours · {t.leaveDays} leave {t.leaveDays === 1 ? "day" : "days"} · submitted {t.submitted}
                      </p>
                    </div>
                    <span className="dash-chip cursor-help" data-tone={TONE[t.status]} title={help(t.status)}>
                      {t.status}
                    </span>
                  </div>
                  {t.leaveNote && <p className="mt-2 text-xs text-[var(--dash-muted)]">Leave: {t.leaveNote}</p>}
                  <p className="mt-2 flex items-center gap-1.5 text-xs">
                    <FileText className="size-3.5 flex-none text-[var(--dash-muted)]" aria-hidden="true" />
                    <span className="truncate">{t.fileName}</span>
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="dash-card dash-card-pad mt-3 text-sm text-[var(--dash-muted)]">No timesheets yet. Your first one is due at the end of your first month.</p>
          )}
        </section>
      </div>
      {toast}
    </div>
  );
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="dash-label">
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-xs font-medium text-[var(--dash-red-ink)]">{error}</p>}
    </div>
  );
}
