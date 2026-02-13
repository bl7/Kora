"use client";

import { useEffect, useState } from "react";
import type { Staff, StaffListResponse } from "../_lib/types";

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const [showForm, setShowForm] = useState(false);

  async function loadStaff() {
    const res = await fetch("/api/manager/staff");
    const data = (await res.json()) as StaffListResponse;
    if (!res.ok || !data.ok) {
      setError(data.error ?? "Failed to load staff");
      return;
    }
    setStaff(data.staff ?? []);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/manager/staff");
      const data = (await res.json()) as StaffListResponse;
      if (cancelled) return;
      if (res.ok && data.ok) setStaff(data.staff ?? []);
      else setError(data.error ?? "Failed to load staff");
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  async function onAdd(payload: {
    fullName: string;
    email: string;
    password: string;
    phone: string;
    role: "manager" | "rep" | "back_office";
  }) {
    setWorking(true);
    setError(null);
    const res = await fetch("/api/manager/staff", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as { ok: boolean; error?: string };
    setWorking(false);
    if (!res.ok || !data.ok) {
      setError(data.error ?? "Could not create staff");
      return;
    }
    setShowForm(false);
    await loadStaff();
  }

  async function toggleStatus(s: Staff) {
    setWorking(true);
    setError(null);
    const nextStatus = s.status === "active" ? "inactive" : "active";
    const res = await fetch(`/api/manager/staff/${s.company_user_id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    const data = (await res.json()) as { ok: boolean; error?: string };
    setWorking(false);
    if (!res.ok || !data.ok) {
      setError(data.error ?? "Could not update staff");
      return;
    }
    await loadStaff();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Staff</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Manage your team members, reps, and back office staff.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {showForm ? "Cancel" : "+ Add Staff"}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800/40 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {showForm && (
        <div className="mb-6 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-100">New Staff Member</h2>
          <StaffForm disabled={working} onSubmit={onAdd} />
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-zinc-200/60 dark:bg-zinc-800/60" />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <th className="px-5 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Name</th>
                <th className="px-5 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Email</th>
                <th className="px-5 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Phone</th>
                <th className="px-5 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Role</th>
                <th className="px-5 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {staff.map((s) => (
                <tr key={s.company_user_id} className="border-b border-zinc-100 last:border-0 dark:border-zinc-800/60">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                        {s.full_name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">{s.full_name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-zinc-600 dark:text-zinc-400">{s.email}</td>
                  <td className="px-5 py-3.5 text-zinc-600 dark:text-zinc-400">{s.phone ?? "—"}</td>
                  <td className="px-5 py-3.5">
                    <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                      {s.role}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      s.status === "active"
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                    }`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => toggleStatus(s)}
                      disabled={working}
                      className="rounded-md border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    >
                      {s.status === "active" ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!staff.length && (
            <div className="px-5 py-10 text-center text-sm text-zinc-400">
              No staff members yet. Click &quot;+ Add Staff&quot; to get started.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StaffForm(props: {
  disabled: boolean;
  onSubmit: (payload: {
    fullName: string;
    email: string;
    password: string;
    phone: string;
    role: "manager" | "rep" | "back_office";
  }) => Promise<void>;
}) {
  const [phoneDigits, setPhoneDigits] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"manager" | "rep" | "back_office">("rep");

  const inputClass =
    "w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition-colors focus:border-zinc-400 focus:bg-white dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-500 dark:focus:bg-zinc-800";

  return (
    <form
      className="grid gap-4 sm:grid-cols-2"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!/^\d{10}$/.test(phoneDigits)) return;
        await props.onSubmit({
          fullName,
          email,
          password,
          phone: `+977${phoneDigits}`,
          role,
        });
        setPhoneDigits("");
        setFullName("");
        setEmail("");
        setPassword("");
        setRole("rep");
      }}
    >
      <input required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" className={inputClass} />
      <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className={inputClass} />
      <input required minLength={8} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className={inputClass} />
      <div className="grid grid-cols-[80px_1fr] gap-2">
        <div className="flex items-center justify-center rounded-lg border border-zinc-200 bg-zinc-100 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
          +977
        </div>
        <input
          required
          inputMode="numeric"
          pattern="\d{10}"
          maxLength={10}
          value={phoneDigits}
          onChange={(e) => setPhoneDigits(e.target.value.replace(/[^0-9]/g, "").slice(0, 10))}
          placeholder="98XXXXXXXX"
          className={inputClass}
        />
      </div>
      <select
        value={role}
        onChange={(e) => setRole(e.target.value as "manager" | "rep" | "back_office")}
        className={inputClass}
      >
        <option value="rep">Rep</option>
        <option value="manager">Manager</option>
        <option value="back_office">Back Office</option>
      </select>
      <div className="flex items-end">
        <button
          disabled={props.disabled}
          type="submit"
          className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Add Staff
        </button>
      </div>
    </form>
  );
}

