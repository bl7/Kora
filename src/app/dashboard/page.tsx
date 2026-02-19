"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { useSession } from "./_lib/session-context";
import type { StaffListResponse, ShopListResponse, LeadListResponse, OrderListResponse, Order, Staff, Lead, VisitListResponse, TaskListResponse, CoverageReportResponse } from "./_lib/types";
import Link from "next/link";
import { Breadcrumbs } from "./_lib/breadcrumbs";

function StatCard({ label, value, icon, suffix, color = "orange" }: { label: string; value: number | string; icon: React.ReactNode; suffix?: string; color?: "orange" | "indigo" | "emerald" | "blue" }) {
  const colors = {
    orange: "text-orange-500 bg-orange-50 dark:bg-orange-950/20",
    indigo: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20",
    emerald: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20",
    blue: "text-blue-500 bg-blue-50 dark:bg-blue-950/20",
  };

  return (
    <div className="rounded-[32px] border border-zinc-100 bg-white p-8 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{label}</p>
        <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${colors[color]}`}>
          {icon}
        </div>
      </div>
      <p className="mt-4 text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
        {typeof value === "number" ? value.toLocaleString() : value}
        {suffix && <span className="ml-1 text-lg text-zinc-400">{suffix}</span>}
      </p>
    </div>
  );
}

export default function DashboardPage() {
  const session = useSession();
  const [stats, setStats] = useState({
    activeReps: 0,
    totalStaff: 0,
    newLeads: 0,
    totalShops: 0,
    visitsToday: 0,
    verifiedToday: 0,
    exceptionsToday: 0,
    pendingToday: 0,
    ordersToday: 0,
    revenueTodayFormatted: "$0",
    topPerformers: [] as any[],
    underperformers: [] as any[],
    teamCoverage: 0,
    missedVisits: 0
  });

  const { data: staffData } = useSWR<StaffListResponse>("/api/manager/staff", fetcher);
  const { data: shopsData } = useSWR<ShopListResponse>("/api/manager/shops", fetcher);
  const { data: leadsData } = useSWR<LeadListResponse>("/api/manager/leads", fetcher);
  const { data: ordersData } = useSWR<OrderListResponse>("/api/manager/orders", fetcher);
  const { data: visitsData } = useSWR<VisitListResponse>("/api/manager/visits", fetcher);
  const { data: exceptionsData } = useSWR<VisitListResponse>("/api/manager/visits?exceptions_only=true", fetcher);
  const { data: coverageData } = useSWR<CoverageReportResponse>("/api/manager/reports/coverage", fetcher);

  useEffect(() => {
    if (staffData && shopsData && leadsData && ordersData && visitsData && coverageData) {
      const activeReps = staffData.staff?.filter((s: Staff) => s.role === "rep").length || 0;
      const totalStaff = staffData.counts?.active || 0;
      const newLeads = leadsData.leads?.filter((l: Lead) => l.status === "new").length || 0;
      const totalShops = shopsData.shops?.length || 0;
      
      const today = new Date().toISOString().split('T')[0];
      const todayVisits = visitsData.visits?.filter((v: any) => v.started_at?.startsWith(today!)) || [];
      const visitsToday = todayVisits.length;
      const verifiedToday = todayVisits.filter((v: any) => v.is_verified).length;
      const todayExceptions = exceptionsData?.visits?.filter((v: any) => v.started_at?.startsWith(today!)) || [];
      const exceptionsToday = todayExceptions.length;
      const pendingToday = exceptionsData?.visits?.filter((v: any) => !v.approved_by_manager_id && !v.flagged_by_manager_id).length || 0;

      const todayOrders = ordersData.orders?.filter((o: Order) => o.created_at?.startsWith(today!)) || [];
      const ordersToday = todayOrders.length;
      const revenueToday = todayOrders.reduce((sum: number, o: Order) => sum + (parseFloat(String(o.total_amount)) || 0), 0);
      const revenueTodayFormatted = `$${revenueToday.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

      // Coverage Calculations
      const report = coverageData.report || [];
      const topPerformers = [...report].sort((a, b) => b.coverage_percentage - a.coverage_percentage).slice(0, 3);
      const underperformers = report.filter(r => r.coverage_percentage < 50).sort((a, b) => a.coverage_percentage - b.coverage_percentage).slice(0, 3);
      
      const totalAssigned = report.reduce((acc, curr) => acc + curr.total_assigned, 0);
      const totalVisitedUnique = report.reduce((acc, curr) => acc + curr.shops_visited, 0);
      const teamCoverage = totalAssigned > 0 ? Math.round((totalVisitedUnique / totalAssigned) * 100) : 0;
      const missedVisits = totalAssigned - totalVisitedUnique;

      setStats({ activeReps, totalStaff, newLeads, totalShops, visitsToday, verifiedToday, exceptionsToday, pendingToday, ordersToday, revenueTodayFormatted, topPerformers, underperformers, teamCoverage, missedVisits });
    }
  }, [staffData, shopsData, leadsData, ordersData, visitsData, exceptionsData, coverageData]);

  const loading = !staffData || !shopsData || !leadsData || !ordersData || !visitsData || !coverageData;

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 rounded-[32px] bg-zinc-100 dark:bg-zinc-800" />
          ))}
        </div>
        <div className="h-96 rounded-[40px] bg-zinc-100 dark:bg-zinc-800" />
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-12">
      <div className="flex flex-col gap-2">
        <Breadcrumbs items={[]} />
        <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">Dashboard Summary</h1>
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">A quick look at your shops, field staff, and recent work.</p>
      </div>

      {/* ── Row 1: Signal Cards ── */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
        {/* Active Reps */}
        <div className="rounded-[32px] border border-zinc-100 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Active Reps Today</p>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-50 text-orange-500 dark:bg-orange-950/20">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
          </div>
          <p className="mt-4 text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">{stats.activeReps}</p>
          <p className="mt-1 text-[11px] font-medium text-zinc-400">{stats.totalStaff} total staff</p>
        </div>

        {/* Visits Today — with breakdown */}
        <Link href="/dashboard/visits" className="block">
          <div className="rounded-[32px] border border-blue-100 bg-blue-50/40 p-8 shadow-sm transition-all hover:shadow-md dark:border-blue-900/20 dark:bg-blue-900/5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-500">Visits Today</p>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 text-blue-500 dark:bg-blue-900/30">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              </div>
            </div>
            <p className="mt-4 text-4xl font-black tracking-tight text-blue-700 dark:text-blue-400">{stats.visitsToday}</p>
            <div className="mt-2 flex gap-3 text-[10px] font-bold">
              <span className="text-emerald-500">{stats.verifiedToday} verified</span>
              <span className="text-orange-500">{stats.exceptionsToday} exceptions</span>
              {stats.pendingToday > 0 && <span className="text-red-500">{stats.pendingToday} pending</span>}
            </div>
          </div>
        </Link>

        {/* Orders Today */}
        <div className="rounded-[32px] border border-zinc-100 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Orders Today</p>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500 dark:bg-emerald-950/20">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
            </div>
          </div>
          <p className="mt-4 text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">{stats.ordersToday}</p>
          <p className="mt-1 text-[11px] font-medium text-zinc-400">
            {stats.revenueTodayFormatted} revenue
          </p>
        </div>

        {/* Pending Review — primary headline number, exceptions as secondary */}
        <Link
          href={stats.pendingToday > 0 ? "/dashboard/visits?tab=pending" : "/dashboard/visits?tab=exceptions"}
          className="block"
        >
          <div className={`rounded-[32px] border p-8 shadow-sm transition-all hover:shadow-md ${
            stats.pendingToday > 0
              ? "border-red-100 bg-red-50/60 hover:bg-red-50 dark:border-red-900/30 dark:bg-red-900/10"
              : "border-zinc-100 bg-white dark:border-zinc-800 dark:bg-zinc-900"
          }`}>
            <div className="flex items-center justify-between">
              <p className={`text-[10px] font-black uppercase tracking-widest ${stats.pendingToday > 0 ? "text-red-400" : "text-zinc-400"}`}>
                Pending Review
              </p>
              <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${stats.pendingToday > 0 ? "bg-red-100 text-red-500 dark:bg-red-900/30" : "bg-zinc-50 text-zinc-400 dark:bg-zinc-800"}`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              </div>
            </div>
            <p className={`mt-4 text-4xl font-black tracking-tight ${stats.pendingToday > 0 ? "text-red-600 dark:text-red-400" : "text-zinc-900 dark:text-zinc-100"}`}>
              {stats.pendingToday}
            </p>
            <div className="mt-2 flex gap-3 text-[10px] font-bold">
              <span className="text-zinc-400">Exceptions today: {stats.exceptionsToday}</span>
              <span className="text-emerald-500">Verified: {stats.verifiedToday}</span>
            </div>
          </div>
        </Link>
      </div>

      {/* ── Fire Panel: one glance, all fires ── */}
      <FirePanel pendingReview={stats.pendingToday} />

      {/* Team Performance Snapshot */}
      <div className="rounded-[40px] border border-zinc-100 bg-white p-10 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
              <div>
                  <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100">Top Performers</h2>
                  <p className="mt-1 text-[11px] font-medium text-zinc-400">This week's leaders by visits.</p>
              </div>
              <Link href="/dashboard/performance" className="text-[11px] font-black uppercase tracking-widest text-[#f4a261] hover:underline">Full Leaderboard</Link>
          </div>
          
          <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {/* Underperformers */}
              <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-red-400">Needs Attention</h3>
                  {stats.underperformers.length > 0 ? stats.underperformers.map((rep: any) => (
                      <div key={rep.rep_id} className="flex items-center justify-between rounded-2xl bg-red-50 p-4 dark:bg-red-900/10">
                          <div>
                              <p className="text-[13px] font-black text-zinc-900 dark:text-zinc-100">{rep.rep_name}</p>
                              <p className="text-[10px] font-medium text-red-500">{rep.shops_visited} / {rep.total_assigned} visited</p>
                          </div>
                          <span className="text-xl font-black text-red-500">{rep.coverage_percentage}%</span>
                      </div>
                  )) : (
                      <div className="rounded-2xl border border-dashed border-zinc-200 p-4 text-center text-[11px] font-medium text-zinc-400 dark:border-zinc-800">No underperformers 🎉</div>
                  )}
              </div>

               {/* Top Performers */}
               <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Top Performers</h3>
                  {stats.topPerformers.length > 0 ? stats.topPerformers.map((rep: any) => (
                      <div key={rep.rep_id} className="flex items-center justify-between rounded-2xl bg-emerald-50 p-4 dark:bg-emerald-900/10">
                          <div>
                              <p className="text-[13px] font-black text-zinc-900 dark:text-zinc-100">{rep.rep_name}</p>
                              <p className="text-[10px] font-medium text-emerald-500">${rep.total_sales.toLocaleString()} sales</p>
                          </div>
                          <span className="text-xl font-black text-emerald-500">{rep.coverage_percentage}%</span>
                      </div>
                  )) : (
                      <div className="rounded-2xl border border-dashed border-zinc-200 p-4 text-center text-[11px] font-medium text-zinc-400 dark:border-zinc-800">No data yet</div>
                  )}
              </div>

              {/* Summary Stats */}
              <div className="flex flex-col justify-center space-y-6 rounded-3xl bg-zinc-50 p-8 dark:bg-zinc-800/50">
                   <div>
                       <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Missed Visits</p>
                       <p className="mt-1 text-3xl font-black text-zinc-900 dark:text-zinc-100">{stats.missedVisits}</p>
                   </div>
                   <div>
                       <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Team Coverage</p>
                       <p className={`mt-1 text-3xl font-black ${stats.teamCoverage < 50 ? 'text-red-500' : stats.teamCoverage < 80 ? 'text-orange-500' : 'text-emerald-500'}`}>{stats.teamCoverage}%</p>
                   </div>
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Recent Activity */}
        <div className="lg:col-span-2 space-y-6 rounded-[40px] border border-zinc-100 bg-white p-10 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100">Recent Orders</h2>
                <Link href="/dashboard/orders" className="text-[11px] font-black uppercase tracking-widest text-[#f4a261] hover:underline">View All Orders</Link>
            </div>
            
            <div className="space-y-4">
                {ordersData?.orders?.slice(0, 5).map((order: any) => (
                    <div key={order.id} className="group flex items-center justify-between rounded-3xl border border-zinc-50 p-4 transition-all hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-50 text-zinc-400 dark:bg-zinc-800">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                            </div>
                            <div>
                                <p className="text-[13px] font-black text-zinc-900 dark:text-zinc-100">{order.shop_name}</p>
                                <p className="text-[11px] font-medium text-zinc-400">Order #{order.id.slice(0, 8)} · {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[13px] font-black text-zinc-900 dark:text-zinc-100">${parseFloat(order.total_amount).toLocaleString()}</p>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${order.status === 'pending_approval' ? 'text-orange-500' : 'text-emerald-500'}`}>
                                {order.status.replace('_', ' ')}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-8">
            <div className="rounded-[40px] bg-[#f4a261] p-10 text-white shadow-xl shadow-orange-500/20">
                <h3 className="text-2xl font-black leading-tight">Quick Actions</h3>
                <p className="mt-4 text-sm font-medium opacity-90">Quickly assign work to your team or add a new shop to the map.</p>
                <div className="mt-10 space-y-3">
                    <Link href="/dashboard/tasks" className="flex h-14 w-full items-center justify-center rounded-2xl bg-white text-[11px] font-black uppercase tracking-widest text-[#f4a261] transition-transform hover:scale-[1.02]">
                        Add New Task
                    </Link>
                    <Link href="/dashboard/shops" className="flex h-14 w-full items-center justify-center rounded-2xl bg-white/20 text-[11px] font-black uppercase tracking-widest text-white backdrop-blur-md transition-transform hover:scale-[1.02]">
                        Add New Shop
                    </Link>
                </div>
            </div>

            <div className="rounded-[40px] border border-zinc-100 bg-white p-10 dark:border-zinc-800 dark:bg-zinc-900">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Team Capacity</h3>
                <div className="mt-6 flex items-baseline gap-2">
                    <span className="text-4xl font-black text-zinc-900 dark:text-zinc-100">{stats.totalStaff}</span>
                    <span className="text-lg font-bold text-zinc-400">/ {(session.company.staffLimit ?? 5) + 1}</span>
                </div>
                <div className="mt-6 h-3 w-full overflow-hidden rounded-full bg-zinc-50 dark:bg-zinc-800">
                    <div className="h-full bg-[#f4a261] transition-all" style={{ width: `${(stats.totalStaff / ((session.company.staffLimit ?? 5) + 1)) * 100}%` }} />
                </div>
                <p className="mt-4 text-[11px] font-medium text-zinc-500">You have used {(stats.totalStaff / ((session.company.staffLimit ?? 5) + 1) * 100).toFixed(1)}% of your team limit.</p>
            </div>

            <LeaderboardTeaser />
        </div>
      </div>
    </div>
  );
}

