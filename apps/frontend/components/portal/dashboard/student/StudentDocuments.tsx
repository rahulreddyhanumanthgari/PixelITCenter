"use client";

import { useRef, useState, type ReactNode } from "react";
import { CircleCheck, Download, FileText, Trash2, Upload } from "lucide-react";
import type { StudentDoc, StudentDocType } from "@/content/student-demo";
import { fromPixelitOf, setNoIdDocument, setStudentDocs, studentDocsOf, useSession } from "../session";
import { PageHeader, useToast } from "../ui";

// The student's documents: ONLY resume, DL or State ID (utility bill if they
// have neither), passport copy and visa copy. Plus what PixelIT sent them.
//
// TODO(backend): files stay in this browser (demo). The API stores them in
// private storage (see apps/backend: the Placement Details documents) and
// checks the file's contents, not just its name.

const MAX_MB = 5;
const ACCEPT = ".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png";
const MIME_OK = ["application/pdf", "image/jpeg", "image/png"];

const TYPES: Record<StudentDocType, { label: string; hint: string }> = {
  resume: { label: "Resume", hint: "Your latest resume. New versions with recruiter feedback live in the Resume corner." },
  id: { label: "Driver's License or State ID", hint: "Either one. Front side, all four corners visible." },
  utility: { label: "Utility bill", hint: "A recent bill (last 3 months) showing your name and address." },
  passport: { label: "Passport copy", hint: "The page with your photo and passport number." },
  visa: { label: "Visa copy", hint: "Your current visa or EAD card." },
};

