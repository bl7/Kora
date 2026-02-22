"use client";

import { useMemo, useState, Suspense } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { Breadcrumbs } from "../_lib/breadcrumbs";
import type { ExpenseListResponse, StaffListResponse } from "../_lib/types";
import { LoadingState } from "../_lib/components";

export default function ExpensesPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <ExpensesPageInner />
    </Suspense>
  );
}

function ExpensesPageInner() {
  const [search, setSearch] = useState("");
  const [repFilter, setRepFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  
  const { data: staffData } = useSWR<StaffListResponse>("/api/manager/staff", fetcher);
  const reps = staffData?.staff?.filter(s => s.role === 'rep') || [];

  const { data: expensesData, isLoading } = useSWR<ExpenseListResponse>(
    "/api/manager/expenses",
    fetcher
  );

  const expenses = expensesData?.expenses || [];

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const matchRep = repFilter === "all" || e.rep_company_user_id === repFilter;
      const matchCategory = categoryFilter === "all" || e.category === categoryFilter;
      const matchSearch = e.rep_name.toLowerCase().includes(search.toLowerCase()) || 
                          (e.description?.toLowerCase() || "").includes(search.toLowerCase());
      return matchRep && matchCategory && matchSearch;
    });
  }, [expenses, repFilter, categoryFilter, search]);

  const totalAmount = filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

  const categories = Array.from(new Set(expenses.map(e => e.category)));

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <Breadcrumbs items={[{ label: "EXPENSES" }]} />
        <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">Daily Expenses</h1>
        <p className="text-sm font-medium text-zinc-500">View and track field expenses submitted by reps during clock-out.</p>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-zinc-100 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Total Expenses</p>
          <p className="mt-2 text-3xl font-black text-zinc-900 dark:text-zinc-100">Rs. {totalAmount.toLocaleString()}</p>
        </div>
        <div className="rounded-3xl border border-zinc-100 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Entries</p>
          <p className="mt-2 text-3xl font-black text-zinc-900 dark:text-zinc-100">{filteredExpenses.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Search descriptions or reps..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-12 w-full rounded-2xl border border-zinc-100 bg-white pl-12 pr-4 text-sm font-medium shadow-sm outline-none transition-all focus:border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900"
          />
        </div>
        
        <select
          value={repFilter}
          onChange={e => setRepFilter(e.target.value)}
          className="h-12 w-full rounded-2xl border border-zinc-100 bg-white px-4 text-sm font-bold shadow-sm outline-none transition-all focus:border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 md:w-48"
        >
          <option value="all">All Reps</option>
          {reps.map(r => (
            <option key={r.company_user_id} value={r.company_user_id}>{r.full_name}</option>
          ))}
        </select>

        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="h-12 w-full rounded-2xl border border-zinc-100 bg-white px-4 text-sm font-bold shadow-sm outline-none transition-all focus:border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 md:w-48"
        >
          <option value="all">All Categories</option>
          {categories.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* List Table */}
      <div className="rounded-[40px] border border-zinc-100 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-50 dark:border-zinc-800/60">
                <th className="pb-5 pl-8 pt-8 text-[10px] font-black uppercase tracking-widest text-zinc-400">Date</th>
                <th className="pb-5 pt-8 text-[10px] font-black uppercase tracking-widest text-zinc-400">Rep</th>
                <th className="pb-5 pt-8 text-[10px] font-black uppercase tracking-widest text-zinc-400">Category</th>
                <th className="pb-5 pt-8 text-[10px] font-black uppercase tracking-widest text-zinc-400">Description</th>
                <th className="pb-5 pt-8 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-right pr-8">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/40">
              {isLoading ? (
                <tr><td colSpan={5} className="py-10 text-center text-sm font-medium text-zinc-400">Loading expenses...</td></tr>
              ) : filteredExpenses.length === 0 ? (
                <tr><td colSpan={5} className="py-10 text-center text-sm font-medium text-zinc-400">No expenses found.</td></tr>
              ) : (
                filteredExpenses.map(e => (
                  <tr key={e.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20">
                    <td className="py-5 pl-8">
                      <p className="text-[13px] font-bold text-zinc-900 dark:text-zinc-100">
                        {new Date(e.date).toLocaleDateString()}
                      </p>
                      <p className="text-[10px] font-medium text-zinc-400">
                        {new Date(e.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </td>
                    <td className="py-5">
                      <p className="text-[13px] font-black text-zinc-900 dark:text-zinc-100">{e.rep_name}</p>
                    </td>
                    <td className="py-5">
                      <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                        {e.category}
                      </span>
                    </td>
                    <td className="py-5">
                      <p className="text-[13px] font-medium text-zinc-500 max-w-xs truncate">{e.description || "—"}</p>
                    </td>
                    <td className="py-5 text-right pr-8">
                      <p className="text-[14px] font-black text-zinc-900 dark:text-zinc-100">
                        Rs. {Number(e.amount).toLocaleString()}
                      </p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