function FirePanel({ pendingReview }: { pendingReview: number }) {
  const { data: atRiskData } = useSWR<{ ok: boolean; shops: any[] }>("/api/manager/reports/at-risk", fetcher);
  const { data: exData } = useSWR<{ ok: boolean; visits: any[] }>("/api/manager/visits?exceptions_only=true", fetcher);

  const atRiskShops = atRiskData?.shops || [];
  const neverVisited = atRiskShops.filter((s: any) => s.days_since_last_visit === null).length;
  const overdueShops = atRiskShops.filter((s: any) => s.days_since_last_visit !== null && s.days_since_last_visit >= 7).length;
  const atRiskTotal = neverVisited + overdueShops;

  const allExceptions = exData?.visits || [];
  const approved = allExceptions.filter((v: any) => !!v.approved_by_manager_id).length;
  const flagged = allExceptions.filter((v: any) => !!v.flagged_by_manager_id).length;

  type FireItem = { label: string; sub: string; href: string; color: string; dot: string; textColor: string; subColor: string };

  const fires: FireItem[] = [
    pendingReview > 0 ? {
      label: `${pendingReview} pending review`,
      sub: "Exceptions awaiting your action",
      href: "/dashboard/visits?tab=pending",
      color: "border-red-200 bg-red-50 dark:border-red-900/30 dark:bg-red-900/10",
      dot: "bg-red-500",
      textColor: "text-red-700 dark:text-red-400",
      subColor: "text-red-500/80",
    } : null,
    atRiskTotal > 0 ? {
      label: `${atRiskTotal} at-risk shop${atRiskTotal !== 1 ? "s" : ""}`,
      sub: `${neverVisited} never visited · ${overdueShops} overdue (7d+)`,
      href: "/dashboard/coverage?tab=atrisk",
      color: "border-amber-200 bg-amber-50 dark:border-amber-900/30 dark:bg-amber-900/10",
      dot: "bg-amber-500",
      textColor: "text-amber-800 dark:text-amber-400",
      subColor: "text-amber-600/80",
    } : null,
    (approved > 0 || flagged > 0) ? {
      label: `${approved} approved · ${flagged} flagged`,
      sub: "Exception (approved) and exception (flagged) history",
      href: "/dashboard/visits?tab=exceptions",
      color: "border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50",
      dot: "bg-zinc-400",
      textColor: "text-zinc-700 dark:text-zinc-300",
      subColor: "text-zinc-500",
    } : null,
  ].filter((x): x is FireItem => x !== null);

  if (fires.length === 0) return (
    <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/50 px-6 py-4 dark:border-emerald-900/20 dark:bg-emerald-900/5">
      <span className="text-lg">✅</span>
      <p className="text-[13px] font-bold text-emerald-700 dark:text-emerald-400">All clear — no open fires right now.</p>
    </div>
  );

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      {fires.map((fire, i) => (
        <Link
          key={i}
          href={fire.href}
          className={`group flex flex-1 items-center gap-4 rounded-2xl border px-5 py-4 transition-all hover:shadow-sm ${fire.color}`}
        >
          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${fire.dot}`} />
          <div className="min-w-0 flex-1">
            <p className={`text-[13px] font-black leading-tight ${fire.textColor}`}>{fire.label}</p>
            <p className={`text-[10px] font-medium ${fire.subColor}`}>{fire.sub}</p>
          </div>
          <svg className={`shrink-0 opacity-60 transition-transform group-hover:translate-x-0.5 ${fire.textColor}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </Link>
      ))}
    </div>
  );
}

