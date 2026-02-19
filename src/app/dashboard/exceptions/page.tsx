"use client";

import { useMemo, useState } from "react";
import useSWR, { mutate } from "swr";
import { fetcher } from "@/lib/fetcher";
import { Breadcrumbs } from "../_lib/breadcrumbs";
import type { VisitListResponse } from "../_lib/types";
import { useToast } from "../_lib/toast-context";

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

export default function ExceptionsPage() {
  const toast = useToast();
  const [repFilter, setRepFilter] = useState("all");
  const [reasonFilter, setReasonFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [managerNoteInput, setManagerNoteInput] = useState<Record<string, string>>({});

  const { data: visitsData, isLoading } = useSWR<VisitListResponse>(
    "/api/manager/visits?exceptions_only=true",
    fetcher
  );

  const exceptions = visitsData?.visits || [];

  // Unique reps from exceptions
  const reps = useMemo(() => {
    const seen = new Set<string>();
    return exceptions.filter(v => {
      if (seen.has(v.rep_name)) return false;
      seen.add(v.rep_name);
      return true;
    }).map(v => v.rep_name);
  }, [exceptions]);

  const filtered = useMemo(() => {
    return exceptions.filter(v => {
      const matchRep = repFilter === "all" || v.rep_name === repFilter;
      const matchReason = reasonFilter === "all" || v.exception_reason === reasonFilter;
      return matchRep && matchReason;
    });
  }, [exceptions, repFilter, reasonFilter]);

  const stats = useMemo(() => ({
    total: exceptions.length,
    pending: exceptions.filter(v => !v.approved_by_manager_id && !v.flagged_by_manager_id).length,
    approved: exceptions.filter(v => !!v.approved_by_manager_id).length,
    flagged: exceptions.filter(v => !!v.flagged_by_manager_id).length,
  }), [exceptions]);

  async function handleAction(visitId: string, action: "approve" | "flag") {
    setActionLoading(visitId + action);
    const note = managerNoteInput[visitId] || undefined;
    const res = await fetch(`/api/manager/visits/${visitId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        [action]: true,
        ...(note ? { managerNote: note } : {})
      }),
    });
    const data = await res.json();
    setActionLoading(null);
    if (data.ok) {
      toast.success(action === "approve" ? "Visit approved." : "Visit flagged for review.");
      mutate("/api/manager/visits?exceptions_only=true");
    } else {
      toast.error("Action failed.");
    }
  }

  return (
    <div className="space-y-10 pb-12">
      <div className="flex flex-col gap-2">
        <Breadcrumbs items={[{ label: "EXCEPTIONS" }]} />
        <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
          Exceptions Queue
        </h1>
        <p className="text-sm font-medium text-zinc-500">
          Visits where reps were outside the shop geofence. Review and approve or flag each one.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Total Exceptions" value={stats.total} color="zinc" />
        <StatCard label="Pending Review" value={stats.pending} color="orange" />
        <StatCard label="Approved" value={stats.approved} color="emerald" />
        <StatCard label="Flagged" value={stats.flagged} color="red" />
      </div>

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
      </div>

      {/* Exceptions List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-28 animate-pulse rounded-3xl bg-zinc-100 dark:bg-zinc-800" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[40px] border border-dashed border-zinc-200 py-20 dark:border-zinc-800">
            <div className="text-4xl">🎉</div>
            <p className="mt-4 text-sm font-bold text-zinc-400">No exceptions found</p>
            <p className="text-xs font-medium text-zinc-300 dark:text-zinc-600">All visits are verified or filters are too narrow.</p>
          </div>
        ) : (
          filtered.map(v => {
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
                {/* Main row */}
                <div
                  className="flex cursor-pointer items-center gap-4 p-5"
                  onClick={() => setExpandedId(isExpanded ? null : v.id)}
                >
                  {/* Status indicator */}
                  <div className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                    isApproved ? "bg-emerald-500" :
                    isFlagged ? "bg-red-500" :
                    "bg-orange-400"
                  }`} />

                  {/* Rep + Shop */}
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

                  {/* Reason badge */}
                  <span className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${REASON_COLORS[v.exception_reason || "other"]}`}>
                    {EXCEPTION_REASON_LABELS[v.exception_reason || "other"] || v.exception_reason}
                  </span>

                  {/* Distance */}
                  {v.distance_m != null && (
                    <span className="shrink-0 text-[11px] font-bold text-zinc-400">
                      {Math.round(v.distance_m ?? 0)}m away
                    </span>
                  )}

                  {/* Status badge */}
                  <span className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
                    isApproved ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                    isFlagged ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                    "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                  }`}>
                    {isApproved ? "Approved" : isFlagged ? "Flagged" : "Pending"}
                  </span>

                  {/* Expand chevron */}
                  <svg
                    className={`shrink-0 text-zinc-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-zinc-100 px-5 pb-5 pt-4 dark:border-zinc-800">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      {/* Left: details */}
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

                      {/* Right: actions */}
                      {isPending && (
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
                              onClick={() => handleAction(v.id, "approve")}
                              disabled={actionLoading === v.id + "approve"}
                              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-500 text-[11px] font-black uppercase tracking-widest text-white shadow-lg shadow-emerald-500/20 transition-all hover:brightness-110 disabled:opacity-50"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                              {actionLoading === v.id + "approve" ? "..." : "Approve"}
                            </button>
                            <button
                              onClick={() => handleAction(v.id, "flag")}
                              disabled={actionLoading === v.id + "flag"}
                              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 text-[11px] font-black uppercase tracking-widest text-red-600 transition-all hover:bg-red-100 disabled:opacity-50 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-400"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
                              {actionLoading === v.id + "flag" ? "..." : "Flag"}
                            </button>
                          </div>
                        </div>
                      )}

                      {!isPending && (
                        <div className={`flex items-center justify-center rounded-2xl p-6 ${
                          isApproved ? "bg-emerald-50 dark:bg-emerald-900/10" : "bg-red-50 dark:bg-red-900/10"
                        }`}>
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

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    zinc: "text-zinc-500 bg-zinc-50 dark:bg-zinc-800",
    orange: "text-orange-500 bg-orange-50 dark:bg-orange-900/20",
    emerald: "text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20",
    red: "text-red-500 bg-red-50 dark:bg-red-900/20",
  };

  return (
    <div className="rounded-3xl border border-zinc-100 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{label}</p>
      <p className={`mt-2 text-3xl font-black ${colors[color].split(" ")[0]}`}>{value}</p>
    </div>
  );
}
