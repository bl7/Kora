"use client";

import { useEffect, useMemo, useState } from "react";
import type { Staff, StaffListResponse, Shop, ShopListResponse } from "../_lib/types";

export default function AssignmentsPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  const [shopId, setShopId] = useState("");
  const [repCompanyUserId, setRepCompanyUserId] = useState("");
  const [isPrimary, setIsPrimary] = useState(true);

  const reps = useMemo(
    () => staff.filter((s) => s.role === "rep" && s.status === "active"),
    [staff]
  );

  async function loadData() {
    const [sRes, shRes] = await Promise.all([
      fetch("/api/manager/staff"),
      fetch("/api/manager/shops"),
    ]);
    const sData = (await sRes.json()) as StaffListResponse;
    const shData = (await shRes.json()) as ShopListResponse;
    setStaff(sData.staff ?? []);
    setShops(shData.shops ?? []);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [sRes, shRes] = await Promise.all([
        fetch("/api/manager/staff"),
        fetch("/api/manager/shops"),
      ]);
      const sData = (await sRes.json()) as StaffListResponse;
      const shData = (await shRes.json()) as ShopListResponse;
      if (cancelled) return;
      setStaff(sData.staff ?? []);
      setShops(shData.shops ?? []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  async function onAssign(e: React.FormEvent) {
    e.preventDefault();
    if (!shopId || !repCompanyUserId) return;
    setWorking(true);
    setError(null);
    const res = await fetch("/api/manager/shop-assignments", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ shopId, repCompanyUserId, isPrimary }),
    });
    const data = (await res.json()) as { ok: boolean; error?: string };
    setWorking(false);
    if (!res.ok || !data.ok) {
      setError(data.error ?? "Could not assign shop");
      return;
    }
    setShopId("");
    setRepCompanyUserId("");
    setIsPrimary(true);
    await loadData();
  }

  const selectClass =
    "w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition-colors focus:border-zinc-400 focus:bg-white dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-500 dark:focus:bg-zinc-800";

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Assignments</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Assign shops to reps for visit tracking and order capture.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800/40 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Assignment form */}
      <div className="mb-8 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-100">New Assignment</h2>
        <form onSubmit={onAssign} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <select required value={shopId} onChange={(e) => setShopId(e.target.value)} className={selectClass}>
            <option value="">Select Shop</option>
            {shops.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <select required value={repCompanyUserId} onChange={(e) => setRepCompanyUserId(e.target.value)} className={selectClass}>
            <option value="">Select Rep</option>
            {reps.map((r) => (
              <option key={r.company_user_id} value={r.company_user_id}>{r.full_name}</option>
            ))}
          </select>
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            <input
              type="checkbox"
              checked={isPrimary}
              onChange={(e) => setIsPrimary(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-300 accent-zinc-900 dark:accent-zinc-100"
            />
            Primary
          </label>
          <button
            disabled={working || loading}
            type="submit"
            className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Assign
          </button>
        </form>
      </div>

      {/* Shops with assignments */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-zinc-200/60 dark:bg-zinc-800/60" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {shops.filter((s) => s.assignment_count > 0).map((s) => (
            <div key={s.id} className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-500 dark:text-zinc-400">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">{s.name}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {s.assignment_count} {s.assignment_count === 1 ? "rep assigned" : "reps assigned"}
                  </p>
                </div>
              </div>
            </div>
          ))}
          {shops.every((s) => s.assignment_count === 0) && (
            <div className="rounded-xl border border-zinc-200 bg-white px-5 py-10 text-center text-sm text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900">
              No assignments yet. Use the form above to assign shops to reps.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

