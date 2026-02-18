"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { useSession } from "../_lib/session-context";
import { useToast } from "../_lib/toast-context";
import type { Task, TaskListResponse, Shop, ShopListResponse, Lead, LeadListResponse, Staff, StaffListResponse } from "../_lib/types";
import Link from "next/link";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  completed: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  overdue: "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
};

export default function TasksPage() {
  const session = useSession();
  const toast = useToast();
  const [tab, setTab] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [working, setWorking] = useState(false);
  const [repFilter, setRepFilter] = useState<string>("all");

  const { data: tasksData, mutate } = useSWR<TaskListResponse>("/api/manager/tasks", fetcher);
  const { data: shopsData } = useSWR<ShopListResponse>("/api/manager/shops", fetcher);
  const { data: leadsData } = useSWR<LeadListResponse>("/api/manager/leads", fetcher);
  const { data: staffData } = useSWR<StaffListResponse>("/api/manager/staff", fetcher);

  const tasks = tasksData?.tasks ?? [];
  const shops = shopsData?.shops ?? [];
  const leads = leadsData?.leads ?? [];
  const reps = staffData?.staff?.filter(s => s.role === "rep") ?? [];

  const filteredTasks = useMemo(() => {
    return tasks.filter((t: Task) => {
      const matchSearch = t.title.toLowerCase().includes(search.toLowerCase()) || 
                          t.description.toLowerCase().includes(search.toLowerCase());
      const matchTab = tab === "all" || t.status === tab;
      const matchRep = repFilter === "all" || t.rep_company_user_id === repFilter;
      return matchSearch && matchTab && matchRep;
    });
  }, [tasks, search, tab, repFilter]);

  const stats = useMemo(() => ({
    total: tasks.length,
    pending: tasks.filter((t: Task) => t.status === "pending").length,
    completed: tasks.filter((t: Task) => t.status === "completed").length,
  }), [tasks]);

  async function handleSave(payload: any) {
    setWorking(true);
    const url = editingTask ? `/api/manager/tasks/${editingTask.id}` : "/api/manager/tasks";
    const method = editingTask ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setWorking(false);
    if (data.ok) {
        toast.success(editingTask ? "Directive updated." : "New directive deployed.");
        setShowModal(false);
        setEditingTask(null);
        mutate();
    } else {
        toast.error(data.error || "Deployment failed");
    }
  }

  async function onMarkComplete(t: Task) {
    const res = await fetch(`/api/manager/tasks/${t.id}/complete`, { method: "POST" });
    const data = await res.json();
    if (data.ok) {
        toast.success("Directive completed.");
        mutate();
    } else {
        toast.error(data.error || "Update failed");
    }
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#f4a261]">
            <Link href="/dashboard" className="hover:underline">CONSOLE</Link>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="9 18 15 12 9 6"/></svg>
            <span className="text-zinc-300">FIELD DIRECTIVES</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">Task Management</h1>
        </div>
        <button 
          onClick={() => { setEditingTask(null); setShowModal(true); }}
          className="flex h-14 items-center gap-2 rounded-2xl bg-[#f4a261] px-8 text-[11px] font-black uppercase tracking-widest text-white shadow-lg shadow-orange-500/20 transition-all hover:brightness-110"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Deploy Directive
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <StatCardSmall label="Open Directives" value={stats.pending} icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>} />
        <StatCardSmall label="Resolved Today" value={stats.completed} icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>} />
        <StatCardSmall label="Directives Total" value={stats.total} icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>} />
      </div>

      <div className="rounded-[40px] border border-zinc-100 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
           <div className="flex items-center gap-1 rounded-2xl bg-zinc-50 p-1 dark:bg-zinc-800/60">
              {["all", "pending", "completed", "overdue"].map(t => (
                <button 
                  key={t}
                  onClick={() => setTab(t)}
                  className={`rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${tab === t ? "bg-white text-[#f4a261] shadow-sm dark:bg-zinc-700" : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"}`}
                >
                  {t}
                </button>
              ))}
           </div>
           
           <div className="flex items-center gap-3">
               <select 
                 value={repFilter} 
                 onChange={e => setRepFilter(e.target.value)}
                 className="h-11 rounded-xl border border-zinc-50 bg-zinc-50/50 px-4 text-[11px] font-bold text-zinc-500 outline-none transition-all focus:border-zinc-200 dark:border-zinc-800 dark:bg-zinc-800/40"
               >
                  <option value="all">All Agents</option>
                  {reps.map(r => <option key={r.company_user_id} value={r.company_user_id}>{r.full_name}</option>)}
               </select>
               <div className="relative">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  <input 
                    type="text" 
                    placeholder="Search directives..." 
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="h-11 w-full rounded-xl border border-zinc-50 bg-zinc-50/50 pl-11 pr-4 text-[11px] font-bold outline-none transition-all focus:border-zinc-200 dark:border-zinc-800 dark:bg-zinc-800/40 md:w-64"
                  />
               </div>
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-50 dark:border-zinc-800/60">
                <th className="pb-5 text-[10px] font-black uppercase tracking-widest text-zinc-400">Directive Title</th>
                <th className="pb-5 text-[10px] font-black uppercase tracking-widest text-zinc-400">Assigned Agent</th>
                <th className="pb-5 text-[10px] font-black uppercase tracking-widest text-zinc-400">Linked Asset</th>
                <th className="pb-5 text-[10px] font-black uppercase tracking-widest text-zinc-400">Directive Status</th>
                <th className="pb-5 text-right text-[10px] font-black uppercase tracking-widest text-zinc-400">Deployment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/40">
              {filteredTasks.map((t) => (
                <tr key={t.id} className="group hover:bg-zinc-50/30 dark:hover:bg-zinc-800/20">
                  <td className="py-6">
                    <div className="max-w-xs">
                      <p className="text-[13px] font-black text-zinc-900 dark:text-zinc-100">{t.title}</p>
                      <p className="mt-0.5 truncate text-[11px] font-medium text-zinc-400">{t.description}</p>
                    </div>
                  </td>
                  <td className="py-6">
                    <p className="text-[12px] font-bold text-zinc-700 dark:text-zinc-300">{t.rep_name || "Unassigned"}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mt-0.5">Role: Field Agent</p>
                  </td>
                  <td className="py-6">
                    <p className="text-[12px] font-black text-zinc-900 dark:text-zinc-100">{t.shop_name || t.lead_name || "Global"}</p>
                    <p className="text-[10px] font-bold text-[#f4a261] uppercase tracking-widest mt-0.5">{t.shop_name ? "Shop Asset" : t.lead_name ? "Prospect" : "General"}</p>
                  </td>
                  <td className="py-6">
                    <span className={`inline-flex rounded-full px-3 py-1.5 text-[9px] font-black uppercase tracking-widest ${STATUS_COLORS[t.status] || "bg-zinc-100 text-zinc-600"}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="py-6 text-right">
                    <div className="flex items-center justify-end gap-3">
                        {t.status === "pending" && (
                            <button 
                                onClick={() => onMarkComplete(t)}
                                className="text-[10px] font-black uppercase tracking-widest text-[#f4a261] hover:underline"
                            >
                                Resolve
                            </button>
                        )}
                        <button 
                            onClick={() => { setEditingTask(t); setShowModal(true); }}
                            className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                        >
                            Modify
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <TaskModal 
            task={editingTask} 
            shops={shops} 
            leads={leads} 
            reps={reps} 
            working={working}
            onClose={() => { setShowModal(false); setEditingTask(null); }}
            onSubmit={handleSave}
        />
      )}
    </div>
  );
}

function StatCardSmall({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between rounded-3xl border border-zinc-100 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{label}</p>
                <p className="mt-1 text-2xl font-black text-zinc-900 dark:text-zinc-100">{value}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-[#f4a261] dark:bg-orange-900/20">
                {icon}
            </div>
        </div>
    );
}

function TaskModal({ task, shops, leads, reps, working, onClose, onSubmit }: { 
    task?: Task | null; 
    shops: Shop[]; 
    leads: Lead[]; 
    reps: Staff[]; 
    working: boolean; 
    onClose: () => void; 
    onSubmit: (payload: any) => Promise<void>; 
}) {
    const [formData, setFormData] = useState({
        title: task?.title || "",
        description: task?.description || "",
        repCompanyUserId: task?.rep_company_user_id || "",
        shopId: task?.shop_id || "",
        leadId: task?.lead_id || "",
        deadline: task?.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : "",
        status: task?.status || "pending"
    });

    const inputClass = "w-full rounded-xl border border-zinc-100 bg-zinc-50/50 px-4 py-3 text-[13px] font-medium text-zinc-900 outline-none transition-all focus:border-zinc-200 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-100";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/20 p-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl overflow-hidden rounded-[40px] border border-zinc-100 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center justify-between border-b border-zinc-50 px-10 py-8 dark:border-zinc-800">
                    <div>
                        <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100">{task ? "Modify Field Directive" : "Deploy Directive"}</h3>
                        <p className="text-xs font-medium text-zinc-400 uppercase tracking-widest mt-1">Deployment ID #{task?.id.slice(0, 8) || "NEW"}</p>
                    </div>
                    <button onClick={onClose} className="rounded-xl border border-zinc-100 p-2 text-zinc-400 hover:bg-zinc-50 dark:border-zinc-800">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                </div>
                
                <form onSubmit={e => { e.preventDefault(); onSubmit(formData); }} className="p-10">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className="col-span-2 space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Directive Header</label>
                            <input required className={inputClass} placeholder="Deployment Title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                        </div>
                        <div className="col-span-2 space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Mission Description</label>
                            <textarea required className={`${inputClass} h-32 resize-none`} placeholder="Deployment Context and Requirements..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                        </div>
                        
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Deployed Agent</label>
                            <select required className={inputClass} value={formData.repCompanyUserId} onChange={e => setFormData({...formData, repCompanyUserId: e.target.value})}>
                                <option value="">Select Agent</option>
                                {reps.map(r => <option key={r.company_user_id} value={r.company_user_id}>{r.full_name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Deployment Window</label>
                            <input required type="datetime-local" className={inputClass} value={formData.deadline} onChange={e => setFormData({...formData, deadline: e.target.value})} />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Shop Asset Link (Optional)</label>
                            <select className={inputClass} value={formData.shopId} onChange={e => { setFormData({...formData, shopId: e.target.value, leadId: ""}); }}>
                                <option value="">No Shop Asset</option>
                                {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Prospect Link (Optional)</label>
                            <select className={inputClass} value={formData.leadId} onChange={e => { setFormData({...formData, leadId: e.target.value, shopId: ""}); }}>
                                <option value="">No Prospect</option>
                                {leads.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="mt-10 flex gap-4">
                        <button type="button" onClick={onClose} className="h-14 flex-1 rounded-2xl border border-zinc-100 text-[11px] font-black uppercase tracking-widest text-zinc-400 hover:bg-zinc-50 dark:border-zinc-800">Cancel</button>
                        <button disabled={working} className="h-14 flex-1 rounded-2xl bg-[#f4a261] text-[11px] font-black uppercase tracking-widest text-white shadow-xl shadow-orange-500/20">
                            {working ? "Deploying..." : task ? "Update Directive" : "Launch Mission"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
