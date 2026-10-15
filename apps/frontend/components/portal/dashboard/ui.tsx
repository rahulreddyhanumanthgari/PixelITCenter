"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Pencil } from "lucide-react";
import { initials, setPhoto } from "./session";

// Small pieces shared by the dashboard pages.

const AVATAR_COLOURS = ["#041327", "#fc650d", "#0b7fa3", "#1d4ed8", "#c2410c", "#334155"];

/** The person's photo, or their initials in a circle (the same name always gets the same colour). */
export function Avatar({ name, size = 36, className, photo }: { name: string; size?: number; className?: string; photo?: string | null }) {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  if (photo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- a data: URL from the browser; next/image can't optimise it
      <img src={photo} alt="" aria-hidden="true" width={size} height={size} className={cn("dash-avatar object-cover", className)} style={{ width: size, height: size }} />
    );
  }
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
  "In review": "ink",
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
export function ProfileRing({ name, percent, size = 76, photo, editable = false }: { name: string; percent: number; size?: number; photo?: string | null; editable?: boolean }) {
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
      {editable ? <PhotoEditor name={name || "?"} size={size - 16} photo={photo} /> : <Avatar name={name || "?"} size={size - 16} photo={photo} />}
    </span>
  );
}

/**
 * Your own photo with a pencil on hover (and always on touch screens): pick a
 * picture and it replaces your initials everywhere in the portal. JPG, PNG or
 * WebP up to 10 MB; it's cropped to a square and shrunk to 256 px first.
 * DEMO: kept in this browser with the session. With the backend it's uploaded
 * to private storage like other documents.
 */
export function PhotoEditor({ name, size, photo }: { name: string; size: number; photo?: string | null }) {
  const input = useRef<HTMLInputElement>(null);
  const [toast, showToast] = useToast();
  async function pick(file: File | undefined) {
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return showToast("Use a JPG, PNG or WebP picture.");
    if (file.size > 10 * 1024 * 1024) return showToast("Pictures can be up to 10 MB.");
    try {
      setPhoto(await squarePhoto(file));
      showToast("Photo updated.");
    } catch {
      showToast("That picture couldn't be read. Try another one.");
    }
  }
  return (
    <span className="group relative grid place-items-center" style={{ width: size, height: size }}>
      <Avatar name={name} size={size} photo={photo} />
      <button
        type="button"
        onClick={() => input.current?.click()}
        aria-label={photo ? "Change your photo" : "Add your photo"}
        className="absolute inset-0 grid place-items-center rounded-full bg-[rgb(4_19_39/0.55)] text-white opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100 [@media(hover:none)]:bg-transparent"
      >
        <span className="grid size-9 place-items-center rounded-full bg-white/15 [@media(hover:none)]:absolute [@media(hover:none)]:right-0 [@media(hover:none)]:bottom-0 [@media(hover:none)]:size-8 [@media(hover:none)]:bg-[var(--dash-orange)] [@media(hover:none)]:ring-2 [@media(hover:none)]:ring-white">
          <Pencil className="size-4" aria-hidden="true" />
        </span>
      </button>
      {photo && (
        <button
          type="button"
          onClick={() => {
            setPhoto(null);
            showToast("Photo removed.");
          }}
          className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-semibold whitespace-nowrap text-[var(--dash-muted)] opacity-0 transition-opacity group-hover:opacity-100 hover:text-[var(--dash-red-ink)] focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
        >
          Remove
        </button>
      )}
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => (pick(e.target.files?.[0]), (e.target.value = ""))} />
      {toast}
    </span>
  );
}

/** Centre-crops a picture to a square and shrinks it to 256 px (JPEG, about 20–40 KB). */
function squarePhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const side = Math.min(img.naturalWidth, img.naturalHeight);
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 256;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("no canvas"));
      ctx.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, 256, 256);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("bad image"));
    };
    img.src = url;
  });
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
