"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useSession } from "../_lib/session-context";
import { useToast } from "../_lib/toast-context";
import type { Product, ProductListResponse } from "../_lib/types";

function StatCard({ title, value, subValue, icon, accentColor }: { 
  title: string; 
  value: string; 
  subValue?: string; 
  icon: React.ReactNode;
  accentColor: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-[24px] border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className={`absolute left-0 top-0 h-full w-1 ${accentColor}`} />
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{title}</p>
          <div className="flex flex-col">
            <span className="text-2xl font-black text-zinc-900 dark:text-zinc-100">{value}</span>
            {subValue && <span className="text-[10px] font-bold text-zinc-400 mt-1">{subValue}</span>}
          </div>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-50 text-zinc-400 dark:bg-zinc-800">
          {icon}
        </div>
      </div>
    </div>
  );
}

function useDebounce<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

export default function ProductsPage() {
  const session = useSession();
  const toast = useToast();
  const canManageProducts =
    session.user.role === "boss" ||
    session.user.role === "manager" ||
    session.user.role === "back_office";

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [tab, setTab] = useState<"all" | "active" | "inactive">("all");
  const [searchInput, setSearchInput] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [duplicateFrom, setDuplicateFrom] = useState<Product | null>(null);
  
  const debouncedQ = useDebounce(searchInput.trim(), 300);

  const loadProducts = useCallback(
    async (q: string) => {
      const params = new URLSearchParams();
      // Fetch all products to handle filtering client-side or we can use the API's status filter
      // For the new design with "All Categories/Statuses" dropdowns, it's better to fetch more and filter.
      // But the API currently takes 'status' ('active'/'inactive').
      // Let's fetch both if 'all' is selected.
      
      const fetchList = async (status?: string) => {
          const p = new URLSearchParams();
          if (status) p.set("status", status);
          if (q) p.set("q", q);
          const res = await fetch(`/api/manager/products?${p.toString()}`);
          const data = (await res.json()) as ProductListResponse;
          return data.ok ? (data.products ?? []) : [];
      };

      if (tab === "all") {
          const [active, inactive] = await Promise.all([fetchList("active"), fetchList("inactive")]);
          setProducts([...active, ...inactive].sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      } else {
          const list = await fetchList(tab);
          setProducts(list);
      }
    },
    [tab]
  );

  useEffect(() => {
    setLoading(true);
    loadProducts(debouncedQ).then(() => setLoading(false));
  }, [debouncedQ, loadProducts]);

  const stats = useMemo(() => {
      const total = products.length;
      const active = products.filter(p => p.is_active).length;
      const categories = new Set(products.map(p => p.unit.toLowerCase())).size;
      const activeRate = total > 0 ? Math.round((active / total) * 100) : 0;
      
      return {
          total,
          active,
          categories,
          activeRate: `${activeRate}%`
      };
  }, [products]);

  const filteredProducts = useMemo(() => {
      // Products are already filtered by status if tab !== "all" because of loadProducts fetching logic
      // But we can double check here for a smooth UI
      return products.filter(p => {
          if (tab === "active") return p.is_active;
          if (tab === "inactive") return !p.is_active;
          return true;
      });
  }, [products, tab]);

  async function onCreate(payload: any) {
    setWorking(true);
    const res = await fetch("/api/manager/products", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...payload, status: payload.status ?? "active" }),
    });
    const data = await res.json();
    setWorking(false);
    if (!data.ok) {
      toast.error(data.error ?? "Could not create product");
      return;
    }
    toast.success("Product added.");
    setShowModal(false);
    loadProducts(debouncedQ);
  }

  async function onUpdate(productId: string, payload: any) {
    setWorking(true);
    const body = { ...payload };
    if (payload.status !== undefined) body.isActive = payload.status === "active";
    const res = await fetch(`/api/manager/products/${productId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setWorking(false);
    if (!data.ok) {
      toast.error(data.error ?? "Could not update product");
      return;
    }
    toast.success("Product updated.");
    setShowModal(false);
    loadProducts(debouncedQ);
  }

  async function onDelete(productId: string) {
    if (!confirm("Delete this product?")) return;
    setWorking(true);
    const res = await fetch(`/api/manager/products/${productId}`, { method: "DELETE" });
    const data = await res.json();
    setWorking(false);
    if (!data.ok) {
      toast.error(data.error ?? "Could not delete product");
      return;
    }
    toast.success("Product deleted.");
    loadProducts(debouncedQ);
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400">
             <Link href="/dashboard" className="hover:text-zinc-600">HOME</Link>
             <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="9 18 15 12 9 6"/></svg>
             <span className="text-zinc-300">PRODUCTS</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">Product Inventory</h1>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Manage your product catalog and inventory status.</p>
        </div>
        <div className="flex items-center gap-3">
            <button className="flex h-11 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-5 text-xs font-bold uppercase tracking-widest text-zinc-600 transition-all hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Export
            </button>
            {canManageProducts && (
                <button 
                    onClick={() => { setEditingProduct(null); setDuplicateFrom(null); setShowModal(true); }}
                    className="flex h-11 items-center gap-2 rounded-xl bg-[#f4a261] px-6 text-xs font-bold uppercase tracking-widest text-white shadow-lg shadow-[#f4a261]/20 transition-all hover:brightness-110"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Add New Product
                </button>
            )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
            title="Total Products" 
            value={stats.total.toLocaleString()} 
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>}
            accentColor="bg-sky-400"
        />
        <StatCard 
            title="Active Categories" 
            value={stats.categories.toString()} 
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2l3 6 7.5 1-5.5 5.5 1.5 7.5-6.5-3.5-6.5 3.5 1.5-7.5-5.5-5.5 7.5-1 3-6z"/></svg>}
            accentColor="bg-teal-400"
        />
        <StatCard 
            title="Active Products" 
            value={stats.active.toString()} 
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>}
            accentColor="bg-amber-400"
        />
        <StatCard 
            title="Catalog Coverage" 
            value={stats.activeRate} 
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>}
            accentColor="bg-rose-400"
        />
      </div>

      {/* Main Content Card */}
      <div className="rounded-[32px] border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input 
                    type="text" 
                    placeholder="Search by name, SKU or brand..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="h-11 w-full rounded-xl border border-zinc-100 bg-zinc-50/50 pl-12 pr-4 text-xs font-bold outline-none ring-zinc-500/10 transition-all focus:border-zinc-300 focus:ring-4 dark:border-zinc-800 dark:bg-zinc-800/40 md:w-96"
                />
            </div>
            <div className="flex items-center gap-3">
                <select 
                    value={tab} 
                    onChange={(e) => setTab(e.target.value as any)}
                    className="h-11 rounded-xl border border-zinc-100 bg-zinc-50/50 px-4 text-[11px] font-black uppercase tracking-widest text-zinc-600 outline-none transition-all focus:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-400"
                >
                    <option value="all">All Statuses</option>
                    <option value="active">Active Only</option>
                    <option value="inactive">Inactive Only</option>
                </select>
                <button className="flex h-11 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-5 text-[11px] font-black uppercase tracking-widest text-zinc-600 transition-all hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 3H2l8 9v6l4 2V12l8-9z"/></svg>
                    More Filters
                </button>
            </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800/60">
                <th className="pb-5 pl-2 text-[10px] font-black uppercase tracking-widest text-zinc-400">PRODUCT DETAILS</th>
                <th className="pb-5 text-[10px] font-black uppercase tracking-widest text-zinc-400">SKU</th>
                <th className="pb-5 text-[10px] font-black uppercase tracking-widest text-zinc-400">UNIT / CATEGORY</th>
                <th className="pb-5 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-right">PRICE</th>
                <th className="pb-5 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-center">STATUS</th>
                <th className="pb-5 text-right text-[10px] font-black uppercase tracking-widest text-zinc-400">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/40">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="py-8"><div className="h-12 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40" /></td>
                  </tr>
                ))
              ) : filteredProducts.map((p) => (
                <tr key={p.id} className="group hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20">
                  <td className="py-6 pl-2">
                    <div className="flex items-center gap-4">
                       <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-500 dark:bg-orange-900/20">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 8V21H3V8"/><path d="M1 3H23V8H1V3ZM10 12H14"/></svg>
                       </div>
                       <div>
                          <Link href={`/dashboard/products/${p.id}`}>
                            <p className="text-[13px] font-black text-zinc-900 transition-colors hover:text-[#f4a261] dark:text-zinc-100 dark:hover:text-[#f4a261]">{p.name}</p>
                          </Link>
                          <p className="max-w-[200px] truncate text-[11px] font-medium text-zinc-400">{p.description || "No description provided."}</p>
                       </div>
                    </div>
                  </td>
                  <td className="py-6">
                    <span className="text-[11px] font-bold font-mono text-zinc-500 dark:text-zinc-400">{p.sku}</span>
                  </td>
                  <td className="py-6">
                    <span className="inline-flex rounded-lg bg-zinc-100 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                      {p.unit}
                    </span>
                  </td>
                  <td className="py-6 text-right">
                    <p className="text-[13px] font-black text-zinc-900 dark:text-zinc-100">
                      {p.current_price ? `${p.currency_code ?? "NPR"} ${Number(p.current_price).toLocaleString()}` : "—"}
                    </p>
                  </td>
                  <td className="py-6 text-center">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest ${p.is_active ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400'}`}>
                      <span className={`h-1 w-1 rounded-full ${p.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      {p.is_active ? "In Stock" : "Inactive"}
                    </span>
                  </td>
                  <td className="py-6 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button 
                        onClick={() => { setEditingProduct(p); setShowModal(true); }}
                        className="rounded-xl p-2 text-zinc-400 transition-all hover:bg-zinc-100 hover:text-indigo-600 dark:hover:bg-zinc-800"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                      </button>
                      <button 
                         onClick={() => onDelete(p.id)}
                         className="rounded-xl p-2 text-zinc-400 transition-all hover:bg-zinc-100 hover:text-rose-600 dark:hover:bg-zinc-800"
                      >
                         <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filteredProducts.length && !loading && (
             <div className="py-12 text-center text-zinc-400 text-xs font-bold uppercase tracking-widest">
                No products found matching your criteria.
             </div>
          )}
        </div>

        <div className="mt-8 flex items-center justify-between border-t border-zinc-100 pt-8 dark:border-zinc-800">
            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
                Showing {filteredProducts.length} of {stats.total} entries
            </p>
            <div className="flex items-center gap-2">
                <button className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 text-zinc-400 transition-all hover:bg-zinc-50 dark:border-zinc-800">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <button className="h-9 w-9 rounded-xl bg-[#f4a261] text-[11px] font-black text-white shadow-lg">1</button>
                <button className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 text-zinc-400 transition-all hover:bg-zinc-50 dark:border-zinc-800">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
            </div>
        </div>
      </div>

      {showModal && (
        <ProductModal 
          product={editingProduct} 
          duplicateFrom={duplicateFrom}
          working={working}
          onClose={() => setShowModal(false)}
          onSave={editingProduct ? (payload: any) => onUpdate(editingProduct.id, payload) : onCreate}
          onSetPrice={(price: number, currency: string) => editingProduct && onUpdate(editingProduct.id, { price, currencyCode: currency })}
        />
      )}
    </div>
  );
}

function ProductModal({ product, duplicateFrom, working, onClose, onSave, onSetPrice }: any) {
  const isEdit = !!product && !duplicateFrom;
  const prefill = duplicateFrom || product;
  
  const [name, setName] = useState(prefill?.name || "");
  const [sku, setSku] = useState(duplicateFrom ? "" : prefill?.sku || "");
  const [description, setDescription] = useState(prefill?.description || "");
  const [unit, setUnit] = useState(prefill?.unit || "unit");
  const [price, setPrice] = useState(prefill?.current_price || "");
  const [currency, setCurrency] = useState(prefill?.currency_code || "NPR");
  const [status, setStatus] = useState<"active" | "inactive">(prefill?.is_active === false ? "inactive" : "active");

  const inputClass = "w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-900 outline-none ring-zinc-500/10 transition-all focus:border-zinc-400 focus:ring-4 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="absolute inset-0 bg-zinc-900/60" />
      <div className="relative w-full max-w-xl rounded-[32px] border border-zinc-200 bg-white p-8 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900" onClick={e => e.stopPropagation()}>
         <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
                {isEdit ? "Edit Product" : duplicateFrom ? "Duplicate Product" : "Add New Product"}
            </h2>
            <button onClick={onClose} className="rounded-full bg-zinc-50 p-2 text-zinc-400 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
         </div>

         <form onSubmit={e => {
             e.preventDefault();
             onSave({ name, sku, description, unit, status, price: Number(price) || undefined, currencyCode: currency });
         }} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Product Name</label>
                    <input required className={inputClass} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Wireless Mechanical Keyboard" />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">SKU Code</label>
                    <input required className={inputClass} value={sku} onChange={e => setSku(e.target.value)} placeholder="WMK-700-BL" />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Unit / Category</label>
                    <input required className={inputClass} value={unit} onChange={e => setUnit(e.target.value)} placeholder="e.g. piece, Box, kg" />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Price Amount</label>
                    <input type="number" step="any" className={inputClass} value={price} onChange={e => setPrice(e.target.value)} placeholder="0.00" />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Currency</label>
                    <select className={inputClass} value={currency} onChange={e => setCurrency(e.target.value)}>
                        <option value="NPR">NPR</option>
                        <option value="USD">USD</option>
                        <option value="INR">INR</option>
                    </select>
                </div>
                <div className="space-y-1.5 col-span-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Product Description</label>
                    <textarea className={`${inputClass} h-24 resize-none`} value={description} onChange={e => setDescription(e.target.value)} placeholder="Tell us more about this item..." />
                </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                    <button 
                        type="button"
                        onClick={() => setStatus(status === "active" ? "inactive" : "active")}
                        className={`flex h-6 w-11 items-center rounded-full transition-all ${status === "active" ? "bg-emerald-500" : "bg-zinc-200"}`}
                    >
                        <div className={`h-4 w-4 rounded-full bg-white transition-all ${status === "active" ? "ml-6" : "ml-1"}`} />
                    </button>
                    <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">
                        {status === "active" ? "Product Active" : "Product Inactive"}
                    </span>
                </div>
                <div className="flex gap-3">
                    <button type="button" onClick={onClose} className="rounded-2xl border border-zinc-200 px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:bg-zinc-50">Cancel</button>
                    <button disabled={working} className="rounded-2xl bg-[#f4a261] px-10 py-4 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-[#f4a261]/20 hover:brightness-110 disabled:opacity-50">
                        {working ? "Saving..." : "Save Product"}
                    </button>
                </div>
            </div>
         </form>
      </div>
    </div>
  );
}
