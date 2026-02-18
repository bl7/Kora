"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import type { Staff, StaffCounts, StaffListResponse, Visit, VisitListResponse, AttendanceLog, AttendanceLogListResponse } from "../_lib/types";
import { useSession } from "../_lib/session-context";
import { useToast } from "../_lib/toast-context";

type Tab = "active" | "invited" | "inactive";

const ROLE_OPTIONS = [
  { value: "", label: "All roles" },
  { value: "rep", label: "Rep" },
  { value: "manager", label: "Manager" },
  { value: "back_office", label: "Back office" },
  { value: "boss", label: "Admin" },
] as const;

function useDebounce<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
  }
  return (name[0] ?? "?").toUpperCase();
}

function formatLastLogin(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    if (diffDays === 0) return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "—";
  }
}

function normalizePhoneInput(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+977${digits}`;
  if (digits.length === 13 && digits.startsWith("977")) return `+${digits}`;
  if (digits.length >= 10) return `+977${digits.slice(-10)}`;
  return phone;
}

function StatCard({ title, value, trend, trendUp, subValue, icon }: { 
  title: string; 
  value: string; 
  trend?: string; 
  trendUp?: boolean; 
  subValue?: string;
  icon: 'timer' | 'alert' | 'clock';
}) {
  const IconMap = {
    timer: (
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      </div>
    ),
    alert: (
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 dark:bg-orange-900/20">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      </div>
    ),
    clock: (
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
      </div>
    )
  };

  return (
    <div className="flex items-center justify-between rounded-[24px] border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">{title}</p>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-4xl font-bold text-zinc-900 dark:text-zinc-100">{value}</span>
          {subValue && <span className="text-[13px] text-zinc-400">{subValue}</span>}
        </div>
        {trend && (
          <p className={`mt-2 flex items-center gap-1 text-[11px] font-bold ${trendUp ? "text-emerald-500" : "text-orange-500"}`}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={trendUp ? "" : "rotate-180"}>
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
            </svg>
            {trend}
          </p>
        )}
      </div>
      {IconMap[icon]}
    </div>
  );
}

export default function StaffPage() {
  const session = useSession();
  const toast = useToast();
  const canManage = session.user.role === "boss" || session.user.role === "manager";
  const [tab, setTab] = useState<Tab>("active");
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput.trim(), 300);
  const [roleFilter, setRoleFilter] = useState("");

  // Calculate today's date range (Local)
  const dateRange = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    return { from: start.toISOString(), to: end.toISOString(), dateStr: start.toDateString() };
  }, []);

  const [addDrawerOpen, setAddDrawerOpen] = useState(false);
  const [editStaff, setEditStaff] = useState<Staff | null>(null);
  const [deactivateStaff, setDeactivateStaff] = useState<Staff | null>(null);
  const [viewVisitsStaff, setViewVisitsStaff] = useState<Staff | null>(null);
  const [working, setWorking] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top?: number; bottom?: number; right: number } | null>(null);


  const debouncedRole = useDebounce(roleFilter, 0);



  const params = new URLSearchParams();
  params.set("status", tab);
  if (debouncedSearch) params.set("q", debouncedSearch);
  if (debouncedRole) params.set("role", debouncedRole);

  const { data: staffData, mutate: mutateStaff } = useSWR<StaffListResponse>(
    `/api/manager/staff?${params.toString()}`,
    fetcher,
    { refreshInterval: 5000 }
  );

  const staff = staffData?.staff ?? [];
  const counts = staffData?.counts ?? { active: 0, invited: 0, inactive: 0 };
  const loading = !staffData;


  useLayoutEffect(() => {
    if (!menuOpenId || !menuRef.current) {
      setDropdownPosition(null);
      return;
    }
    const rect = menuRef.current.getBoundingClientRect();
    const right = window.innerWidth - rect.right;
    const menuHeight = 220;
    if (rect.bottom + menuHeight > window.innerHeight - 8 && rect.top > menuHeight) {
      setDropdownPosition({ bottom: window.innerHeight - rect.top + 4, right });
    } else {
      setDropdownPosition({ top: rect.bottom + 4, right });
    }
  }, [menuOpenId]);

  useEffect(() => {
    if (!menuOpenId) return;
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (menuRef.current?.contains(target) || dropdownRef.current?.contains(target)) return;
      setMenuOpenId(null);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [menuOpenId]);

  async function handleAdd(payload: { fullName: string; email: string; phone: string; role: string }) {
    setWorking(true);
    const phone = normalizePhoneInput(payload.phone);
    const res = await fetch("/api/manager/staff", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        fullName: payload.fullName,
        email: payload.email,
        phone,
        role: payload.role === "boss" ? "manager" : payload.role,
      }),
    });
    const data = (await res.json()) as { ok: boolean; error?: string };
    setWorking(false);
    if (!res.ok || !data.ok) {
      toast.error(data.error ?? "Could not add staff");
      return data.error;
    }
    toast.success(`Invite sent to ${payload.email}`);
    setAddDrawerOpen(false);
    mutateStaff();
  }

  async function handleUpdate(id: string, payload: { fullName?: string; email?: string; phone?: string; role?: string }) {
    setWorking(true);
    const body: Record<string, unknown> = {};
    if (payload.fullName !== undefined) body.fullName = payload.fullName;
    if (payload.email !== undefined) body.email = payload.email;
    if (payload.role !== undefined) body.role = payload.role === "boss" ? "manager" : payload.role;
    if (payload.phone !== undefined) body.phone = normalizePhoneInput(payload.phone);

    const res = await fetch(`/api/manager/staff/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json()) as { ok: boolean; error?: string };
    setWorking(false);
    if (!res.ok || !data.ok) {
      toast.error(data.error ?? "Could not update staff");
      return data.error;
    }
    toast.success("Staff updated.");
    setEditStaff(null);
    mutateStaff();
  }

  async function handleResendInvite(s: Staff) {
    setMenuOpenId(null);
    setWorking(true);
    const res = await fetch(`/api/manager/staff/${s.company_user_id}/resend-invite`, { method: "POST" });
    const data = (await res.json()) as { ok: boolean; error?: string };
    setWorking(false);
    if (!res.ok || !data.ok) {
      toast.error(data.error ?? "Could not resend invite");
      return;
    }
    toast.success(`Invite resent to ${s.email}`);
    mutateStaff();
  }

  async function handleDeactivate(s: Staff, reassignments?: Record<string, string>) {
    setMenuOpenId(null);
    setDeactivateStaff(null);
    setDeactivatePreview(null);
    setWorking(true);
    const res = await fetch(`/api/manager/staff/${s.company_user_id}/deactivate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(reassignments ? { reassignments } : {}),
    });
    const data = (await res.json()) as { ok: boolean; error?: string };
    setWorking(false);
    if (!res.ok || !data.ok) {
      toast.error(data.error ?? "Could not deactivate");
      return;
    }
    toast.success("Staff deactivated.");
    mutateStaff();
  }

  async function handleActivate(s: Staff) {
    setMenuOpenId(null);
    setWorking(true);
    const res = await fetch(`/api/manager/staff/${s.company_user_id}/activate`, { method: "POST" });
    const data = (await res.json()) as { ok: boolean; error?: string };
    setWorking(false);
    if (!res.ok || !data.ok) {
      toast.error(data.error ?? "Could not activate");
      return;
    }
    toast.success("Staff activated.");
    mutateStaff();
  }

  const [activeReps, setActiveReps] = useState<Staff[]>([]);
  const [deactivatePreview, setDeactivatePreview] = useState<{
    shops_only_this_rep: { shop_id: string; shop_name: string }[];
    shops_other_reps_too: { shop_id: string; shop_name: string }[];
  } | null>(null);

  useEffect(() => {
    if (!deactivateStaff) {
      setDeactivatePreview(null);
      return;
    }
    const params = new URLSearchParams({ status: "active", role: "rep" });
    fetch(`/api/manager/staff?${params}`)
      .then((r) => r.json())
      .then((d: StaffListResponse) => {
        if (d.ok && d.staff) setActiveReps(d.staff.filter((s) => s.company_user_id !== deactivateStaff?.company_user_id));
      });
    fetch(`/api/manager/staff/${deactivateStaff.company_user_id}/deactivate-preview`)
      .then((r) => r.json())
      .then((d: { ok: boolean; shops_only_this_rep?: { shop_id: string; shop_name: string }[]; shops_other_reps_too?: { shop_id: string; shop_name: string }[] }) => {
        if (d.ok) {
          setDeactivatePreview({
            shops_only_this_rep: d.shops_only_this_rep ?? [],
            shops_other_reps_too: d.shops_other_reps_too ?? [],
          });
        } else {
          setDeactivatePreview({ shops_only_this_rep: [], shops_other_reps_too: [] });
        }
      })
      .catch(() => setDeactivatePreview({ shops_only_this_rep: [], shops_other_reps_too: [] }));
  }, [deactivateStaff]);

  const staffLimit = session.company.staffLimit ?? 5;
  const totalAllowed = staffLimit + 1;
  const totalCurrent = counts.active + counts.invited + counts.inactive;
  const atLimit = totalCurrent >= totalAllowed;


  const { data: attendanceData } = useSWR<AttendanceLogListResponse>(
    `/api/manager/attendance?date_from=${dateRange.from}&date_to=${dateRange.to}`,
    fetcher,
    { refreshInterval: 5000 }
  );

  const logs = attendanceData?.logs ?? [];
  // Strict frontend filter for today's local date
  const filteredLogs = logs.filter((l: AttendanceLog) => new Date(l.clock_in_at).toDateString() === dateRange.dateStr);

  // Calc stats
  const currentlyOnClock = filteredLogs.filter((l: AttendanceLog) => !l.clock_out_at).length;
  // Let's assume late is after 9:00 AM for now, or just some demo logic
  const lateArrivals = filteredLogs.filter((l: AttendanceLog) => {
    const time = new Date(l.clock_in_at).getHours();
    return time >= 9;
  }).length;

  const totalMinutesToday = filteredLogs.reduce((acc: number, l: AttendanceLog) => {
    const start = new Date(l.clock_in_at).getTime();
    const end = l.clock_out_at ? new Date(l.clock_out_at).getTime() : Date.now();
    return acc + (end - start) / (1000 * 60);
  }, 0);
  const totalHoursStr = (totalMinutesToday / 60).toLocaleString(undefined, { maximumFractionDigits: 1 });

  return (
    <div className="space-y-8">
      {/* Attendance Stats */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <StatCard
          title="currently on clock"
          value={currentlyOnClock.toString()}
          icon="timer"
        />
        <StatCard
          title="late arrivals"
          value={lateArrivals.toString().padStart(2, '0')}
          subValue="After 09:00 AM"
          icon="alert"
        />
        <StatCard
          title="total hours today"
          value={`${totalHoursStr.replace('.', ',')}h`}
          subValue={`Target: ${(counts.active * 8).toLocaleString()} hrs`}
          icon="clock"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Real-time Attendance Logs</h2>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-xs font-medium text-zinc-700 transition-all hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 3H2l8 9v6l4 2V12l8-9z"/></svg>
            Filters
          </button>
          <button className="flex items-center gap-2 rounded-lg bg-[#f4a261] px-4 py-2 text-xs font-medium text-white transition-all hover:brightness-105">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export
          </button>
          {canManage && (
            <button
              type="button"
              onClick={() => setAddDrawerOpen(true)}
              disabled={atLimit}
              className="rounded-lg bg-[#f4a261] px-4 py-2 text-xs font-medium text-white shadow-lg shadow-orange-500/10 transition-all hover:brightness-105 disabled:opacity-50"
            >
              + Add staff
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex rounded-lg border border-zinc-200 bg-white/50 p-0.5 dark:border-zinc-700 dark:bg-zinc-800/50">
          {(["active", "invited", "inactive"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-md px-3.5 py-2 text-sm font-medium transition-colors ${
                tab === t
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100"
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)} ({counts[t] ?? 0})
            </button>
          ))}
        </div>
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search specific employees by name or department..."
          className="flex-1 min-w-[300px] rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-900 outline-none transition-all placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-500"
        >
          {ROLE_OPTIONS.map((opt) => (
            <option key={opt.value || "all"} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {roleFilter && (
          <button
            type="button"
            onClick={() => setRoleFilter("")}
            className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-400"
          >
            Reset
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-white dark:bg-zinc-800/40" />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-[24px] border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <table className="w-full text-left text-[11px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800">
                <th className="px-8 py-5 font-semibold">REPRESENTATIVE</th>
                <th className="px-5 py-5 font-semibold">STATUS</th>
                <th className="px-5 py-5 font-semibold text-center">CLOCK IN</th>
                <th className="px-5 py-5 font-semibold text-center">CLOCK OUT</th>
                <th className="px-5 py-5 font-semibold text-center">DURATION</th>
                <th className="px-8 py-5 text-right font-semibold">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="normal-case tracking-normal">
              {staff.map((s: Staff) => {
                const log = filteredLogs.find((l: AttendanceLog) => l.rep_company_user_id === s.company_user_id);
                const isCurrentlyIn = log && !log.clock_out_at;
                const isLate = log && new Date(log.clock_in_at).getHours() >= 9;

                const clockIn = log ? new Date(log.clock_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : "--:--";
                const clockOut = log?.clock_out_at ? new Date(log.clock_out_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : "--:--";
                
                let duration = "--:-- hrs";
                if (log) {
                  const start = new Date(log.clock_in_at).getTime();
                  const end = log.clock_out_at ? new Date(log.clock_out_at).getTime() : Date.now();
                  const diff = Math.floor((end - start) / (1000 * 60));
                  const h = Math.floor(diff / 60);
                  const m = diff % 60;
                  duration = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} hrs`;
                }

                return (
                  <tr key={s.company_user_id} className="border-b border-zinc-50 last:border-0 hover:bg-zinc-50/50 dark:border-zinc-800/60 dark:hover:bg-zinc-800/20">
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[13px] font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                            {initials(s.full_name)}
                          </div>
                          {isCurrentlyIn && (
                            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 dark:border-zinc-900" />
                          )}
                        </div>
                        <Link href={`/dashboard/staff/${s.company_user_id}`} className="group cursor-pointer">
                          <div className="text-[14px] font-bold text-zinc-900 group-hover:text-[#f4a261] transition-colors dark:text-zinc-100">{s.full_name}</div>
                          <div className="text-[11px] text-zinc-400 dark:text-zinc-500">
                             {s.role === "back_office" ? "Back office" : s.role === "boss" ? "Admin" : s.role === "rep" ? "Sales Department" : s.role}
                          </div>
                        </Link>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1">
                        {log ? (
                          <>
                            <span className={`inline-flex w-fit rounded-full px-3 py-1 text-[10px] font-bold ${
                              isCurrentlyIn 
                                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400" 
                                : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                            }`}>
                              {isCurrentlyIn ? "Currently In" : "Clocked Out"}
                            </span>
                            {isLate && (
                              <span className="inline-flex w-fit rounded-full bg-orange-50 px-3 py-0.5 text-[9px] font-bold text-orange-600 dark:bg-orange-900/20 dark:text-orange-400">
                                LATE ARRIVAL
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-[11px] text-zinc-400">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center font-medium text-zinc-900 dark:text-zinc-100">
                      {isLate ? <span className="text-red-500">{clockIn}</span> : clockIn}
                    </td>
                    <td className="px-5 py-4 text-center text-zinc-400 dark:text-zinc-500">{clockOut}</td>
                    <td className="px-5 py-4 text-center font-bold text-zinc-900 dark:text-zinc-100">{duration}</td>
                    <td className="px-8 py-4 text-right">
                      <div className="flex items-center justify-end font-medium">
                        <button
                          type="button"
                          onClick={() => setMenuOpenId((id) => (id === s.company_user_id ? null : s.company_user_id))}
                          className="rounded-full p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-700"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="flex items-center justify-between border-t border-zinc-100 px-8 py-5 dark:border-zinc-800">
            <span className="text-[11px] font-bold uppercase text-zinc-400">
              SHOWING 1-{staff.length} OF {counts[tab] ?? 0} EMPLOYEES
            </span>
            <div className="flex gap-1.5">
              {[1, 2, 3].map(p => (
                <button
                  key={p}
                  className={`h-7 w-7 rounded-lg text-[11px] font-bold border transition-all ${
                    p === 1 
                      ? "bg-[#f4a261] border-[#f4a261] text-white" 
                      : "bg-white border-zinc-200 text-zinc-500 hover:border-zinc-300 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-400"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button className="h-7 w-7 rounded-lg border border-zinc-200 flex items-center justify-center text-zinc-400 dark:border-zinc-700">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {menuOpenId && dropdownPosition && typeof document !== "undefined" &&
        createPortal(
          (() => {
            const s = staff.find((x: Staff) => x.company_user_id === menuOpenId);
            if (!s) return null;
            return (
              <div
                ref={dropdownRef}
                className="min-w-[180px] rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-800"
                style={{
                  position: "fixed",
                  zIndex: 50,
                  ...dropdownPosition,
                }}
              >
                <button
                  type="button"
                  onClick={() => setEditStaff(s)}
                  className="w-full px-3 py-2 text-left text-xs text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  Edit details
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpenId(null);
                    setEditStaff({ ...s });
                  }}
                  className="w-full px-3 py-2 text-left text-xs text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  Change role
                </button>
                {(s.status === "invited" || !s.email_verified_at) && (
                  <button
                    type="button"
                    onClick={() => handleResendInvite(s)}
                    disabled={working}
                    className="w-full px-3 py-2 text-left text-xs text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:text-zinc-300 dark:hover:bg-zinc-700"
                  >
                    Resend invite
                  </button>
                )}
                {(s.status === "active" || s.status === "invited") && (
                  <button
                    type="button"
                    onClick={() => {
                      if (s.role === "rep" && (s.assigned_shops_count ?? 0) > 0) {
                        setDeactivateStaff(s);
                      } else {
                        handleDeactivate(s);
                      }
                    }}
                    disabled={working}
                    className="w-full px-3 py-2 text-left text-xs text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:text-zinc-300 dark:hover:bg-zinc-700"
                  >
                    Deactivate
                  </button>
                )}
                {s.status === "inactive" && (
                  <button
                    type="button"
                    onClick={() => handleActivate(s)}
                    disabled={working}
                    className="w-full px-3 py-2 text-left text-xs text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:text-zinc-300 dark:hover:bg-zinc-700"
                  >
                    Activate
                  </button>
                )}
              </div>
            );
          })(),
          document.body
        )}

      {addDrawerOpen && (
        <AddStaffModal
          onClose={() => setAddDrawerOpen(false)}
          onSubmit={handleAdd}
          working={working}
        />
      )}

      {editStaff && (
        <EditStaffModal
          staff={editStaff}
          onClose={() => setEditStaff(null)}
          onSubmit={(payload) => handleUpdate(editStaff.company_user_id, payload)}
          working={working}
        />
      )}

      {deactivateStaff && (
        <DeactivateModal
          staff={deactivateStaff}
          activeReps={activeReps}
          preview={deactivatePreview}
          onClose={() => { setDeactivateStaff(null); setDeactivatePreview(null); }}
          onConfirm={(reassignments) => handleDeactivate(deactivateStaff, reassignments)}
          working={working}
        />
      )}

      {viewVisitsStaff && (
        <VisitHistoryModal
          staff={viewVisitsStaff}
          onClose={() => setViewVisitsStaff(null)}
        />
      )}
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition-colors focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-500";

function AddStaffModal(props: {
  onClose: () => void;
  onSubmit: (p: { fullName: string; email: string; phone: string; role: string }) => Promise<string | undefined>;
  working: boolean;
}) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("rep");
  const [serverError, setServerError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    const err = await props.onSubmit({ fullName, email, phone, role });
    if (err) setServerError(err);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 p-4"
      onClick={props.onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-staff-title"
    >
      <div
        className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="add-staff-title" className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Add staff
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {serverError && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-300">
              {serverError}
            </p>
          )}
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            We&apos;ll generate a password and email login details to this address.
          </p>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Full name</label>
            <input required value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} placeholder="Full name" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Email</label>
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="email@example.com" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Phone</label>
            <input required type="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^\d+]/g, "").slice(0, 14))} className={inputClass} placeholder="+977 98XXXXXXXX" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value as "rep" | "manager" | "back_office")} className={inputClass}>
              <option value="rep">Rep</option>
              <option value="manager">Manager</option>
              <option value="back_office">Back office</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={props.onClose} className="rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800">
              Cancel
            </button>
            <button type="submit" disabled={props.working} className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200">
              {props.working ? "Sending…" : "Send invite"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditStaffModal(props: {
  staff: Staff;
  onClose: () => void;
  onSubmit: (p: { fullName?: string; email?: string; phone?: string; role?: string }) => Promise<string | undefined>;
  working: boolean;
}) {
  const [fullName, setFullName] = useState(props.staff.full_name);
  const [email, setEmail] = useState(props.staff.email);
  const [phone, setPhone] = useState(props.staff.phone ?? "");
  const [role, setRole] = useState(props.staff.role === "boss" ? "manager" : props.staff.role);
  const [serverError, setServerError] = useState<string | null>(null);
  const emailChanged = email !== props.staff.email;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    const err = await props.onSubmit({ fullName, email, phone, role });
    if (err) setServerError(err);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 p-4"
      onClick={props.onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-staff-title"
    >
      <div
        className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="edit-staff-title" className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Edit staff
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {serverError && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-300">
              {serverError}
            </p>
          )}
          {emailChanged && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800/50 dark:bg-amber-900/20 dark:text-amber-200">
              This will change their login email.
            </p>
          )}
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Full name</label>
            <input required value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Email</label>
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Phone</label>
            <input required type="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^\d+]/g, "").slice(0, 14))} className={inputClass} placeholder="+977 98XXXXXXXX" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value as "rep" | "manager" | "back_office")} className={inputClass}>
              <option value="rep">Rep</option>
              <option value="manager">Manager</option>
              <option value="back_office">Back office</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={props.onClose} className="rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800">
              Cancel
            </button>
            <button type="submit" disabled={props.working} className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200">
              {props.working ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeactivateModal(props: {
  staff: Staff;
  activeReps: Staff[];
  preview: {
    shops_only_this_rep: { shop_id: string; shop_name: string }[];
    shops_other_reps_too: { shop_id: string; shop_name: string }[];
  } | null;
  onClose: () => void;
  onConfirm: (reassignments?: Record<string, string>) => void;
  working: boolean;
}) {
  const solo = props.preview?.shops_only_this_rep ?? [];
  const other = props.preview?.shops_other_reps_too ?? [];
  const [reassignments, setReassignments] = useState<Record<string, string>>({});
  const loading = (props.staff.assigned_shops_count ?? 0) > 0 && props.preview === null;
  const needReassign = solo.length > 0;
  const allSoloChosen = solo.every((s) => reassignments[s.shop_id]);
  const canSubmit = !needReassign || (props.activeReps.length > 0 && allSoloChosen);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="deactivate-title">
      <div className="absolute inset-0 bg-zinc-900/40" onClick={props.onClose} aria-hidden="true" />
      <div className="relative w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        <h2 id="deactivate-title" className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Deactivate rep
        </h2>
        {loading ? (
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>
        ) : (
          <>
            {other.length > 0 && (
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                This rep is also assigned to {other.length} shop{other.length !== 1 ? "s" : ""} that have other reps. We&apos;ll remove this rep from those; no reassignment needed.
              </p>
            )}
            {needReassign && (
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                The following shop{solo.length !== 1 ? "s" : ""} {solo.length !== 1 ? "have" : "has"} only this rep. Choose a rep for each:
              </p>
            )}
            {needReassign && (
              <div className="mt-3 space-y-3">
                {props.activeReps.length === 0 ? (
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    No other active reps. Activate another rep first, then try again.
                  </p>
                ) : (
                  solo.map((shop) => (
                    <div key={shop.shop_id}>
                      <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                        {shop.shop_name}
                      </label>
                      <select
                        value={reassignments[shop.shop_id] ?? ""}
                        onChange={(e) => setReassignments((prev) => ({ ...prev, [shop.shop_id]: e.target.value }))}
                        className={inputClass}
                      >
                        <option value="">Select rep</option>
                        {props.activeReps.map((r) => (
                          <option key={r.company_user_id} value={r.company_user_id}>
                            {r.full_name} ({r.email})
                          </option>
                        ))}
                      </select>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={props.onClose}
            className="rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => props.onConfirm(needReassign && allSoloChosen ? reassignments : undefined)}
            disabled={props.working || !canSubmit}
            className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {props.working ? "Updating…" : needReassign ? "Reassign and deactivate" : "Deactivate"}
          </button>
        </div>
      </div>
    </div>
  );
}

function VisitHistoryModal({ staff, onClose }: { staff: Staff; onClose: () => void }) {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/manager/visits?rep=${staff.company_user_id}`)
      .then((r) => r.json())
      .then((d: VisitListResponse) => {
        if (d.ok) setVisits(d.visits ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [staff.company_user_id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-zinc-900/40" onClick={onClose} />
      <div className="relative flex max-h-[80vh] w-full max-w-2xl flex-col rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-100 p-5 dark:border-zinc-800">
          <div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Visit History</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{staff.full_name} • {staff.email}</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
            <span className="text-2xl">×</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
              ))}
            </div>
          ) : visits.length === 0 ? (
            <div className="py-12 text-center text-sm text-zinc-400">
              No visit records found for this staff member.
            </div>
          ) : (
            <div className="space-y-4">
              {visits.map((v) => {
                const start = new Date(v.started_at);
                const end = v.ended_at ? new Date(v.ended_at) : null;
                const duration = end ? Math.round((end.getTime() - start.getTime()) / 60000) : null;

                return (
                  <div key={v.id} className="rounded-lg border border-zinc-100 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-800/50">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">{v.shop_name}</h4>
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                          <span>📅 {start.toLocaleDateString()}</span>
                          <span>🕒 {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – {end ? end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "In progress"}</span>
                          {duration !== null && (
                            <span className="font-medium text-zinc-600 dark:text-zinc-300">⏱️ {duration} mins</span>
                          )}
                        </div>
                      </div>
                      {!v.ended_at && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                          Active
                        </span>
                      )}
                    </div>
                    {v.notes && (
                      <div className="mt-3 rounded border-l-2 border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-300">
                        {v.notes}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t border-zinc-100 p-4 dark:border-zinc-800 text-right">
          <button
            onClick={onClose}
            className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
