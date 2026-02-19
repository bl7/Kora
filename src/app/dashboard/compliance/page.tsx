"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { Breadcrumbs } from "../_lib/breadcrumbs";
import Link from "next/link";

type FlaggedRep = {
  rep_id: string;
  rep_name: string;
  flag_type: "high_exception_rate" | "frequent_far_starts" | "repeated_coordinates";
  total_visits: number;
  exception_count: number;
  exception_rate: number;
  detail: string | null;
};

type ExceptionVisit = {
  id: string;
  rep_name: string;
  shop_name: string;
  exception_reason: string;
  exception_note: string | null;
  started_at: string;
  distance_m: number | null;
  gps_accuracy_m: number | null;
  approved_by_manager_id: string | null;
  flagged_by_manager_id: string | null;
};

const FLAG_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  high_exception_rate: {
    label: "High Exception Rate",
    color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    icon: "🚨",
  },
  frequent_far_starts: {
    label: "Frequent Far Starts",
    color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    icon: "📍",
  },
  repeated_coordinates: {
    label: "Repeated Coordinates",
    color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    icon: "🔁",
  },
};

const REASON_LABELS: Record<string, string> = {
  gps_drift: "GPS Drift",
  shop_moved: "Shop Moved",
  road_blocked: "Road Blocked",
  alternate_location: "Alternate Location",
  customer_requested_outside: "Customer Outside",
  low_gps_accuracy: "Low GPS Accuracy",
  other: "Other",
};

