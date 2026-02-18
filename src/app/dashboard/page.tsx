"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { useSession } from "./_lib/session-context";
import type { StaffListResponse, ShopListResponse, LeadListResponse, OrderListResponse, Order, Staff, Lead, VisitListResponse, TaskListResponse } from "./_lib/types";
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
  });

  const { data: staffData } = useSWR<StaffListResponse>("/api/manager/staff", fetcher);
  const { data: shopsData } = useSWR<ShopListResponse>("/api/manager/shops", fetcher);
  const { data: leadsData } = useSWR<LeadListResponse>("/api/manager/leads", fetcher);
  const { data: ordersData } = useSWR<OrderListResponse>("/api/manager/orders", fetcher);
  const { data: visitsData } = useSWR<VisitListResponse>("/api/manager/visits", fetcher);

  useEffect(() => {
    if (staffData && shopsData && leadsData && ordersData && visitsData) {
      const activeReps = staffData.staff?.filter((s: Staff) => s.role === "rep").length || 0;
      const totalStaff = staffData.counts?.active || 0;
      const newLeads = leadsData.leads?.filter((l: Lead) => l.status === "new").length || 0;
      const totalShops = shopsData.shops?.length || 0;
      
      const today = new Date().toISOString().split('T')[0];
      const visitsToday = visitsData.visits?.filter((v: any) => v.started_at?.startsWith(today!)).length || 0;

      setStats({ activeReps, totalStaff, newLeads, totalShops, visitsToday });
    }
  }, [staffData, shopsData, leadsData, ordersData, visitsData]);

  const loading = !staffData || !shopsData || !leadsData || !ordersData || !visitsData;

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

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          label="Active Representatives" 
          value={stats.activeReps} 
          color="orange"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>} 
        />
        <StatCard 
          label="New Leads" 
          value={stats.newLeads} 
          suffix="Leads"
          color="indigo"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>} 
        />
        <StatCard 
          label="Total Shops" 
          value={stats.totalShops} 
          suffix="Shops"
          color="emerald"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>} 
        />
        <StatCard 
          label="Today's Visits" 
          value={stats.visitsToday} 
          suffix="Visits"
          color="blue"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2l3 6 7.5 1-5.5 5.5 1.5 7.5-6.5-3.5-6.5 3.5 1.5-7.5-5.5-5.5 7.5-1 3-6z"/></svg>} 
        />
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
        </div>
      </div>
    </div>
  );
}
