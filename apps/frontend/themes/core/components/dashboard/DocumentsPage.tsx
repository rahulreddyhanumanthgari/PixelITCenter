"use client";

import { useRef, useState } from "react";
import { Download, FileText, Upload } from "lucide-react";
import { documents as starter } from "@/content/portal-demo";
import { Chip, PageHeader, useToast } from "./ui";

function formatSize(bytes: number) {
  return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

type Doc = { id: string; name: string; category: string; size: string; updated: string; by?: string; expires?: string; expiresSoon?: boolean };

/**
 * Shared files by category. Upload adds the file to this list only (demo).
 * Students' files carry an expiry date (ID, work papers) instead of "shared by".
 */
export function DocumentsPage({
  starter: initial = starter,
  body = "Contracts, plans, certificates and timesheets shared with you.",
}: {
  starter?: Doc[];
  body?: string;
}) {
  const [docs, setDocs] = useState<Doc[]>(initial);
  const withExpiry = initial.some((d) => d.expires);
  const [category, setCategory] = useState("All");
  const fileInput = useRef<HTMLInputElement>(null);
  const [toast, showToast] = useToast();
  const categories = ["All", ...Array.from(new Set(initial.map((d) => d.category))), ...(docs.some((d) => d.category === "Uploads") ? ["Uploads"] : [])];
  const soon = docs.filter((d) => d.expiresSoon);
  const shown = docs.filter((d) => category === "All" || d.category === category);

  return (
    <div className="space-y-6">
      <PageHeader title="Documents" body={body}>
        <button type="button" className="dash-btn" onClick={() => fileInput.current?.click()}>
          <Upload className="size-4" aria-hidden="true" /> Upload
        </button>
        <input
          ref={fileInput}
          type="file"
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setDocs((d) => [
              { id: `u${Date.now()}`, name: file.name, category: "Uploads", size: formatSize(file.size), updated: "Just now", by: "You" },
              ...d,
            ]);
            showToast(`Added “${file.name}”. Demo: it stays in this browser.`);
            e.target.value = "";
          }}
        />
      </PageHeader>

      {soon.map((d) => (
        <p key={d.id} className="portal-error flex flex-wrap items-center gap-x-2">
          <strong>{d.name.replace(/\.\w+$/, "")} expires {d.expires}.</strong> Upload a new one so nothing is delayed.
        </p>
      ))}

      <div className="dash-scroll-row -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="dash-tabs" role="group" aria-label="Filter by category">
          {categories.map((c) => (
            <button key={c} type="button" className="dash-tab" aria-pressed={category === c} onClick={() => setCategory(c)}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="dash-card p-2 sm:p-3">
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Category</th>
                <th scope="col">Size</th>
                <th scope="col">Updated</th>
                <th scope="col">{withExpiry ? "Expires" : "Shared by"}</th>
                <th scope="col">
                  <span className="sr-only">Download</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {shown.map((d) => (
                <tr key={d.id}>
                  <td>
                    <span className="flex items-center gap-2.5">
                      <span className="dash-stat-icon flex-none">
                        <FileText className="size-3.5" aria-hidden="true" />
                      </span>
                      {d.name}
                    </span>
                  </td>
                  <td>{d.category}</td>
                  <td>{d.size}</td>
                  <td>{d.updated}</td>
                  <td>
                    {withExpiry ? (
                      d.expiresSoon ? <Chip>Expires soon</Chip> : (d.expires ?? "—")
                    ) : (
                      d.by
                    )}
                  </td>
                  <td className="text-right">
                    <button
                      type="button"
                      className="dash-icon-btn ml-auto size-8"
                      aria-label={`Download ${d.name}`}
                      onClick={() => showToast("Demo: downloads open when the portal is live.")}
                    >
                      <Download className="size-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {toast}
    </div>
  );
}
