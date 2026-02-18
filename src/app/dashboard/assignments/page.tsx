"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { useSession } from "../_lib/session-context";
import { useToast } from "../_lib/toast-context";
import type { Shop, ShopListResponse, Staff, StaffListResponse, ShopAssignment, ShopAssignmentListResponse } from "../_lib/types";
import Link from "next/link";

export default function AssignmentsPage() {
  const session = useSession();
  const toast = useToast();
  const [showModal, setShowModal] = useState(false);
  const [working, setWorking] = useState(false);

  const { data: assignmentsData, mutate } = useSWR<ShopAssignmentListResponse>("/api/manager/shop-assignments", fetcher);
  const { data: shopsData } = useSWR<ShopListResponse>("/api/manager/shops", fetcher);
  const { data: staffData } = useSWR<StaffListResponse>("/api/manager/staff", fetcher);

  const assignments = assignmentsData?.assignments ?? [];
  const shops = shopsData?.shops ?? [];
  const reps = staffData?.staff?.filter(s => s.role === "rep" && (s.status === "active" || s.status === "inactive")) ?? [];

  const groupedAssignments = useMemo(() => {
    const map: Record<string, { rep: Staff; assignedShops: ShopAssignment[] }> = {};
    
    // Ensure all reps are in the map
    reps.forEach(r => {
        map[r.company_user_id] = { rep: r, assignedShops: [] };
    });

    assignments.forEach(a => {
      if (map[a.rep_company_user_id]) {
        map[a.rep_company_user_id].assignedShops.push(a);
      }
    });

    return Object.values(map);
  }, [assignments, reps]);

  async function handleAdd(payload: any) {
    setWorking(true);
    const res = await fetch("/api/manager/shop-assignments", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setWorking(false);
    if (data.ok) {
        toast.success("Shop assigned successfully.");
        setShowModal(false);
        mutate();
    } else {
        toast.error(data.error || "Assignment failed");
    }
  }

  async function onRemove(a: ShopAssignment) {
    if (!confirm(`Remove assignment for ${a.shop_name}?`)) return;
    const res = await fetch(`/api/manager/shop-assignments/${a.id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.ok) {
        toast.success("Assignment removed.");
        mutate();
    } else {
        toast.error(data.error || "Action failed");
    }
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">Shop Assignments</h1>
        <button 
          onClick={() => setShowModal(true)}
          className="flex h-14 items-center gap-2 rounded-2xl bg-[#f4a261] px-8 text-[11px] font-black uppercase tracking-widest text-white shadow-lg shadow-orange-500/20 transition-all hover:brightness-110"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          Assign Shops
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {groupedAssignments.map(({ rep, assignedShops }) => (
          <div key={rep.company_user_id} className="rounded-[40px] border border-zinc-100 bg-white p-8 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-50 text-[12px] font-black text-zinc-400 dark:bg-zinc-800">
                    {rep.full_name.charAt(0)}
                </div>
                <div>
                  <p className="text-[14px] font-black text-zinc-900 dark:text-zinc-100">{rep.full_name}</p>
                   <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Sales Rep</p>
                </div>
              </div>
              <span className={`rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest ${rep.status === 'active' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' : 'bg-zinc-100 text-zinc-500'}`}>
                {rep.status}
              </span>
            </div>

            <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Assigned Shop Route</p>
                {assignedShops.length > 0 ? (
                    <div className="flex flex-wrap gap-2.5">
                        {assignedShops.map(a => (
                            <div key={a.id} className={`group relative flex items-center gap-2 rounded-[14px] px-4 py-2.5 transition-all hover:scale-105 ${a.is_primary ? "bg-[#f4a261] text-white shadow-md shadow-orange-500/20" : "bg-zinc-50 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-200"}`}>
                                <span className="text-[12px] font-black">{a.shop_name}</span>
                                {a.is_primary && (
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg>
                                )}
                                <button 
                                    onClick={() => onRemove(a)}
                                    className={`ml-2 rounded-full p-0.5 transition-colors ${a.is_primary ? "hover:bg-white/20 text-white/70" : "hover:bg-zinc-200 text-zinc-400 dark:hover:bg-zinc-700"}`}
                                >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center rounded-[24px] border border-dashed border-zinc-100 py-10 dark:border-zinc-800">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">No active route</p>
                    </div>
                )}
            </div>

            <div className="mt-8 border-t border-zinc-50 pt-6 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Load Capacity</p>
                    <p className="text-[10px] font-black text-[#f4a261] uppercase tracking-widest">{assignedShops.length} SHOPS</p>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-zinc-50 dark:bg-zinc-800">
                    <div className="h-full bg-[#f4a261]" style={{ width: `${Math.min(100, (assignedShops.length / 10) * 100)}%` }} />
                </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <AssignmentModal 
            shops={shops} 
            reps={reps} 
            assignments={assignments}
            working={working}
            onClose={() => setShowModal(false)}
            onSubmit={handleAdd}
        />
      )}
    </div>
  );
}

function AssignmentModal({ shops, reps, assignments, working, onClose, onSubmit }: { 
    shops: Shop[]; 
    reps: Staff[]; 
    assignments: ShopAssignment[];
    working: boolean; 
    onClose: () => void; 
    onSubmit: (payload: any) => Promise<void>; 
}) {
    const [formData, setFormData] = useState({
        repCompanyUserId: "",
        shopId: "",
        isPrimary: false
    });

    const inputClass = "w-full rounded-xl border border-zinc-100 bg-zinc-50/50 px-4 py-3 text-[13px] font-medium text-zinc-900 outline-none transition-all focus:border-zinc-200 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-100";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/20 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg overflow-hidden rounded-[40px] border border-zinc-100 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center justify-between border-b border-zinc-50 px-10 py-8 dark:border-zinc-800">
                    <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100">Assign Shop to Rep</h3>
                    <button onClick={onClose} className="rounded-xl border border-zinc-100 p-2 text-zinc-400 hover:bg-zinc-50 dark:border-zinc-800">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                </div>
                
                <form onSubmit={e => { e.preventDefault(); onSubmit(formData); }} className="p-10">
                    <div className="space-y-6">
                        <div className="space-y-1.5">
                             <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Select Sales Rep</label>
                            <select required className={inputClass} value={formData.repCompanyUserId} onChange={e => setFormData({...formData, repCompanyUserId: e.target.value})}>
                                <option value="">Choose Rep</option>
                                {reps.map(r => <option key={r.company_user_id} value={r.company_user_id}>{r.full_name} ({r.status})</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Select Shop</label>
                            <select required className={inputClass} value={formData.shopId} onChange={e => setFormData({...formData, shopId: e.target.value})}>
                                <option value="">Choose Shop</option>
                                {shops
                                    .filter(s => !assignments.some(a => a.shop_id === s.id && a.rep_company_user_id === formData.repCompanyUserId))
                                    .map(s => <option key={s.id} value={s.id}>{s.name}</option>)
                                }
                            </select>
                        </div>
                        
                        <label className="flex cursor-pointer items-center gap-3">
                            <input 
                                type="checkbox" 
                                checked={formData.isPrimary} 
                                onChange={e => setFormData({...formData, isPrimary: e.target.checked})}
                                className="h-5 w-5 rounded-lg border-zinc-200 text-[#f4a261] focus:ring-[#f4a261]"
                            />
                            <span className="text-[13px] font-bold text-zinc-600 dark:text-zinc-400">Mark as primary shop for this agent</span>
                        </label>
                    </div>

                    <div className="mt-10 flex gap-4">
                        <button type="button" onClick={onClose} className="h-14 flex-1 rounded-2xl border border-zinc-100 text-[11px] font-black uppercase tracking-widest text-zinc-400 hover:bg-zinc-50 dark:border-zinc-800">Cancel</button>
                        <button disabled={working} className="h-14 flex-1 rounded-2xl bg-[#f4a261] text-[11px] font-black uppercase tracking-widest text-white shadow-xl shadow-orange-500/20">
                            {working ? "Assigning..." : "Confirm Assignment"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
