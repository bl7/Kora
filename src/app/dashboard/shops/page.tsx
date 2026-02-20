"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { Breadcrumbs } from "../_lib/breadcrumbs";
import { BulkImportModal } from "../_lib/bulk-import-modal";
import Link from "next/link";
import type { 
  Shop, 
  ShopListResponse, 
  Visit, 
  VisitListResponse, 
  StaffListResponse, 
  ShopAssignmentListResponse,
  ShopAssignment
} from "../_lib/types";
import { useSession } from "../_lib/session-context";
import { useToast } from "../_lib/toast-context";
import useSWR, { mutate } from "swr";
import { fetcher } from "@/lib/fetcher";

type Rep = { company_user_id: string; full_name: string };

function StatCard({ title, value, trend, trendUp, icon }: { 
  title: string; 
  value: string; 
  trend?: string; 
  trendUp?: boolean; 
  icon: 'shop' | 'calendar';
}) {
  return (
    <div className="flex items-center justify-between rounded-[24px] border border-zinc-200 bg-white p-7 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
      <div className="space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">{title}</p>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-black text-zinc-900 dark:text-zinc-100">{value}</span>
        </div>
        {trend && (
          <p className={`flex items-center gap-1 text-[11px] font-bold ${trendUp ? "text-emerald-500" : "text-zinc-400"}`}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={trendUp ? "" : "rotate-180"}>
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
            </svg>
            {trend}
          </p>
        )}
      </div>
      <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${icon === 'shop' ? 'bg-orange-50 text-orange-500' : 'bg-emerald-50 text-emerald-500'} dark:bg-zinc-800`}>
        {icon === 'shop' ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        )}
      </div>
    </div>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
  return (name[0] ?? "?").toUpperCase();
}

export default function ShopsPage() {
  const session = useSession();
  const toast = useToast();
  const [tab, setTab] = useState<"all" | "visited">("all");
  const [working, setWorking] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [assignShop, setAssignShop] = useState<Shop | null>(null);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [viewVisitsShop, setViewVisitsShop] = useState<Shop | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [regionFilter, setRegionFilter] = useState("all");
  const [page, setPage] = useState(1);
  const limit = 10;
  
  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = useState(searchInput);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // If search or region changes, reset page
  useEffect(() => { setPage(1); }, [debouncedSearch, regionFilter]);

  const { data: shopsData, mutate: mutateShops } = useSWR<ShopListResponse>(
    `/api/manager/shops?page=${page}&limit=${limit}&q=${encodeURIComponent(debouncedSearch)}${regionFilter !== "all" ? "&regionId=" + regionFilter : ""}`,
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

  const { data: visitsData } = useSWR<VisitListResponse>(
    "/api/manager/visits",
    fetcher
  );

  const { data: regionsData } = useSWR<{ ok: boolean; regions: any[] }>(
    "/api/manager/regions",
    fetcher
  );

  const shops = shopsData?.shops ?? [];
  const assignments = assignmentsData?.assignments ?? [];
  const visits = visitsData?.visits ?? [];
  const regions = regionsData?.regions ?? [];
  const reps = (staffData?.staff ?? []).filter(s => s.role === 'rep' && s.status === 'active');

  const loading = !shopsData || !staffData || !assignmentsData || !visitsData;

  const stats = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0,0,0,0);

    const visitedThisWeek = new Set(
      visits
        .filter(v => new Date(v.started_at) >= startOfWeek)
        .map(v => v.shop_id)
    ).size;

    return {
      total: shopsData?.total ?? 0,
      visitedThisWeek
    };
  }, [shopsData?.total, visits]);

  const shopRows = useMemo(() => {
    const today = new Date().toDateString();
    
    return shops.map(shop => {
      const shopAssignments = assignments.filter(a => a.shop_id === shop.id);
      const primaryAssignment = shopAssignments.find(a => a.is_primary) || shopAssignments[0];
      const assignedRep = primaryAssignment 
        ? reps.find(r => r.company_user_id === primaryAssignment.rep_company_user_id) 
        : null;

      const shopVisits = visits
        .filter(v => v.shop_id === shop.id)
        .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
      
      const lastVisit = shopVisits[0];
      const visitedToday = shopVisits.some(v => new Date(v.started_at).toDateString() === today);

      return {
        ...shop,
        assignedRep,
        lastVisitDate: lastVisit ? new Date(lastVisit.started_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : "--",
        visitedToday
      };
    }).filter(s => {
        // Client-side filtering for Tab only (Search is backend)
        const matchesTab = tab === "all" || s.visitedToday;
        return matchesTab;
    });
  }, [shops, assignments, reps, visits, tab]);

  async function onAdd(payload: any) {
    setWorking(true);
    const res = await fetch("/api/manager/shops", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setWorking(false);
    if (!data.ok) {
      toast.error(data.error ?? "Could not create shop");
      return;
    }
    toast.success("Shop added.");
    setShowForm(false);
    mutateShops();
  }

  return (
    <div className="space-y-8 p-4 md:p-0">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <Breadcrumbs items={[{ label: "SHOPS" }]} />
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">Our Shops</h1>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">List of all registered shops and their visit history.</p>
        </div>
        <div className="flex items-center gap-3">
            <button 
                onClick={() => setShowForm(true)}
                className="flex h-11 items-center gap-2 rounded-xl bg-[#f4a261] px-6 text-xs font-bold uppercase tracking-widest text-white shadow-lg shadow-[#f4a261]/20 transition-all hover:brightness-110"
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add New Shop
            </button>
            <button 
               onClick={() => setIsImportOpen(true)}
               className="flex h-12 items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-6 text-[11px] font-black uppercase tracking-widest text-[#f4a261] transition-transform hover:scale-105 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
               Import CSV
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <StatCard title="TOTAL SHOPS" value={stats.total.toLocaleString()} icon="shop" />
        <StatCard title="VISITED THIS WEEK" value={stats.visitedThisWeek.toLocaleString()} icon="calendar" />
      </div>

      <div className="rounded-[32px] border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between mb-8">
            <div className="flex rounded-2xl bg-zinc-50 p-1 dark:bg-zinc-800/60">
                <button 
                    onClick={() => setTab("all")}
                    className={`rounded-xl px-6 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all ${tab === "all" ? "bg-zinc-900 text-white shadow-lg dark:bg-zinc-700" : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"}`}
                >
                    All Shops
                </button>
                <button 
                    onClick={() => setTab("visited")}
                    className={`rounded-xl px-6 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all ${tab === "visited" ? "bg-zinc-900 text-white shadow-lg dark:bg-zinc-700" : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"}`}
                >
                    Visited Today
                </button>
            </div>
            <div className="flex flex-wrap items-center gap-4">
                <select
                    value={regionFilter}
                    onChange={(e) => setRegionFilter(e.target.value)}
                    className="h-11 rounded-xl border border-zinc-100 bg-zinc-50/50 px-4 text-xs font-bold outline-none ring-zinc-500/10 transition-all focus:border-zinc-300 focus:ring-4 dark:border-zinc-800 dark:bg-zinc-800/40"
                >
                    <option value="all">All Regions</option>
                    {regions.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                </select>
                <div className="relative">
                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <input 
                        type="text" 
                        placeholder="Search shops or locations..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        className="h-11 w-full rounded-xl border border-zinc-100 bg-zinc-50/50 pl-11 pr-4 text-xs font-bold outline-none ring-zinc-500/10 transition-all focus:border-zinc-300 focus:ring-4 dark:border-zinc-800 dark:bg-zinc-800/40 md:w-64"
                    />
                </div>
            </div>
        </div>

        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="border-b border-zinc-100 dark:border-zinc-800">
                        <th className="pb-5 pl-2 text-[10px] font-black uppercase tracking-widest text-zinc-400">SHOP NAME</th>
                        <th className="pb-5 text-[10px] font-black uppercase tracking-widest text-zinc-400">SALES REP</th>
                        <th className="pb-5 text-[10px] font-black uppercase tracking-widest text-zinc-400">LAST VISIT</th>
                        <th className="pb-5 text-[10px] font-black uppercase tracking-widest text-zinc-400">STATUS</th>
                        <th className="pb-5 text-right text-[10px] font-black uppercase tracking-widest text-zinc-400">OPTION</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/40">
                    {loading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <tr key={i} className="animate-pulse">
                                <td colSpan={5} className="py-8"><div className="h-10 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40" /></td>
                            </tr>
                        ))
                    ) : shopRows.map((s) => (
                        <tr key={s.id} className="group hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20">
                            <td className="py-6 pl-2">
                                <div className="flex items-center gap-4">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500 dark:bg-indigo-900/20">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z"/></svg>
                                    </div>
                                    <div>
                                        <Link href={`/dashboard/shops/${s.id}`}>
                                          <p className="text-[13px] font-black text-zinc-900 transition-colors hover:text-[#f4a261] dark:text-zinc-100 dark:hover:text-[#f4a261]">{s.name}</p>
                                        </Link>
                                        <p className="text-[11px] font-medium text-zinc-400">{s.address || "No address provided"}</p>
                                    </div>
                                </div>
                            </td>
                            <td className="py-6">
                                {s.assignedRep ? (
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-100 text-[10px] font-black text-zinc-500 dark:bg-zinc-800">
                                            {initials(s.assignedRep.full_name)}
                                        </div>
                                        <span className="text-[12px] font-bold text-zinc-700 dark:text-zinc-300">{s.assignedRep.full_name}</span>
                                    </div>
                                ) : (
                                    <span className="text-xs font-bold text-zinc-300 dark:text-zinc-600">Unassigned</span>
                                )}
                            </td>
                            <td className="py-6 text-[12px] font-bold text-zinc-500 dark:text-zinc-400">
                                {s.lastVisitDate}
                            </td>
                            <td className="py-6">
                                {s.visitedToday ? (
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
                                        <span className="h-1 w-1 rounded-full bg-emerald-500" />
                                        Visited Today
                                    </span>
                                ) : (
                                    <span className="text-xs font-bold text-zinc-300 dark:text-zinc-600">—</span>
                                )}
                            </td>
                            <td className="py-6 text-right">
                                <button 
                                    onClick={() => setViewVisitsShop(s)}
                                    className="rounded-xl p-2 text-zinc-400 transition-all hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        <div className="mt-8 flex items-center justify-between border-t border-zinc-100 pt-8 dark:border-zinc-800">
            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
                Showing {shopRows.length} of {shopsData?.total || 0} entries
            </p>
            <div className="flex items-center gap-2">
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-lg border border-zinc-200 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-800 dark:text-zinc-400"
                >
                  Previous
                </button>
                <span className="text-[10px] font-black text-zinc-900 dark:text-zinc-100">
                    Page {page}
                </span>
                <button 
                  onClick={() => setPage(p => p + 1)}
                  disabled={shopRows.length < limit && (shopsData?.total ? page * limit >= shopsData.total : true)}
                  className="rounded-lg border border-zinc-200 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-800 dark:text-zinc-400"
                >
                  Next
                </button>
            </div>
        </div>
      </div>

      {showForm && (
        <AddShopModal
          onClose={() => setShowForm(false)}
          onSubmit={onAdd}
          working={working}
          regions={regions}
        />
      )}

      <BulkImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        title="Import Shops"
        templateUrl="/api/manager/shops/import-template"
        importUrl="/api/manager/shops/import"
        onSuccess={() => {
           mutate("/api/manager/shops");
           mutate("/api/manager/regions"); // Refresh regions too as they might be created
           setIsImportOpen(false);
        }}
      />

      {viewVisitsShop && (
        <VisitHistoryModal
          shop={viewVisitsShop}
          onClose={() => setViewVisitsShop(null)}
        />
      )}
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-900 outline-none ring-zinc-500/10 transition-all focus:border-zinc-400 focus:ring-4 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-500";

function AddShopModal(props: {
  onClose: () => void;
  onSubmit: (payload: any) => Promise<void>;
  working: boolean;
  regions: any[];
}) {
  const [name, setName] = useState("");
  const [regionId, setRegionId] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [geofenceRadiusM, setGeofenceRadiusM] = useState("100");
  const [address, setAddress] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [notes, setNotes] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await props.onSubmit({
      name,
      regionId: regionId || undefined,
      latitude: latitude ? Number(latitude) : 0,
      longitude: longitude ? Number(longitude) : 0,
      geofenceRadiusM: Number(geofenceRadiusM),
      address: address || undefined,
      contactName: contactName || undefined,
      contactEmail: contactEmail || undefined,
      contactPhone: contactPhone || undefined,
      notes: notes || undefined,
    });
    props.onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/60 p-4 backdrop-blur-sm" onClick={props.onClose}>
      <div className="w-full max-w-2xl rounded-[32px] border border-zinc-200 bg-white p-8 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900" onClick={(e) => e.stopPropagation()}>
        <div className="mb-8 flex items-center justify-between">
            <h2 className="text-xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">Add New Shop</h2>
            <button onClick={props.onClose} className="rounded-full bg-zinc-50 p-2 text-zinc-400 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Basic Info</h3>
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-zinc-400">Shop Name *</label>
                <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="e.g. Acme Stores Central" />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-zinc-400">Region</label>
                <select 
                  value={regionId} 
                  onChange={(e) => setRegionId(e.target.value)} 
                  className={inputClass}
                >
                  <option value="">No Region</option>
                  {props.regions.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-zinc-400">Address</label>
                <input value={address} onChange={(e) => setAddress(e.target.value)} className={inputClass} placeholder="Physical address" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-zinc-400">Latitude</label>
                  <input type="number" step="any" value={latitude} onChange={(e) => setLatitude(e.target.value)} className={inputClass} placeholder="Lat" />
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-zinc-400">Longitude</label>
                  <input type="number" step="any" value={longitude} onChange={(e) => setLongitude(e.target.value)} className={inputClass} placeholder="Lng" />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-zinc-400">Geofence radius (m)</label>
                <input required type="number" min={1} value={geofenceRadiusM} onChange={(e) => setGeofenceRadiusM(e.target.value)} className={inputClass} />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Contact Details</h3>
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-zinc-400">Contact Person</label>
                <input value={contactName} onChange={(e) => setContactName(e.target.value)} className={inputClass} placeholder="Manager name" />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-zinc-400">Phone</label>
                <input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} className={inputClass} placeholder="Contact number" />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-zinc-400">Email</label>
                <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className={inputClass} placeholder="Email" />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-zinc-400">Internal Notes</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={`${inputClass} h-[106px] resize-none`} placeholder="Any extra details..." />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-zinc-100 dark:border-zinc-800">
            <button type="button" onClick={props.onClose} className="rounded-2xl border border-zinc-200 px-6 py-4 text-xs font-bold uppercase tracking-widest text-zinc-600 transition-all hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/60">
              Cancel
            </button>
            <button type="submit" disabled={props.working} className="rounded-2xl bg-[#f4a261] px-10 py-4 text-xs font-bold uppercase tracking-widest text-white shadow-lg shadow-[#f4a261]/20 transition-all hover:brightness-110 disabled:opacity-50">
              {props.working ? "Adding…" : "Add Shop"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function VisitHistoryModal({ shop, onClose }: { shop: Shop; onClose: () => void }) {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/manager/visits?shop=${shop.id}`)
      .then((r) => r.json())
      .then((d: VisitListResponse) => {
        if (d.ok) setVisits(d.visits ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [shop.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="absolute inset-0 bg-zinc-900/60" onClick={onClose} />
      <div className="relative flex max-h-[80vh] w-full max-w-2xl flex-col rounded-[32px] border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
        <div className="flex items-center justify-between border-b border-zinc-50 p-8 dark:border-zinc-800">
          <div>
            <h3 className="text-xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">Visit History</h3>
            <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 mt-1">{shop.name}</p>
          </div>
          <button onClick={onClose} className="rounded-full bg-zinc-50 p-2 text-zinc-400 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-2xl bg-zinc-50 dark:bg-zinc-800/40" />
              ))}
            </div>
          ) : visits.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm font-bold text-zinc-300 dark:text-zinc-600 uppercase tracking-widest">No visit records found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {visits.map((v) => {
                const start = new Date(v.started_at);
                const end = v.ended_at ? new Date(v.ended_at) : null;
                return (
                  <div key={v.id} className="rounded-[24px] border border-zinc-100 bg-zinc-50/20 p-6 dark:border-zinc-800/60 dark:bg-zinc-800/20">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                         <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center text-[10px] font-black text-zinc-400 dark:bg-zinc-800">
                            {initials(v.rep_name)}
                         </div>
                         <div>
                            <h4 className="text-sm font-black text-zinc-900 dark:text-zinc-100">{v.rep_name}</h4>
                            <div className="mt-1 flex gap-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                                <span>{start.toLocaleDateString()}</span>
                                <span>{start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} — {end ? end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Active"}</span>
                            </div>
                         </div>
                      </div>
                      {!v.ended_at && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-[8px] font-black uppercase tracking-widest text-emerald-600">
                          <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                          Live
                        </span>
                      )}
                    </div>
                    {v.notes && (
                      <div className="mt-4 rounded-xl bg-white px-4 py-3 text-xs font-medium text-zinc-500 border border-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400">
                        {v.notes}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-8 border-t border-zinc-50 dark:border-zinc-800">
          <button
            onClick={onClose}
            className="w-full rounded-2xl bg-zinc-900 py-4 text-xs font-bold uppercase tracking-widest text-white transition-all hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
