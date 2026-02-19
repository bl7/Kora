"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { Breadcrumbs } from "../_lib/breadcrumbs";

type RepStat = {
  rep_id: string;
  rep_name: string;
  visits_today: number;
  orders_today: number;
  revenue_today: number;
  visits_week: number;
  orders_week: number;
  revenue_week: number;
  visits_mtd: number;
  orders_mtd: number;
  revenue_mtd: number;
  exceptions_mtd: number;
  verified_mtd: number;
  exception_rate_mtd: number;
  verified_rate_mtd: number;
};

type Period = "today" | "week" | "mtd";
type SortKey = "revenue" | "visits" | "orders" | "exception_rate";

const MEDAL = ["🥇", "🥈", "🥉"];

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function ExceptionDot({ rate }: { rate: number }) {
  const color = rate === 0 ? "bg-emerald-400" : rate < 20 ? "bg-amber-400" : "bg-red-500";
  return (
    <span className="flex items-center gap-1.5">
      <span className={`inline-block h-2 w-2 rounded-full ${color}`} />
      <span className={`text-[11px] font-black ${rate === 0 ? "text-emerald-600 dark:text-emerald-400" : rate < 20 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"}`}>
        {rate}%
      </span>
    </span>
  );
}

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<Period>("mtd");
  const [sortKey, setSortKey] = useState<SortKey>("revenue");
  const [showBottom, setShowBottom] = useState(false);

  const { data, isLoading } = useSWR<{ ok: boolean; reps: RepStat[] }>(
    "/api/manager/reports/leaderboard",
    fetcher
  );
  const reps = data?.reps || [];

  const sorted = useMemo(() => {
    const key = {
      revenue: period === "today" ? "revenue_today" : period === "week" ? "revenue_week" : "revenue_mtd",
      visits: period === "today" ? "visits_today" : period === "week" ? "visits_week" : "visits_mtd",
      orders: period === "today" ? "orders_today" : period === "week" ? "orders_week" : "orders_mtd",
      exception_rate: "exception_rate_mtd",
    }[sortKey] as keyof RepStat;

    return [...reps].sort((a, b) => {
      if (sortKey === "exception_rate") return (a[key] as number) - (b[key] as number); // lower is better
      return (b[key] as number) - (a[key] as number);
    });
  }, [reps, period, sortKey]);

  const top5 = sorted.slice(0, 5);
  const bottom5 = [...sorted].reverse().slice(0, 5);
  const displayed = showBottom ? bottom5 : top5;

  const maxRevenue = Math.max(...reps.map(r =>
    period === "today" ? r.revenue_today : period === "week" ? r.revenue_week : r.revenue_mtd
  ), 1);
  const maxVisits = Math.max(...reps.map(r =>
    period === "today" ? r.visits_today : period === "week" ? r.visits_week : r.visits_mtd
  ), 1);

  // Team totals
  const teamRevenue = reps.reduce((s, r) => s + (period === "today" ? r.revenue_today : period === "week" ? r.revenue_week : r.revenue_mtd), 0);
  const teamVisits = reps.reduce((s, r) => s + (period === "today" ? r.visits_today : period === "week" ? r.visits_week : r.visits_mtd), 0);
  const teamOrders = reps.reduce((s, r) => s + (period === "today" ? r.orders_today : period === "week" ? r.orders_week : r.orders_mtd), 0);
  const avgExceptionRate = reps.length > 0 ? Math.round(reps.reduce((s, r) => s + r.exception_rate_mtd, 0) / reps.length) : 0;

  return (
    <div className="space-y-10 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <Breadcrumbs items={[{ label: "LEADERBOARD" }]} />
        <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">Rep Leaderboard</h1>
        <p className="text-sm font-medium text-zinc-500">Performance rankings across visits, orders, and revenue.</p>
      </div>

      {/* Team Totals */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Team Revenue", value: `$${teamRevenue.toLocaleString()}`, color: "text-emerald-600 dark:text-emerald-400" },
          { label: "Team Visits", value: teamVisits, color: "text-blue-600 dark:text-blue-400" },
          { label: "Team Orders", value: teamOrders, color: "text-indigo-600 dark:text-indigo-400" },
          { label: "Avg Exception Rate", value: `${avgExceptionRate}%`, color: avgExceptionRate > 20 ? "text-red-500" : avgExceptionRate > 10 ? "text-amber-500" : "text-emerald-500" },
        ].map(s => (
          <div key={s.label} className="rounded-3xl border border-zinc-100 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{s.label}</p>
            <p className={`mt-2 text-2xl font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Period tabs */}
        <div className="flex gap-2">
          {([["today", "Today"], ["week", "This Week"], ["mtd", "MTD"]] as [Period, string][]).map(([p, label]) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                period === p ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900" : "bg-zinc-50 text-zinc-500 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-400"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Sort + Top/Bottom toggle */}
        <div className="flex gap-2">
          {([["revenue", "Revenue"], ["visits", "Visits"], ["orders", "Orders"], ["exception_rate", "Exception %"]] as [SortKey, string][]).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setSortKey(k)}
              className={`rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                sortKey === k ? "bg-[#f4a261] text-white" : "bg-zinc-50 text-zinc-500 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-400"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Top / Bottom toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowBottom(false)}
          className={`rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${!showBottom ? "bg-emerald-500 text-white" : "bg-zinc-50 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"}`}
        >
          🏆 Top Performers
        </button>
        <button
          onClick={() => setShowBottom(true)}
          className={`rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${showBottom ? "bg-red-500 text-white" : "bg-zinc-50 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"}`}
        >
          ⚠️ Needs Attention
        </button>
      </div>

      {/* Leaderboard Cards */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-28 animate-pulse rounded-3xl bg-zinc-100 dark:bg-zinc-800" />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[40px] border border-dashed border-zinc-200 py-20 dark:border-zinc-800">
          <p className="text-sm font-bold text-zinc-400">No rep data yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((rep, idx) => {
            const revenue = period === "today" ? rep.revenue_today : period === "week" ? rep.revenue_week : rep.revenue_mtd;
            const visits = period === "today" ? rep.visits_today : period === "week" ? rep.visits_week : rep.visits_mtd;
            const orders = period === "today" ? rep.orders_today : period === "week" ? rep.orders_week : rep.orders_mtd;
            const rank = showBottom ? reps.length - idx : idx + 1;
            const isTop3 = !showBottom && idx < 3;

            return (
              <div
                key={rep.rep_id}
                className={`relative overflow-hidden rounded-3xl border p-6 transition-all ${
                  isTop3
                    ? "border-[#f4a261]/30 bg-gradient-to-r from-[#f4a261]/5 to-transparent dark:border-[#f4a261]/20"
                    : showBottom
                    ? "border-red-100 bg-red-50/30 dark:border-red-900/20 dark:bg-red-900/5"
                    : "border-zinc-100 bg-white dark:border-zinc-800 dark:bg-zinc-900"
                }`}
              >
                <div className="flex items-center gap-5">
                  {/* Rank */}
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center">
                    {isTop3 ? (
                      <span className="text-2xl">{MEDAL[idx]}</span>
                    ) : (
                      <span className="text-[18px] font-black text-zinc-300 dark:text-zinc-700">#{rank}</span>
                    )}
                  </div>

                  {/* Avatar */}
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 text-[14px] font-black text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                    {rep.rep_name.charAt(0).toUpperCase()}
                  </div>

                  {/* Name + bars */}
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-black text-zinc-900 dark:text-zinc-100">{rep.rep_name}</p>
                    <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-zinc-400">Visits</span>
                          <span className="text-[11px] font-black text-zinc-700 dark:text-zinc-300">{visits}</span>
                        </div>
                        <MiniBar value={visits} max={maxVisits} color="bg-blue-400" />
                      </div>
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-zinc-400">Orders</span>
                          <span className="text-[11px] font-black text-zinc-700 dark:text-zinc-300">{orders}</span>
                        </div>
                        <MiniBar value={orders} max={Math.max(...reps.map(r => period === "today" ? r.orders_today : period === "week" ? r.orders_week : r.orders_mtd), 1)} color="bg-indigo-400" />
                      </div>
                    </div>
                  </div>

                  {/* Revenue */}
                  <div className="shrink-0 text-right">
                    <p className="text-[18px] font-black text-zinc-900 dark:text-zinc-100">
                      ${revenue.toLocaleString()}
                    </p>
                    <MiniBar value={revenue} max={maxRevenue} color="bg-emerald-400" />
                    <p className="mt-1 text-[10px] font-medium text-zinc-400">revenue</p>
                  </div>

                  {/* Exception rate */}
                  <div className="shrink-0 text-right">
                    <p className="mb-1 text-[9px] font-black uppercase tracking-widest text-zinc-400">Exception</p>
                    <ExceptionDot rate={rep.exception_rate_mtd} />
                    <p className="mt-1 text-[9px] font-medium text-zinc-400">{rep.exceptions_mtd} exceptions</p>
                  </div>

                  {/* Verified rate */}
                  <div className="shrink-0 text-right">
                    <p className="mb-1 text-[9px] font-black uppercase tracking-widest text-zinc-400">Verified</p>
                    <span className={`text-[13px] font-black ${rep.verified_rate_mtd >= 80 ? "text-emerald-500" : rep.verified_rate_mtd >= 50 ? "text-amber-500" : "text-red-500"}`}>
                      {rep.verified_rate_mtd}%
                    </span>
                    <p className="text-[9px] font-medium text-zinc-400">{rep.verified_mtd} verified</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full table */}
      {reps.length > 5 && (
        <div className="rounded-[40px] border border-zinc-100 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-50 dark:border-zinc-800/60">
                  <th className="px-8 pb-5 pt-8 text-[10px] font-black uppercase tracking-widest text-zinc-400">#</th>
                  <th className="pb-5 pt-8 text-[10px] font-black uppercase tracking-widest text-zinc-400">Rep</th>
                  <th className="pb-5 pt-8 text-right text-[10px] font-black uppercase tracking-widest text-zinc-400">Visits</th>
                  <th className="pb-5 pt-8 text-right text-[10px] font-black uppercase tracking-widest text-zinc-400">Orders</th>
                  <th className="pb-5 pt-8 text-right text-[10px] font-black uppercase tracking-widest text-zinc-400">Revenue</th>
                  <th className="pb-5 pt-8 text-right text-[10px] font-black uppercase tracking-widest text-zinc-400">Exception %</th>
                  <th className="pb-5 pr-8 pt-8 text-right text-[10px] font-black uppercase tracking-widest text-zinc-400">Verified %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/40">
                {sorted.map((rep, idx) => {
                  const revenue = period === "today" ? rep.revenue_today : period === "week" ? rep.revenue_week : rep.revenue_mtd;
                  const visits = period === "today" ? rep.visits_today : period === "week" ? rep.visits_week : rep.visits_mtd;
                  const orders = period === "today" ? rep.orders_today : period === "week" ? rep.orders_week : rep.orders_mtd;
                  return (
                    <tr key={rep.rep_id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20">
                      <td className="py-4 pl-8 text-[12px] font-black text-zinc-400">#{idx + 1}</td>
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-100 text-[11px] font-black text-zinc-500 dark:bg-zinc-800">
                            {rep.rep_name.charAt(0)}
                          </div>
                          <span className="text-[13px] font-black text-zinc-900 dark:text-zinc-100">{rep.rep_name}</span>
                        </div>
                      </td>
                      <td className="py-4 text-right text-[13px] font-bold text-zinc-700 dark:text-zinc-300">{visits}</td>
                      <td className="py-4 text-right text-[13px] font-bold text-zinc-700 dark:text-zinc-300">{orders}</td>
                      <td className="py-4 text-right text-[13px] font-black text-zinc-900 dark:text-zinc-100">${revenue.toLocaleString()}</td>
                      <td className="py-4 text-right"><ExceptionDot rate={rep.exception_rate_mtd} /></td>
                      <td className="py-4 pr-8 text-right">
                        <span className={`text-[12px] font-black ${rep.verified_rate_mtd >= 80 ? "text-emerald-500" : rep.verified_rate_mtd >= 50 ? "text-amber-500" : "text-red-500"}`}>
                          {rep.verified_rate_mtd}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
