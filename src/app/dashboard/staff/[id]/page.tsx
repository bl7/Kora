"use client";

import { useEffect, useState, use, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { useSession } from "../../_lib/session-context";
import { useToast } from "../../_lib/toast-context";
import type { 
  Staff, 
  StaffListResponse, 
  AttendanceLog, 
  AttendanceLogListResponse 
} from "../../_lib/types";

export default function StaffDetailsPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const session = useSession();
  const toast = useToast();
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"week" | "month">("week");

  // Date range for current week/month (Starting Sunday)
  const { startDate, endDate, displayDays } = useMemo(() => {
    const now = new Date();
    
    if (viewMode === "week") {
      const day = now.getDay(); // 0 is Sunday
      const start = new Date(now);
      start.setDate(now.getDate() - day);
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);

      const weekDays = [];
      for (let i = 0; i < 7; i++) {
          const d = new Date(start);
          d.setDate(start.getDate() + i);
          weekDays.push(d);
      }

      return { 
          startDate: start.toISOString(), 
          endDate: end.toISOString(),
          displayDays: weekDays
      };
    } else {
      // Month view
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      
      const monthDays = [];
      for (let i = 1; i <= end.getDate(); i++) {
        monthDays.push(new Date(now.getFullYear(), now.getMonth(), i));
      }

      return {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        displayDays: monthDays
      };
    }
  }, [viewMode]);

  const { data: staffListData } = useSWR<StaffListResponse>(
    "/api/manager/staff",
    fetcher
  );

  const { data: logsData } = useSWR<AttendanceLogListResponse>(
    `/api/manager/attendance?rep=${params.id}&date_from=${startDate}&date_to=${endDate}`,
    fetcher,
    { refreshInterval: 5000 }
  );

  const staff = staffListData?.staff?.find(s => s.company_user_id === params.id) ?? null;
  const logs = logsData?.logs ?? [];
  const loading = !staffListData || !logsData;

  // Compute insights
  // Compute insights
  const { totalHours, avgStart, punctuality, logsMap } = useMemo(() => {
    let totalMins = 0;
    let onTimeCount = 0;
    let loggedDays = 0;
    let totalStartMins = 0;
    const map: Record<string, AttendanceLog[]> = {};

    logs.forEach(log => {
      const dateStr = new Date(log.clock_in_at).toDateString();
      if (!map[dateStr]) map[dateStr] = [];
      map[dateStr].push(log);

      const start = new Date(log.clock_in_at).getTime();
      const end = log.clock_out_at ? new Date(log.clock_out_at).getTime() : Date.now();
      const duration = (end - start) / 60000;
      totalMins += duration;

      // 9:00 AM check
      const startTime = new Date(log.clock_in_at);
      const startMinutes = startTime.getHours() * 60 + startTime.getMinutes();
      totalStartMins += startMinutes;
      loggedDays++;

      if (startMinutes <= 9 * 60) {
        onTimeCount++;
      }
    });

    return {
      totalHours: (totalMins / 60).toFixed(1),
      avgStart: loggedDays > 0 
        ? new Date(0, 0, 0, 0, totalStartMins / loggedDays).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : "09:00 AM",
      punctuality: loggedDays > 0 ? Math.round((onTimeCount / loggedDays) * 100) : 100,
      logsMap: map
    };
  }, [logs]);

  if (loading) {
    return (
      <div className="p-8 space-y-8 animate-pulse">
        <div className="h-32 bg-zinc-100 rounded-3xl dark:bg-zinc-800"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="h-64 bg-zinc-100 rounded-3xl dark:bg-zinc-800 md:col-span-1"></div>
            <div className="h-64 bg-zinc-100 rounded-3xl dark:bg-zinc-800 md:col-span-2"></div>
        </div>
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="p-12 text-center">
        <h2 className="text-xl font-bold">Staff member not found</h2>
        <Link href="/dashboard/staff" className="text-[#f4a261] hover:underline mt-4 block">
          &larr; Back to Staff List
        </Link>
      </div>
    );
  }

  const isCurrentlyIn = logs.some(l => !l.clock_out_at);

  return (
    <div className="space-y-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-400">
        <Link href="/dashboard" className="hover:text-zinc-600 dark:hover:text-zinc-200">Dashboard</Link>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="9 18 15 12 9 6"/></svg>
        <Link href="/dashboard/staff" className="hover:text-zinc-600 dark:hover:text-zinc-200">Attendance</Link>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="9 18 15 12 9 6"/></svg>
        <span className="text-zinc-900 dark:text-zinc-100">{staff.full_name}</span>
      </nav>

      {/* Profile Header */}
      <div className="group relative overflow-hidden rounded-[32px] border border-zinc-200 bg-white p-8 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-zinc-100 text-3xl font-bold text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
                {staff.full_name.charAt(0)}
              </div>
              {isCurrentlyIn && (
                <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full border-4 border-white bg-emerald-500 dark:border-zinc-900" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">{staff.full_name}</h1>
                {isCurrentlyIn && (
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
                      Active Now
                    </span>
                )}
              </div>
              <p className="mt-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                {staff.role.charAt(0).toUpperCase() + staff.role.slice(1).replace('_', ' ')}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 transition-colors hover:text-[#f4a261]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  {staff.email}
                </div>
                {staff.phone && (
                  <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 transition-colors hover:text-[#f4a261]">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    {staff.phone}
                  </div>
                )}
                {staff.last_login_at && (
                  <div className="flex items-center gap-2 text-xs font-bold text-zinc-400">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    Last active: {new Date(staff.last_login_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex w-full items-center gap-3 md:w-auto">
            <button className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-[#f4a261] px-6 py-4 text-xs font-bold uppercase tracking-widest text-white shadow-lg shadow-[#f4a261]/20 transition-all hover:brightness-105 md:flex-none">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              Export PDF
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Weekly Insights */}
        <div className="space-y-8 rounded-[32px] border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-500 dark:bg-blue-900/20">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 3v18h18"/><path d="M18 17l-6-6-4 4-5-5"/></svg>
              </div>
              <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-900 dark:text-zinc-100">Weekly Insights</h2>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              {new Date(startDate).toLocaleDateString([], { month: 'short', day: 'numeric' })} - {new Date(endDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
            </span>
          </div>

          <div className="space-y-4">
            <div className="flex items-end justify-between">
              <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Total Hours Worked</span>
              <span className="text-sm font-black text-zinc-900 dark:text-zinc-100">{totalHours} / 40.0</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
               <div 
                 className="h-full bg-blue-500 transition-all duration-1000" 
                 style={{ width: `${Math.min(100, (parseFloat(totalHours)/40)*100)}%` }}
               />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1 rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-800/40">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">AVG START</p>
              <p className="text-lg font-black text-zinc-900 dark:text-zinc-100">{avgStart}</p>
            </div>
            <div className="space-y-1 rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-800/40">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">PUNCTUALITY</p>
              <p className="text-lg font-black text-zinc-900 dark:text-zinc-100">{punctuality}%</p>
            </div>
          </div>

          <div className="space-y-3">
             <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Performance Markers</p>
             <div className="flex items-center justify-between rounded-xl border border-dashed border-zinc-200 p-4 dark:border-zinc-800">
                <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Punctuality Score</span>
                <span className="text-xs font-black text-[#f4a261]">{punctuality}%</span>
             </div>
          </div>
        </div>

        {/* Attendance Timeline */}
        <div className="lg:col-span-2 space-y-8 rounded-[32px] border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between">
                <div>
                   <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-500 dark:bg-indigo-900/20">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      </div>
                      <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-900 dark:text-zinc-100">Attendance Timeline</h2>
                   </div>
                   <p className="mt-1 text-[11px] font-medium text-zinc-400">Weekly visual log of attendance records</p>
                </div>
                <div className="flex rounded-xl bg-zinc-50 p-1 dark:bg-zinc-800/60">
                    <button 
                      onClick={() => setViewMode("week")}
                      className={`rounded-lg px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all ${viewMode === "week" ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100" : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"}`}
                    >
                      Week
                    </button>
                    <button 
                      onClick={() => setViewMode("month")}
                      className={`rounded-lg px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all ${viewMode === "month" ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100" : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"}`}
                    >
                      Month
                    </button>
                </div>
            </div>

            <div className="relative overflow-x-auto">
                <div className="min-w-[700px]">
                    {/* Time Axis */}
                    <div className="flex border-b border-zinc-100 pb-3 dark:border-zinc-800">
                        <div className="w-24 shrink-0" />
                        {[6, 8, 10, 12, 14, 16, 18, 20].map(h => (
                            <div key={h} className="flex-1 text-center text-[10px] font-black uppercase text-zinc-400">
                                {h % 12 || 12} {h < 12 ? 'AM' : 'PM'}
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 space-y-4">
                        {(viewMode === "week" ? displayDays.slice(0, 6) : displayDays).map(day => {
                            const dateStr = day.toDateString();
                            const dayLogs = logsMap[dateStr] || [];
                            return (
                                <div key={dateStr} className="flex items-center group">
                                    <div className="w-24 shrink-0 text-xs font-black text-zinc-900 dark:text-zinc-100">
                                        {day.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                                    </div>
                                    <div className="relative h-10 flex-1 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 transition-all group-hover:bg-zinc-100/50 dark:group-hover:bg-zinc-800/60">
                                        {dayLogs.map((log, i) => {
                                            const start = new Date(log.clock_in_at);
                                            const end = log.clock_out_at ? new Date(log.clock_out_at) : new Date();
                                            
                                            const startPct = ((start.getHours() * 60 + start.getMinutes() - 360) / (20 * 60 - 360)) * 100;
                                            const durationPct = ((end.getTime() - start.getTime()) / (60000 * (20 - 6) * 60)) * 100;

                                            return (
                                                <div 
                                                    key={log.id}
                                                    className="absolute top-1.5 bottom-1.5 flex items-center justify-center rounded-lg text-[9px] font-black uppercase tracking-widest text-white shadow-sm transition-transform hover:scale-[1.02] bg-blue-500"
                                                    style={{ 
                                                        left: `${Math.max(0, startPct)}%`, 
                                                        width: `${Math.min(100 - startPct, durationPct)}%` 
                                                    }}
                                                >
                                                    Shift: {start.getHours()}:{start.getMinutes().toString().padStart(2, '0')} - {log.clock_out_at ? `${end.getHours()}:${end.getMinutes().toString().padStart(2, '0')}` : 'NOW'}
                                                </div>
                                            );
                                        })}
                                        {!dayLogs.length && (
                                            <div className="flex h-full items-center justify-center text-[9px] font-black uppercase tracking-widest text-zinc-300 dark:text-zinc-600">
                                                NO LOGS FOUND
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-6 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-md bg-blue-500" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Regular Shift</span>
                </div>
            </div>
        </div>
      </div>

    </div>
  );
}
