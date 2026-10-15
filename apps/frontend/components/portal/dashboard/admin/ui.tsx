"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { AlertTriangle, Check, LoaderCircle, X } from "lucide-react";
import { staffRoles } from "@/content/portal-demo";
import { cn } from "@/lib/utils";
import { staffRoleOf, useSession } from "../session";
import { ApiError, type BillingStage, type Who } from "./api";

// Small pieces shared by the client-section pages (Clients, Placements,
// Timesheets, Billing).

/** The signed-in staff member, for API calls. Null for anyone without a staff role. */
export function useWho(): Who | null {
  const session = useSession();
  const role = session ? staffRoleOf(session) : null;
  return session && role ? { email: session.profile.email, role } : null;
}

export const can = (who: Who | null, ...roles: Who["role"][]) => Boolean(who && roles.includes(who.role));

/** Loads data from the API; `reload` fetches again (after a change). */
export function useApi<T>(load: (() => Promise<T>) | null, deps: unknown[]) {
  const [tick, setTick] = useState(0);
  const reload = useCallback(() => setTick((t) => t + 1), []);
  // Loading = the last answer is for other inputs than the current ones.
  const key = JSON.stringify([...deps, tick]);
  const [state, setState] = useState<{ key: string | null; data: T | null; error: string | null }>({ key: null, data: null, error: null });
  useEffect(() => {
    if (!load) return;
    let live = true;
    load()
      .then((data) => live && setState({ key, data, error: null }))
      .catch((e: unknown) => live && setState((s) => ({ key, data: s.data, error: errorText(e) })));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return { data: state.data, error: state.error, loading: Boolean(load) && state.key !== key, reload };
}

/** `value`, once it has stopped changing for `ms` (search boxes: one request, not one per key). */
export function useDebounced<T>(value: T, ms = 350) {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setSettled(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return settled;
}

export const errorText = (e: unknown) => (e instanceof ApiError || e instanceof Error ? e.message : "Something went wrong.");
export const fieldErrors = (e: unknown) => (e instanceof ApiError ? e.fields : {});

// --- formatting ----------------------------------------------------------------------------

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
export const usd = (n: number | null | undefined) => (n === null || n === undefined ? "–" : money.format(n));
export const hours = (n: number | null | undefined) => (n === null || n === undefined ? "–" : `${n.toLocaleString("en-US", { maximumFractionDigits: 2 })} h`);

/** "2026-10-14" or an ISO time → "Oct 14, 2026". */
export function date(iso: string | null | undefined) {
  if (!iso) return "–";
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00Z` : iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: iso.length === 10 ? "UTC" : undefined });
}
/** "2026-09" → "Sep 2026" (tables). */
export const monthShort = (m: string) => new Date(`${m}-01T12:00:00Z`).toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });

export const dateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

/** Today as YYYY-MM-DD in the viewer's time zone. */
export const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/** The last `n` months, newest first, as { value: "2026-09", label: "September 2026" }. */
export function recentMonths(n = 12) {
  const now = new Date();
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(Date.UTC(now.getFullYear(), now.getMonth() - i, 1));
    return { value: d.toISOString().slice(0, 7), label: d.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" }) };
  });
}

export const roleLabel = (role: string) => staffRoles[role as Who["role"]]?.label ?? (role === "student" ? "Consultant" : role === "admin" ? "Admin" : role);

// --- page states ------------------------------------------------------------------------------

export function Loading({ label = "Loading" }: { label?: string }) {
  return (
    <div className="grid place-items-center py-16">
      <LoaderCircle className="size-6 animate-spin text-[var(--dash-orange)]" aria-label={label} />
    </div>
  );
}

export function ErrorNote({ text, onRetry }: { text: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col gap-3 rounded-2xl bg-[var(--dash-red-tint)] p-4 text-sm text-[var(--dash-red-ink)] sm:flex-row sm:items-center">
      <AlertTriangle className="size-5 flex-none" aria-hidden="true" />
      <p className="flex-1">{text}</p>
      {onRetry && (
        <button type="button" className="dash-btn-ghost min-h-[44px] sm:min-h-0" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function Empty({ title, body }: { title: string; body?: string }) {
  return (
    <div className="px-4 py-12 text-center">
      <p className="text-sm font-semibold">{title}</p>
      {body && <p className="mt-1 text-sm text-[var(--dash-muted)]">{body}</p>}
    </div>
  );
}

// --- forms --------------------------------------------------------------------------------------

export function Field({ id, label, hint, error, children, className }: { id: string; label: string; hint?: string; error?: string; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="dash-label">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs font-medium text-[var(--dash-red-ink)]">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-[var(--dash-muted)]">{hint}</p>
      ) : null}
    </div>
  );
}

/** An on/off switch with its label. */
export function Toggle({ id, label, hint, checked, onChange }: { id: string; label: string; hint?: string; checked: boolean; onChange: (on: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span>
        <span id={`${id}-label`} className="block text-sm font-semibold">
          {label}
        </span>
        {hint && <span className="mt-0.5 block text-xs text-[var(--dash-muted)]">{hint}</span>}
      </span>
      <button type="button" role="switch" id={id} aria-checked={checked} aria-labelledby={`${id}-label`} className="dash-switch mt-0.5" onClick={() => onChange(!checked)} />
    </div>
  );
}

// --- side panel ------------------------------------------------------------------------------

/**
 * A panel that slides in from the right (full screen on phones), built on
 * <dialog>: focus stays inside, Escape closes it, the page behind is inert.
 */
export function Panel({
  open,
  title,
  subtitle,
  onClose,
  children,
  footer,
  center = false,
}: {
  open: boolean;
  title: string;
  subtitle?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  /** A small window in the middle of the screen instead of a panel from the right. */
  center?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      className={center ? "dash-panel dash-modal" : "dash-panel"}
      aria-labelledby="panel-title"
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {open && (
        <>
          <div className="flex items-start justify-between gap-3 border-b border-[var(--dash-line)] px-4 py-4 sm:px-6">
            <div className="min-w-0">
              <h2 id="panel-title" className="text-lg font-semibold">
                {title}
              </h2>
              {subtitle && <div className="mt-0.5 text-sm text-[var(--dash-muted)]">{subtitle}</div>}
            </div>
            <button type="button" className="dash-icon-btn flex-none" onClick={onClose} aria-label="Close">
              <X className="size-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">{children}</div>
          {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-[var(--dash-line)] px-4 py-3 sm:px-6">{footer}</div>}
        </>
      )}
    </dialog>
  );
}

// --- the five-stage billing flow ------------------------------------------------------------

export const STAGES: { id: BillingStage; label: string; short: string }[] = [
  { id: "timesheet_received", label: "Timesheet received from consultant", short: "Timesheet in" },
  { id: "timesheet_submitted", label: "Timesheet submitted to client", short: "To client" },
  { id: "invoice_sent", label: "Invoice raised and sent to client", short: "Invoice sent" },
  { id: "client_paid", label: "Payment received from client", short: "Client paid" },
  { id: "consultant_paid", label: "Consultant paid", short: "Consultant paid" },
];

/** Five dots (or a list, with dates): which stages are done. */
export function FlowSteps({ steps, compact = false }: { steps: Record<BillingStage, string | null>; compact?: boolean }) {
  if (compact) {
    const done = STAGES.filter((s) => steps[s.id]).length;
    return (
      <span className="flex items-center gap-1" aria-label={`${done} of 5 stages done`}>
        {STAGES.map((s) => (
          <span
            key={s.id}
            title={s.label}
            className={cn("size-2.5 rounded-full", steps[s.id] ? "bg-[var(--dash-cyan)]" : "bg-[rgb(4_19_39/0.12)]")}
          />
        ))}
      </span>
    );
  }
  return (
    <ol className="space-y-2.5">
      {STAGES.map((s, i) => {
        const at = steps[s.id];
        return (
          <li key={s.id} className="flex items-center gap-3 text-sm">
            <span
              className={cn(
                "grid size-6 flex-none place-items-center rounded-full text-xs font-bold",
                at ? "bg-[var(--dash-cyan)] text-white" : "border border-[var(--dash-line-strong)] text-[var(--dash-muted)]",
              )}
              aria-hidden="true"
            >
              {at ? <Check className="size-3.5" /> : i + 1}
            </span>
            <span className={cn("flex-1", !at && "text-[var(--dash-muted)]")}>{s.label}</span>
            <span className="text-xs text-[var(--dash-muted)]">{at ? date(at) : "Not yet"}</span>
          </li>
        );
      })}
    </ol>
  );
}

/** A labelled value in a detail panel. */
export function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-[var(--dash-muted)]">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium break-words">{children}</dd>
    </div>
  );
}