export default function CompliancePage() {
  const { data: flaggedData, isLoading: flaggedLoading } = useSWR<{ ok: boolean; flagged: FlaggedRep[] }>(
    "/api/manager/reports/flagged",
    fetcher
  );
  const { data: exceptionsData, isLoading: exceptionsLoading } = useSWR<{ ok: boolean; visits: ExceptionVisit[] }>(
    "/api/manager/visits?exceptions_only=true",
    fetcher
  );

  const flagged = flaggedData?.flagged || [];
  const exceptions = exceptionsData?.visits || [];

  // Exception reason breakdown
  const reasonBreakdown = exceptions.reduce((acc, v) => {
    const r = v.exception_reason || "other";
    acc[r] = (acc[r] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pending = exceptions.filter(v => !v.approved_by_manager_id && !v.flagged_by_manager_id).length;
  const approved = exceptions.filter(v => !!v.approved_by_manager_id).length;
  const flaggedCount = exceptions.filter(v => !!v.flagged_by_manager_id).length;

  return (
    <div className="space-y-10 pb-12">
      <div className="space-y-1">
        <Breadcrumbs items={[{ label: "COMPLIANCE" }]} />
        <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">Compliance</h1>
        <p className="text-sm font-medium text-zinc-500">Exception patterns, auto-flagged reps, and visit integrity.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-zinc-100 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Total Exceptions</p>
          <p className="mt-2 text-3xl font-black text-zinc-900 dark:text-zinc-100">{exceptions.length}</p>
        </div>
        <div className="rounded-3xl border border-amber-100 bg-amber-50/50 p-6 dark:border-amber-900/30 dark:bg-amber-900/5">
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-500">Pending Review</p>
          <p className="mt-2 text-3xl font-black text-amber-600 dark:text-amber-400">{pending}</p>
        </div>
        <div className="rounded-3xl border border-emerald-100 bg-emerald-50/50 p-6 dark:border-emerald-900/30 dark:bg-emerald-900/5">
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Approved</p>
          <p className="mt-2 text-3xl font-black text-emerald-600 dark:text-emerald-400">{approved}</p>
        </div>
        <div className="rounded-3xl border border-red-100 bg-red-50/50 p-6 dark:border-red-900/30 dark:bg-red-900/5">
          <p className="text-[10px] font-black uppercase tracking-widest text-red-400">Flagged</p>
          <p className="mt-2 text-3xl font-black text-red-600 dark:text-red-400">{flaggedCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Auto-Flagged Reps */}
        <div className="rounded-[40px] border border-zinc-100 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100">Auto-Flagged Reps</h2>
              <p className="mt-0.5 text-[11px] font-medium text-zinc-400">Detected this week based on behavior patterns</p>
            </div>
            {flagged.length > 0 && (
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-[11px] font-black text-white">
                {flagged.length}
              </span>
            )}
          </div>

          {flaggedLoading ? (
            <div className="space-y-3">
              {[1, 2].map(i => <div key={i} className="h-16 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />)}
            </div>
          ) : flagged.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-200 py-12 dark:border-zinc-800">
              <span className="text-3xl">✅</span>
              <p className="mt-3 text-sm font-bold text-zinc-400">No abnormal behavior detected this week</p>
            </div>
          ) : (
            <div className="space-y-3">
              {flagged.map((rep, i) => {
                const meta = FLAG_LABELS[rep.flag_type];
                return (
                  <div key={`${rep.rep_id}-${rep.flag_type}-${i}`} className="flex items-start gap-4 rounded-2xl border border-zinc-50 p-4 dark:border-zinc-800">
                    <span className="text-xl">{meta.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[13px] font-black text-zinc-900 dark:text-zinc-100">{rep.rep_name}</p>
                        <span className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-widest ${meta.color}`}>
                          {meta.label}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] font-medium text-zinc-400">
                        {rep.flag_type === "high_exception_rate"
                          ? `${rep.exception_rate}% exception rate — ${rep.exception_count} of ${rep.total_visits} visits`
                          : rep.detail || `${rep.total_visits} visits this week`}
                      </p>
                    </div>
                    <Link
                      href={`/dashboard/visits?tab=exceptions`}
                      className="shrink-0 rounded-xl bg-zinc-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-400"
                    >
                      Review
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Exception Reason Breakdown */}
        <div className="rounded-[40px] border border-zinc-100 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-6">
            <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100">Exception Reasons</h2>
            <p className="mt-0.5 text-[11px] font-medium text-zinc-400">All-time breakdown by reason</p>
          </div>

          {exceptionsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-10 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />)}
            </div>
          ) : Object.keys(reasonBreakdown).length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-200 py-12 dark:border-zinc-800">
              <span className="text-3xl">📋</span>
              <p className="mt-3 text-sm font-bold text-zinc-400">No exceptions recorded yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(reasonBreakdown)
                .sort(([, a], [, b]) => b - a)
                .map(([reason, count]) => {
                  const pct = exceptions.length > 0 ? Math.round((count / exceptions.length) * 100) : 0;
                  return (
                    <div key={reason}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[12px] font-bold text-zinc-700 dark:text-zinc-300">
                          {REASON_LABELS[reason] || reason}
                        </span>
                        <span className="text-[11px] font-black text-zinc-500">{count} <span className="font-medium text-zinc-400">({pct}%)</span></span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <div
                          className="h-full rounded-full bg-[#f4a261] transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* Pending exceptions with 1-click drilldown */}
      {pending > 0 && (
        <div className="rounded-[40px] border border-amber-100 bg-amber-50/40 p-8 dark:border-amber-900/20 dark:bg-amber-900/5">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100">
                {pending} Exception{pending !== 1 ? "s" : ""} Pending Review
              </h2>
              <p className="mt-0.5 text-[11px] font-medium text-zinc-500">These visits need your Approve or Flag action.</p>
            </div>
            <Link
              href="/dashboard/visits?tab=pending"
              className="inline-flex h-10 items-center gap-2 rounded-2xl bg-[#f4a261] px-5 text-[11px] font-black uppercase tracking-widest text-white transition-all hover:opacity-90"
            >
              Review All
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </Link>
          </div>
          <div className="space-y-2">
            {exceptions.filter(v => !v.approved_by_manager_id && !v.flagged_by_manager_id).slice(0, 5).map(v => (
              <div key={v.id} className="flex items-center gap-4 rounded-2xl bg-white px-5 py-4 dark:bg-zinc-900">
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-black text-zinc-900 dark:text-zinc-100 truncate">{v.shop_name}</p>
                  <p className="text-[11px] font-medium text-zinc-400">{v.rep_name} · {REASON_LABELS[v.exception_reason] || v.exception_reason}</p>
                </div>
                <span className="shrink-0 text-[11px] font-medium text-zinc-400">
                  {new Date(v.started_at).toLocaleDateString()}
                </span>
              </div>
            ))}
            {pending > 5 && (
              <p className="text-center text-[11px] font-bold text-zinc-400 pt-2">
                +{pending - 5} more — <Link href="/dashboard/visits?tab=pending" className="text-[#f4a261] hover:underline">View all</Link>
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
