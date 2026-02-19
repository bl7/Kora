"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { Breadcrumbs } from "../_lib/breadcrumbs";
import Link from "next/link";

type AtRiskShop = {
  shop_id: string;
  shop_name: string;
  assigned_rep_name: string | null;
  assigned_rep_id: string | null;
  days_since_last_visit: number | null;
  days_since_last_order: number | null;
  total_order_value_30d: number;
  last_visit_at: string | null;
  last_order_at: string | null;
};

type AtRiskResponse = {
  ok: boolean;
  shops: AtRiskShop[];
};

function RiskBadge({ days, warnAt, dangerAt, label }: { days: number | null; warnAt: number; dangerAt: number; label: string }) {
  if (days === null) {
    return (
      <div className="text-center">
        <span className="inline-block rounded-full bg-red-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-red-700 dark:bg-red-900/30 dark:text-red-400">
          Never
        </span>
        <p className="mt-1 text-[9px] font-medium text-zinc-400">{label}</p>
      </div>
    );
  }
  const color =
    days >= dangerAt ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
    days >= warnAt  ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
  return (
    <div className="text-center">
      <span className={`inline-block rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${color}`}>
        {days}d ago
      </span>
      <p className="mt-1 text-[9px] font-medium text-zinc-400">{label}</p>
    </div>
  );
}

export default function AtRiskShopsPage() {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"value" | "visit" | "order">("value");

  const { data, isLoading } = useSWR<AtRiskResponse>("/api/manager/reports/at-risk", fetcher);
  const shops = data?.shops || [];

  const filtered = useMemo(() => {
    let list = shops.filter(s =>
      s.shop_name.toLowerCase().includes(search.toLowerCase()) ||
      (s.assigned_rep_name || "").toLowerCase().includes(search.toLowerCase())
    );
    if (sortBy === "visit") list = [...list].sort((a, b) => (b.days_since_last_visit ?? 9999) - (a.days_since_last_visit ?? 9999));
    if (sortBy === "order") list = [...list].sort((a, b) => (b.days_since_last_order ?? 9999) - (a.days_since_last_order ?? 9999));
    if (sortBy === "value") list = [...list].sort((a, b) => b.total_order_value_30d - a.total_order_value_30d);
    return list;
  }, [shops, search, sortBy]);

  const stats = useMemo(() => ({
    total: shops.length,
    neverVisited: shops.filter(s => s.days_since_last_visit === null).length,
    overdueVisit: shops.filter(s => s.days_since_last_visit !== null && s.days_since_last_visit >= 7).length,
    noOrders30d: shops.filter(s => s.total_order_value_30d === 0).length,
  }), [shops]);

  return (
    <div className="space-y-10 pb-12">
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <Breadcrumbs items={[{ label: "AT-RISK SHOPS" }]} />
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">At-Risk Shops</h1>
          <p className="text-sm font-medium text-zinc-500">Shops that haven't been visited or ordered recently. Act before they churn.</p>
        </div>
        <div className="relative shrink-0">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            type="text"
            placeholder="Search shops or reps..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-12 w-full rounded-2xl border border-zinc-100 bg-white pl-12 pr-4 text-sm font-medium shadow-sm outline-none transition-all focus:border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 md:w-72"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-zinc-100 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Total Shops</p>
          <p className="mt-2 text-3xl font-black text-zinc-900 dark:text-zinc-100">{stats.total}</p>
        </div>
        <div className="rounded-3xl border border-red-100 bg-red-50/50 p-6 shadow-sm dark:border-red-900/30 dark:bg-red-900/5">
          <p className="text-[10px] font-black uppercase tracking-widest text-red-400">Never Visited</p>
          <p className="mt-2 text-3xl font-black text-red-600 dark:text-red-400">{stats.neverVisited}</p>
        </div>
        <div className="rounded-3xl border border-amber-100 bg-amber-50/50 p-6 shadow-sm dark:border-amber-900/30 dark:bg-amber-900/5">
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-500">Overdue Visit (7d+)</p>
          <p className="mt-2 text-3xl font-black text-amber-600 dark:text-amber-400">{stats.overdueVisit}</p>
        </div>
        <div className="rounded-3xl border border-zinc-100 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">No Orders (30d)</p>
          <p className="mt-2 text-3xl font-black text-zinc-900 dark:text-zinc-100">{stats.noOrders30d}</p>
        </div>
      </div>

      {/* Sort controls */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Sort by</span>
        {[
          { key: "value", label: "Order Value" },
          { key: "visit", label: "Days Since Visit" },
          { key: "order", label: "Days Since Order" },
        ].map(s => (
          <button
            key={s.key}
            onClick={() => setSortBy(s.key as any)}
            className={`rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${
              sortBy === s.key
                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                : "bg-zinc-50 text-zinc-500 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-400"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Table */}
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
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-sm font-medium text-zinc-400">
                    Loading shops...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="text-3xl">🎉</div>
                    <p className="mt-3 text-sm font-bold text-zinc-400">No at-risk shops found</p>
                  </td>
                </tr>
              ) : (
                filtered.map(shop => {
                  const isHighValue = shop.total_order_value_30d > 0;
                  const isNeverVisited = shop.days_since_last_visit === null;
                  const isDangerVisit = shop.days_since_last_visit !== null && shop.days_since_last_visit >= 14;

                  return (
                    <tr
                      key={shop.shop_id}
                      className={`group transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 ${
                        isNeverVisited || isDangerVisit ? "border-l-4 border-l-red-400" : ""
                      }`}
                    >
                      <td className="py-5 pl-8">
                        <div>
                          <p className="text-[13px] font-black text-zinc-900 dark:text-zinc-100">{shop.shop_name}</p>
                          {isHighValue && (
                            <span className="mt-0.5 inline-block text-[10px] font-bold text-emerald-500">
                              High Value
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-5">
                        {shop.assigned_rep_name ? (
                          <span className="text-[12px] font-bold text-zinc-700 dark:text-zinc-300">
                            {shop.assigned_rep_name}
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-red-400">Unassigned</span>
                        )}
                      </td>
                      <td className="py-5 text-center">
                        <RiskBadge days={shop.days_since_last_visit} warnAt={7} dangerAt={14} label="Last Visit" />
                      </td>
                      <td className="py-5 text-center">
                        <RiskBadge days={shop.days_since_last_order} warnAt={14} dangerAt={30} label="Last Order" />
                      </td>
                      <td className="py-5 text-right">
                        <p className="text-[13px] font-black text-zinc-900 dark:text-zinc-100">
                          ${shop.total_order_value_30d.toLocaleString()}
                        </p>
                        <p className="text-[10px] font-medium text-zinc-400">last 30 days</p>
                      </td>
                      <td className="py-5 pr-8 text-right">
                        <Link
                          href={`/dashboard/shops/${shop.shop_id}`}
                          className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-zinc-50 px-4 text-[10px] font-black uppercase tracking-widest text-zinc-600 transition-all hover:bg-[#f4a261] hover:text-white dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-[#f4a261] dark:hover:text-white"
                        >
                          View Shop
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
