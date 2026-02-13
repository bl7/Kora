"use client";

import { useEffect, useState } from "react";
import { useSession } from "./_lib/session-context";
import type { Staff, StaffListResponse, Shop, ShopListResponse } from "./_lib/types";

export default function OverviewPage() {
  const session = useSession();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const [sRes, shRes] = await Promise.all([
        fetch("/api/manager/staff"),
        fetch("/api/manager/shops"),
      ]);
      const sData = (await sRes.json()) as StaffListResponse;
      const shData = (await shRes.json()) as ShopListResponse;
      setStaff(sData.staff ?? []);
      setShops(shData.shops ?? []);
      setLoading(false);
    })();
  }, []);

  const activeReps = staff.filter((s) => s.role === "rep" && s.status === "active").length;

  const totalAssignments = shops.reduce((sum, s) => sum + s.assignment_count, 0);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          Welcome back, {session.user.fullName.split(" ")[0]}
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Here&apos;s what&apos;s happening with {session.company.name}.
        </p>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[106px] animate-pulse rounded-xl bg-zinc-200/60 dark:bg-zinc-800/60" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Staff" value={staff.length} icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          } />
          <StatCard label="Active Reps" value={activeReps} icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          } />
          <StatCard label="Shops" value={shops.length} icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z" /><polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          } />
          <StatCard label="Assignments" value={totalAssignments} icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-violet-500">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
          } />
        </div>
      )}

      {/* Quick info */}
      {!loading && (
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Recent Staff
            </h2>
            <div className="mt-4 space-y-3">
              {staff.slice(0, 5).map((s) => (
                <div key={s.company_user_id} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                    {s.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{s.full_name}</p>
                    <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{s.email}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    s.status === "active"
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                  }`}>
                    {s.status}
                  </span>
                </div>
              ))}
              {!staff.length && <p className="text-sm text-zinc-400">No staff added yet.</p>}
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Recent Shops
            </h2>
            <div className="mt-4 space-y-3">
              {shops.slice(0, 5).map((s) => (
                <div key={s.id} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-xs dark:bg-zinc-800">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-500 dark:text-zinc-400">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{s.name}</p>
                    <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                      {s.latitude.toFixed(4)}, {s.longitude.toFixed(4)} · {s.geofence_radius_m}m radius
                    </p>
                  </div>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    {s.assignment_count} {s.assignment_count === 1 ? "rep" : "reps"}
                  </span>
                </div>
              ))}
              {!shops.length && <p className="text-sm text-zinc-400">No shops added yet.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{label}</p>
        {icon}
      </div>
      <p className="mt-3 text-3xl font-semibold text-zinc-900 dark:text-zinc-100">{value}</p>
    </div>
  );
}
