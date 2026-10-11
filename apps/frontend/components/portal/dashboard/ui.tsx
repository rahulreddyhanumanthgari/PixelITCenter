"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { initials } from "./session";

// Small pieces shared by the dashboard pages.

const AVATAR_COLOURS = ["#041327", "#fc650d", "#0b7fa3", "#1d4ed8", "#c2410c", "#334155"];

/** Initials in a circle; the same name always gets the same colour. */
export function Avatar({ name, size = 36, className }: { name: string; size?: number; className?: string }) {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return (
    <span
      aria-hidden="true"
      className={cn("dash-avatar", className)}
      style={{ width: size, height: size, fontSize: size * 0.36, background: AVATAR_COLOURS[hash % AVATAR_COLOURS.length] }}
    >
      {initials(name)}
    </span>
  );
}

/** A row of overlapping avatars. */
export function AvatarStack({ names, size = 28 }: { names: string[]; size?: number }) {
  return (
    <span className="flex -space-x-2" aria-label={names.join(", ")}>
      {names.map((n) => (
        <Avatar key={n} name={n} size={size} className="ring-2 ring-white" />
      ))}
    </span>
  );
}

type Tone = "good" | "warn" | "bad" | "ink" | undefined;

const TONES: Record<string, Tone> = {
  "On track": "good",
  Approved: "good",
  Paid: "good",
  Signed: "good",
  Resolved: "good",
  Completed: "good",
  Scheduled: "good",
  "At risk": "warn",
  Due: "warn",
  Open: "warn",
  "In progress": "warn",
  Medium: "warn",
  Overdue: "bad",
  High: "bad",
  Normal: "good",
  // Student corner
  Shortlisted: "ink",
  Interview: "warn",
  Offer: "good",
  Done: "good",
  Graded: "good",
  Submitted: "good",
  Reviewed: "good",
  "Needs changes": "warn",
  Strong: "good",
  Good: "good",
  "Practise more": "warn",
  "Mock interview": "good",
  "Expires soon": "bad",
};

/** A status / priority chip; the colour follows the word. */
export function Chip({ children, tone }: { children: string; tone?: Tone }) {
  return (
    <span className="dash-chip" data-tone={tone ?? TONES[children]}>
      {children}
    </span>
  );
}

/** The profile-complete ring around the avatar. */
export function ProfileRing({ name, percent, size = 76 }: { name: string; percent: number; size?: number }) {
  const r = 46;
  const c = 2 * Math.PI * r;
  return (
    <span className="relative grid flex-none place-items-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90" aria-hidden="true">
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgb(4 19 39 / 0.08)" strokeWidth="5" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="var(--dash-orange)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - percent / 100)}
          style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(0.22, 1, 0.36, 1)" }}
        />
      </svg>
      <Avatar name={name || "?"} size={size - 16} />
    </span>
  );
}

/** Page heading + one line under it + optional buttons on the right. */
export function PageHeader({ title, body, children }: { title: ReactNode; body?: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="dash-title">{title}</h1>
        {body && <p className="mt-2 text-sm text-[var(--dash-muted)] sm:text-[0.9375rem]">{body}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

/**
 * A note that shows for a few seconds: `const [toast, show] = useToast()`.
 * `raised` lifts it above a bar stuck to the bottom (the job page's Apply bar).
 */
export function useToast({ raised = false }: { raised?: boolean } = {}): [ReactNode, (text: string) => void] {
  const [text, setText] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const show = (t: string) => {
    clearTimeout(timer.current);
    setText(t);
    timer.current = setTimeout(() => setText(null), 2800);
  };
  const node = (
    <div role="status" aria-live="polite">
      {text && (
        <div className="dash-toast" data-raised={raised || undefined}>
          {text}
        </div>
      )}
    </div>
  );
  return [node, show];
}
