"use client";

import { useMemo, useState, Suspense } from "react";
import useSWR, { mutate } from "swr";
import { fetcher } from "@/lib/fetcher";
import { Breadcrumbs } from "../_lib/breadcrumbs";
import type { VisitListResponse } from "../_lib/types";
import { useToast } from "../_lib/toast-context";
import { useSearchParams } from "next/navigation";

const EXCEPTION_REASON_LABELS: Record<string, string> = {
  gps_drift: "GPS Drift",
  shop_moved: "Shop Moved",
  road_blocked: "Road Blocked",
  alternate_location: "Alternate Location",
  customer_requested_outside: "Customer Outside",
  low_gps_accuracy: "Low GPS Accuracy",
  other: "Other",
};

const REASON_COLORS: Record<string, string> = {
  gps_drift: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
  shop_moved: "bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400",
  road_blocked: "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
  alternate_location: "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400",
  customer_requested_outside: "bg-cyan-50 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-400",
  low_gps_accuracy: "bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400",
  other: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

type Tab = "all" | "exceptions" | "pending";

export default function VisitsPage() {
  return (
    <Suspense fallback={<div className="animate-pulse space-y-4"><div className="h-32 rounded-3xl bg-zinc-100 dark:bg-zinc-800" /></div>}>
      <VisitsPageInner />
    </Suspense>
  );
}

function VisitsPageInner() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as Tab) || "all";
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [search, setSearch] = useState("");
  const [repFilter, setRepFilter] = useState("all");
  const [reasonFilter, setReasonFilter] = useState("all");
  const [regionFilter, setRegionFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [managerNoteInput, setManagerNoteInput] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const toast = useToast();

  const { data: regionsData } = useSWR<{ ok: boolean; regions: any[] }>("/api/manager/regions", fetcher);
  const regions = regionsData?.regions || [];

  const { data: allVisitsData, isLoading: allLoading } = useSWR<VisitListResponse>(
    `/api/manager/visits${regionFilter !== 'all' ? `?region=${regionFilter}` : ''}`,
    fetcher
  );
  const { data: exceptionsData, isLoading: exLoading } = useSWR<VisitListResponse>(
    `/api/manager/visits?exceptions_only=true${regionFilter !== 'all' ? `&region=${regionFilter}` : ''}`,
    fetcher
  );

  const allVisits = allVisitsData?.visits || [];
  const exceptions = exceptionsData?.visits || [];
  const pending = exceptions.filter(v => !v.approved_by_manager_id && !v.flagged_by_manager_id);

  function switchTab(tab: Tab) {
    setActiveTab(tab);
    setSearch("");
    setRepFilter("all");
    setReasonFilter("all");
    setExpandedId(null);
  }

  // All visits filtered
  const filteredAll = useMemo(() => {
    return allVisits.filter(v => {
      const q = search.toLowerCase();
      return (
        v.rep_name?.toLowerCase().includes(q) ||
        v.shop_name?.toLowerCase().includes(q)
      );
    });
  }, [allVisits, search]);

  // Exception reps for filter
  const exceptionReps = useMemo(() => {
    const seen = new Set<string>();
    return exceptions.filter(v => {
      if (seen.has(v.rep_name)) return false;
      seen.add(v.rep_name);
      return true;
    }).map(v => v.rep_name);
  }, [exceptions]);

  // Exceptions filtered
  const filteredExceptions = useMemo(() => {
    return exceptions.filter(v => {
      const matchRep = repFilter === "all" || v.rep_name === repFilter;
      const matchReason = reasonFilter === "all" || v.exception_reason === reasonFilter;
      return matchRep && matchReason;
    });
  }, [exceptions, repFilter, reasonFilter]);

  // Pending filtered
  const filteredPending = useMemo(() => {
    return pending.filter(v => {
      const matchRep = repFilter === "all" || v.rep_name === repFilter;
      const matchReason = reasonFilter === "all" || v.exception_reason === reasonFilter;
      return matchRep && matchReason;
    });
  }, [pending, repFilter, reasonFilter]);

  async function handleAction(visitId: string, action: "approve" | "flag") {
    setActionLoading(visitId + action);
    const note = managerNoteInput[visitId] || undefined;
    const res = await fetch(`/api/manager/visits/${visitId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ [action]: true, ...(note ? { managerNote: note } : {}) }),
    });
    const data = await res.json();
    setActionLoading(null);
    if (data.ok) {
      toast.success(action === "approve" ? "Visit approved." : "Visit flagged.");
      mutate("/api/manager/visits?exceptions_only=true");
    } else {
      toast.error("Action failed.");
    }
  }

  // Summary stats
  const verified = allVisits.filter(v => v.is_verified).length;
  const exCount = exceptions.length;
  const pendingCount = pending.length;

  const tabs: { id: Tab; label: string; count?: number; alert?: boolean }[] = [
    { id: "all", label: "All Visits", count: allVisits.length },
    { id: "exceptions", label: "Exceptions", count: exCount, alert: exCount > 0 },
    { id: "pending", label: "Pending Review", count: pendingCount, alert: pendingCount > 0 },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <Breadcrumbs items={[{ label: "VISITS" }]} />
        <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">Visits</h1>
        <p className="text-sm font-medium text-zinc-500">Visit log, exceptions, and pending manager review.</p>
      </div>

      {/* Signal row */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-zinc-100 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Total Visits</p>
          <p className="mt-2 text-3xl font-black text-zinc-900 dark:text-zinc-100">{allVisits.length}</p>
        </div>
        <div className="rounded-3xl border border-emerald-100 bg-emerald-50/40 p-6 dark:border-emerald-900/30 dark:bg-emerald-900/5">
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Verified GPS</p>
          <p className="mt-2 text-3xl font-black text-emerald-600 dark:text-emerald-400">{verified}</p>
        </div>
        <div className="rounded-3xl border border-orange-100 bg-orange-50/40 p-6 dark:border-orange-900/30 dark:bg-orange-900/5">
          <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">Exceptions</p>
          <p className="mt-2 text-3xl font-black text-orange-600 dark:text-orange-400">{exCount}</p>
        </div>
        <div className="rounded-3xl border border-red-100 bg-red-50/40 p-6 dark:border-red-900/30 dark:bg-red-900/5">
          <p className="text-[10px] font-black uppercase tracking-widest text-red-400">Pending Review</p>
          <p className="mt-2 text-3xl font-black text-red-600 dark:text-red-400">{pendingCount}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-2xl border border-zinc-100 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-900 w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => switchTab(tab.id)}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-[12px] font-black uppercase tracking-widest transition-all ${
              activeTab === tab.id
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-100"
                : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            }`}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className={`flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-black ${
                tab.alert && activeTab !== tab.id
                  ? "bg-red-500 text-white"
                  : "bg-zinc-100 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400"
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab: All Visits ── */}
      {activeTab === "all" && (
        <div className="space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                placeholder="Search by rep or shop..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="h-12 w-full rounded-2xl border border-zinc-100 bg-white pl-12 pr-4 text-sm font-medium shadow-sm outline-none transition-all focus:border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900"
              />
            </div>
            
            <select
              value={regionFilter}
              onChange={e => setRegionFilter(e.target.value)}
              className="h-12 w-full rounded-2xl border border-zinc-100 bg-white px-4 text-sm font-bold shadow-sm outline-none transition-all focus:border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 md:w-48"
            >
              <option value="all">All Regions</option>
              {regions.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          <div className="rounded-[40px] border border-zinc-100 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-zinc-50 dark:border-zinc-800/60">
                    <th className="pb-5 pl-8 pt-8 text-[10px] font-black uppercase tracking-widest text-zinc-400">Time</th>
                    <th className="pb-5 pt-8 text-[10px] font-black uppercase tracking-widest text-zinc-400">Rep & Shop</th>
                    <th className="pb-5 pt-8 text-[10px] font-black uppercase tracking-widest text-zinc-400">Verification</th>
                    <th className="pb-5 pt-8 text-[10px] font-black uppercase tracking-widest text-zinc-400">Status</th>
                    <th className="pb-5 pt-8 text-[10px] font-black uppercase tracking-widest text-zinc-400">Distance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/40">
                  {allLoading ? (
                    <tr><td colSpan={5} className="py-10 text-center text-sm font-medium text-zinc-400">Loading visits...</td></tr>
                  ) : filteredAll.length === 0 ? (
                    <tr><td colSpan={5} className="py-10 text-center text-sm font-medium text-zinc-400">No visits found.</td></tr>
                  ) : (
                    filteredAll.map(v => (
                      <tr key={v.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20">
                        <td className="py-5 pl-8">
                          <p className="text-[13px] font-bold text-zinc-900 dark:text-zinc-100">
                            {new Date(v.started_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                          <p className="text-[10px] font-medium text-zinc-400">
                            {new Date(v.started_at).toLocaleDateString()}
                          </p>
                        </td>
                        <td className="py-5">
                          <p className="text-[13px] font-black text-zinc-900 dark:text-zinc-100">{v.shop_name}</p>
                          <p className="text-[11px] font-medium text-zinc-500">by {v.rep_name}</p>
                        </td>
                        <td className="py-5">
                          {v.is_verified ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
                              ✓ Verified
                            </span>
                          ) : v.exception_reason ? (
                            <div className="flex flex-col gap-1">
                              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${REASON_COLORS[v.exception_reason || "other"]}`}>
                                {EXCEPTION_REASON_LABELS[v.exception_reason] || v.exception_reason}
                              </span>
                              <span className={`text-[9px] font-black uppercase tracking-widest ${
                                v.approved_by_manager_id
                                  ? "text-emerald-500"
                                  : v.flagged_by_manager_id
                                  ? "text-red-500"
                                  : "text-orange-500"
                              }`}>
                                {v.approved_by_manager_id
                                  ? "Exception (approved)"
                                  : v.flagged_by_manager_id
                                  ? "Exception (flagged)"
                                  : "Exception (pending)"}
                              </span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-blue-500 dark:bg-blue-900/20 dark:text-blue-400">
                              Ongoing
                            </span>
                          )}
                        </td>
                        <td className="py-5">
                          <span className={`text-[11px] font-bold ${v.ended_at ? "text-zinc-500" : "animate-pulse text-blue-500"}`}>
                            {v.ended_at ? "Completed" : "Ongoing"}
                          </span>
                        </td>
                        <td className="py-5">
                          <p className="text-[11px] font-bold text-zinc-500">
                            {v.distance_m != null ? `${Math.round(v.distance_m ?? 0)}m` : "—"}
                          </p>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Exceptions ── */}
      {activeTab === "exceptions" && (
        <div className="space-y-4">
          {/* Summary strip */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-orange-100 bg-orange-50/60 px-4 py-2 dark:border-orange-900/20 dark:bg-orange-900/10">
              <span className="h-2 w-2 rounded-full bg-orange-400" />
              <span className="text-[11px] font-black text-orange-700 dark:text-orange-400">Exception (pending): {pendingCount}</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-2 dark:border-emerald-900/20 dark:bg-emerald-900/10">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-[11px] font-black text-emerald-700 dark:text-emerald-400">Exception (approved): {exceptions.filter(v => !!v.approved_by_manager_id).length}</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50/60 px-4 py-2 dark:border-red-900/20 dark:bg-red-900/10">
              <span className="h-2 w-2 rounded-full bg-red-400" />
              <span className="text-[11px] font-black text-red-700 dark:text-red-400">Exception (flagged): {exceptions.filter(v => !!v.flagged_by_manager_id).length}</span>
            </div>
          </div>
          <ExceptionList
            visits={filteredExceptions}
            isLoading={exLoading}
            reps={exceptionReps}
            repFilter={repFilter}
            setRepFilter={setRepFilter}
            reasonFilter={reasonFilter}
            setReasonFilter={setReasonFilter}
            expandedId={expandedId}
            setExpandedId={setExpandedId}
            managerNoteInput={managerNoteInput}
            setManagerNoteInput={setManagerNoteInput}
            actionLoading={actionLoading}
            onAction={handleAction}
            regions={regions}
            regionFilter={regionFilter}
            setRegionFilter={setRegionFilter}
            emptyMessage="No exceptions found."
          />
        </div>
      )}

      {/* ── Tab: Pending Review ── */}
      {activeTab === "pending" && (
        <div className="space-y-4">
          {/* Summary strip */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50/60 px-4 py-2 dark:border-red-900/20 dark:bg-red-900/10">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
              <span className="text-[11px] font-black text-red-700 dark:text-red-400">{pendingCount} pending review — needs your action</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-2 dark:border-emerald-900/20 dark:bg-emerald-900/10">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-[11px] font-black text-emerald-700 dark:text-emerald-400">Exception (approved): {exceptions.filter(v => !!v.approved_by_manager_id).length}</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-2 dark:border-zinc-700 dark:bg-zinc-800">
              <span className="h-2 w-2 rounded-full bg-zinc-400" />
              <span className="text-[11px] font-black text-zinc-600 dark:text-zinc-400">Exception (flagged): {exceptions.filter(v => !!v.flagged_by_manager_id).length}</span>
            </div>
          </div>
          <ExceptionList
            visits={filteredPending}
            isLoading={exLoading}
            reps={exceptionReps}
            repFilter={repFilter}
            setRepFilter={setRepFilter}
            reasonFilter={reasonFilter}
            setReasonFilter={setReasonFilter}
            expandedId={expandedId}
            setExpandedId={setExpandedId}
            managerNoteInput={managerNoteInput}
            setManagerNoteInput={setManagerNoteInput}
            actionLoading={actionLoading}
            onAction={handleAction}
            regions={regions}
            regionFilter={regionFilter}
            setRegionFilter={setRegionFilter}
            emptyMessage="No pending reviews. All caught up! 🎉"
          />
        </div>
      )}
    </div>
  );
}

