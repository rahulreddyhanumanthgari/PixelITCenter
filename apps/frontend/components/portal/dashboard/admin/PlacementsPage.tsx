"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Plus, Search } from "lucide-react";
import { Chip, PageHeader, useToast } from "../ui";
import { adminApi, type ExtensionStatus, type Placement, type PlacementInput, type Who } from "./api";
import { can, date, Empty, ErrorNote, Field, fieldErrors, errorText, Loading, Panel, usd, useApi, useWho } from "./ui";

// Placements: who is placed where, at what rates, until when. Replaces the old
// projects / tasks / schedule pages. Admins add and edit; accounts sees the
// rates; recruiters and verifiers see placements without any rates (the API
// leaves them out for those roles).

const STATUS: Record<ExtensionStatus, { label: string; tone: "good" | "warn" | "ink" | undefined }> = {
  ACTIVE: { label: "Active", tone: "good" },
  EXTENSION_PENDING: { label: "Extension pending", tone: "warn" },
  EXTENDED: { label: "Extended", tone: "ink" },
  ENDED: { label: "Ended", tone: undefined },
};

const FILTERS: ("ALL" | ExtensionStatus)[] = ["ALL", "ACTIVE", "EXTENSION_PENDING", "EXTENDED", "ENDED"];

export function PlacementsPage() {
  const who = useWho();
  const [status, setStatus] = useState<"ALL" | ExtensionStatus>("ALL");
  const [clientId, setClientId] = useState("");
  const [q, setQ] = useState("");
  const list = useApi(who ? () => adminApi.placements(who) : null, [who?.email, who?.role]);
  const [editing, setEditing] = useState<Placement | "new" | null>(null);
  const [toast, showToast] = useToast();
  const isAdmin = can(who, "admin");

  const all = useMemo(() => list.data?.placements ?? [], [list.data]);
  const money = all.some((p) => p.billRate !== undefined);
  const clients = useMemo(() => [...new Map(all.map((p) => [p.client.id, p.client.name])).entries()].sort((a, b) => a[1].localeCompare(b[1])), [all]);
  const needle = q.trim().toLowerCase();
  const shown = all.filter(
    (p) =>
      (status === "ALL" || p.extensionStatus === status) &&
      (!clientId || p.client.id === clientId) &&
      (!needle || [p.consultantName, p.role, p.client.name, p.endClientName ?? ""].some((v) => v.toLowerCase().includes(needle))),
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Placements" body={money ? "Who is placed where, at what rates. Bill rate is charged to the client; pay rate is paid to the consultant." : "Who is placed where and until when."}>
        {isAdmin && (
          <button type="button" className="dash-btn" data-tone="orange" onClick={() => setEditing("new")}>
            <Plus className="size-4" aria-hidden="true" /> Add placement
          </button>
        )}
      </PageHeader>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="dash-scroll-row -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div className="dash-tabs" role="group" aria-label="Filter by status">
            {FILTERS.map((f) => (
              <button key={f} type="button" className="dash-tab" aria-pressed={status === f} onClick={() => setStatus(f)}>
                {f === "ALL" ? "All" : STATUS[f].label}
                <span className="ml-1.5 text-[var(--dash-faint)]">{f === "ALL" ? all.length : all.filter((p) => p.extensionStatus === f).length}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:ml-auto lg:max-w-xl">
          <label className="sr-only" htmlFor="pl-client">
            Client
          </label>
          <select id="pl-client" className="dash-input" value={clientId} onChange={(e) => setClientId(e.target.value)}>
            <option value="">All clients</option>
            {clients.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
          <div className="relative">
            <label className="sr-only" htmlFor="pl-search">
              Search placements
            </label>
            <input id="pl-search" type="search" className="dash-input pr-10" placeholder="Consultant, role, client…" value={q} onChange={(e) => setQ(e.target.value)} />
            <Search className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-[var(--dash-muted)]" aria-hidden="true" />
          </div>
        </div>
      </div>

      {list.error && <ErrorNote text={list.error} onRetry={list.reload} />}
      {list.loading && !list.data ? (
        <Loading />
      ) : list.data ? (
        <div className="dash-card p-2 sm:p-3">
          {shown.length === 0 ? (
            <Empty title="No placements match" body={all.length ? "Try another filter." : isAdmin ? "Add the first one with “Add placement”." : undefined} />
          ) : (
            <div className="dash-table-wrap">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th scope="col">Consultant</th>
                    <th scope="col">Client / vendor</th>
                    <th scope="col">End client</th>
                    <th scope="col">Role</th>
                    {money && (
                      <>
                        <th scope="col">Bill rate</th>
                        <th scope="col">Pay rate</th>
                        <th scope="col">Margin / h</th>
                      </>
                    )}
                    <th scope="col">Start</th>
                    <th scope="col">Contract end</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((p) => (
                    <tr key={p.id} data-clickable={isAdmin || undefined} onClick={isAdmin ? () => setEditing(p) : undefined}>
                      <td>
                        {isAdmin ? (
                          <button type="button" className="text-left font-semibold hover:underline" onClick={(e) => (e.stopPropagation(), setEditing(p))}>
                            {p.consultantName}
                          </button>
                        ) : (
                          p.consultantName
                        )}
                      </td>
                      <td>
                        {p.client.name}
                        {p.client.type === "VENDOR" && <span className="ml-1.5 text-xs text-[var(--dash-muted)]">(vendor)</span>}
                      </td>
                      <td>{p.endClientName ?? "–"}</td>
                      <td>{p.role}</td>
                      {money && (
                        <>
                          <td>{usd(p.billRate)}/h</td>
                          <td>{usd(p.payRate)}/h</td>
                          <td className={p.marginPerHour !== undefined && p.marginPerHour < 0 ? "font-semibold text-[var(--dash-red-ink)]" : undefined}>{usd(p.marginPerHour)}</td>
                        </>
                      )}
                      <td>{date(p.startDate)}</td>
                      <td>{date(p.endDate)}</td>
                      <td>
                        <Chip tone={STATUS[p.extensionStatus].tone}>{STATUS[p.extensionStatus].label}</Chip>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}

      {who && isAdmin && (
        <PlacementPanel
          who={who}
          placement={editing}
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

const emptyDraft = { clientId: "", consultantName: "", consultantEmail: "", endClientName: "", role: "", billRate: "", payRate: "", startDate: "", endDate: "", extensionStatus: "ACTIVE" as ExtensionStatus };
type Draft = typeof emptyDraft;

const toDraft = (p: Placement): Draft => ({
  clientId: p.client.id,
  consultantName: p.consultantName,
  consultantEmail: p.consultantEmail,
  endClientName: p.endClientName ?? "",
  role: p.role,
  billRate: String(p.billRate ?? ""),
  payRate: String(p.payRate ?? ""),
  startDate: p.startDate,
  endDate: p.endDate ?? "",
  extensionStatus: p.extensionStatus,
});

function PlacementPanel({ who, placement, onClose, onSaved }: { who: Who; placement: Placement | "new" | null; onClose: () => void; onSaved: (message: string) => void }) {
  const isNew = placement === "new";
  const clients = useApi(placement ? () => adminApi.clients(who) : null, [Boolean(placement)]);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [last, setLast] = useState(placement);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (placement !== last) {
    setLast(placement);
    setDraft(placement && placement !== "new" ? toDraft(placement) : emptyDraft);
    setErrors({});
    setProblem(null);
  }
  const edit = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));
  const input = (k: keyof Draft) => ({
    id: `pl-${k}`,
    className: "dash-input",
    value: draft[k],
    "aria-invalid": Boolean(errors[k]) || undefined,
    "aria-describedby": errors[k] ? `pl-${k}-error` : undefined,
    onChange: (e: { target: { value: string } }) => edit({ [k]: e.target.value } as Partial<Draft>),
  });

  const bill = Number(draft.billRate);
  const pay = Number(draft.payRate);
  const margin = draft.billRate && draft.payRate ? bill - pay : null;

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!placement) return;
    setBusy(true);
    setErrors({});
    setProblem(null);
    const body: PlacementInput = {
      clientId: draft.clientId,
      consultantName: draft.consultantName,
      consultantEmail: draft.consultantEmail,
      endClientName: draft.endClientName || null,
      role: draft.role,
      billRate: Number(draft.billRate),
      payRate: Number(draft.payRate),
      startDate: draft.startDate,
      endDate: draft.endDate || null,
      extensionStatus: draft.extensionStatus,
    };
    try {
      if (isNew) await adminApi.createPlacement(who, body);
      else await adminApi.updatePlacement(who, placement.id, body);
      onSaved(isNew ? `Placement for ${draft.consultantName} added.` : "Saved. New rates apply to invoices raised from now on.");
    } catch (err) {
      setErrors(fieldErrors(err));
      setProblem(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel
      open={Boolean(placement)}
      title={isNew ? "Add a placement" : `${(placement as Placement | null)?.consultantName ?? ""}, ${(placement as Placement | null)?.role ?? ""}`}
      subtitle="Bill and pay rates feed the invoices. Consultants see only their client and their own pay rate."
      onClose={onClose}
      footer={
        <button type="submit" form="placement-form" className="dash-btn" data-tone="orange" disabled={busy}>
          {busy ? "Saving…" : isNew ? "Add placement" : "Save"}
        </button>
      }
    >
      <form id="placement-form" onSubmit={save} className="space-y-5" noValidate>
        {problem && <ErrorNote text={problem} />}
        <Field id="pl-clientId" label="Client or vendor" error={errors.clientId}>
          <select {...input("clientId")}>
            <option value="">Choose…</option>
            {clients.data?.clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.type === "VENDOR" ? ` (vendor${c.endClientName ? ` → ${c.endClientName}` : ""})` : ""}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="pl-consultantName" label="Consultant" error={errors.consultantName}>
            <input {...input("consultantName")} autoComplete="off" />
          </Field>
          <Field id="pl-consultantEmail" label="Consultant's portal email" hint="Links the placement to their account." error={errors.consultantEmail}>
            <input {...input("consultantEmail")} type="email" inputMode="email" autoComplete="off" />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="pl-role" label="Role" error={errors.role}>
            <input {...input("role")} />
          </Field>
          <Field id="pl-endClientName" label="End client (optional)" hint="Leave empty to use the client's." error={errors.endClientName}>
            <input {...input("endClientName")} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field id="pl-billRate" label="Bill rate ($/h)" hint="Charged to the client." error={errors.billRate}>
            <input {...input("billRate")} type="number" inputMode="decimal" min="0" step="0.01" />
          </Field>
          <Field id="pl-payRate" label="Pay rate ($/h)" hint="Paid to the consultant." error={errors.payRate}>
            <input {...input("payRate")} type="number" inputMode="decimal" min="0" step="0.01" />
          </Field>
        </div>
        {margin !== null && (
          <p className={`text-sm ${margin < 0 ? "font-semibold text-[var(--dash-red-ink)]" : "text-[var(--dash-muted)]"}`}>
            Margin: {usd(margin)} per hour{margin < 0 ? ". The bill rate is below the pay rate; check both." : "."}
          </p>
        )}
        <div className="grid grid-cols-2 gap-4">
          <Field id="pl-startDate" label="Start date" error={errors.startDate}>
            <input {...input("startDate")} type="date" />
          </Field>
          <Field id="pl-endDate" label="Contract end" error={errors.endDate}>
            <input {...input("endDate")} type="date" />
          </Field>
        </div>
        <Field id="pl-extensionStatus" label="Extension status" error={errors.extensionStatus}>
          <select {...input("extensionStatus")}>
            {(Object.keys(STATUS) as ExtensionStatus[]).map((s) => (
              <option key={s} value={s}>
                {STATUS[s].label}
              </option>
            ))}
          </select>
        </Field>
      </form>
    </Panel>
  );
}
