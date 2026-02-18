"use client";

import { useEffect, useState, useMemo, use } from "react";
import Link from "next/link";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { useSession } from "../../_lib/session-context";
import { useToast } from "../../_lib/toast-context";
import type { 
  Shop, 
  ShopListResponse, 
  Visit, 
  VisitListResponse, 
  StaffListResponse,
  ShopAssignmentListResponse
} from "../../_lib/types";
import { Breadcrumbs } from "../../_lib/breadcrumbs";

function StatCard({ title, value, subValue, icon, accentColor }: { 
  title: string; 
  value: string; 
  subValue?: string; 
  icon: React.ReactNode;
  accentColor: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-[24px] border border-zinc-200 bg-white p-7 shadow-sm dark:border-zinc-800 dark:bg-zinc-900`}>
      <div className={`absolute left-0 top-0 h-full w-1 ${accentColor}`} />
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">{title}</p>
          <div className="flex flex-col">
            <span className="text-3xl font-black text-zinc-900 dark:text-zinc-100">{value}</span>
            {subValue && <span className="text-[11px] font-bold text-zinc-400 mt-1">{subValue}</span>}
          </div>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-50 text-zinc-400 dark:bg-zinc-800">
          {icon}
        </div>
      </div>
    </div>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
  return (name[0] ?? "?").toUpperCase();
}

export default function ShopDetailsPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const session = useSession();
  const toast = useToast();
  const [searchInput, setSearchInput] = useState("");

  const { data: shopData } = useSWR<{ ok: boolean; shop: Shop }>(
    `/api/manager/shops/${params.id}`,
    fetcher
  );

  const { data: visitsData } = useSWR<VisitListResponse>(
    `/api/manager/visits?shop=${params.id}`,
    fetcher
  );

  const { data: staffData } = useSWR<StaffListResponse>(
    "/api/manager/staff",
    fetcher
  );

  const { data: assignmentsData } = useSWR<ShopAssignmentListResponse>(
    "/api/manager/shop-assignments",
    fetcher
  );

  const shop = shopData?.shop;
  const visits = visitsData?.visits ?? [];
  const assignments = assignmentsData?.assignments ?? [];
  const reps = staffData?.staff ?? [];

  const primaryAssignment = useMemo(() => 
    assignments.find(a => a.shop_id === params.id && a.is_primary) || 
    assignments.find(a => a.shop_id === params.id),
    [assignments, params.id]
  );

  const primaryRep = useMemo(() => 
    primaryAssignment ? reps.find(r => r.company_user_id === primaryAssignment.rep_company_user_id) : null,
    [primaryAssignment, reps]
  );

  const stats = useMemo(() => {
    const totalVisits = visits.length;
    const lastVisit = visits[0];
    const lastVisitDate = lastVisit ? new Date(lastVisit.started_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : "No visits";
    const lastVisitTime = lastVisit ? new Date(lastVisit.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "";

    // Calculate avg duration
    const completedVisits = visits.filter(v => v.ended_at);
    let avgDuration = 0;
    if (completedVisits.length > 0) {
      const totalMins = completedVisits.reduce((acc, v) => {
        const start = new Date(v.started_at).getTime();
        const end = new Date(v.ended_at!).getTime();
        return acc + (end - start) / 60000;
      }, 0);
      avgDuration = Math.round(totalMins / completedVisits.length);
    }

    return {
      totalVisits,
      lastVisitDate,
      lastVisitTime,
      avgDuration: `${avgDuration} mins`
    };
  }, [visits]);

  const filteredVisits = useMemo(() => 
    visits.filter(v => 
      v.rep_name.toLowerCase().includes(searchInput.toLowerCase()) || 
      (v.notes?.toLowerCase() || "").includes(searchInput.toLowerCase())
    ),
    [visits, searchInput]
  );

  if (!shop && !shopData) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-[#f4a261]" />
      </div>
    );
  }

  if (!shop) return <div>Shop not found.</div>;

  return (
    <div className="space-y-8">
      {/* Header & Meta */}
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="space-y-3">
          <Breadcrumbs items={[
            { label: "SHOPS", href: "/dashboard/shops" },
            { label: shop.name }
          ]} />
          <div className="flex items-center gap-4">
            <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">{shop.name}</h1>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
              Active
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-[12px] font-bold text-zinc-400">
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              {shop.address || "No address provided"}
            </div>
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              {shop.contact_phone || "—"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {primaryRep ? (
            <div className="flex items-center gap-3 rounded-[20px] border border-zinc-100 bg-white p-2 pr-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-[12px] font-black text-orange-500 dark:bg-orange-900/20">
                {initials(primaryRep.full_name)}
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Primary Rep</p>
                <p className="text-[13px] font-black text-zinc-900 dark:text-zinc-100">{primaryRep.full_name}</p>
              </div>
            </div>
          ) : (
             <button className="flex h-12 items-center gap-2 rounded-2xl border border-dashed border-zinc-200 px-6 text-[11px] font-black uppercase tracking-widest text-zinc-400 hover:border-zinc-400 hover:text-zinc-600">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Assign Rep
             </button>
          )}
          <button className="flex h-14 items-center gap-2 rounded-[20px] bg-[#f4a261] px-8 text-[11px] font-black uppercase tracking-widest text-white shadow-lg shadow-[#f4a261]/20 transition-all hover:brightness-110">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Assign Task
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <StatCard 
          title="Total Visits" 
          value={stats.totalVisits.toString()} 
          subValue="Life-time record" 
          accentColor="bg-orange-400"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
        />
        <StatCard 
          title="Last Visit Date" 
          value={stats.lastVisitDate} 
          subValue={stats.lastVisitTime}
          accentColor="bg-indigo-400"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}
        />
        <StatCard 
          title="Avg. Duration" 
          value={stats.avgDuration} 
          subValue="Across all completed"
          accentColor="bg-emerald-400"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
        />
      </div>

      {/* Visit History Log Card */}
      <div className="rounded-[32px] border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-500 dark:bg-orange-900/20">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
            </div>
            <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100">Visit History Log</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input 
                type="text" 
                placeholder="Filter by representative or date..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="h-11 w-full rounded-xl border border-zinc-100 bg-zinc-50/50 pl-11 pr-4 text-[11px] font-bold outline-none ring-zinc-500/10 transition-all focus:border-zinc-300 focus:ring-4 dark:border-zinc-800 dark:bg-zinc-800/40 md:w-72"
              />
            </div>
            <button className="flex h-11 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-[10px] font-black uppercase tracking-widest text-zinc-600 transition-all hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 3H2l8 9v6l4 2V12l8-9z"/></svg>
              Filter
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800/60">
                <th className="pb-5 pl-2 text-[10px] font-black uppercase tracking-widest text-zinc-400">REPRESENTATIVE</th>
                <th className="pb-5 text-[10px] font-black uppercase tracking-widest text-zinc-400">DATE & TIME</th>
                <th className="pb-5 text-[10px] font-black uppercase tracking-widest text-zinc-400">DURATION</th>
                <th className="pb-5 text-[10px] font-black uppercase tracking-widest text-zinc-400">VISIT NOTES</th>
                <th className="pb-5 text-right text-[10px] font-black uppercase tracking-widest text-zinc-400">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/40">
              {filteredVisits.map((v) => {
                const start = new Date(v.started_at);
                const end = v.ended_at ? new Date(v.ended_at) : null;
                const duration = end ? Math.round((end.getTime() - start.getTime()) / 60000) : null;
                return (
                  <tr key={v.id} className="group hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20">
                    <td className="py-6 pl-2">
                       <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 text-[10px] font-black text-zinc-500 dark:bg-zinc-800">
                             {initials(v.rep_name)}
                          </div>
                          <span className="text-[13px] font-bold text-zinc-700 dark:text-zinc-300">{v.rep_name}</span>
                       </div>
                    </td>
                    <td className="py-6">
                      <div className="flex items-center gap-2">
                         <span className="text-[12px] font-bold text-zinc-900 dark:text-zinc-100">{start.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                         <span className="h-1 w-1 rounded-full bg-zinc-200" />
                         <span className="text-[12px] font-medium text-zinc-400">{start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </td>
                    <td className="py-6">
                      <div className="flex items-center gap-2 rounded-xl bg-indigo-50/50 px-3 py-1.5 w-fit dark:bg-indigo-900/10">
                        <svg className="text-indigo-500" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        <span className="text-[11px] font-black text-indigo-600 dark:text-indigo-400">{duration ? `${duration} mins` : "In Progress"}</span>
                      </div>
                    </td>
                    <td className="py-6">
                      <p className="max-w-[300px] truncate text-[12px] font-medium text-zinc-500 dark:text-zinc-400">
                        {v.notes || "No notes provided for this visit."}
                      </p>
                    </td>
                    <td className="py-6 text-right">
                      <button className="text-[11px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-700">View Detail</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        <div className="mt-8 flex items-center justify-between border-t border-zinc-50 pt-8 dark:border-zinc-800">
            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
                Showing 1-{filteredVisits.length} of {visits.length} visits
            </p>
            <div className="flex items-center gap-2">
                <button className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 text-zinc-400 hover:bg-zinc-50">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <button className="h-9 w-9 rounded-xl bg-[#f4a261] text-[11px] font-black text-white shadow-lg">1</button>
                <button className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 text-zinc-400 hover:bg-zinc-50">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
            </div>
        </div>
      </div>

      {/* Footer Cards */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Quick Contact Info */}
        <div className="rounded-[32px] border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-8 flex items-center gap-3">
             <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="23 7 23 11 19 11"/></svg>
             </div>
             <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100">Quick Contact Info</h3>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-50 text-zinc-400 dark:bg-zinc-800">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Store Manager</p>
                <p className="text-[14px] font-black text-zinc-900 dark:text-zinc-100">{shop.contact_name || "Mike Henderson"}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-50 text-zinc-400 dark:bg-zinc-800">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Email Address</p>
                <p className="text-[14px] font-black text-zinc-900 dark:text-zinc-100">{shop.contact_email || "m.henderson@globalauto.com"}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-50 text-zinc-400 dark:bg-zinc-800">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Operating Hours</p>
                <p className="text-[14px] font-black text-zinc-900 dark:text-zinc-100">{shop.operating_hours || "Not specified"}</p>
              </div>
            </div>

            <button className="mt-4 w-full rounded-2xl border border-[#f4a261] py-4 text-[11px] font-black uppercase tracking-widest text-[#f4a261] transition-all hover:bg-[#f4a261] hover:text-white">
              Send Direct Message
            </button>
          </div>
        </div>

        {/* Note to Representatives */}
        <div className="rounded-[32px] border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
           <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100 mb-8">Note to Representatives</h3>
           
           <div className="rounded-2xl border-l-[6px] border-[#f4a261] bg-zinc-50 p-6 dark:bg-zinc-800/40">
             <p className="text-[13px] font-medium leading-relaxed text-zinc-600 dark:text-zinc-300">
               {shop.notes || `${shop.name} is a high-priority account. Always check with ${shop.contact_name || "the manager"} before proceeding with the inventory count. Focus on their request for performance category expansion.`}
             </p>
           </div>

           <div className="mt-8 grid grid-cols-2 gap-8">
             <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Preferred Visit Day</p>
                <p className="mt-2 text-[13px] font-black text-zinc-900 dark:text-zinc-100">{shop.preferred_visit_days || "Any day"}</p>
             </div>
             <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Payment Status</p>
                <div className="mt-2">
                   <span className="rounded-full bg-emerald-50 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:bg-emerald-900/20">
                     {(shop.payment_status || "up_to_date").replace('_', ' ')}
                   </span>
                </div>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
