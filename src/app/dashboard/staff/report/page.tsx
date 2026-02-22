"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { AttendanceLog, Lead, Order, StaffPerformanceDetailResponse, StaffReportItem, StaffReportResponse, Visit } from "../../_lib/types";
import { Breadcrumbs } from "../../_lib/breadcrumbs";
import { LoadingState } from "../../_lib/components";

export default function StaffReportPage() {
  const [dateRange, setDateRange] = useState(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);
    return {
      from: start.toISOString().split("T")[0],
      to: end.toISOString().split("T")[0],
    };
  });

  const [selectedRep, setSelectedRep] = useState<StaffReportItem | null>(null);

  const { data, isLoading } = useSWR<StaffReportResponse>(
    `/api/manager/reports/staff-report?dateFrom=${dateRange.from}&dateTo=${dateRange.to}`,
    fetcher
  );

  const report = data?.report || [];

  return (
    <div className="space-y-10 pb-12">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <Breadcrumbs items={[{ label: "STAFF", href: "/dashboard/staff" }, { label: "REPORT" }]} />
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">Staff Wise Report</h1>
          <p className="text-sm font-medium text-zinc-500">Aggregate metrics for all sales representatives in a given period.</p>
        </div>

        <div className="flex items-center gap-2 rounded-2xl bg-white p-2 shadow-sm dark:bg-zinc-900">
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
      </div>

      {isLoading ? (
        <LoadingState />
      ) : report.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[40px] border border-dashed border-zinc-200 py-20 dark:border-zinc-800">
          <p className="text-sm font-bold text-zinc-400">No data found for this period.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-6">
            {report.map((row) => (
              <StaffCard key={row.rep_id} row={row} onViewDetails={() => setSelectedRep(row)} />
            ))}
          </div>
          
          <div className="flex items-center justify-between px-2 pt-4">
            <p className="text-sm font-medium text-zinc-500">
              Showing {report.length} staff members
            </p>
            <div className="flex items-center gap-2">
              <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-zinc-100 text-zinc-400 dark:bg-zinc-900 dark:border-zinc-800">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6"/></svg>
              </button>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-zinc-100 text-[14px] font-black text-[#5e60ce] shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
                1
              </div>
              <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-zinc-100 text-zinc-400 dark:bg-zinc-900 dark:border-zinc-800">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m9 18 6-6-6-6"/></svg>
              </button>
            </div>
          </div>
        </div>
      )}   {selectedRep && (
        <PerformanceDetail rep={selectedRep} dateRange={dateRange} onClose={() => setSelectedRep(null)} />
      )}
    </div>
  );
}

