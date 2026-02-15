"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "../_lib/session-context";
import { useToast } from "../_lib/toast-context";

type Task = {
  id: string;
  rep_company_user_id: string;
  rep_name: string;
  title: string;
  description: string | null;
  status: "pending" | "completed" | "cancelled";
  due_at: string | null;
  completed_at: string | null;
  lead_id: string | null;
  shop_id: string | null;
  created_at: string;
  updated_at: string;
};

type Staff = { company_user_id: string; full_name: string; role: string; status: string };
type Shop = { id: string; name: string };
type Lead = { id: string; name: string };

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  completed: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  cancelled: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
};

const inputClass =
  "w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition-colors focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-500";
const selectClass =
  "w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-500";

function formatDate(s: string | null): string {
  if (!s) return "—";
  const d = new Date(s);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toISODateTimeLocal(s: string | null): string {
  if (!s) return "";
  const d = new Date(s);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function TasksPage() {
  const session = useSession();
  const toast = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterRep, setFilterRep] = useState("");

  const canAssign = session.user.role === "boss" || session.user.role === "manager";
  const reps = useMemo(
    () => staff.filter((s) => s.role === "rep" && s.status === "active"),
    [staff]
  );

  async function loadTasks() {
    const params = new URLSearchParams();
    if (filterStatus) params.set("status", filterStatus);
    if (filterRep && canAssign) params.set("rep", filterRep);
    const res = await fetch(`/api/manager/tasks?${params}`);
    const data = (await res.json()) as { ok: boolean; tasks?: Task[]; error?: string };
    if (res.ok && data.ok) setTasks(data.tasks ?? []);
    else toast.error(data.error ?? "Failed to load tasks");
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const tasksRes = await fetch("/api/manager/tasks");
      const tasksData = (await tasksRes.json()) as { ok: boolean; tasks?: Task[]; error?: string };
      if (cancelled) return;
      if (tasksRes.ok && tasksData.ok) setTasks(tasksData.tasks ?? []);

      const [shopsRes, leadsRes] = await Promise.all([
        fetch("/api/manager/shops"),
        fetch("/api/manager/leads"),
      ]);
      const shopsData = (await shopsRes.json()) as { ok: boolean; shops?: Shop[] };
      const leadsData = (await leadsRes.json()) as { ok: boolean; leads?: Lead[] };
      if (cancelled) return;
      setShops(shopsData.shops ?? []);
      setLeads(leadsData.leads ?? []);

      if (canAssign) {
        const staffRes = await fetch("/api/manager/staff");
        const staffData = (await staffRes.json()) as { ok: boolean; staff?: Staff[] };
        if (cancelled) return;
        setStaff(staffData.staff ?? []);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [canAssign]);

  useEffect(() => {
    if (!loading) loadTasks();
  }, [filterStatus, filterRep]);

  async function onCreate(payload: {
    repCompanyUserId: string;
    title: string;
    description?: string;
    dueAt?: string;
    leadId?: string;
    shopId?: string;
  }) {
    setWorking(true);
    const body: Record<string, unknown> = {
      repCompanyUserId: payload.repCompanyUserId,
      title: payload.title,
      description: payload.description || undefined,
      leadId: payload.leadId || undefined,
      shopId: payload.shopId || undefined,
    };
    if (payload.dueAt) {
      body.dueAt = new Date(payload.dueAt).toISOString();
    }
    const res = await fetch("/api/manager/tasks", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json()) as { ok: boolean; error?: string };
    setWorking(false);
    if (!res.ok || !data.ok) {
      toast.error(data.error ?? "Could not create task");
      return;
    }
    toast.success("Task assigned.");
    setAddModalOpen(false);
    await loadTasks();
  }

  async function onUpdate(taskId: string, payload: { status?: string; dueAt?: string | null; title?: string; description?: string | null }) {
    setWorking(true);
    const body: Record<string, unknown> = {};
    if (payload.status !== undefined) body.status = payload.status;
    if (payload.title !== undefined) body.title = payload.title;
    if (payload.description !== undefined) body.description = payload.description;
    if (payload.dueAt !== undefined) {
      body.dueAt = payload.dueAt ? new Date(payload.dueAt).toISOString() : null;
    }
    const res = await fetch(`/api/manager/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json()) as { ok: boolean; error?: string };
    setWorking(false);
    if (!res.ok || !data.ok) {
      toast.error(data.error ?? "Could not update task");
      return;
    }
    toast.success("Task updated.");
    setEditingTask(null);
    await loadTasks();
  }

  const shopNames = useMemo(() => {
    const m = new Map<string, string>();
    shops.forEach((s) => m.set(s.id, s.name));
    return m;
  }, [shops]);
  const leadNames = useMemo(() => {
    const m = new Map<string, string>();
    leads.forEach((l) => m.set(l.id, l.name));
    return m;
  }, [leads]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Tasks</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {canAssign ? "Assign and track tasks for your reps." : "View and manage your assigned tasks."}
          </p>
        </div>
        {canAssign && (
          <button
            type="button"
            onClick={() => setAddModalOpen(true)}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            + Assign Task
          </button>
        )}
      </div>

      {addModalOpen && canAssign && (
        <AssignTaskModal
          reps={reps}
          shops={shops}
          leads={leads}
          working={working}
          onClose={() => setAddModalOpen(false)}
          onSubmit={onCreate}
        />
      )}

      {editingTask && (
        <EditTaskModal
          task={editingTask}
          working={working}
          onClose={() => setEditingTask(null)}
          onSave={(payload) => onUpdate(editingTask.id, payload)}
        />
      )}

      {canAssign && (
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={selectClass}
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            value={filterRep}
            onChange={(e) => setFilterRep(e.target.value)}
            className={selectClass}
          >
            <option value="">All reps</option>
            {reps.map((r) => (
              <option key={r.company_user_id} value={r.company_user_id}>
                {r.full_name}
              </option>
            ))}
          </select>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-zinc-200/60 dark:bg-zinc-800/60" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <th className="px-5 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Task</th>
                {canAssign && (
                  <th className="px-5 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Assigned to</th>
                )}
                <th className="px-5 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Due</th>
                <th className="px-5 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Link</th>
                <th className="px-5 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {tasks.map((t) => (
                <tr key={t.id} className="border-b border-zinc-100 last:border-0 dark:border-zinc-800/60">
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">{t.title}</p>
                    {t.description && (
                      <p className="mt-0.5 line-clamp-2 text-xs text-zinc-500 dark:text-zinc-400">{t.description}</p>
                    )}
                  </td>
                  {canAssign && (
                    <td className="px-5 py-3.5 text-zinc-600 dark:text-zinc-400">{t.rep_name}</td>
                  )}
                  <td className="px-5 py-3.5 text-zinc-600 dark:text-zinc-400">{formatDate(t.due_at)}</td>
                  <td className="px-5 py-3.5 text-zinc-600 dark:text-zinc-400">
                    {t.shop_id && shopNames.get(t.shop_id) ? (
                      <span title={t.shop_id}>{shopNames.get(t.shop_id)}</span>
                    ) : t.lead_id && leadNames.get(t.lead_id) ? (
                      <span title={t.lead_id}>{leadNames.get(t.lead_id)}</span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_COLORS[t.status] ?? ""}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      {t.status === "pending" && (
                        <button
                          type="button"
                          onClick={() => onUpdate(t.id, { status: "completed" })}
                          disabled={working}
                          className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-50 dark:border-emerald-800/50 dark:bg-emerald-900/20 dark:text-emerald-300 dark:hover:bg-emerald-900/30"
                        >
                          Complete
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setEditingTask(t)}
                        disabled={working}
                        className="rounded-md border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                      >
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!tasks.length && (
            <div className="px-5 py-10 text-center text-sm text-zinc-400">
              {canAssign
                ? "No tasks yet. Click \"+ Assign Task\" to create one."
                : "No tasks assigned to you."}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ModalShell(props: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 p-4"
      onClick={props.onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="modal-title" className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          {props.title}
        </h2>
        {props.children}
      </div>
    </div>
  );
}

function AssignTaskModal(props: {
  reps: Staff[];
  shops: Shop[];
  leads: Lead[];
  working: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    repCompanyUserId: string;
    title: string;
    description?: string;
    dueAt?: string;
    leadId?: string;
    shopId?: string;
  }) => Promise<void>;
}) {
  const [repId, setRepId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [leadId, setLeadId] = useState("");
  const [shopId, setShopId] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!repId || !title.trim()) {
      return;
    }
    await props.onSubmit({
      repCompanyUserId: repId,
      title: title.trim(),
      description: description.trim() || undefined,
      dueAt: dueAt || undefined,
      leadId: leadId || undefined,
      shopId: shopId || undefined,
    });
    setRepId("");
    setTitle("");
    setDescription("");
    setDueAt("");
    setLeadId("");
    setShopId("");
  }

  return (
    <ModalShell title="Assign Task" onClose={props.onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Assign to rep <span className="text-red-500">*</span>
          </label>
          <select
            required
            value={repId}
            onChange={(e) => setRepId(e.target.value)}
            className={selectClass}
          >
            <option value="">Select rep</option>
            {props.reps.map((r) => (
              <option key={r.company_user_id} value={r.company_user_id}>
                {r.full_name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputClass}
            placeholder="e.g. Follow up with ABC Store"
            maxLength={200}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className={inputClass}
            placeholder="Optional details"
            maxLength={2000}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Due date</label>
          <input
            type="datetime-local"
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Link to shop</label>
            <select value={shopId} onChange={(e) => setShopId(e.target.value)} className={selectClass}>
              <option value="">Optional</option>
              {props.shops.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Link to lead</label>
            <select value={leadId} onChange={(e) => setLeadId(e.target.value)} className={selectClass}>
              <option value="">Optional</option>
              {props.leads.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={props.onClose}
            className="rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={props.working}
            className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {props.working ? "Assigning…" : "Assign Task"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function EditTaskModal(props: {
  task: Task;
  working: boolean;
  onClose: () => void;
  onSave: (payload: { status?: string; dueAt?: string | null; title?: string; description?: string | null }) => Promise<void>;
}) {
  const t = props.task;
  const [title, setTitle] = useState(t.title);
  const [description, setDescription] = useState(t.description ?? "");
  const [dueAt, setDueAt] = useState(toISODateTimeLocal(t.due_at));
  const [status, setStatus] = useState(t.status);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await props.onSave({
      title: title.trim(),
      description: description || null,
      dueAt: dueAt ? new Date(dueAt).toISOString() : null,
      status,
    });
  }

  return (
    <ModalShell title="Edit Task" onClose={props.onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Title</label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputClass}
            maxLength={200}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className={inputClass}
            maxLength={2000}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Due date</label>
          <input
            type="datetime-local"
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as Task["status"])} className={selectClass}>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={props.onClose}
            className="rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={props.working}
            className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {props.working ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
