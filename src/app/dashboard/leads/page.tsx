"use client";

import { useEffect, useState } from "react";

type Lead = {
  id: string;
  name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  status: "new" | "contacted" | "qualified" | "converted" | "lost";
  notes: string | null;
  converted_at: string | null;
  created_at: string;
  updated_at: string;
  shop_name: string | null;
  assigned_rep_name: string | null;
};

type Shop = { id: string; name: string };
type Staff = { company_user_id: string; full_name: string; role: string };

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  contacted: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  qualified: "bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  converted: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  lost: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
};

const NEXT_STATUS: Record<string, string> = {
  new: "contacted",
  contacted: "qualified",
  qualified: "converted",
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [reps, setReps] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");

  async function loadLeads(status = filterStatus, q = search) {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (q) params.set("q", q);
    const res = await fetch(`/api/manager/leads?${params}`);
    const data = (await res.json()) as { ok: boolean; leads?: Lead[]; error?: string };
    if (res.ok && data.ok) setLeads(data.leads ?? []);
    else setError(data.error ?? "Failed to load leads");
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [leadsRes, shopsRes, staffRes] = await Promise.all([
        fetch("/api/manager/leads"),
        fetch("/api/manager/shops"),
        fetch("/api/manager/staff"),
      ]);
      const leadsData = (await leadsRes.json()) as { ok: boolean; leads?: Lead[] };
      const shopsData = (await shopsRes.json()) as { shops?: Shop[] };
      const staffData = (await staffRes.json()) as { ok: boolean; staff?: Staff[] };
      if (cancelled) return;
      if (leadsRes.ok && leadsData.ok) setLeads(leadsData.leads ?? []);
      setShops(shopsData.shops ?? []);
      setReps((staffData.staff ?? []).filter((s) => s.role === "rep"));
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  async function onCreate(payload: {
    shopId?: string;
    name: string;
    contactName?: string;
    phone?: string;
    email?: string;
    address?: string;
    assignedRepCompanyUserId?: string;
    notes?: string;
  }) {
    setWorking(true);
    setError(null);
    const res = await fetch("/api/manager/leads", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as { ok: boolean; error?: string };
    setWorking(false);
    if (!res.ok || !data.ok) { setError(data.error ?? "Could not create lead"); return; }
    setShowForm(false);
    await loadLeads();
  }

  async function onUpdate(leadId: string, payload: Record<string, unknown>) {
    setWorking(true);
    setError(null);
    const res = await fetch(`/api/manager/leads/${leadId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as { ok: boolean; error?: string };
    setWorking(false);
    if (!res.ok || !data.ok) { setError(data.error ?? "Could not update lead"); return; }
    setEditingId(null);
    await loadLeads();
  }

  async function onDelete(leadId: string) {
    if (!confirm("Delete this lead? This cannot be undone.")) return;
    setWorking(true);
    setError(null);
    const res = await fetch(`/api/manager/leads/${leadId}`, { method: "DELETE" });
    const data = (await res.json()) as { ok: boolean; error?: string };
    setWorking(false);
    if (!res.ok || !data.ok) { setError(data.error ?? "Could not delete lead"); return; }
    await loadLeads();
  }

  async function onStatusChange(leadId: string, newStatus: string) {
    await onUpdate(leadId, { status: newStatus });
  }

  function handleFilter(status: string) {
    setFilterStatus(status);
    loadLeads(status, search);
  }

  function handleSearch(q: string) {
    setSearch(q);
    loadLeads(filterStatus, q);
  }

  const selectClass = "rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100";

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Leads</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Track and manage sales leads from the field.
          </p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setEditingId(null); }}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {showForm ? "Cancel" : "+ New Lead"}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800/40 dark:bg-red-900/20 dark:text-red-400">
          {error}
          <button onClick={() => setError(null)} className="ml-2 font-medium underline">dismiss</button>
        </div>
      )}

      {showForm && (
        <div className="mb-6 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-100">New Lead</h2>
          <CreateLeadForm shops={shops} reps={reps} disabled={working} onSubmit={onCreate} />
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select value={filterStatus} onChange={(e) => handleFilter(e.target.value)} className={selectClass}>
          <option value="">All statuses</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="qualified">Qualified</option>
          <option value="converted">Converted</option>
          <option value="lost">Lost</option>
        </select>
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search by name, contact, or phone…"
          className="max-w-xs rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-sm text-zinc-900 outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-zinc-200/60 dark:bg-zinc-800/60" />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <th className="px-5 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Name</th>
                <th className="px-5 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Contact</th>
                <th className="px-5 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Shop</th>
                <th className="px-5 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Assigned Rep</th>
                <th className="px-5 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.id} className="border-b border-zinc-100 last:border-0 dark:border-zinc-800/60">
                  {editingId === l.id ? (
                    <EditRow
                      lead={l}
                      shops={shops}
                      reps={reps}
                      disabled={working}
                      onSave={(payload) => onUpdate(l.id, payload)}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <>
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">{l.name}</p>
                        {l.contact_name && (
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">{l.contact_name}</p>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-zinc-600 dark:text-zinc-400">
                        {l.phone && <p className="text-xs">{l.phone}</p>}
                        {l.email && <p className="text-xs">{l.email}</p>}
                        {!l.phone && !l.email && <span className="text-xs">—</span>}
                      </td>
                      <td className="px-5 py-3.5 text-zinc-600 dark:text-zinc-400">{l.shop_name ?? "—"}</td>
                      <td className="px-5 py-3.5 text-zinc-600 dark:text-zinc-400">{l.assigned_rep_name ?? "—"}</td>
                      <td className="px-5 py-3.5">
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_COLORS[l.status] ?? ""}`}>
                          {l.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {NEXT_STATUS[l.status] && (
                            <button
                              onClick={() => onStatusChange(l.id, NEXT_STATUS[l.status])}
                              disabled={working}
                              className="rounded-md border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                            >
                              → {NEXT_STATUS[l.status]}
                            </button>
                          )}
                          <button
                            onClick={() => { setEditingId(l.id); setShowForm(false); }}
                            className="rounded-md border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => onDelete(l.id)}
                            disabled={working}
                            className="rounded-md border border-red-200 px-3 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-red-800/40 dark:text-red-400 dark:hover:bg-red-900/20"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {!leads.length && (
            <div className="px-5 py-10 text-center text-sm text-zinc-400">
              No leads yet. Click &quot;+ New Lead&quot; to create one.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Create lead form ── */

function CreateLeadForm(props: {
  shops: Shop[];
  reps: Staff[];
  disabled: boolean;
  onSubmit: (payload: {
    shopId?: string;
    name: string;
    contactName?: string;
    phone?: string;
    email?: string;
    address?: string;
    assignedRepCompanyUserId?: string;
    notes?: string;
  }) => Promise<void>;
}) {
  const [shopId, setShopId] = useState("");
  const [name, setName] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [assignedRepId, setAssignedRepId] = useState("");
  const [notes, setNotes] = useState("");

  const inputClass =
    "w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition-colors focus:border-zinc-400 focus:bg-white dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-500 dark:focus:bg-zinc-800";

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        await props.onSubmit({
          shopId: shopId || undefined,
          name,
          contactName: contactName || undefined,
          phone: phone || undefined,
          email: email || undefined,
          address: address || undefined,
          assignedRepCompanyUserId: assignedRepId || undefined,
          notes: notes || undefined,
        });
        setShopId("");
        setName("");
        setContactName("");
        setPhone("");
        setEmail("");
        setAddress("");
        setAssignedRepId("");
        setNotes("");
      }}
      className="grid gap-4 sm:grid-cols-2"
    >
      <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Lead name" className={inputClass} />
      <input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Contact name (optional)" className={inputClass} />
      <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone (optional)" className={inputClass} />
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (optional)" className={inputClass} />
      <select value={shopId} onChange={(e) => setShopId(e.target.value)} className={inputClass}>
        <option value="">Select shop (optional)</option>
        {props.shops.map((s) => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>
      <select value={assignedRepId} onChange={(e) => setAssignedRepId(e.target.value)} className={inputClass}>
        <option value="">Assign to rep (optional)</option>
        {props.reps.map((r) => (
          <option key={r.company_user_id} value={r.company_user_id}>{r.full_name}</option>
        ))}
      </select>
      <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address (optional)" className={`${inputClass} sm:col-span-2`} />
      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (optional)" rows={3} className={`${inputClass} sm:col-span-2`} />
      <div className="flex items-end sm:col-span-2">
        <button
          disabled={props.disabled}
          type="submit"
          className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Create Lead
        </button>
      </div>
    </form>
  );
}

/* ── Edit row ── */

function EditRow(props: {
  lead: Lead;
  shops: Shop[];
  reps: Staff[];
  disabled: boolean;
  onSave: (payload: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
}) {
  const { lead: l } = props;
  const [name, setName] = useState(l.name);
  const [contactName, setContactName] = useState(l.contact_name ?? "");
  const [phone, setPhone] = useState(l.phone ?? "");
  const [email, setEmail] = useState(l.email ?? "");
  const [address, setAddress] = useState(l.address ?? "");
  const [status, setStatus] = useState(l.status);
  const [shopId, setShopId] = useState(l.shop_name ? props.shops.find((s) => s.name === l.shop_name)?.id ?? "" : "");
  const [assignedRepId, setAssignedRepId] = useState(
    l.assigned_rep_name ? props.reps.find((r) => r.full_name === l.assigned_rep_name)?.company_user_id ?? "" : ""
  );
  const [notes, setNotes] = useState(l.notes ?? "");

  const inputClass =
    "w-full rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100";

  return (
    <>
      <td className="px-5 py-2.5" colSpan={6}>
        <div className="grid grid-cols-2 gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className={inputClass} />
          <input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Contact name" className={inputClass} />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" className={inputClass} />
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className={inputClass} />
          <select value={shopId} onChange={(e) => setShopId(e.target.value)} className={inputClass}>
            <option value="">No shop</option>
            {props.shops.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <select value={assignedRepId} onChange={(e) => setAssignedRepId(e.target.value)} className={inputClass}>
            <option value="">No rep</option>
            {props.reps.map((r) => (
              <option key={r.company_user_id} value={r.company_user_id}>{r.full_name}</option>
            ))}
          </select>
          <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address" className={inputClass} />
          <select value={status} onChange={(e) => setStatus(e.target.value as Lead["status"])} className={inputClass}>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="converted">Converted</option>
            <option value="lost">Lost</option>
          </select>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes" rows={2} className={`${inputClass} col-span-2`} />
          <div className="col-span-2 flex items-center justify-end gap-2">
            <button
              onClick={() => props.onSave({ name, contactName: contactName || null, phone: phone || null, email: email || null, address: address || null, shopId: shopId || null, assignedRepCompanyUserId: assignedRepId || null, status, notes: notes || null })}
              disabled={props.disabled}
              className="rounded-md bg-zinc-900 px-3 py-1 text-xs font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
            >
              Save
            </button>
            <button
              onClick={props.onCancel}
              className="rounded-md border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"
            >
              Cancel
            </button>
          </div>
        </div>
      </td>
    </>
  );
}

