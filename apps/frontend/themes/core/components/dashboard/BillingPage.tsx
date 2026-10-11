"use client";

import { Download } from "lucide-react";
import { billingSummary, invoices } from "@/content/portal-demo";
import { Chip, PageHeader, useToast } from "./ui";

/** Invoice totals, then every invoice with its status. */
export function BillingPage() {
  const [toast, showToast] = useToast();
  return (
    <div className="space-y-6">
      <PageHeader title="Billing & invoices" body="What's been billed, what's paid and what's due next." />

      <ul className="grid gap-3 sm:grid-cols-3">
        {billingSummary.map((b) => (
          <li key={b.label} className="dash-stat">
            <p className="text-[0.8125rem] font-medium text-[var(--dash-muted)]">{b.label}</p>
            <p className="mt-1.5 text-2xl font-semibold">{b.value}</p>
            <p className="mt-0.5 text-xs text-[var(--dash-muted)]">{b.note}</p>
          </li>
        ))}
      </ul>

      <section aria-labelledby="invoices-heading">
        <h2 id="invoices-heading" className="dash-section-title">
          Invoices <span className="dash-count">{invoices.length}</span>
        </h2>
        <div className="dash-card mt-3 p-2 sm:p-3">
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th scope="col">Invoice</th>
                  <th scope="col">For</th>
                  <th scope="col">Amount</th>
                  <th scope="col">Issued</th>
                  <th scope="col">Due</th>
                  <th scope="col">Status</th>
                  <th scope="col">
                    <span className="sr-only">Download</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((i) => (
                  <tr key={i.id}>
                    <td>{i.id}</td>
                    <td>{i.title}</td>
                    <td className="font-semibold text-[var(--dash-ink)]">{i.amount}</td>
                    <td>{i.issued}</td>
                    <td>{i.due}</td>
                    <td>
                      <Chip>{i.status}</Chip>
                    </td>
                    <td className="text-right">
                      <button
                        type="button"
                        className="dash-icon-btn ml-auto size-8"
                        aria-label={`Download ${i.id}`}
                        onClick={() => showToast(`Demo: ${i.id} downloads when the portal is live.`)}
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
      </section>
      {toast}
    </div>
  );
}
