"use client";

import { useRef, useState, type MouseEvent } from "react";
import { CircleCheck, FileText, LoaderCircle, Trash2, Upload } from "lucide-react";
import { ApiError, fileUrl, placementApi, type PlacementDocument } from "./api";
import { DOCUMENTS, type DocumentType } from "./fields";

// Resume, ID and visa copy: one row each with Upload / View / Replace / Remove.

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = ".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png";

function sizeLabel(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** Quick check before uploading; the server checks the file's contents too. */
function precheck(file: File) {
  if (!/\.(pdf|jpe?g|png)$/i.test(file.name)) return "Use a PDF, JPG or PNG file.";
  if (file.size > MAX_BYTES) return "This file is over 5 MB. Try a smaller scan or a PDF.";
  if (file.size === 0) return "This file is empty.";
  return null;
}

export function PlacementDocuments({
  email,
  documents,
  canEdit,
  errors,
  onChange,
  notify,
}: {
  email: string;
  documents: PlacementDocument[];
  canEdit: boolean;
  errors: Record<string, string>;
  onChange: (docs: PlacementDocument[]) => void;
  notify: (text: string) => void;
}) {
  return (
    <ul className="space-y-3">
      {DOCUMENTS.map((d) => (
        <DocumentRow
          key={d.type}
          email={email}
          spec={d}
          doc={documents.find((x) => x.type === d.type)}
          canEdit={canEdit}
          error={errors[`document:${d.type}`]}
          onUploaded={(doc) => onChange([...documents.filter((x) => x.type !== doc.type), doc])}
          onRemoved={(id) => onChange(documents.filter((x) => x.id !== id))}
          onRefreshed={onChange}
          notify={notify}
        />
      ))}
    </ul>
  );
}

function DocumentRow({
  email,
  spec,
  doc,
  canEdit,
  error,
  onUploaded,
  onRemoved,
  onRefreshed,
  notify,
}: {
  email: string;
  spec: (typeof DOCUMENTS)[number];
  doc?: PlacementDocument;
  canEdit: boolean;
  error?: string;
  onUploaded: (doc: PlacementDocument) => void;
  onRemoved: (id: string) => void;
  onRefreshed: (docs: PlacementDocument[]) => void;
  notify: (text: string) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<"upload" | "remove" | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const shownError = problem ?? error;
  const id = `doc-${spec.type}`;

  async function upload(file: File) {
    const bad = precheck(file);
    if (bad) return setProblem(bad);
    setProblem(null);
    setBusy("upload");
    try {
      onUploaded(await placementApi.upload(email, spec.type as DocumentType, file));
      notify(`${spec.label} uploaded.`);
    } catch (e) {
      setProblem(e instanceof ApiError ? e.message : "Upload failed. Try again.");
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    if (!doc) return;
    setBusy("remove");
    try {
      await placementApi.remove(email, doc.id);
      onRemoved(doc.id);
      notify(`${spec.label} removed.`);
    } catch (e) {
      setProblem(e instanceof ApiError ? e.message : "Couldn't remove it. Try again.");
    } finally {
      setBusy(null);
      setConfirming(false);
    }
  }

  /** File links last a few minutes; fetch a fresh one if this one has run out. */
  async function view(e: MouseEvent<HTMLAnchorElement>) {
    if (!doc || new Date(doc.expiresAt).getTime() - Date.now() > 15_000) return;
    e.preventDefault();
    const tab = window.open("about:blank", "_blank");
    try {
      const { documents } = await placementApi.documents(email);
      onRefreshed(documents);
      const fresh = documents.find((x) => x.id === doc.id);
      if (tab && fresh) {
        tab.opener = null;
        tab.location.href = fileUrl(fresh);
      } else tab?.close();
    } catch {
      tab?.close();
      notify("Couldn't open the file. Try again.");
    }
  }

  return (
    <li
      className={`rounded-2xl border p-4 ${shownError ? "border-[var(--dash-red-ink)]" : "border-[var(--dash-line-strong)]"}`}
      aria-describedby={shownError ? `${id}-error` : undefined}
    >
      <div className="flex flex-wrap items-start gap-3">
        <span
          className={`grid size-10 flex-none place-items-center rounded-xl ${doc ? "bg-[var(--dash-cyan-tint)] text-[var(--dash-cyan-ink)]" : "bg-[var(--dash-side)] text-[var(--dash-muted)]"}`}
        >
          {doc ? <CircleCheck className="size-5" aria-hidden="true" /> : <FileText className="size-5" aria-hidden="true" />}
        </span>
        <div className="min-w-0 flex-1 basis-48">
          <p id={`${id}-label`} className="text-sm font-semibold">
            {spec.label}
            <span className="text-[var(--dash-orange-ink)]" aria-hidden="true">
              {" "}*
            </span>
          </p>
          {doc ? (
            <p className="mt-0.5 truncate text-xs text-[var(--dash-muted)]">
              {doc.fileName} · {sizeLabel(doc.sizeBytes)} · added {new Date(doc.uploadedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </p>
          ) : (
            <p className="mt-0.5 text-xs leading-relaxed text-[var(--dash-muted)]">{spec.hint}</p>
          )}
        </div>

        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          {doc && (
            <a href={fileUrl(doc)} target="_blank" rel="noopener noreferrer" onClick={view} className="dash-btn-ghost h-9 px-3.5">
              View
            </a>
          )}
          {canEdit && (
            <>
              <input
                ref={input}
                id={id}
                type="file"
                accept={ACCEPT}
                className="sr-only"
                aria-labelledby={`${id}-label`}
                tabIndex={-1}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (file) upload(file);
                }}
              />
              <button type="button" className="dash-btn-ghost h-9 px-3.5" disabled={busy !== null} onClick={() => input.current?.click()}>
                {busy === "upload" ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Upload className="size-4" aria-hidden="true" />}
                {busy === "upload" ? "Uploading…" : doc ? "Replace" : "Upload"}
              </button>
              {doc &&
                (confirming ? (
                  <span className="flex items-center gap-1.5">
                    <button type="button" className="dash-btn h-9 px-3.5" disabled={busy !== null} onClick={remove}>
                      {busy === "remove" ? "Removing…" : "Yes, remove"}
                    </button>
                    <button type="button" className="dash-btn-ghost h-9 px-3.5" onClick={() => setConfirming(false)}>
                      Keep
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    className="dash-btn-ghost h-9 px-3"
                    aria-label={`Remove ${spec.label.toLowerCase()}`}
                    disabled={busy !== null}
                    onClick={() => setConfirming(true)}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                ))}
            </>
          )}
        </div>
      </div>
      {shownError && (
        <p id={`${id}-error`} className="mt-2 text-xs font-medium text-[var(--dash-red-ink)]">
          {shownError === "Required." ? "Upload this to submit." : shownError}
        </p>
      )}
    </li>
  );
}
