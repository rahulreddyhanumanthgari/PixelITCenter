"use client";

import { useState, type FormEvent } from "react";
import { ExternalLink, Plus, Send } from "lucide-react";
import { Chip, PageHeader, useToast } from "../ui";
import { adminApi, type Client, type ClientInput } from "./api";
import { can, Detail, Empty, ErrorNote, Field, fieldErrors, errorText, Loading, Panel, Toggle, useApi, useWho } from "./ui";

// Clients and vendors (admin only). No logins: clients never sign in to the
// portal. Admins create and edit records; accounts reads them and can send a
// client's unsent invoices.

const TERMS = [15, 30, 45, 60, 90];

const blank: ClientInput = {
  name: "",
  type: "CLIENT",
  endClientName: null,
  contactPerson: null,
  billingEmail: "",
  vmsPortalName: null,
  vmsPortalUrl: null,
  paymentTermsDays: 30,
  notes: null,
  autoSendInvoices: true,
};

export function ClientsPage() {
  const who = useWho();
  const [showArchived, setShowArchived] = useState(false);
  const list = useApi(who ? () => adminApi.clients(who, showArchived) : null, [who?.email, who?.role, showArchived]);
  const [editing, setEditing] = useState<Client | "new" | null>(null);
  const [toast, showToast] = useToast();
  const isAdmin = can(who, "admin");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clients"
        body="End clients and vendors you bill. They don't sign in here; invoices go to their billing email or VMS portal."
      >
        {isAdmin && (
          <button type="button" className="dash-btn" data-tone="orange" onClick={() => setEditing("new")}>
            <Plus className="size-4" aria-hidden="true" /> Add client
          </button>
        )}
      </PageHeader>

      <div className="dash-tabs" role="group" aria-label="Show">
        <button type="button" className="dash-tab" aria-pressed={!showArchived} onClick={() => setShowArchived(false)}>
          Active
        </button>
        <button type="button" className="dash-tab" aria-pressed={showArchived} onClick={() => setShowArchived(true)}>
          Archived
        </button>
      </div>

      {list.error && <ErrorNote text={list.error} onRetry={list.reload} />}
      {list.loading && !list.data ? (
        <Loading />
      ) : list.data ? (
        <div className="dash-card p-2 sm:p-3">
          {list.data.clients.length === 0 ? (
            <Empty title={showArchived ? "No archived clients" : "No clients yet"} body={isAdmin && !showArchived ? "Add the first one with “Add client”." : undefined} />
          ) : (
            <div className="dash-table-wrap">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th scope="col">Name</th>
                    <th scope="col">Type</th>
                    <th scope="col">Contact</th>
                    <th scope="col">Billing email</th>
                    <th scope="col">VMS</th>
                    <th scope="col">Terms</th>
                    <th scope="col">Auto-send</th>
                    <th scope="col">Placements</th>
                    <th scope="col">Unsent</th>
                  </tr>
                </thead>
                <tbody>
                  {list.data.clients.map((c) => (
                    <tr key={c.id} data-clickable onClick={() => setEditing(c)}>
                      <td>
                        <button type="button" className="text-left font-semibold hover:underline" onClick={(e) => (e.stopPropagation(), setEditing(c))}>
                          {c.name}
                        </button>
                        {c.endClientName && <span className="block text-xs font-normal text-[var(--dash-muted)]">End client: {c.endClientName}</span>}
                      </td>
                      <td>
                        <Chip tone={c.type === "VENDOR" ? "warn" : "good"}>{c.type === "VENDOR" ? "Vendor" : "Client"}</Chip>
                      </td>
                      <td>{c.contactPerson ?? "–"}</td>
                      <td>{c.billingEmail}</td>
                      <td>{c.vmsPortalName ?? "–"}</td>
                      <td>Net {c.paymentTermsDays}</td>
                      <td>{c.autoSendInvoices ? <Chip tone="good">On</Chip> : <Chip>Off</Chip>}</td>
                      <td>{c.activePlacements}</td>
                      <td>{c.unsentInvoices ? <Chip tone="warn">{String(c.unsentInvoices)}</Chip> : "0"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}

      {who && (
        <ClientPanel
          who={who}
          client={editing}
          onClose={() => setEditing(null)}
          onSaved={(message) => {
            setEditing(null);
            list.reload();
            showToast(message);
          }}
        />
      )}
      {toast}
    </div>
  );
}

function ClientPanel({
  who,
  client,
  onClose,
  onSaved,
}: {
  who: NonNullable<ReturnType<typeof useWho>>;
  client: Client | "new" | null;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const isNew = client === "new";
  const isAdmin = who.role === "admin";
  const start = client && client !== "new" ? client : blank;
  const [draft, setDraft] = useState<ClientInput>(start);
  const [lastClient, setLastClient] = useState(client);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);

  // A different client opened: start from its values.
  if (client !== lastClient) {
    setLastClient(client);
    setDraft(client && client !== "new" ? client : blank);
    setErrors({});
    setProblem(null);
    setConfirmArchive(false);
  }

  const edit = (patch: Partial<ClientInput>) => setDraft((d) => ({ ...d, ...patch }));
  const text = (k: keyof ClientInput) => ({
    id: `client-${k}`,
    className: "dash-input",
    value: (draft[k] as string | null) ?? "",
    disabled: !isAdmin,
    "aria-invalid": Boolean(errors[k]) || undefined,
    "aria-describedby": errors[k] ? `client-${k}-error` : undefined,
    onChange: (e: { target: { value: string } }) => edit({ [k]: e.target.value } as Partial<ClientInput>),
  });

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!client) return;
    setBusy(true);
    setErrors({});
    setProblem(null);
    const body: Partial<ClientInput> = {
      name: draft.name,
      type: draft.type,
      endClientName: draft.endClientName || null,
      contactPerson: draft.contactPerson || null,
      billingEmail: draft.billingEmail,
      vmsPortalName: draft.vmsPortalName || null,
      vmsPortalUrl: draft.vmsPortalUrl || null,
      paymentTermsDays: draft.paymentTermsDays,
      notes: draft.notes || null,
      autoSendInvoices: draft.autoSendInvoices,
    };
    try {
      if (isNew) await adminApi.createClient(who, body);
      else await adminApi.updateClient(who, client.id, body);
      onSaved(isNew ? `${draft.name} added.` : "Saved.");
    } catch (err) {
      setErrors(fieldErrors(err));
      setProblem(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  async function act(run: () => Promise<string>) {
    setBusy(true);
    setProblem(null);
    try {
      onSaved(await run());
    } catch (err) {
      setProblem(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  const existing = client && client !== "new" ? client : null;

  return (
    <Panel
      open={Boolean(client)}
      title={isNew ? "Add a client or vendor" : (existing?.name ?? "")}
      subtitle={isNew ? "No login is created. Clients never sign in to the portal." : existing?.type === "VENDOR" ? "Vendor" : "Client"}
      onClose={onClose}
      footer={
        <>
          {existing && isAdmin && !existing.archived && (
            <button
              type="button"
              className="dash-btn-ghost mr-auto"
              disabled={busy}
              onClick={() =>
                confirmArchive
                  ? act(async () => (await adminApi.archiveClient(who, existing.id), `${existing.name} archived.`))
                  : setConfirmArchive(true)
              }
            >
              {confirmArchive ? "Click again to archive" : "Archive"}
            </button>
          )}
          {existing && existing.unsentInvoices > 0 && (
            <button
              type="button"
              className="dash-btn-ghost"
              disabled={busy}
              onClick={() =>
                act(async () => {
                  const r = await adminApi.sendClientInvoices(who, existing.id);
                  return r.failed ? `Sent ${r.sent}; ${r.failed} failed and are flagged.` : `Sent ${r.sent} invoice${r.sent === 1 ? "" : "s"}.`;
                })
              }
            >
              <Send className="size-4" aria-hidden="true" /> Send {existing.unsentInvoices} unsent now
            </button>
          )}
          {isAdmin && (
            <button type="submit" form="client-form" className="dash-btn" data-tone="orange" disabled={busy}>
              {busy ? "Saving…" : isNew ? "Add client" : "Save"}
            </button>
          )}
        </>
      }
    >
      <form id="client-form" onSubmit={save} className="space-y-5" noValidate>
        {problem && <ErrorNote text={problem} />}
        {!isAdmin && <p className="rounded-xl bg-[var(--dash-side)] p-3 text-sm text-[var(--dash-muted)]">Only an admin can change client records.</p>}

        <fieldset disabled={!isAdmin} className="space-y-5">
          <div role="radiogroup" aria-label="Type" className="grid grid-cols-2 gap-2">
            {(["CLIENT", "VENDOR"] as const).map((t) => (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={draft.type === t}
                onClick={() => edit({ type: t })}
                className={`min-h-[44px] rounded-xl border px-3 py-2 text-left text-sm ${draft.type === t ? "border-[var(--dash-orange)] bg-[var(--dash-orange-tint)] font-semibold" : "border-[var(--dash-line-strong)]"}`}
              >
                {t === "CLIENT" ? "End client" : "Vendor"}
                <span className="block text-xs font-normal text-[var(--dash-muted)]">{t === "CLIENT" ? "We bill them directly." : "Sits between us and the end client."}</span>
              </button>
            ))}
          </div>

          <Field id="client-name" label="Name" error={errors.name}>
            <input {...text("name")} autoComplete="organization" required />
          </Field>
          <Field id="client-endClientName" label={draft.type === "VENDOR" ? "End client" : "End client (optional)"} hint="Who the consultant actually works for." error={errors.endClientName}>
            <input {...text("endClientName")} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="client-contactPerson" label="Contact person" error={errors.contactPerson}>
              <input {...text("contactPerson")} autoComplete="name" />
            </Field>
            <Field id="client-billingEmail" label="Billing email" hint="Invoices and timesheets are sent here." error={errors.billingEmail}>
              <input {...text("billingEmail")} type="email" inputMode="email" autoComplete="email" required />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="client-vmsPortalName" label="VMS portal (optional)" hint="e.g. Beeline, SAP Fieldglass" error={errors.vmsPortalName}>
              <input {...text("vmsPortalName")} />
            </Field>
            <Field id="client-vmsPortalUrl" label="VMS link (optional)" error={errors.vmsPortalUrl}>
              <input {...text("vmsPortalUrl")} type="url" inputMode="url" placeholder="https://" />
            </Field>
          </div>
          <Field id="client-terms" label="Payment terms" hint="The invoice due date is the issue date plus these days." error={errors.paymentTermsDays}>
            <select id="client-terms" className="dash-input" value={draft.paymentTermsDays} onChange={(e) => edit({ paymentTermsDays: Number(e.target.value) })}>
              {[...new Set([...TERMS, draft.paymentTermsDays])].sort((a, b) => a - b).map((d) => (
                <option key={d} value={d}>
                  Net {d}
                </option>
              ))}
            </select>
          </Field>
          <Field id="client-notes" label="Notes (optional)" error={errors.notes}>
            <textarea {...text("notes")} rows={3} />
          </Field>
          <Toggle
            id="client-autosend"
            label="Email invoices automatically"
            hint="On the 1st of each month, unsent invoices and their approved timesheets go to the billing email. Turn off for clients who use a VMS portal."
            checked={draft.autoSendInvoices}
            onChange={(on) => isAdmin && edit({ autoSendInvoices: on })}
          />
        </fieldset>

        {existing && (
          <dl className="grid grid-cols-2 gap-4 rounded-2xl bg-[var(--dash-side)] p-4">
            <Detail label="Active placements">{existing.activePlacements}</Detail>
            <Detail label="Unsent invoices">{existing.unsentInvoices}</Detail>
            {existing.vmsPortalUrl && (
              <Detail label="VMS">
                <a href={existing.vmsPortalUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[var(--dash-orange-ink)] hover:underline">
                  Open {existing.vmsPortalName ?? "portal"} <ExternalLink className="size-3.5" aria-hidden="true" />
                </a>
              </Detail>
            )}
          </dl>
        )}
      </form>
    </Panel>
  );
}