function sizeLabel(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function checkFile(file: File) {
  if (!/\.(pdf|jpe?g|png)$/i.test(file.name) || !MIME_OK.includes(file.type)) return "Use a PDF, JPG or PNG file.";
  if (file.size > MAX_MB * 1024 * 1024) return `This file is over ${MAX_MB} MB. Try a smaller scan or a PDF.`;
  if (file.size === 0) return "This file is empty.";
  return null;
}

export function StudentDocuments() {
  const session = useSession();
  const [tab, setTab] = useState<"mine" | "pixelit">("mine");
  const [toast, showToast] = useToast();
  if (!session) return null;

  const docs = studentDocsOf(session);
  const fromPixelit = fromPixelitOf(session);
  const noId = Boolean(session.noIdDocument);
  // A utility bill replaces the DL / State ID only when the student has neither.
  const types: StudentDocType[] = ["resume", noId ? "utility" : "id", "passport", "visa"];
  const done = types.filter((t) => docs.some((d) => d.type === t)).length;

  return (
    <div className="space-y-6">
      <PageHeader title="Documents" body={`The papers your recruiter needs to market your profile. PDF, JPG or PNG, up to ${MAX_MB} MB each.`} />

      <div className="dash-tabs" role="tablist" aria-label="Documents">
        <button type="button" role="tab" aria-selected={tab === "mine"} className="dash-tab" onClick={() => setTab("mine")}>
          Your documents <span className="ml-1 text-[var(--dash-faint)]">{done}/{types.length}</span>
        </button>
        <button type="button" role="tab" aria-selected={tab === "pixelit"} className="dash-tab" onClick={() => setTab("pixelit")}>
          From PixelIT <span className="ml-1 text-[var(--dash-faint)]">{fromPixelit.length}</span>
        </button>
      </div>

      {tab === "mine" ? (
        <ul className="space-y-3">
          {types.map((t) => (
            <DocRow
              key={t}
              type={t}
              doc={docs.find((d) => d.type === t)}
              onToast={showToast}
              extra={
                t === "id" || t === "utility" ? (
                  <button
                    type="button"
                    className="mt-2 text-xs font-semibold text-[var(--dash-orange-ink)] hover:underline"
                    onClick={() => setNoIdDocument(!noId)}
                  >
                    {noId ? "I have a Driver's License or State ID after all" : "I don't have a Driver's License or State ID"}
                  </button>
                ) : null
              }
            />
          ))}
        </ul>
      ) : fromPixelit.length ? (
        <ul className="dash-card divide-y divide-[var(--dash-line)] px-4 sm:px-5">
          {fromPixelit.map((d) => (
            <li key={d.id} className="flex flex-wrap items-center gap-3 py-3.5">
              <span className="dash-stat-icon flex-none">
                <FileText className="size-3.5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold break-words">{d.name}</span>
                <span className="block text-xs text-[var(--dash-muted)]">
                  Sent {d.sent} by {d.by} · {d.size}
                </span>
              </span>
              <button
                type="button"
                className="dash-btn-ghost h-9 px-3.5"
                onClick={() => showToast("Demo: downloads open when the portal is live.")}
              >
                <Download className="size-4" aria-hidden="true" /> Download
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="dash-card dash-card-pad py-10 text-center">
          <p className="text-sm font-semibold">Nothing from PixelIT yet</p>
          <p className="mt-1 text-sm text-[var(--dash-muted)]">Offer letters and forms your recruiter sends you will appear here.</p>
        </div>
      )}
      {toast}
    </div>
  );
}

function DocRow({ type, doc, onToast, extra }: { type: StudentDocType; doc?: StudentDoc; onToast: (t: string) => void; extra?: ReactNode }) {
  const input = useRef<HTMLInputElement>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const spec = TYPES[type];
  const id = `sdoc-${type}`;

  return (
    <li className={`dash-card dash-card-pad ${problem ? "border-[var(--dash-red-ink)]" : ""}`}>
      <div className="flex flex-wrap items-start gap-3">
        <span
          className={`grid size-10 flex-none place-items-center rounded-xl ${doc ? "bg-[var(--dash-cyan-tint)] text-[var(--dash-cyan-ink)]" : "bg-[var(--dash-side)] text-[var(--dash-muted)]"}`}
        >
          {doc ? <CircleCheck className="size-5" aria-hidden="true" /> : <FileText className="size-5" aria-hidden="true" />}
        </span>
        <div className="min-w-0 flex-1 basis-48">
          <p id={`${id}-label`} className="text-sm font-semibold">
            {spec.label}
          </p>
          {doc ? (
            <p className="mt-0.5 text-xs break-words text-[var(--dash-muted)]">
              {doc.fileName} · {doc.size} · added {doc.uploaded}
              {doc.expires && <> · expires {doc.expires}</>}
            </p>
          ) : (
            <p className="mt-0.5 text-xs leading-relaxed text-[var(--dash-muted)]">
              <span className="font-semibold text-[var(--dash-orange-ink)]">Not uploaded.</span> {spec.hint}
            </p>
          )}
          {extra}
        </div>

        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          {doc && (
            <button type="button" className="dash-btn-ghost h-9 px-3.5" onClick={() => onToast("Demo: files open when the portal is live.")}>
              View
            </button>
          )}
          <input
            ref={input}
            id={id}
            type="file"
            accept={ACCEPT}
            className="sr-only"
            aria-labelledby={`${id}-label`}
            tabIndex={-1}
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (!f) return;
              const bad = checkFile(f);
              setProblem(bad);
              if (bad) return;
              setStudentDocs((list) => [
                ...list.filter((d) => d.type !== type),
                { id: `d${Date.now()}`, type, fileName: f.name, size: sizeLabel(f.size), uploaded: "Just now" },
              ]);
              onToast(`${spec.label} uploaded.`);
            }}
          />
          <button type="button" className="dash-btn-ghost h-9 px-3.5" title="PDF, JPG or PNG, up to 5 MB" onClick={() => input.current?.click()}>
            <Upload className="size-4" aria-hidden="true" /> {doc ? "Replace" : "Upload"}
          </button>
          {doc &&
            (confirming ? (
              <span className="flex items-center gap-1.5">
                <button
                  type="button"
                  className="dash-btn h-9 px-3.5"
                  onClick={() => {
                    setStudentDocs((list) => list.filter((d) => d.id !== doc.id));
                    setConfirming(false);
                    onToast(`${spec.label} removed.`);
                  }}
                >
                  Yes, remove
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
                title="Remove"
                onClick={() => setConfirming(true)}
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </button>
            ))}
        </div>
      </div>
      {problem && (
        <p className="mt-2 text-xs font-medium text-[var(--dash-red-ink)]" role="alert">
          {problem}
        </p>
      )}
    </li>
  );
}
