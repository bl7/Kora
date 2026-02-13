"use client";

import { useEffect, useState } from "react";
import type { Shop, ShopListResponse } from "../_lib/types";

export default function ShopsPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const [showForm, setShowForm] = useState(false);

  async function loadShops() {
    const res = await fetch("/api/manager/shops");
    const data = (await res.json()) as ShopListResponse;
    if (!res.ok || !data.ok) {
      setError(data.error ?? "Failed to load shops");
      return;
    }
    setShops(data.shops ?? []);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/manager/shops");
      const data = (await res.json()) as ShopListResponse;
      if (cancelled) return;
      if (res.ok && data.ok) setShops(data.shops ?? []);
      else setError(data.error ?? "Failed to load shops");
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  async function onAdd(payload: {
    name: string;
    latitude: number;
    longitude: number;
    geofenceRadiusM: number;
  }) {
    setWorking(true);
    setError(null);
    const res = await fetch("/api/manager/shops", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as { ok: boolean; error?: string };
    setWorking(false);
    if (!res.ok || !data.ok) {
      setError(data.error ?? "Could not create shop");
      return;
    }
    setShowForm(false);
    await loadShops();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Shops</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Manage shop locations and geofencing for visit verification.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {showForm ? "Cancel" : "+ Add Shop"}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800/40 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {showForm && (
        <div className="mb-6 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-100">New Shop</h2>
          <ShopForm disabled={working} onSubmit={onAdd} />
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-zinc-200/60 dark:bg-zinc-800/60" />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <th className="px-5 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Name</th>
                <th className="px-5 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Location</th>
                <th className="px-5 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Radius</th>
                <th className="px-5 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Reps Assigned</th>
                <th className="px-5 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Status</th>
              </tr>
            </thead>
            <tbody>
              {shops.map((s) => (
                <tr key={s.id} className="border-b border-zinc-100 last:border-0 dark:border-zinc-800/60">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-500 dark:text-zinc-400">
                          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z" />
                        </svg>
                      </div>
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-zinc-600 dark:text-zinc-400">
                    {s.latitude.toFixed(4)}, {s.longitude.toFixed(4)}
                  </td>
                  <td className="px-5 py-3.5 text-zinc-600 dark:text-zinc-400">{s.geofence_radius_m}m</td>
                  <td className="px-5 py-3.5 text-zinc-600 dark:text-zinc-400">{s.assignment_count}</td>
                  <td className="px-5 py-3.5">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      s.is_active
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                    }`}>
                      {s.is_active ? "active" : "inactive"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!shops.length && (
            <div className="px-5 py-10 text-center text-sm text-zinc-400">
              No shops yet. Click &quot;+ Add Shop&quot; to get started.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ShopForm(props: {
  disabled: boolean;
  onSubmit: (payload: {
    name: string;
    latitude: number;
    longitude: number;
    geofenceRadiusM: number;
  }) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [geofenceRadiusM, setGeofenceRadiusM] = useState("60");

  const inputClass =
    "w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition-colors focus:border-zinc-400 focus:bg-white dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-500 dark:focus:bg-zinc-800";

  return (
    <form
      className="grid gap-4 sm:grid-cols-2"
      onSubmit={async (e) => {
        e.preventDefault();
        await props.onSubmit({
          name,
          latitude: Number(latitude),
          longitude: Number(longitude),
          geofenceRadiusM: Number(geofenceRadiusM),
        });
        setName("");
        setLatitude("");
        setLongitude("");
        setGeofenceRadiusM("60");
      }}
    >
      <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Shop name" className={inputClass} />
      <input required type="number" step="any" value={latitude} onChange={(e) => setLatitude(e.target.value)} placeholder="Latitude" className={inputClass} />
      <input required type="number" step="any" value={longitude} onChange={(e) => setLongitude(e.target.value)} placeholder="Longitude" className={inputClass} />
      <input required type="number" min={1} value={geofenceRadiusM} onChange={(e) => setGeofenceRadiusM(e.target.value)} placeholder="Geofence radius (m)" className={inputClass} />
      <div className="flex items-end sm:col-span-2">
        <button
          disabled={props.disabled}
          type="submit"
          className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Add Shop
        </button>
      </div>
    </form>
  );
}

