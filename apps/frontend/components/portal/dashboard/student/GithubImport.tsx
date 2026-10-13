"use client";

import { useRef, useState } from "react";
import { Check, X } from "lucide-react";
import type { PracticeProject } from "@/content/student-demo";
import { addProject } from "../session";

/** GitHub's mark (lucide has no brand icons). */
export function GithubMark({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

/** "https://github.com/owner/repo(.git)(/tree/…)" → { owner, repo }, or null. */
export function parseRepo(input: string) {
  const m = input.trim().match(/^(?:https?:\/\/)?(?:www\.)?github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?(?:[/?#].*)?$/i);
  return m ? { owner: m[1], repo: m[2] } : null;
}

/** "eks-api_demo" → "Eks api demo" */
const titleFrom = (repo: string) => {
  const words = repo.replace(/[-_.]+/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

/**
 * "Add from GitHub": paste a repo link, check the name, add a line about it
 * and the tools used. The project joins the list as "In review" for the
 * recruiter. Front end only: nothing is fetched from GitHub; the live
 * portal can read the repo's name, description and languages instead.
 */
export function useGithubImport(onAdded: (name: string) => void) {
  const ref = useRef<HTMLDialogElement>(null);
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [nameTouched, setNameTouched] = useState(false);
  const [body, setBody] = useState("");
  const [stack, setStack] = useState("");
  const parsed = parseRepo(url);
  const shownName = nameTouched ? name : parsed ? titleFrom(parsed.repo) : "";

  const open = () => {
    setUrl("");
    setName("");
    setNameTouched(false);
    setBody("");
    setStack("");
    ref.current?.showModal();
  };

  const dialog = (
    <dialog
      ref={ref}
      className="dash-card m-auto w-[min(30rem,calc(100vw-2rem))] p-0 backdrop:bg-[rgb(4_19_39/0.4)]"
      aria-labelledby="gh-heading"
    >
      <form
        method="dialog"
        className="p-5 sm:p-6"
        onSubmit={(e) => {
          if (!parsed || !shownName.trim()) {
            e.preventDefault();
            return;
          }
          const project: PracticeProject = {
            id: `gh${Date.now()}`,
            name: shownName.trim(),
            body: body.trim() || "Added from GitHub. Your recruiter will look at it.",
            stack: stack.split(",").map((s) => s.trim()).filter(Boolean),
            status: "In review",
            progress: 100,
            repo: `github.com/${parsed.owner}/${parsed.repo}`,
            fromGithub: true,
          };
          addProject(project);
          onAdded(project.name);
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id="gh-heading" className="flex items-center gap-2 text-lg font-semibold">
            <GithubMark className="size-5" /> Add a project from GitHub
          </h2>
          <button type="button" className="dash-icon-btn size-8" aria-label="Close" onClick={() => ref.current?.close()}>
            <X className="size-4" />
          </button>
        </div>
        <p className="mt-1 text-sm text-[var(--dash-muted)]">Paste the link to your repository. Make sure it&apos;s public so recruiters can open it.</p>

        <div className="mt-5 space-y-4">
          <div>
            <label htmlFor="gh-url" className="dash-label">
              Repository link
            </label>
            <input
              id="gh-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://github.com/your-name/your-project"
              className="dash-input"
              aria-invalid={url.trim() !== "" && !parsed}
              aria-describedby="gh-url-help"
              autoComplete="url"
              inputMode="url"
              required
            />
            <p id="gh-url-help" className="mt-1.5 text-xs">
              {!url.trim() ? (
                <span className="text-[var(--dash-faint)]">Like github.com/your-name/your-project</span>
              ) : parsed ? (
                <span className="flex items-center gap-1 font-semibold text-[var(--dash-cyan-ink)]">
                  <Check className="size-3.5" strokeWidth={3} aria-hidden="true" /> {parsed.owner}/{parsed.repo}
                </span>
              ) : (
                <span className="font-semibold text-[var(--dash-red-ink)]">That isn&apos;t a GitHub repository link yet.</span>
              )}
            </p>
          </div>

          <div>
            <label htmlFor="gh-name" className="dash-label">
              Project name
            </label>
            <input
              id="gh-name"
              value={shownName}
              onChange={(e) => {
                setNameTouched(true);
                setName(e.target.value);
              }}
              placeholder="Filled in from the link"
              className="dash-input"
            />
          </div>

          <div>
            <label htmlFor="gh-body" className="dash-label">
              What it does <span className="font-normal text-[var(--dash-faint)]">(optional)</span>
            </label>
            <textarea
              id="gh-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="One or two lines a recruiter can read quickly."
              className="dash-input min-h-20"
              maxLength={200}
            />
          </div>

          <div>
            <label htmlFor="gh-stack" className="dash-label">
              Tools used <span className="font-normal text-[var(--dash-faint)]">(optional, separated by commas)</span>
            </label>
            <input id="gh-stack" value={stack} onChange={(e) => setStack(e.target.value)} placeholder="AWS, Terraform, Python" className="dash-input" />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className="dash-btn-ghost" onClick={() => ref.current?.close()}>
            Cancel
          </button>
          <button type="submit" className="dash-btn" data-tone="orange" disabled={!parsed || !shownName.trim()}>
            Add project
          </button>
        </div>
      </form>
    </dialog>
  );

  return { open, dialog };
}
