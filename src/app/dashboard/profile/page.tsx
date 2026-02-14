"use client";

import { useState } from "react";
import { useSession } from "../_lib/session-context";
import { useToast } from "../_lib/toast-context";

const inputClass =
  "w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition-colors focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-500";

function normalizePhoneInput(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+977${digits}`;
  if (digits.length === 13 && digits.startsWith("977")) return `+${digits}`;
  if (digits.length >= 10) return `+977${digits.slice(-10)}`;
  return phone;
}

function daysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

export default function ProfilePage() {
  const session = useSession();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [working, setWorking] = useState(false);
  const [fullName, setFullName] = useState(session.user.fullName);
  const [email, setEmail] = useState(session.user.email);
  const [phone, setPhone] = useState(session.user.phone ?? "");
  const [serverError, setServerError] = useState<string | null>(null);

  const staffLimit = session.company.staffLimit ?? 5;
  const staffCount = session.company.staffCount ?? 0;
  const totalAllowed = staffLimit + 1; // +1 for manager slot
  const daysLeft = daysUntil(session.company.subscriptionEndsAt);
  const subscriptionActive = daysLeft !== null && daysLeft > 0;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    setWorking(true);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: normalizePhoneInput(phone),
      }),
    });
    const data = (await res.json()) as { ok: boolean; error?: string };
    setWorking(false);
    if (!res.ok || !data.ok) {
      setServerError(data.error ?? "Could not update profile");
      return;
    }
    toast.success("Profile updated");
    await session.refreshSession();
    setEditing(false);
  }

  function handleCancel() {
    setFullName(session.user.fullName);
    setEmail(session.user.email);
    setPhone(session.user.phone ?? "");
    setServerError(null);
    setEditing(false);
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          Profile
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Your account details and subscription info.
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile details */}
        <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Personal details
            </h2>
            {!editing ? (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Edit
              </button>
            ) : null}
          </div>

          {editing ? (
            <form onSubmit={handleSave} className="mt-6 space-y-4">
              {serverError && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-300">
                  {serverError}
                </p>
              )}
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Full name
                </label>
                <input
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Email
                </label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Phone
                </label>
                <input
                  required
                  type="tel"
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value.replace(/[^\d+]/g, "").slice(0, 14))
                  }
                  className={inputClass}
                  placeholder="+977 98XXXXXXXX"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={working}
                  className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  {working ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          ) : (
            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Full name
                </dt>
                <dd className="mt-0.5 text-zinc-900 dark:text-zinc-100">
                  {session.user.fullName}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Email
                </dt>
                <dd className="mt-0.5 text-zinc-900 dark:text-zinc-100">
                  {session.user.email}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Phone
                </dt>
                <dd className="mt-0.5 text-zinc-900 dark:text-zinc-100">
                  {session.user.phone ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Company
                </dt>
                <dd className="mt-0.5 text-zinc-900 dark:text-zinc-100">
                  {session.company.name}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Company address
                </dt>
                <dd className="mt-0.5 text-zinc-900 dark:text-zinc-100">
                  {session.company.address?.trim() || "—"}
                </dd>
              </div>
            </dl>
          )}
        </section>

        {/* Subscription */}
        <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Subscription
          </h2>
          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Status
              </dt>
              <dd className="mt-0.5">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    subscriptionActive
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                  }`}
                >
                  {subscriptionActive ? "Active" : "Expired"}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Expires
              </dt>
              <dd className="mt-0.5 text-zinc-900 dark:text-zinc-100">
                {formatDate(session.company.subscriptionEndsAt)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Time remaining
              </dt>
              <dd className="mt-0.5 text-zinc-900 dark:text-zinc-100">
                {daysLeft !== null
                  ? daysLeft > 0
                    ? `${daysLeft} day${daysLeft !== 1 ? "s" : ""} left`
                    : "Expired"
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Team members
              </dt>
              <dd className="mt-0.5 text-zinc-900 dark:text-zinc-100">
                {staffCount} of {totalAllowed} allowed
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}
