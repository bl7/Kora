"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { ToastProvider } from "../../dashboard/_lib/toast-context";
import { WarehouseSessionProvider, useWarehouseSession } from "./_lib/warehouse-session-context";

export default function WarehouseDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <WarehouseSessionProvider>
        <WarehouseDashboardShell>{children}</WarehouseDashboardShell>
      </WarehouseSessionProvider>
    </ToastProvider>
  );
}

function WarehouseDashboardShell({ children }: { children: React.ReactNode }) {
  const session = useWarehouseSession();
  const pathname = usePathname();
  const router = useRouter();

  async function onLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/warehouse/login");
  }

  return (
    <div className="flex h-screen bg-zinc-100 dark:bg-[#0d1117]">
      {/* Simple Sidebar */}
      <aside className="hidden w-[280px] flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 lg:flex">
        <div className="flex h-32 items-center px-8">
          <Image src="/logo.svg" alt="SalesSuite" width={120} height={40} className="h-10 w-auto dark:hidden" />
          <Image src="/logo-dark.svg" alt="SalesSuite" width={120} height={40} className="hidden h-10 w-auto dark:block" />
        </div>

        <nav className="flex-1 px-4">
          <Link
            href="/warehouse/dashboard"
            className={`flex items-center gap-4 rounded-2xl px-6 py-3.5 text-[13px] font-bold transition-all ${
              pathname === "/warehouse/dashboard"
                ? "bg-[#f4a261]/5 text-[#f4a261]"
                : "text-zinc-500 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="shrink-0"><rect x="1" y="3" width="15" height="13"/><polyline points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
            Pending Shipments
          </Link>

          {(session.user.role === "manager" || session.user.role === "boss") && (
            <div className="mt-8 space-y-4">
               <p className="px-6 text-[9px] font-black uppercase tracking-widest text-zinc-400">Navigation</p>
               <Link
                href="/dashboard"
                className="flex items-center gap-4 rounded-2xl px-6 py-3.5 text-[13px] font-bold text-zinc-500 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                Main Dashboard
              </Link>
            </div>
          )}
        </nav>

        <div className="border-t border-zinc-200 p-6 dark:border-zinc-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-zinc-50 text-[12px] font-black text-zinc-400 dark:bg-zinc-800">
              {session.user.fullName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-black text-zinc-900 dark:text-zinc-100">{session.user.fullName}</p>
              <p className="truncate text-[10px] font-bold uppercase tracking-widest text-[#f4a261]">
                {session.user.role === "dispatch_supervisor" ? "Dispatch Supervisor" : 
                 session.user.role === "manager" ? "Manager" : 
                 session.user.role === "boss" ? "Admin" : "User"}
              </p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white text-[11px] font-black uppercase tracking-widest text-zinc-400 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900"
          >
            Sign Out
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
          <header className="flex h-14 items-center justify-between border-b border-zinc-200 bg-white px-8 lg:hidden dark:border-zinc-800 dark:bg-zinc-900">
             <Image src="/logo.svg" alt="SalesSuite" width={100} height={40} className="h-8 w-auto dark:hidden" />
             <Image src="/logo-dark.svg" alt="SalesSuite" width={100} height={40} className="hidden h-8 w-auto dark:block" />
             <button onClick={onLogout} className="text-xs font-bold uppercase tracking-widest text-zinc-400">Logout</button>
          </header>
        <main className="flex-1 overflow-y-auto p-8">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