function PerformanceDetail({ rep, dateRange, onClose }: { rep: StaffReportItem; dateRange: { from: string; to: string }; onClose: () => void }) {
  const { data, isLoading } = useSWR<StaffPerformanceDetailResponse>(
    `/api/manager/reports/staff-performance-detail?repId=${rep.rep_id}&dateFrom=${dateRange.from}&dateTo=${dateRange.to}`,
    fetcher
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex h-[90vh] w-full max-w-6xl flex-col bg-zinc-50 overflow-hidden rounded-[40px] shadow-2xl dark:bg-zinc-950 border border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f4a261] text-lg font-black text-white">
              {rep.rep_name.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100">{rep.rep_name}</h2>
              <p className="text-xs font-bold uppercase tracking-widest text-[#f4a261]">Performance Details • {dateRange.from} to {dateRange.to}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-xl bg-zinc-50 p-3 text-zinc-400 transition-all hover:bg-zinc-100 hover:text-zinc-900 dark:bg-zinc-800 dark:hover:bg-zinc-700">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-12">
           {isLoading ? (
             <LoadingState />
           ) : (
             <div className="space-y-12 pb-10">
               {/* Summary Stats in Grid */}
               <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  <DetailStatCard label="Total Sales" value={`Rs.${rep.total_sales.toLocaleString()}`} icon="💰" color="emerald" />
                  <DetailStatCard label="Attendance" value={data?.attendance.length || 0} icon="📅" color="indigo" />
                  <DetailStatCard label="Completed Visits" value={data?.visits.length || 0} icon="📍" color="blue" />
                  <DetailStatCard label="Distance Cover" value={`${rep.distance_km.toFixed(1)} km`} icon="🚗" color="emerald" />
                  <DetailStatCard label="Walk/Drive Time" value={`${Math.floor((rep.walking_ms + rep.driving_ms) / 3600000)}h ${Math.floor((rep.walking_ms + rep.driving_ms) % 3600000 / 60000)}m`} icon="🚶" color="indigo" />
                  <DetailStatCard label="New Leads" value={data?.leads.length || 0} icon="🎯" color="orange" />
               </div>

               {/* Section: Attendance */}
               <section>
                 <SectionHeader title="Attendance Logs" icon="⏰" />
                 <div className="mt-4 rounded-3xl border border-zinc-100 bg-white overflow-hidden dark:border-zinc-800 dark:bg-zinc-900">
                   <table className="w-full text-left">
                     <thead>
                       <tr className="border-b border-zinc-50 bg-zinc-50/50 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:border-zinc-800 dark:bg-zinc-800/50">
                         <th className="px-6 py-4">Date</th>
                         <th className="px-6 py-4">Clock In</th>
                         <th className="px-6 py-4">Clock Out</th>
                         <th className="px-6 py-4 text-right">Duration</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800">
                       {data?.attendance.length === 0 ? <NoDataRow colSpan={4} /> : data?.attendance.map((log: AttendanceLog) => {
                         const start = new Date(log.clock_in_at);
                         const end = log.clock_out_at ? new Date(log.clock_out_at) : null;
                         const diff = end ? (end.getTime() - start.getTime()) / (1000 * 60) : 0;
                         return (
                           <tr key={log.id} className="text-[13px] font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800">
                             <td className="px-6 py-4">{start.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</td>
                             <td className="px-6 py-4 font-black text-zinc-900 dark:text-zinc-100">{start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                             <td className="px-6 py-4">{end ? end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : <span className="text-emerald-500 animate-pulse">On Clock</span>}</td>
                             <td className="px-6 py-4 text-right">{diff > 0 ? `${(diff / 60).toFixed(1)}h` : '—'}</td>
                           </tr>
                         );
                       })}
                     </tbody>
                   </table>
                 </div>
               </section>

               {/* Section: Visits */}
               <section>
                 <SectionHeader title="Visits & Compliance" icon="🏠" />
                 <div className="mt-4 rounded-3xl border border-zinc-100 bg-white overflow-hidden dark:border-zinc-800 dark:bg-zinc-900">
                   <table className="w-full text-left">
                     <thead>
                       <tr className="border-b border-zinc-50 bg-zinc-50/50 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:border-zinc-800 dark:bg-zinc-800/50">
                         <th className="px-6 py-4">Shop</th>
                         <th className="px-6 py-4">Date & Time</th>
                         <th className="px-6 py-4 text-center">Distance</th>
                         <th className="px-6 py-4 text-right">Compliance</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800">
                       {data?.visits.length === 0 ? <NoDataRow colSpan={4} /> : data?.visits.map((visit: Visit) => (
                         <tr key={visit.id} className="text-[13px] font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800">
                           <td className="px-6 py-4 font-black text-zinc-900 dark:text-zinc-100">{visit.shop_name}</td>
                           <td className="px-6 py-4 font-medium opacity-60">
                              {new Date(visit.started_at).toLocaleDateString()} {new Date(visit.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                           </td>
                           <td className="px-6 py-4 text-center">
                              {visit.distance_m ? `${Math.round(visit.distance_m)}m` : '—'}
                           </td>
                           <td className="px-6 py-4 text-right">
                              {visit.exception_reason ? (
                                <span className={`inline-flex px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${visit.approved_by_manager_id ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
                                  {visit.exception_reason} • {visit.approved_by_manager_id ? 'Apprvd' : 'Pending'}
                                </span>
                              ) : (
                                <span className="text-zinc-300">Default</span>
                              )}
                           </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
               </section>

               {/* Section: Orders */}
               <section>
                 <SectionHeader title="Orders Placed" icon="📦" />
                 <div className="mt-4 rounded-3xl border border-zinc-100 bg-white overflow-hidden dark:border-zinc-800 dark:bg-zinc-900">
                   <table className="w-full text-left">
                     <thead>
                       <tr className="border-b border-zinc-50 bg-zinc-50/50 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:border-zinc-800 dark:bg-zinc-800/50">
                         <th className="px-6 py-4">Order #</th>
                         <th className="px-6 py-4">Shop</th>
                         <th className="px-6 py-4">Status</th>
                         <th className="px-6 py-4 text-right">Value</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800">
                       {data?.orders.length === 0 ? <NoDataRow colSpan={4} /> : data?.orders.map((order: Order) => (
                         <tr key={order.id} className="text-[13px] font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800">
                           <td className="px-6 py-4 font-black text-zinc-900 dark:text-zinc-100">{order.order_number}</td>
                           <td className="px-6 py-4">{order.shop_name}</td>
                           <td className="px-6 py-4">
                             <span className="capitalize text-[11px] font-black px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">{order.status}</span>
                           </td>
                           <td className="px-6 py-4 text-right font-black text-zinc-900 dark:text-zinc-100">Rs.{parseFloat(order.total_amount as any).toLocaleString()}</td>
                         </tr>
                       ))}
                       {data && data.orders.length > 0 && (
                         <tr className="bg-zinc-50 dark:bg-zinc-900/40">
                            <td colSpan={3} className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-zinc-400 text-right">Total Order Value</td>
                            <td className="px-6 py-4 text-right font-black text-lg text-[#f4a261]">Rs.{rep.total_sales.toLocaleString()}</td>
                         </tr>
                       )}
                     </tbody>
                   </table>
                 </div>
               </section>

               {/* Section: Leads */}
               <section>
                 <SectionHeader title="New Leads" icon="🔥" />
                 <div className="mt-4 rounded-3xl border border-zinc-100 bg-white overflow-hidden dark:border-zinc-800 dark:bg-zinc-900">
                   <table className="w-full text-left">
                     <thead>
                       <tr className="border-b border-zinc-50 bg-zinc-50/50 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:border-zinc-800 dark:bg-zinc-800/50">
                         <th className="px-6 py-4">Name</th>
                         <th className="px-6 py-4">Contact</th>
                         <th className="px-6 py-4">Phone</th>
                         <th className="px-6 py-4 text-right">Status</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800">
                       {data?.leads.length === 0 ? <NoDataRow colSpan={4} /> : data?.leads.map((lead: Lead) => (
                         <tr key={lead.id} className="text-[13px] font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800">
                           <td className="px-6 py-4 font-black text-zinc-900 dark:text-zinc-100">{lead.name}</td>
                           <td className="px-6 py-4">{lead.contact_name}</td>
                           <td className="px-6 py-4 font-medium opacity-60">{lead.phone}</td>
                           <td className="px-6 py-4 text-right">
                             <span className={`capitalize text-[10px] font-black px-2 py-1 rounded-full ${lead.status === 'converted' ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-500'}`}>
                                {lead.status}
                             </span>
                           </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
               </section>

               {/* Section: Expenses */}
               <section>
                 <SectionHeader title="Expenses Detailed" icon="🧾" />
                 <div className="mt-4 rounded-3xl border border-zinc-100 bg-white overflow-hidden dark:border-zinc-800 dark:bg-zinc-900">
                   <table className="w-full text-left">
                     <thead>
                       <tr className="border-b border-zinc-50 bg-zinc-50/50 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:border-zinc-800 dark:bg-zinc-800/50">
                         <th className="px-6 py-4">Date</th>
                         <th className="px-6 py-4">Category</th>
                         <th className="px-6 py-4">Description</th>
                         <th className="px-6 py-4 text-right">Amount</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800">
                       {data?.expenses.length === 0 ? <NoDataRow colSpan={4} /> : data?.expenses.map((expense) => (
                         <tr key={expense.id} className="text-[13px] font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800">
                           <td className="px-6 py-4">{new Date(expense.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</td>
                           <td className="px-6 py-4">
                             <span className="inline-flex px-2 py-0.5 rounded-md bg-zinc-100 text-[11px] font-black uppercase text-zinc-500">{expense.category}</span>
                           </td>
                           <td className="px-6 py-4 font-medium opacity-70 italic">{expense.description || '—'}</td>
                           <td className="px-6 py-4 text-right font-black text-zinc-900 dark:text-zinc-100">Rs.{expense.amount.toLocaleString()}</td>
                         </tr>
                       ))}
                       {data && data.expenses.length > 0 && (
                         <tr className="bg-zinc-50 dark:bg-zinc-900/40">
                            <td colSpan={3} className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-zinc-400 text-right">Total Expenses Sum</td>
                            <td className="px-6 py-4 text-right font-black text-lg text-red-500">Rs.{rep.expenses_sum.toLocaleString()}</td>
                         </tr>
                       )}
                     </tbody>
                   </table>
                 </div>
               </section>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title, icon }: { title: string; icon: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-sm dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
        <span className="text-sm">{icon}</span>
      </div>
      <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100">{title}</h3>
    </div>
  );
}

function DetailStatCard({ label, value, icon, color }: { label: string; value: string | number; icon: string; color: string }) {
  const colors: any = {
    emerald: "text-emerald-500 bg-emerald-50/50 dark:bg-emerald-500/5 border-emerald-100 dark:border-emerald-500/10",
    indigo: "text-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/5 border-indigo-100 dark:border-indigo-500/10",
    blue: "text-blue-500 bg-blue-50/50 dark:bg-blue-500/5 border-blue-100 dark:border-blue-500/10",
    orange: "text-orange-500 bg-orange-50/50 dark:bg-orange-500/5 border-orange-100 dark:border-orange-500/10",
  }
  return (
    <div className={`rounded-3xl border p-6 ${colors[color]}`}>
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-black uppercase tracking-widest opacity-60">{label}</span>
        <span className="text-xl">{icon}</span>
      </div>
      <p className="mt-2 text-2xl font-black">{value}</p>
    </div>
  )
}

function NoDataRow({ colSpan }: { colSpan: number }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-6 py-10 text-center text-xs font-bold text-zinc-400 italic">
        No records found during this period.
      </td>
    </tr>
  )
}

function StaffCard({ row, onViewDetails }: { row: StaffReportItem; onViewDetails: () => void }) {
  const formatMs = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const lastClockIn = row.last_clock_in ? new Date(row.last_clock_in) : null;
  const lastClockOut = row.last_clock_out ? new Date(row.last_clock_out) : null;

  return (
    <div className="group relative flex flex-col gap-8 rounded-[32px] border border-zinc-100 bg-white p-8 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 md:flex-row md:items-center">
      <div className="flex flex-1 items-center gap-6">
        <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#5e60ce]/10 text-xl font-black text-[#5e60ce] dark:bg-[#5e60ce]/20">
          {row.rep_name.charAt(0)}
        </div>
        <div>
          <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100">{row.rep_name}</h2>
          <div className="mt-2 flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${row.is_on_duty ? "bg-emerald-500 animate-pulse" : "bg-zinc-300"}`} />
            <span className="text-[13px] font-bold text-zinc-500">{row.is_on_duty ? "On-Duty" : "Off-Duty"}</span>
          </div>
        </div>
      </div>

      <div className="h-px bg-zinc-50 dark:bg-zinc-800 md:h-12 md:w-px" />

      <div className="flex flex-[2] flex-col gap-8 md:flex-row md:items-center">
        <div className="grid flex-1 grid-cols-2 gap-4 lg:grid-cols-3">
          <div className="flex flex-col gap-1 items-center rounded-2xl bg-zinc-50/50 p-3 dark:bg-zinc-800/50">
             <span className="text-[9px] font-black uppercase tracking-tight text-zinc-400">Visits</span>
             <span className="text-[14px] font-black text-[#4361ee]">{row.visit_count.toString().padStart(2, '0')}</span>
          </div>
          <div className="flex flex-col gap-1 items-center rounded-2xl bg-zinc-50/50 p-3 dark:bg-zinc-800/50">
             <span className="text-[9px] font-black uppercase tracking-tight text-zinc-400">Orders</span>
             <span className="text-[14px] font-black text-[#f4a261]">{row.orders_count.toString().padStart(2, '0')}</span>
          </div>
          <div className="flex flex-col gap-1 items-center rounded-2xl bg-zinc-50/50 p-3 dark:bg-zinc-800/50">
             <span className="text-[9px] font-black uppercase tracking-tight text-zinc-400">Leads</span>
             <span className="text-[14px] font-black text-[#2ec4b6]">{row.leads_count.toString().padStart(2, '0')}</span>
          </div>
          <div className="flex flex-col gap-1 items-center p-2">
             <span className="text-[9px] font-black uppercase tracking-tight text-zinc-400 text-center">Expenses</span>
             <span className="text-[13px] font-black text-zinc-900 dark:text-zinc-100">Rs. {row.expenses_sum.toLocaleString()}</span>
          </div>
          <div className="flex flex-col gap-1 items-center p-2">
             <span className="text-[9px] font-black uppercase tracking-tight text-zinc-400 text-center">Distance</span>
             <span className="text-[13px] font-black text-zinc-900 dark:text-zinc-100">{row.distance_km.toFixed(1)} km</span>
          </div>
          <div className="flex flex-col gap-1 items-center p-2">
             <span className="text-[9px] font-black uppercase tracking-tight text-zinc-400 text-center">Sales</span>
             <span className="text-[13px] font-black text-zinc-900 dark:text-zinc-100">Rs. {row.total_sales.toLocaleString()}</span>
          </div>
        </div>

        <div className="h-px bg-zinc-50 dark:bg-zinc-800 md:h-12 md:w-px" />

        <div className="flex flex-1 flex-col gap-4">
          <div className="flex items-center gap-3">
             <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-50 dark:bg-zinc-800">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-zinc-400">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
             </div>
             <div className="flex-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">
                  {row.is_on_duty ? "Shift & Attendance" : "Last Logout"}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-black text-zinc-900 dark:text-zinc-100">
                    {lastClockIn ? lastClockIn.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}
                    {lastClockOut && ` - ${lastClockOut.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                  </span>
                  {row.is_on_duty && (
                    <span className="rounded-lg bg-[#5e60ce]/10 px-2 py-0.5 text-[9px] font-black text-[#5e60ce]">Current Session</span>
                  )}
                  {!row.is_on_duty && lastClockOut && (
                    <span className="rounded-lg bg-zinc-50 px-2 py-0.5 text-[9px] font-black text-zinc-400 dark:bg-zinc-800">
                      {lastClockOut.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>
             </div>
          </div>

          <div className="flex items-center gap-3">
             <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-50 dark:bg-zinc-800">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-zinc-400">
                  <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34"/><path d="m20 12-4-4-4 4"/></svg>
             </div>
             <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Field Effort</p>
                <p className="text-[13px] font-black text-zinc-900 dark:text-zinc-100">
                  Working: <span className="text-[#5e60ce]">{formatMs(row.walking_ms + row.driving_ms)}</span> • Resting: <span className="text-zinc-400">{formatMs(row.still_ms)}</span>
                </p>
             </div>
          </div>
        </div>
      </div>

      <div className="h-px bg-zinc-50 dark:bg-zinc-800 md:h-12 md:w-px" />

      <div className="flex flex-col items-center gap-4 text-center md:w-32">
        <div>
          <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Compliance</p>
          <div className={`mt-2 inline-flex rounded-full px-3 py-1 text-[11px] font-black ${
            row.compliance_count > 0 
              ? (row.compliance_approved_count === row.compliance_count ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/10" : "bg-red-50 text-red-600 dark:bg-red-900/10")
              : "bg-zinc-50 text-zinc-400 dark:bg-zinc-800"
          }`}>
             {row.compliance_approved_count}/{row.compliance_count} {row.compliance_count > 0 ? (row.compliance_approved_count === row.compliance_count ? "Pass" : "Fail") : "NA"}
          </div>
        </div>
        <button 
          onClick={onViewDetails}
          className="rounded-2xl bg-[#5e60ce] px-6 py-3 text-[12px] font-black text-white shadow-[0_8px_16px_rgba(94,96,206,0.25)] transition-all hover:scale-105 active:scale-95 group-hover:bg-[#4849a1]"
        >
          View Details
        </button>
      </div>
    </div>
  );
}