// ── Shared exception list component ──
type Visit = NonNullable<VisitListResponse["visits"]>[number];

function ExceptionList({
  visits,
  isLoading,
  reps,
  repFilter,
  setRepFilter,
  reasonFilter,
  setReasonFilter,
  expandedId,
  setExpandedId,
  managerNoteInput,
  setManagerNoteInput,
  actionLoading,
  onAction,
  regions,
  regionFilter,
  setRegionFilter,
  emptyMessage,
}: {
  visits: Visit[];
  isLoading: boolean;
  reps: string[];
  repFilter: string;
  setRepFilter: (v: string) => void;
  reasonFilter: string;
  setReasonFilter: (v: string) => void;
  expandedId: string | null;
  setExpandedId: (v: string | null) => void;
  managerNoteInput: Record<string, string>;
  setManagerNoteInput: (fn: (prev: Record<string, string>) => Record<string, string>) => void;
  actionLoading: string | null;
  onAction: (id: string, action: "approve" | "flag") => void;
  regions: any[];
  regionFilter: string;
  setRegionFilter: (v: string) => void;
  emptyMessage: string;
}) {
  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Rep</label>
          <select
            value={repFilter}
            onChange={e => setRepFilter(e.target.value)}
            className="rounded-xl border border-zinc-100 bg-white px-3 py-2 text-[12px] font-bold text-zinc-700 shadow-sm outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
          >
            <option value="all">All Reps</option>
            {reps.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Reason</label>
          <select
            value={reasonFilter}
            onChange={e => setReasonFilter(e.target.value)}
            className="rounded-xl border border-zinc-100 bg-white px-3 py-2 text-[12px] font-bold text-zinc-700 shadow-sm outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
          >
            <option value="all">All Reasons</option>
            {Object.entries(EXCEPTION_REASON_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Region</label>
          <select
            value={regionFilter}
            onChange={e => setRegionFilter(e.target.value)}
            className="rounded-xl border border-zinc-100 bg-white px-3 py-2 text-[12px] font-bold text-zinc-700 shadow-sm outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 min-w-[120px]"
          >
            <option value="all">All Regions</option>
            {regions.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-20 animate-pulse rounded-3xl bg-zinc-100 dark:bg-zinc-800" />)}
          </div>
        ) : visits.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[40px] border border-dashed border-zinc-200 py-20 dark:border-zinc-800">
            <div className="text-4xl">🎉</div>
            <p className="mt-4 text-sm font-bold text-zinc-400">{emptyMessage}</p>
          </div>
        ) : (
          visits.map(v => {
            const isExpanded = expandedId === v.id;
            const isApproved = !!v.approved_by_manager_id;
            const isFlagged = !!v.flagged_by_manager_id;
            const isPending = !isApproved && !isFlagged;

            return (
              <div
                key={v.id}
                className={`overflow-hidden rounded-3xl border transition-all ${
                  isApproved ? "border-emerald-100 bg-emerald-50/30 dark:border-emerald-900/30 dark:bg-emerald-900/5" :
                  isFlagged ? "border-red-100 bg-red-50/30 dark:border-red-900/30 dark:bg-red-900/5" :
                  "border-zinc-100 bg-white dark:border-zinc-800 dark:bg-zinc-900"
                }`}
              >
                <div
                  className="flex cursor-pointer items-center gap-4 p-5"
                  onClick={() => setExpandedId(isExpanded ? null : v.id)}
                >
                  <div className={`h-2.5 w-2.5 shrink-0 rounded-full ${isApproved ? "bg-emerald-500" : isFlagged ? "bg-red-500" : "bg-orange-400"}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[13px] font-black text-zinc-900 dark:text-zinc-100">{v.rep_name}</span>
                      <span className="text-zinc-300 dark:text-zinc-700">→</span>
                      <span className="text-[13px] font-bold text-zinc-600 dark:text-zinc-400">{v.shop_name}</span>
                    </div>
                    <p className="mt-0.5 text-[11px] font-medium text-zinc-400">
                      {new Date(v.started_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${REASON_COLORS[v.exception_reason || "other"]}`}>
                    {EXCEPTION_REASON_LABELS[v.exception_reason || "other"] || v.exception_reason}
                  </span>
                  {v.distance_m != null && (
                    <span className="shrink-0 text-[11px] font-bold text-zinc-400">{Math.round(v.distance_m ?? 0)}m away</span>
                  )}
                  <span className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
                    isApproved ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                    isFlagged ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                    "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                  }`}>
                    {isApproved ? "Approved" : isFlagged ? "Flagged" : "Pending"}
                  </span>
                  <svg
                    className={`shrink-0 text-zinc-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>

                {isExpanded && (
                  <div className="border-t border-zinc-100 px-5 pb-5 pt-4 dark:border-zinc-800">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div className="space-y-3">
                        {v.exception_note && (
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Rep's Note</p>
                            <p className="mt-1 text-[13px] font-medium text-zinc-700 dark:text-zinc-300">{v.exception_note}</p>
                          </div>
                        )}
                        <div className="flex gap-6">
                          {v.distance_m != null && (
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Distance</p>
                              <p className="mt-1 text-[13px] font-bold text-zinc-900 dark:text-zinc-100">{Math.round(v.distance_m ?? 0)}m</p>
                            </div>
                          )}
                          {v.gps_accuracy_m != null && (
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">GPS Accuracy</p>
                              <p className={`mt-1 text-[13px] font-bold ${(v.gps_accuracy_m ?? 0) > 50 ? "text-orange-500" : "text-emerald-500"}`}>
                                ±{Math.round(v.gps_accuracy_m ?? 0)}m
                              </p>
                            </div>
                          )}
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Method</p>
                            <p className="mt-1 text-[13px] font-bold text-zinc-900 dark:text-zinc-100">
                              {v.verification_method?.replace("_", " ") || "—"}
                            </p>
                          </div>
                        </div>
                        {v.manager_note && (
                          <div className="rounded-2xl bg-zinc-50 p-3 dark:bg-zinc-800">
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Manager Note</p>
                            <p className="mt-1 text-[12px] font-medium text-zinc-600 dark:text-zinc-400">{v.manager_note}</p>
                          </div>
                        )}
                      </div>

                      {isPending ? (
                        <div className="space-y-3">
                          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Manager Note (optional)</p>
                          <textarea
                            rows={2}
                            placeholder="Add a note..."
                            value={managerNoteInput[v.id] || ""}
                            onChange={e => setManagerNoteInput(prev => ({ ...prev, [v.id]: e.target.value }))}
                            className="w-full resize-none rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-3 text-[12px] font-medium outline-none transition-all focus:border-zinc-200 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
                          />
                          <div className="flex gap-3">
                            <button
                              onClick={() => onAction(v.id, "approve")}
                              disabled={actionLoading === v.id + "approve"}
                              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-500 text-[11px] font-black uppercase tracking-widest text-white shadow-lg shadow-emerald-500/20 transition-all hover:brightness-110 disabled:opacity-50"
                            >
                              ✓ {actionLoading === v.id + "approve" ? "..." : "Approve"}
                            </button>
                            <button
                              onClick={() => onAction(v.id, "flag")}
                              disabled={actionLoading === v.id + "flag"}
                              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 text-[11px] font-black uppercase tracking-widest text-red-600 transition-all hover:bg-red-100 disabled:opacity-50 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-400"
                            >
                              ⚑ {actionLoading === v.id + "flag" ? "..." : "Flag"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className={`flex items-center justify-center rounded-2xl p-6 ${isApproved ? "bg-emerald-50 dark:bg-emerald-900/10" : "bg-red-50 dark:bg-red-900/10"}`}>
                          <div className="text-center">
                            <div className={`text-3xl ${isApproved ? "text-emerald-500" : "text-red-500"}`}>
                              {isApproved ? "✓" : "⚑"}
                            </div>
                            <p className={`mt-2 text-[11px] font-black uppercase tracking-widest ${isApproved ? "text-emerald-600" : "text-red-600"}`}>
                              {isApproved ? "Approved by manager" : "Flagged for review"}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
