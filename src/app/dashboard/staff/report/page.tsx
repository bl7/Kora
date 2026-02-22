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
        <div className="rounded-[40px] border border-zinc-100 bg-white shadow-sm overflow-hidden dark:border-zinc-800 dark:bg-zinc-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[1000px]">
              <thead>
                <tr className="border-b border-zinc-50 bg-zinc-50/50 text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:border-zinc-800 dark:bg-zinc-800/50">
                  <th className="px-8 py-6">Representative</th>
                  <th className="px-5 py-6 text-center">Attendance</th>
                  <th className="px-5 py-6 text-center">Visits</th>
                  <th className="px-5 py-6 text-center">Orders</th>
                  <th className="px-5 py-6 text-center">Leads</th>
                  <th className="px-5 py-6 text-center">Expenses</th>
                  <th className="px-5 py-6 text-center">Distance</th>
                  <th className="px-5 py-6 text-center">Field Effort</th>
                  <th className="px-5 py-6 text-center">Compliance</th>
                  <th className="px-5 py-6 text-right">Total Sales</th>
                  <th className="px-8 py-6 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800">
                {report.map((row) => (
                  <tr key={row.rep_id} className="group transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-[12px] font-black text-zinc-500 dark:bg-zinc-800">
                          {row.rep_name.charAt(0)}
                        </div>
                        <p className="text-[14px] font-black text-zinc-900 dark:text-zinc-100">{row.rep_name}</p>
                      </div>
                    </td>
                    <td className="px-5 py-6 text-center">
                      <span className="inline-flex h-8 min-w-[32px] items-center justify-center rounded-lg bg-indigo-50 px-2 text-[12px] font-black text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400">
                        {row.attendance_count}
                      </span>
                    </td>
                    <td className="px-5 py-6 text-center">
                      <span className="inline-flex h-8 min-w-[32px] items-center justify-center rounded-lg bg-blue-50 px-2 text-[12px] font-black text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                        {row.visit_count}
                      </span>
                    </td>
                    <td className="px-5 py-6 text-center">
                      <span className="inline-flex h-8 min-w-[32px] items-center justify-center rounded-lg bg-orange-50 px-2 text-[12px] font-black text-orange-600 dark:bg-orange-900/20 dark:text-orange-400">
                        {row.orders_count}
                      </span>
                    </td>
                    <td className="px-5 py-6 text-center">
                      <span className="inline-flex h-8 min-w-[32px] items-center justify-center rounded-lg bg-emerald-50 px-2 text-[12px] font-black text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
                        {row.leads_count}
                      </span>
                    </td>
                    <td className="px-5 py-6 text-center">
                      <span className="inline-flex h-8 min-w-[32px] items-center justify-center rounded-lg bg-zinc-50 px-2 text-[12px] font-black text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                        Rs.{row.expenses_sum.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-5 py-6 text-center">
                      <span className="inline-flex h-8 min-w-[32px] items-center justify-center rounded-lg bg-orange-50 px-2 text-[12px] font-black text-orange-600 dark:bg-orange-900/20 dark:text-orange-400">
                        {row.distance_km.toFixed(1)} km
                      </span>
                    </td>
                    <td className="px-5 py-6 text-center">
                      <span className="inline-flex h-8 min-w-[32px] items-center justify-center rounded-lg bg-blue-50 px-2 text-[11px] font-black text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                        {Math.floor((row.walking_ms + row.driving_ms) / (1000 * 60 * 60))}h {Math.floor(((row.walking_ms + row.driving_ms) % (1000 * 60 * 60)) / (1000 * 60))}m
                      </span>
                    </td>
                    <td className="px-5 py-6 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className={`inline-flex h-8 min-w-[32px] items-center justify-center rounded-lg px-2 text-[12px] font-black ${
                          row.compliance_count > 0 
                            ? (row.compliance_approved_count === row.compliance_count ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20" : "bg-red-50 text-red-600 dark:bg-red-900/20")
                            : "bg-zinc-50 text-zinc-400 dark:bg-zinc-800"
                        }`}>
                          {row.compliance_approved_count}/{row.compliance_count}
                        </span>
                        {row.compliance_count > 0 && (
                          <span className="text-[9px] font-bold uppercase tracking-tight text-zinc-400">Approved</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-6 text-right">
                      <p className="text-[16px] font-black text-zinc-900 dark:text-zinc-100">Rs.{row.total_sales.toLocaleString()}</p>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button 
                        onClick={() => setSelectedRep(row)}
                        className="whitespace-nowrap rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 transition-all hover:bg-[#f4a261] hover:text-white dark:border-zinc-800 dark:bg-zinc-800 dark:hover:bg-[#f4a261]"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedRep && (
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
