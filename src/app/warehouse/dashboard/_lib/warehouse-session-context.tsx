"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { MeResponse } from "@/app/dashboard/_lib/types";

type WarehouseSessionState = {
  user: NonNullable<MeResponse["user"]>;
  company: NonNullable<MeResponse["company"]>;
  refreshSession: () => Promise<void>;
};

const WarehouseSessionContext = createContext<WarehouseSessionState | null>(null);

export function useWarehouseSession() {
  const ctx = useContext(WarehouseSessionContext);
  if (!ctx) throw new Error("useWarehouseSession must be used inside WarehouseSessionProvider");
  return ctx;
}

export function WarehouseSessionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [session, setSession] = useState<Omit<WarehouseSessionState, "refreshSession"> | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    const res = await fetch("/api/auth/me");
    const data = (await res.json()) as MeResponse;
    
    if (!res.ok || !data.ok || !data.user || !data.company) {
      router.push("/warehouse/login");
      return;
    }
    
    // Enforce role: Only dispatch_supervisor, manager, and boss can access warehouse
    const allowedRoles = ["dispatch_supervisor", "manager", "boss"];
    if (!allowedRoles.includes(data.user.role)) {
      router.replace("/dashboard");
      return;
    }

    setSession({ user: data.user, company: data.company });
  }, [router]);

  useEffect(() => {
    void refreshSession().then(() => setLoading(false));
  }, [refreshSession]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50 dark:bg-[#0d1117]">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading Warehouse Dashboard…</p>
      </div>
    );
  }

  if (!session) return null;

  return (
    <WarehouseSessionContext.Provider value={{ ...session, refreshSession }}>
      {children}
    </WarehouseSessionContext.Provider>
  );
}
