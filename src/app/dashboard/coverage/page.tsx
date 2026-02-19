"use client";

import { useMemo, useState, Suspense } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { CoverageReportResponse } from "../_lib/types";
import { Breadcrumbs } from "../_lib/breadcrumbs";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type Tab = "coverage" | "unvisited" | "atrisk";

const DAY_OPTIONS = [7, 14, 30, 60];

export default function CoveragePage() {
  return (
    <Suspense fallback={<div className="animate-pulse space-y-4"><div className="h-32 rounded-3xl bg-zinc-100 dark:bg-zinc-800" /></div>}>
      <CoveragePageInner />
    </Suspense>
  );
}

function CoveragePageInner() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>((searchParams.get("tab") as Tab) || "coverage");

  // Coverage tab state
  const [dateRange, setDateRange] = useState(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 7);
    return {
      from: start.toISOString().split("T")[0],
      to: end.toISOString().split("T")[0],
    };
  });

  // Unvisited tab state
  const [days, setDays] = useState(7);
  const [repFilter, setRepFilter] = useState("all");

  // Data fetching
  const { data: coverageData, isLoading: coverageLoading } = useSWR<CoverageReportResponse>(
    `/api/manager/reports/coverage?dateFrom=${dateRange.from}&dateTo=${dateRange.to}`,
    fetcher
  );

  const unvisitedUrl = `/api/manager/reports/unvisited?days=${days}${repFilter !== "all" ? `&rep=${repFilter}` : ""}`;
  const { data: unvisitedData, isLoading: unvisitedLoading } = useSWR<{
    ok: boolean; shops: any[]; days: number; total: number;
  }>(unvisitedUrl, fetcher);

  const { data: atRiskData, isLoading: atRiskLoading } = useSWR<{
    ok: boolean; shops: any[];
  }>("/api/manager/reports/at-risk", fetcher);

  const [atRiskSort, setAtRiskSort] = useState<"value" | "visit" | "order">("value");
  const [atRiskSearch, setAtRiskSearch] = useState("");

  const report = coverageData?.report || [];
  const unvisited = unvisitedData?.shops || [];

  // Coverage stats
  const totalAssigned = report.reduce((acc, curr) => acc + curr.total_assigned, 0);
  const totalVisitedUnique = report.reduce((acc, curr) => acc + curr.shops_visited, 0);
  const avgCoverage = totalAssigned > 0 ? Math.round((totalVisitedUnique / totalAssigned) * 100) : 0;
  const totalSales = report.reduce((acc, curr) => acc + curr.total_sales, 0);

  // Unique reps from unvisited for filter
  const reps = useMemo(() => {
    const seen = new Set<string>();
    return unvisited
      .filter(s => s.assigned_rep_id && !seen.has(s.assigned_rep_id) && seen.add(s.assigned_rep_id))
      .map(s => ({ id: s.assigned_rep_id, name: s.assigned_rep_name }));
  }, [unvisited]);

  // Unvisited stats
  const neverVisited = unvisited.filter(s => s.days_since_last_visit === null).length;
  const highValue = unvisited.filter(s => s.revenue_30d > 0).length;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <Breadcrumbs items={[{ label: "REPORTS", href: "/dashboard/coverage" }, { label: "COVERAGE" }]} />
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">Team Coverage</h1>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 rounded-2xl border border-zinc-100 bg-zinc-50 p-1 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          {([
            { id: "coverage", label: "Coverage %" },
            { id: "unvisited", label: "Unvisited", count: unvisitedData?.total },
            { id: "atrisk", label: "At-Risk", count: atRiskData?.shops?.length, alert: true },
          ] as { id: Tab; label: string; count?: number; alert?: boolean }[]).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-[11px] font-black uppercase tracking-widest transition-all ${
                tab === t.id ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-100" : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              }`}
            >
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span className={`flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-black ${
                  t.alert && tab !== t.id ? "bg-red-500 text-white" : "bg-zinc-100 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400"
                }`}>{t.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── TAB: Rep Coverage ── */}
      {tab === "coverage" && (
        <>
          {/* Date range */}
          <div className="flex items-center gap-2 self-start rounded-2xl bg-white p-2 shadow-sm dark:bg-zinc-900">
            <input
              type="date"
              value={dateRange.from}
              onChange={e => setDateRange({ ...dateRange, from: e.target.value })}
              className="rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-100"
            />
            <span className="text-zinc-400">–</span>
            <input
              type="date"
              value={dateRange.to}
              onChange={e => setDateRange({ ...dateRange, to: e.target.value })}
              className="rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <StatCard label="Overall Coverage" value={`${avgCoverage}%`} color={avgCoverage < 50 ? "red" : avgCoverage < 80 ? "orange" : "emerald"} />
            <StatCard label="Total Sales (Period)" value={`$${totalSales.toLocaleString()}`} color="blue" />
            <StatCard label="Active Reps" value={report.length} color="indigo" />
          </div>

          <div className="rounded-[40px] border border-zinc-100 bg-white shadow-sm overflow-hidden dark:border-zinc-800 dark:bg-zinc-900">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-50 bg-zinc-50/50 text-left text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:border-zinc-800 dark:bg-zinc-800/50">
                    <th className="px-8 py-6">Representative</th>
                    <th className="px-6 py-6 text-center">Coverage</th>
                    <th className="px-6 py-6 text-right">Assigned</th>
                    <th className="px-6 py-6 text-right">Visited</th>
                    <th className="px-6 py-6 text-right">Orders</th>
                    <th className="px-8 py-6 text-right">Sales</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800">
                  {coverageLoading ? (
                    [1, 2, 3].map(i => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={6} className="h-20 bg-zinc-50 dark:bg-zinc-800/50" />
                      </tr>
                    ))
                  ) : report.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-8 py-12 text-center text-sm font-medium text-zinc-400">
                        No data found for this period
                      </td>
                    </tr>
                  ) : (
                    report.map(row => (
                      <tr key={row.rep_id} className="group transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 text-[12px] font-black text-zinc-500 dark:bg-zinc-800">
                              {row.rep_name.charAt(0)}
                            </div>
                            <p className="text-[13px] font-black text-zinc-900 dark:text-zinc-100">{row.rep_name}</p>
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          <div className="flex flex-col items-center gap-1.5">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-black ${
                              row.coverage_percentage < 50 ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400" :
                              row.coverage_percentage < 80 ? "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400" :
                              "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
                            }`}>
                              {row.coverage_percentage}%
                            </span>
                            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                              <div
                                className={`h-full rounded-full ${row.coverage_percentage < 50 ? "bg-red-400" : row.coverage_percentage < 80 ? "bg-orange-400" : "bg-emerald-400"}`}
                                style={{ width: `${row.coverage_percentage}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-6 text-right font-medium text-zinc-600 dark:text-zinc-400">{row.total_assigned}</td>
                        <td className="px-6 py-6 text-right font-medium text-zinc-600 dark:text-zinc-400">{row.shops_visited}</td>
                        <td className="px-6 py-6 text-right font-medium text-zinc-600 dark:text-zinc-400">{row.orders_count}</td>
                        <td className="px-8 py-6 text-right font-black text-zinc-900 dark:text-zinc-100">${row.total_sales.toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── TAB: Unvisited Shops ── */}
      {tab === "unvisited" && (
        <>
          {/* Controls */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Not visited in</span>
              <div className="flex gap-1.5">
                {DAY_OPTIONS.map(d => (
                  <button
                    key={d}
                    onClick={() => setDays(d)}
                    className={`rounded-xl px-4 py-2 text-[11px] font-black uppercase tracking-widest transition-all ${
                      days === d ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900" : "bg-zinc-50 text-zinc-500 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-400"
                    }`}
                  >
                    {d}d
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Rep</span>
              <select
                value={repFilter}
                onChange={e => setRepFilter(e.target.value)}
                className="rounded-xl border border-zinc-100 bg-white px-3 py-2 text-[12px] font-bold text-zinc-700 shadow-sm outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
              >
                <option value="all">All Reps</option>
                {reps.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
          </div>

          {/* Unvisited stats */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-red-100 bg-red-50/50 p-6 dark:border-red-900/30 dark:bg-red-900/5">
              <p className="text-[10px] font-black uppercase tracking-widest text-red-400">Not Visited ({days}d+)</p>
              <p className="mt-2 text-3xl font-black text-red-600 dark:text-red-400">{unvisited.length}</p>
            </div>
            <div className="rounded-3xl border border-zinc-100 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Never Visited</p>
              <p className="mt-2 text-3xl font-black text-zinc-900 dark:text-zinc-100">{neverVisited}</p>
            </div>
            <div className="rounded-3xl border border-emerald-100 bg-emerald-50/50 p-6 dark:border-emerald-900/30 dark:bg-emerald-900/5">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">With Revenue (30d)</p>
              <p className="mt-2 text-3xl font-black text-emerald-600 dark:text-emerald-400">{highValue}</p>
            </div>
          </div>

          {/* Unvisited table */}
          <div className="rounded-[40px] border border-zinc-100 bg-white shadow-sm overflow-hidden dark:border-zinc-800 dark:bg-zinc-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-zinc-50 bg-zinc-50/50 text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:border-zinc-800 dark:bg-zinc-800/50">
                    <th className="px-8 py-6">Shop</th>
                    <th className="py-6">Assigned Rep</th>
                    <th className="py-6 text-center">Last Visit</th>
                    <th className="py-6 text-right">30d Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800">
                  {unvisitedLoading ? (
                    [1, 2, 3, 4].map(i => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={4} className="h-16 bg-zinc-50 dark:bg-zinc-800/50" />
                      </tr>
                    ))
                  ) : unvisited.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-16 text-center">
                        <div className="text-3xl">🎉</div>
                        <p className="mt-3 text-sm font-bold text-zinc-400">All shops visited in the last {days} days!</p>
                      </td>
                    </tr>
                  ) : (
                    unvisited.map(shop => (
                      <tr key={shop.shop_id} className={`group transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 ${shop.days_since_last_visit === null ? "border-l-4 border-l-red-400" : ""}`}>
                        <td className="px-8 py-5">
                          <p className="text-[13px] font-black text-zinc-900 dark:text-zinc-100">{shop.shop_name}</p>
                          {shop.shop_address && (
                            <p className="mt-0.5 text-[11px] font-medium text-zinc-400 truncate max-w-[200px]">{shop.shop_address}</p>
                          )}
                        </td>
                        <td className="py-5">
                          {shop.assigned_rep_name ? (
                            <span className="text-[12px] font-bold text-zinc-700 dark:text-zinc-300">{shop.assigned_rep_name}</span>
                          ) : (
                            <span className="text-[11px] font-bold text-red-400">Unassigned</span>
                          )}
                        </td>
                        <td className="py-5 text-center">
                          {shop.days_since_last_visit === null ? (
                            <span className="inline-block rounded-full bg-red-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-red-700 dark:bg-red-900/30 dark:text-red-400">
                              Never
                            </span>
                          ) : (
                            <span className={`inline-block rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${
                              shop.days_since_last_visit >= 30 ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                              shop.days_since_last_visit >= 14 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                              "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                            }`}>
                              {shop.days_since_last_visit}d ago
                            </span>
                          )}
                        </td>
                        <td className="py-5 pr-8 text-right">
                          <p className={`text-[13px] font-black ${shop.revenue_30d > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400"}`}>
                            {shop.revenue_30d > 0 ? `$${shop.revenue_30d.toLocaleString()}` : "—"}
                          </p>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── TAB: At-Risk Shops ── */}
      {tab === "atrisk" && (() => {
        const atRiskShops = atRiskData?.shops || [];
        const filtered = atRiskShops
          .filter((s: any) =>
            s.shop_name.toLowerCase().includes(atRiskSearch.toLowerCase()) ||
            (s.assigned_rep_name || "").toLowerCase().includes(atRiskSearch.toLowerCase())
          )
          .sort((a: any, b: any) => {
            if (atRiskSort === "visit") return (b.days_since_last_visit ?? 9999) - (a.days_since_last_visit ?? 9999);
            if (atRiskSort === "order") return (b.days_since_last_order ?? 9999) - (a.days_since_last_order ?? 9999);
            // Default: highest 30d value, then oldest visit age as tiebreaker
            const valueDiff = b.total_order_value_30d - a.total_order_value_30d;
            if (valueDiff !== 0) return valueDiff;
            return (b.days_since_last_visit ?? 9999) - (a.days_since_last_visit ?? 9999);
          });

        const neverVisited = atRiskShops.filter((s: any) => s.days_since_last_visit === null).length;
        const overdueVisit = atRiskShops.filter((s: any) => s.days_since_last_visit !== null && s.days_since_last_visit >= 7).length;
        const noOrders30d = atRiskShops.filter((s: any) => s.total_order_value_30d === 0).length;

        return (
          <>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="rounded-3xl border border-zinc-100 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Total At-Risk</p>
                <p className="mt-2 text-3xl font-black text-zinc-900 dark:text-zinc-100">{atRiskShops.length}</p>
              </div>
              <div className="rounded-3xl border border-red-100 bg-red-50/50 p-6 dark:border-red-900/30 dark:bg-red-900/5">
                <p className="text-[10px] font-black uppercase tracking-widest text-red-400">Never Visited</p>
                <p className="mt-2 text-3xl font-black text-red-600 dark:text-red-400">{neverVisited}</p>
              </div>
              <div className="rounded-3xl border border-amber-100 bg-amber-50/50 p-6 dark:border-amber-900/30 dark:bg-amber-900/5">
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-500">Overdue Visit (7d+)</p>
                <p className="mt-2 text-3xl font-black text-amber-600 dark:text-amber-400">{overdueVisit}</p>
              </div>
              <div className="rounded-3xl border border-zinc-100 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">No Orders (30d)</p>
                <p className="mt-2 text-3xl font-black text-zinc-900 dark:text-zinc-100">{noOrders30d}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  type="text"
                  placeholder="Search shops or reps..."
                  value={atRiskSearch}
                  onChange={e => setAtRiskSearch(e.target.value)}
                  className="h-11 w-72 rounded-2xl border border-zinc-100 bg-white pl-12 pr-4 text-sm font-medium shadow-sm outline-none focus:border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Sort</span>
                {[["value", "Order Value"], ["visit", "Days Since Visit"], ["order", "Days Since Order"]].map(([k, label]) => (
                  <button key={k} onClick={() => setAtRiskSort(k as any)}
                    className={`rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${atRiskSort === k ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900" : "bg-zinc-50 text-zinc-500 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-400"}`}
                  >{label}</button>
                ))}
              </div>
            </div>

            <div className="rounded-[40px] border border-zinc-100 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-zinc-50 dark:border-zinc-800/60">
                      <th className="px-8 pb-5 pt-8 text-[10px] font-black uppercase tracking-widest text-zinc-400">Shop</th>
                      <th className="pb-5 pt-8 text-[10px] font-black uppercase tracking-widest text-zinc-400">Assigned Rep</th>
                      <th className="pb-5 pt-8 text-center text-[10px] font-black uppercase tracking-widest text-zinc-400">Last Visit</th>
                      <th className="pb-5 pt-8 text-center text-[10px] font-black uppercase tracking-widest text-zinc-400">Last Order</th>
                      <th className="pb-5 pt-8 text-right text-[10px] font-black uppercase tracking-widest text-zinc-400">30d Revenue</th>
                      <th className="pb-5 pr-8 pt-8 text-right text-[10px] font-black uppercase tracking-widest text-zinc-400">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/40">
                    {atRiskLoading ? (
                      <tr><td colSpan={6} className="py-16 text-center text-sm font-medium text-zinc-400">Loading...</td></tr>
                    ) : filtered.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-16 text-center">
                          <div className="text-3xl">🎉</div>
                          <p className="mt-3 text-sm font-bold text-zinc-400">No at-risk shops</p>
                        </td>
                      </tr>
                    ) : filtered.map((shop: any) => {
                      const isNeverVisited = shop.days_since_last_visit === null;
                      const isDangerVisit = shop.days_since_last_visit !== null && shop.days_since_last_visit >= 14;
                      return (
                        <tr key={shop.shop_id} className={`group transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 ${isNeverVisited || isDangerVisit ? "border-l-4 border-l-red-400" : ""}`}>
                          <td className="py-5 pl-8">
                            <p className="text-[13px] font-black text-zinc-900 dark:text-zinc-100">{shop.shop_name}</p>
                            {shop.total_order_value_30d > 0 && <span className="text-[10px] font-bold text-emerald-500">High Value</span>}
                          </td>
                          <td className="py-5">
                            {shop.assigned_rep_name
                              ? <span className="text-[12px] font-bold text-zinc-700 dark:text-zinc-300">{shop.assigned_rep_name}</span>
                              : <span className="text-[11px] font-bold text-red-400">Unassigned</span>}
                          </td>
                          <td className="py-5 text-center">
                            {isNeverVisited
                              ? <span className="rounded-full bg-red-100 px-2.5 py-1 text-[10px] font-black text-red-700 dark:bg-red-900/30 dark:text-red-400">Never</span>
                              : <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${shop.days_since_last_visit >= 14 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"}`}>{shop.days_since_last_visit}d ago</span>
                            }
                          </td>
                          <td className="py-5 text-center">
                            {shop.days_since_last_order === null
                              ? <span className="rounded-full bg-red-100 px-2.5 py-1 text-[10px] font-black text-red-700 dark:bg-red-900/30 dark:text-red-400">Never</span>
                              : <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${shop.days_since_last_order >= 30 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"}`}>{shop.days_since_last_order}d ago</span>
                            }
                          </td>
                          <td className="py-5 text-right">
                            <p className="text-[13px] font-black text-zinc-900 dark:text-zinc-100">${shop.total_order_value_30d.toLocaleString()}</p>
                          </td>
                          <td className="py-5 pr-8 text-right">
                            <Link href={`/dashboard/shops/${shop.shop_id}`}
                              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-zinc-50 px-4 text-[10px] font-black uppercase tracking-widest text-zinc-600 transition-all hover:bg-[#f4a261] hover:text-white dark:bg-zinc-800 dark:text-zinc-400"
                            >
                              View Shop
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        );
      })()}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  const colors: Record<string, string> = {
    red: "text-red-500",
    orange: "text-orange-500",
    emerald: "text-emerald-500",
    blue: "text-blue-500",
    indigo: "text-indigo-500",
  };

  return (
    <div className="rounded-[32px] border border-zinc-100 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{label}</p>
      <p className={`mt-4 text-3xl font-black tracking-tight ${colors[color] || "text-zinc-900"}`}>{value}</p>
    </div>
  );
}
