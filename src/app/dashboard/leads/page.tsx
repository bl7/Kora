"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { useSession } from "../_lib/session-context";
import { useToast } from "../_lib/toast-context";
import type { Lead, LeadListResponse, Shop, ShopListResponse, Staff, StaffListResponse } from "../_lib/types";
import Link from "next/link";

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  contacted: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  qualified: "bg-[#f4a261]/10 text-[#f4a261] dark:bg-[#f4a261]/20",
  converted: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  lost: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
};

export default function LeadsPage() {
  const session = useSession();
  const toast = useToast();
  const [tab, setTab] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [working, setWorking] = useState(false);

  const { data: leadsData, mutate } = useSWR<LeadListResponse>("/api/manager/leads", fetcher);
  const { data: shopsData } = useSWR<ShopListResponse>("/api/manager/shops", fetcher);
  const { data: staffData } = useSWR<StaffListResponse>("/api/manager/staff", fetcher);

  const leads = leadsData?.leads ?? [];
  const shops = shopsData?.shops ?? [];
  const reps = staffData?.staff ?? [];

  const filteredLeads = useMemo(() => {
    return leads.filter((l: Lead) => {
      const matchSearch = l.name.toLowerCase().includes(search.toLowerCase()) || 
                          l.contact_name.toLowerCase().includes(search.toLowerCase());
      const matchTab = tab === "all" || l.status === tab;
      return matchSearch && matchTab;
    });
  }, [leads, search, tab]);

  const stats = useMemo(() => ({
    total: leads.length,
    new: leads.filter((l: Lead) => l.status === "new").length,
    converted: leads.filter((l: Lead) => l.status === "converted").length,
  }), [leads]);

  async function handleSave(payload: any) {
    setWorking(true);
    const url = editingLead ? `/api/manager/leads/${editingLead.id}` : "/api/manager/leads";
    const method = editingLead ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setWorking(false);
    if (data.ok) {
        toast.success(editingLead ? "Lead updated successfully." : "New lead registered.");
        setShowModal(false);
        setEditingLead(null);
        mutate();
    } else {
        toast.error(data.error || "Operation failed");
    }
  }

  async function onConvertToShop(l: Lead) {
    if (!confirm(`Convert ${l.name} into a permanent Marketplace Shop?`)) return;
    const res = await fetch(`/api/manager/leads/${l.id}/convert-to-shop`, { method: "POST" });
    const data = await res.json();
    if (data.ok) {
        toast.success("Conversion successful.");
        mutate();
    } else {
        toast.error(data.error || "Conversion failed");
    }
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">Leads Tracking</h1>
        <button 
          onClick={() => { setEditingLead(null); setShowModal(true); }}
          className="flex h-14 items-center gap-2 rounded-2xl bg-[#f4a261] px-8 text-[11px] font-black uppercase tracking-widest text-white shadow-lg shadow-orange-500/20 transition-all hover:brightness-110"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Register New Lead
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <StatCardSmall label="Pipeline Total" value={stats.total} icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>} />
        <StatCardSmall label="Fresh Prospects" value={stats.new} icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>} />
        <StatCardSmall label="Total Conversions" value={stats.converted} icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>} />
      </div>

      <div className="rounded-[40px] border border-zinc-100 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
           <div className="flex items-center gap-1 rounded-2xl bg-zinc-50 p-1 dark:bg-zinc-800/60">
              {["all", "new", "contacted", "qualified", "converted", "lost"].map(t => (
                <button 
                  key={t}
                  onClick={() => setTab(t)}
                  className={`rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${tab === t ? "bg-white text-[#f4a261] shadow-sm dark:bg-zinc-700" : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"}`}
                >
                  {t}
                </button>
              ))}
           </div>
           <div className="relative">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input 
                type="text" 
                placeholder="Search leads..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="h-11 w-full rounded-xl border border-zinc-50 bg-zinc-50/50 pl-11 pr-4 text-[11px] font-bold outline-none transition-all focus:border-zinc-200 dark:border-zinc-800 dark:bg-zinc-800/40 md:w-64"
              />
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-50 dark:border-zinc-800/60">
                <th className="pb-5 text-[10px] font-black uppercase tracking-widest text-zinc-400">LEAD NAME</th>
                <th className="pb-5 text-[10px] font-black uppercase tracking-widest text-zinc-400">CONTACT</th>
                <th className="pb-5 text-[10px] font-black uppercase tracking-widest text-zinc-400">STATUS</th>
                <th className="pb-5 text-[10px] font-black uppercase tracking-widest text-zinc-400">ASSIGNED SHOP</th>
                <th className="pb-5 text-right text-[10px] font-black uppercase tracking-widest text-zinc-400">OPTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/40">
              {filteredLeads.map((l) => (
                <tr key={l.id} className="group hover:bg-zinc-50/30 dark:hover:bg-zinc-800/20">
                  <td className="py-6">
                    <div>
                      <p className="text-[13px] font-black text-zinc-900 dark:text-zinc-100">{l.name}</p>
                      <p className="text-[11px] font-medium text-zinc-400">{l.contact_name}</p>
                    </div>
                  </td>
                  <td className="py-6">
                    <p className="text-[12px] font-bold text-zinc-700 dark:text-zinc-300">{l.phone}</p>
                    <p className="text-[11px] text-zinc-400">{l.email}</p>
                  </td>
                  <td className="py-6">
                    <span className={`inline-flex rounded-full px-3 py-1.5 text-[9px] font-black uppercase tracking-widest ${STATUS_COLORS[l.status] || "bg-zinc-100 text-zinc-600"}`}>
                      {l.status}
                    </span>
                  </td>
                  <td className="py-6">
                    <p className="text-[12px] font-black text-zinc-900 dark:text-zinc-100">{l.assigned_rep_name || "Unassigned"}</p>
                    <p className="text-[11px] font-medium text-zinc-400">{l.shop_name || "No Hub"}</p>
                  </td>
                  <td className="py-6 text-right">
                    <div className="flex items-center justify-end gap-3">
                        {l.status !== "converted" && (
                            <button 
                                onClick={() => onConvertToShop(l)}
                                className="text-[10px] font-black uppercase tracking-widest text-[#f4a261] hover:underline"
                            >
                                Convert
                            </button>
                        )}
                            <button 
                                onClick={() => { setEditingLead(l); setShowModal(true); }}
                                className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                            >
                                Edit
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
        <LeadModal 
            lead={editingLead} 
            shops={shops} 
            reps={reps} 
            working={working}
            onClose={() => { setShowModal(false); setEditingLead(null); }}
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

function LeadModal({ lead, shops, reps, working, onClose, onSubmit }: { 
    lead?: Lead | null; 
    shops: Shop[]; 
    reps: Staff[]; 
    working: boolean; 
    onClose: () => void; 
    onSubmit: (payload: any) => Promise<void>; 
}) {
    const [formData, setFormData] = useState({
        name: lead?.name || "",
        contactName: lead?.contact_name || "",
        phone: lead?.phone || "",
        email: lead?.email || "",
        address: lead?.address || "",
        status: lead?.status || "new",
        shopId: lead?.shop_id || "",
        assignedRepCompanyUserId: lead?.assigned_rep_company_user_id || "",
        notes: lead?.notes || ""
    });

    const inputClass = "w-full rounded-xl border border-zinc-100 bg-zinc-50/50 px-4 py-3 text-[13px] font-medium text-zinc-900 outline-none transition-all focus:border-zinc-200 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-100";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/20 p-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl overflow-hidden rounded-[40px] border border-zinc-100 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center justify-between border-b border-zinc-50 px-10 py-8 dark:border-zinc-800">
                    <div>
                        <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100">{lead ? "Edit Lead Details" : "Add New Lead"}</h3>
                        <p className="text-xs font-medium text-zinc-400 uppercase tracking-widest mt-1">Lead ID #{lead?.id.slice(0, 8) || "NEW"}</p>
                    </div>
                    <button onClick={onClose} className="rounded-xl border border-zinc-100 p-2 text-zinc-400 hover:bg-zinc-50 dark:border-zinc-800">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                </div>
                
                <form onSubmit={e => { e.preventDefault(); onSubmit(formData); }} className="max-h-[70vh] overflow-y-auto p-10">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Shop Name</label>
                            <input required className={inputClass} placeholder="Shop Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Contact Person</label>
                            <input required className={inputClass} placeholder="Full Name" value={formData.contactName} onChange={e => setFormData({...formData, contactName: e.target.value})} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Phone</label>
                            <input required className={inputClass} placeholder="+977" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Email</label>
                            <input required type="email" className={inputClass} placeholder="email@example.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                        </div>
                        <div className="col-span-2 space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Address</label>
                            <input required className={inputClass} placeholder="Full Address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                        </div>
                        
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Status</label>
                            <select className={inputClass} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                                {["new", "contacted", "qualified", "converted", "lost"].map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Parent Shop (Optional)</label>
                            <select className={inputClass} value={formData.shopId} onChange={e => setFormData({...formData, shopId: e.target.value})}>
                                <option value="">Independent</option>
                                {shops.map((s: Shop) => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Assigned Rep</label>
                            <select className={inputClass} value={formData.assignedRepCompanyUserId} onChange={e => setFormData({...formData, assignedRepCompanyUserId: e.target.value})}>
                                <option value="">Unassigned</option>
                                {reps.map((r: Staff) => <option key={r.company_user_id} value={r.company_user_id}>{r.full_name}</option>)}
                            </select>
                        </div>
                        <div className="col-span-2 space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Notes</label>
                            <textarea className={`${inputClass} h-32 resize-none`} placeholder="Field findings and prospect context..." value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
                        </div>
                    </div>

                    <div className="mt-10 flex gap-4">
                        <button type="button" onClick={onClose} className="h-14 flex-1 rounded-2xl border border-zinc-100 text-[11px] font-black uppercase tracking-widest text-zinc-400 hover:bg-zinc-50 dark:border-zinc-800">Discard</button>
                         <button disabled={working} className="h-14 flex-1 rounded-2xl bg-[#f4a261] text-[11px] font-black uppercase tracking-widest text-white shadow-xl shadow-orange-500/20">
                            {working ? "Processing..." : lead ? "Save Changes" : "Save Lead"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