function LeaderboardTeaser() {
  const { data } = useSWR<{ ok: boolean; reps: any[] }>("/api/manager/reports/leaderboard", fetcher);
  const reps = data?.reps || [];
  if (reps.length === 0) return null;

  const top3 = [...reps].sort((a, b) => b.revenue_mtd - a.revenue_mtd).slice(0, 3);
  const MEDAL = ["🥇", "🥈", "🥉"];

  return (
    <div className="rounded-[40px] border border-zinc-100 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100">Top Reps This Month</h2>
          <p className="mt-1 text-[11px] font-medium text-zinc-400">Ranked by MTD revenue</p>
        </div>
        <Link href="/dashboard/performance" className="text-[11px] font-black uppercase tracking-widest text-[#f4a261] hover:underline">Full Leaderboard</Link>
      </div>
      <div className="space-y-3">
        {top3.map((rep, i) => (
          <div key={rep.rep_id} className="flex items-center gap-4 rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-800/50">
            <span className="text-xl">{MEDAL[i]}</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[12px] font-black text-zinc-600 shadow-sm dark:bg-zinc-700 dark:text-zinc-300">
              {rep.rep_name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-black text-zinc-900 dark:text-zinc-100 truncate">{rep.rep_name}</p>
              <p className="text-[10px] font-medium text-zinc-400">{rep.visits_mtd} visits · {rep.orders_mtd} orders</p>
            </div>
            <p className="text-[14px] font-black text-emerald-600 dark:text-emerald-400 shrink-0">${rep.revenue_mtd.toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
