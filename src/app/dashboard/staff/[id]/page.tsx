"use client";

import { useEffect, useState, use } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { useSession } from "../../_lib/session-context";
import { useToast } from "../../_lib/toast-context";
import type { 
  Staff, 
  StaffListResponse, 
  Visit, 
  VisitListResponse, 
  AttendanceLog, 
  AttendanceLogListResponse 
} from "../../_lib/types";

export default function StaffDetailsPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const session = useSession();
  const toast = useToast();
  const router = useRouter();

  const { data: staffListData } = useSWR<StaffListResponse>(
    "/api/manager/staff",
    fetcher,
    { refreshInterval: 10000 }
  );

  const { data: visitsData } = useSWR<VisitListResponse>(
    `/api/manager/visits?rep=${params.id}`,
    fetcher,
    { refreshInterval: 5000 }
  );

  const { data: logsData } = useSWR<AttendanceLogListResponse>(
    `/api/manager/attendance?rep=${params.id}`,
    fetcher,
    { refreshInterval: 5000 }
  );

  const staff = staffListData?.staff?.find(s => s.company_user_id === params.id) ?? null;
  const visits = visitsData?.visits ?? [];
  const logs = logsData?.logs ?? [];
  const loading = !staffListData || !visitsData || !logsData;

  // Compute stats
  const today = new Date().toDateString();
  const visitsToday = visits.filter(v => new Date(v.started_at).toDateString() === today);
  const latestLog = logs[0];
  const isClockedIn = latestLog && !latestLog.clock_out_at;

  const logsToday = logs.filter(l => new Date(l.clock_in_at).toDateString() === today);
  let totalMinutes = 0;
  logsToday.forEach(l => {
    const start = new Date(l.clock_in_at).getTime();
    const end = l.clock_out_at ? new Date(l.clock_out_at).getTime() : Date.now();
    totalMinutes += (end - start) / 1000 / 60;
  });
  const hours = Math.floor(totalMinutes / 60);
  const mins = Math.floor(totalMinutes % 60);

  const stats = {
    clockedIn: !!isClockedIn,
    lastActivity: latestLog ? new Date(latestLog.clock_in_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "None",
    totalVisitsToday: visitsToday.length,
    hoursWorkedToday: `${hours}h ${mins}m`,
  };

  if (loading) {
    return (
      <div className="p-8 space-y-8 animate-pulse">
        <div className="h-32 bg-zinc-100 rounded-xl dark:bg-zinc-800"></div>
        <div className="grid grid-cols-3 gap-6">
          <div className="h-24 bg-zinc-100 rounded-xl dark:bg-zinc-800"></div>
          <div className="h-24 bg-zinc-100 rounded-xl dark:bg-zinc-800"></div>
          <div className="h-24 bg-zinc-100 rounded-xl dark:bg-zinc-800"></div>
        </div>
        <div className="h-64 bg-zinc-100 rounded-xl dark:bg-zinc-800"></div>
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="p-12 text-center">
        <h2 className="text-xl font-bold">Staff member not found</h2>
        <Link href="/dashboard/staff" className="text-blue-600 hover:underline mt-4 block">
          &larr; Back to Staff List
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header / Profile Card */}
      <div className="flex items-start justify-between rounded-2xl bg-white p-6 shadow-sm border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-6">
          <div className="h-20 w-20 flex-shrink-0 rounded-full bg-zinc-100 flex items-center justify-center text-2xl font-bold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
             {staff.full_name.substring(0,2).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{staff.full_name}</h1>
            <p className="text-zinc-500 dark:text-zinc-400">{staff.role} • {staff.email}</p>
            <div className="mt-3 flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                stats.clockedIn 
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800"
                  : "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700"
              }`}>
                {stats.clockedIn ? "🟢 Currently Clocked In" : "⚪ Clocked Out"}
              </span>
              <span className="text-xs text-zinc-400">
                Last activity: {stats.lastActivity}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 border border-zinc-200 rounded-lg text-sm font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Back
          </button>
          <button className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200">
            Edit Profile
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          label="Total Visits Today" 
          value={stats.totalVisitsToday.toString()} 
          icon="📍"
        />
        <StatCard 
          label="Hours Worked Today" 
          value={stats.hoursWorkedToday} 
          icon="⏱️" // Fixed: removed invalid 'sub' prop or merged it correctly if needed. Use simple structure.
        />
        <StatCard 
          label="Assigned Shops" 
          value={staff.assigned_shops_count?.toString() ?? "0"} 
          icon="🏪"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Attendance Log */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Attendance Log</h2>
          </div>
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden dark:bg-zinc-900 dark:border-zinc-800">
            {logs.length === 0 ? (
              <div className="p-8 text-center text-sm text-zinc-500">No attendance records found.</div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="bg-zinc-50 border-b border-zinc-200 dark:bg-zinc-800/50 dark:border-zinc-800">
                  <tr>
                    <th className="px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">Date/Time</th>
                    <th className="px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">Action</th>
                    <th className="px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {logs.slice(0, 10).map((log) => {
                    const start = new Date(log.clock_in_at);
                    const end = log.clock_out_at ? new Date(log.clock_out_at) : null;
                    const durationMins = end 
                      ? Math.round((end.getTime() - start.getTime()) / 60000)
                      : null;
                    
                    // Simple logic to show hours/mins
                    const durStr = durationMins 
                      ? `${Math.floor(durationMins/60)}h ${durationMins%60}m`
                      : "Active";

                    return (
                      <tr key={log.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                        <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">
                          <div>{start.toLocaleDateString()}</div>
                          <div className="text-xs text-zinc-500">{start.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            end ? "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          }`}>
                            {end ? "Shift Ended" : "Clocked In"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                           {durStr}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Recent Visits */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Recent Visits</h2>
          </div>
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden dark:bg-zinc-900 dark:border-zinc-800">
            {visits.length === 0 ? (
              <div className="p-8 text-center text-sm text-zinc-500">No visits recorded.</div>
            ) : (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {visits.slice(0, 10).map((visit) => (
                  <div key={visit.id} className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">{visit.shop_name}</h4>
                        <p className="text-xs text-zinc-500 mt-1">
                          {new Date(visit.started_at).toLocaleString()}
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                         visit.ended_at 
                           ? "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                           : "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                      }`}>
                        {visit.ended_at ? "Completed" : "In Progress"}
                      </span>
                    </div>
                    {visit.notes && (
                      <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-300 bg-zinc-50 p-2 rounded border border-zinc-100 dark:bg-zinc-800/50 dark:border-zinc-700">
                        "{visit.notes}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="p-6 rounded-xl bg-white border border-zinc-200 shadow-sm flex items-center gap-4 dark:bg-zinc-900 dark:border-zinc-800">
      <div className="h-12 w-12 rounded-full bg-zinc-50 flex items-center justify-center text-2xl dark:bg-zinc-800">
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{value}</div>
        <div className="text-sm text-zinc-500 dark:text-zinc-400">{label}</div>
      </div>
    </div>
  );
}
