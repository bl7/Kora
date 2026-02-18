"use client";

import { useState } from "react";
import { useSession } from "../_lib/session-context";
import { useToast } from "../_lib/toast-context";
import Link from "next/link";

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
  now.setHours(0, 0, 0, 0); d.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

export default function ProfilePage() {
  const session = useSession();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [working, setWorking] = useState(false);
  const [formData, setFormData] = useState({
      fullName: session.user.fullName,
      email: session.user.email,
      phone: session.user.phone ?? "",
  });

  const staffLimit = session.company.staffLimit ?? 5;
  const staffCount = session.company.staffCount ?? 0;
  const totalAllowed = staffLimit + 1;
  const daysLeft = daysUntil(session.company.subscriptionEndsAt);
  const subscriptionActive = daysLeft !== null && daysLeft > 0;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setWorking(true);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: normalizePhoneInput(formData.phone),
      }),
    });
    const data = await res.json();
    setWorking(false);
    if (data.ok) {
      toast.success("Profile credentials updated.");
      await session.refreshSession();
      setEditing(false);
    } else {
      toast.error(data.error || "Update failed");
    }
  }

  const inputClass = "w-full rounded-xl border border-zinc-100 bg-zinc-50/50 px-4 py-3 text-[13px] font-medium text-zinc-900 outline-none transition-all focus:border-zinc-200 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-100";

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">User Profile</h1>
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Manage your profile details and company info.</p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Identity Card */}
          <div className="rounded-[40px] border border-zinc-100 bg-white p-10 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mb-10 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-orange-50 text-2xl font-black text-[#f4a261] dark:bg-orange-900/20">
                          {session.user.fullName.charAt(0)}
                      </div>
                      <div>
                          <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100">{session.user.fullName}</h2>
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{session.user.role} · {session.company.name}</p>
                      </div>
                  </div>
                  <button 
                    onClick={() => setEditing(!editing)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-50 text-zinc-400 hover:bg-zinc-50 dark:border-zinc-800"
                  >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
              </div>

              {editing ? (
                  <form onSubmit={handleSave} className="space-y-6">
                      <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Full Name</label>
                          <input required className={inputClass} value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
                      </div>
                      <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Email Address</label>
                          <input required type="email" className={inputClass} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                      </div>
                      <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Phone Number</label>
                          <input required className={inputClass} value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                      </div>
                      <div className="flex gap-4 pt-4">
                          <button type="button" onClick={() => setEditing(false)} className="h-14 flex-1 rounded-2xl border border-zinc-50 text-[11px] font-black uppercase tracking-widest text-zinc-400 hover:bg-zinc-50 dark:border-zinc-800">Discard</button>
                          <button disabled={working} className="h-14 flex-1 rounded-2xl bg-[#f4a261] text-[11px] font-black uppercase tracking-widest text-white shadow-xl shadow-orange-500/20">
                             {working ? "Saving..." : "Save Changes"}
                          </button>
                      </div>
                  </form>
              ) : (
                   <div className="space-y-8">
                      <DetailRow label="Email" value={session.user.email} />
                      <DetailRow label="Phone" value={session.user.phone || "Not provided"} />
                      <DetailRow label="Company" value={session.company.name} />
                      <DetailRow label="Address" value={session.company.address || "No address provided"} />
                  </div>
              )}
          </div>

          {/* Subscription Card */}
          <div className="flex flex-col gap-6">
               <div className="rounded-[40px] border border-zinc-100 bg-white p-10 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                  <h2 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-8">Subscription Status</h2>
                  
                  <div className="mb-10 flex items-center justify-between">
                       <div>
                          <p className="text-3xl font-black text-zinc-900 dark:text-zinc-100">{daysLeft ?? 0} Days</p>
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Days Remaining</p>
                      </div>
                       <span className={`rounded-full px-4 py-1.5 text-[9px] font-black uppercase tracking-widest ${subscriptionActive ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20" : "bg-rose-50 text-rose-600 dark:bg-rose-900/20"}`}>
                          {subscriptionActive ? "Active" : "Expired"}
                      </span>
                  </div>

                  <div className="space-y-6">
                       <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-zinc-500">Expiration Date</span>
                          <span className="text-[11px] font-black text-zinc-900 dark:text-zinc-100">{formatDate(session.company.subscriptionEndsAt)}</span>
                      </div>
                      <div className="space-y-2">
                           <div className="flex justify-between items-baseline">
                              <span className="text-[11px] font-bold text-zinc-500">Staff Limit</span>
                              <span className="text-[11px] font-black text-zinc-900 dark:text-zinc-100">{staffCount} / {totalAllowed} Members</span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-50 dark:bg-zinc-800">
                              <div className="h-full bg-[#f4a261] transition-all" style={{ width: `${(staffCount / totalAllowed) * 100}%` }} />
                          </div>
                      </div>
                  </div>
              </div>

              <div className="rounded-[40px] border border-transparent bg-indigo-600 p-10 text-white shadow-xl shadow-indigo-500/20">
                   <h3 className="text-xl font-black mb-2">Need a bigger team?</h3>
                  <p className="text-sm font-medium text-indigo-100 mb-8 opacity-80">Upgrade your plan to add more staff and unlock better features for your business.</p>
                  <button className="h-14 w-full rounded-2xl bg-white text-[11px] font-black uppercase tracking-widest text-indigo-600 transition-all hover:bg-indigo-50">View Pricing Plans</button>
              </div>
          </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{label}</p>
            <p className="mt-1 text-[13px] font-black text-zinc-900 dark:text-zinc-100">{value}</p>
        </div>
    );
}
