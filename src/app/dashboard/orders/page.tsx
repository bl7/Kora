"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { useToast } from "../_lib/toast-context";
import { useSession } from "../_lib/session-context";
import Link from "next/link";
import { Breadcrumbs } from "../_lib/breadcrumbs";

type OrderItem = {
  id: string;
  product_id: string | null;
  product_name: string;
  product_sku: string | null;
  quantity: string;
  unit_price: string;
  line_total: string;
  notes: string | null;
};

type Order = {
  id: string;
  order_number: string;
  status: "received" | "processing" | "shipped" | "closed" | "cancelled";
  notes: string | null;
  total_amount: string;
  currency_code: string;
  placed_at: string;
  processed_at: string | null;
  shipped_at: string | null;
  closed_at: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  cancel_note: string | null;
  created_at: string;
  updated_at: string;
  shop_id: string | null;
  shop_name: string | null;
  shop_phone: string | null;
  shop_address: string | null;
  lead_name: string | null;
  placed_by_name: string | null;
  placed_by_company_user_id: string | null;
  items_count?: number;
  items: OrderItem[] | null;
};

type OrderDetail = Order & {
  shop_contact_name?: string | null;
  cancelled_by_name?: string | null;
};

type Shop = { id: string; name: string };
type Product = { id: string; name: string; sku: string; current_price: string | null; currency_code: string | null; unit: string };
type Rep = { company_user_id: string; full_name: string };

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  received: { label: "Received", color: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400", dot: "bg-blue-500" },
  processing: { label: "Processing", color: "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400", dot: "bg-amber-500" },
  shipped: { label: "Dispatched", color: "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400", dot: "bg-indigo-500" },
  closed: { label: "Completed", color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400", dot: "bg-emerald-500" },
  cancelled: { label: "Cancelled", color: "bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400", dot: "bg-rose-500" },
};

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

export default function OrdersPage() {
  const session = useSession();
  const toast = useToast();
  const [tab, setTab] = useState<"all" | "pending" | "shipped" | "closed" | "cancelled">("all");
  const [searchInput, setSearchInput] = useState("");
  const [drawerOrderId, setDrawerOrderId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [working, setWorking] = useState(false);

  // Fetching data
  // We use current implementation's logic but wrap in new design
  const { data: ordersData, mutate: mutateOrders } = useSWR<{ ok: boolean; orders?: Order[] }>(
    `/api/manager/orders`,
    fetcher,
    { refreshInterval: 5000 }
  );

  const { data: countsData } = useSWR<{ ok: boolean; counts?: any }>(
    "/api/manager/orders/counts",
    fetcher
  );

  const orders = ordersData?.orders ?? [];
  const counts = countsData?.counts ?? { received: 0, processing: 0, shipped: 0, closed: 0, cancelled: 0 };

  const stats = useMemo(() => {
    const total = orders.length;
    const pending = counts.received + counts.processing;
    const totalValue = orders.reduce((acc, o) => acc + Number(o.total_amount), 0);
    
    const today = new Date().toISOString().split('T')[0];
    const todayCount = orders.filter(o => o.created_at?.startsWith(today!)).length;
    
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    const monthlyRevenue = orders
        .filter(o => o.created_at?.startsWith(currentMonth))
        .reduce((acc, o) => acc + Number(o.total_amount), 0);
    
    return {
      total,
      pending,
      received: counts.received,
      shipped: counts.shipped,
      todayCount,
      totalValue: `NPR ${totalValue.toLocaleString()}`,
      monthlyRevenue: `NPR ${monthlyRevenue.toLocaleString()}`
    };
  }, [orders, counts]);

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchesSearch = o.order_number.toLowerCase().includes(searchInput.toLowerCase()) || 
                           (o.shop_name || "").toLowerCase().includes(searchInput.toLowerCase());
      const matchesTab = tab === "all" || 
                         (tab === "pending" && (o.status === "received" || o.status === "processing")) ||
                         (tab === o.status);
      return matchesSearch && matchesTab;
    });
  }, [orders, searchInput, tab]);

  function handleExport() {
    if (orders.length === 0) {
      toast.error("No orders to export");
      return;
    }
    const headers = ["Order #", "Shop", "Date", "Status", "Total Amount", "Rep"];
    const rows = orders.map(o => [
      o.order_number,
      o.shop_name || "N/A",
      new Date(o.created_at).toLocaleDateString(),
      o.status,
      o.total_amount,
      o.placed_by_name || "N/A"
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `orders_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Orders exported to CSV");
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <Breadcrumbs items={[{ label: "ORDERS" }]} />
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">Marketplace Orders</h1>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Track and process customer orders across all channels.</p>
        </div>
        <div className="flex items-center gap-3">
            <button 
                onClick={handleExport}
                className="flex h-11 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-5 text-xs font-bold uppercase tracking-widest text-zinc-600 transition-all hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Export Report
            </button>
            <button 
                onClick={() => setShowCreateModal(true)}
                className="flex h-11 items-center gap-2 rounded-xl bg-[#f4a261] px-6 text-xs font-bold uppercase tracking-widest text-white shadow-lg shadow-[#f4a261]/20 transition-all hover:brightness-110"
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                New Sales Order
            </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Orders" value={stats.total.toLocaleString()} subValue={`+${stats.todayCount} today`} accentColor="bg-sky-400" icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 8V21H3V8"/><path d="M1 3H23V8H1V3ZM10 12H14"/></svg>} />
        <StatCard title="Pending Approval" value={stats.received.toString()} subValue="Awaiting processing" accentColor="bg-amber-400" icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>} />
        <StatCard title="Dispatched" value={stats.shipped.toString()} subValue="Currently in transit" accentColor="bg-indigo-400" icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="1" y="3" width="15" height="13"/><polyline points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>} />
        <StatCard title="Monthly Revenue" value={stats.monthlyRevenue} subValue="Gross sales this month" accentColor="bg-emerald-400" icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>} />
      </div>

      {/* Main Content */}
      <div className="rounded-[32px] border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex rounded-2xl bg-zinc-50 p-1 dark:bg-zinc-800/60">
                {(["all", "pending", "shipped", "closed", "cancelled"] as const).map(t => (
                    <button 
                        key={t}
                        onClick={() => setTab(t)}
                        className={`rounded-xl px-5 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all ${tab === t ? "bg-white text-[#f4a261] shadow-sm dark:bg-zinc-700" : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"}`}
                    >
                        {t === "all" ? "All Orders" : t}
                    </button>
                ))}
            </div>
            <div className="flex items-center gap-3">
                <div className="relative">
                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <input 
                        type="text" 
                        placeholder="Search orders or shops..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        className="h-11 w-full rounded-xl border border-zinc-100 bg-zinc-50/50 pl-11 pr-4 text-[11px] font-bold outline-none ring-zinc-500/10 transition-all focus:border-zinc-300 focus:ring-4 dark:border-zinc-800 dark:bg-zinc-800/40 md:w-64"
                    />
                </div>
            </div>
        </div>

        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="border-b border-zinc-100 dark:border-zinc-800/60">
                        <th className="pb-5 pl-2 text-[10px] font-black uppercase tracking-widest text-zinc-400">ORDER #</th>
                        <th className="pb-5 text-[10px] font-black uppercase tracking-widest text-zinc-400">CLIENT / SHOP</th>
                        <th className="pb-5 text-[10px] font-black uppercase tracking-widest text-zinc-400">DATE</th>
                        <th className="pb-5 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-right">TOTAL</th>
                        <th className="pb-5 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-center">STATUS</th>
                        <th className="pb-5 text-right text-[10px] font-black uppercase tracking-widest text-zinc-400">OPTION</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/40">
                    {filteredOrders.map((o) => (
                        <tr key={o.id} className="group hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20">
                            <td className="py-6 pl-2">
                                <span className="text-[13px] font-black font-mono text-zinc-900 dark:text-zinc-100">{o.order_number}</span>
                            </td>
                            <td className="py-6">
                                <div>
                                    <p className="text-[13px] font-black text-zinc-900 dark:text-zinc-100">{o.shop_name || o.lead_name || "Direct Sale"}</p>
                                    <p className="text-[11px] font-medium text-zinc-400">{o.placed_by_name || "Field Agent"} • {o.items_count || 0} items</p>
                                </div>
                            </td>
                            <td className="py-6">
                                <span className="text-[12px] font-bold text-zinc-500 dark:text-zinc-400">{new Date(o.placed_at).toLocaleDateString()}</span>
                            </td>
                            <td className="py-6 text-right">
                                <span className="text-[13px] font-black text-zinc-900 dark:text-zinc-100">
                                    {o.currency_code} {Number(o.total_amount).toLocaleString()}
                                </span>
                            </td>
                            <td className="py-6 text-center">
                                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest ${STATUS_CONFIG[o.status].color}`}>
                                    <span className={`h-1 w-1 rounded-full ${STATUS_CONFIG[o.status].dot}`} />
                                    {STATUS_CONFIG[o.status].label}
                                </span>
                            </td>
                            <td className="py-6 text-right">
                                <button 
                                    onClick={() => setDrawerOrderId(o.id)}
                                    className="rounded-xl p-2 text-zinc-400 transition-all hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        <div className="mt-8 flex items-center justify-between border-t border-zinc-100 pt-8 dark:border-zinc-800">
            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
                Showing {filteredOrders.length} of {stats.total} entries
            </p>
        </div>
      </div>

      {drawerOrderId && (
        <OrderDetailsDrawer 
            orderId={drawerOrderId} 
            onClose={() => setDrawerOrderId(null)} 
            mutateOrders={mutateOrders}
        />
      )}

      {showCreateModal && (
          <NewOrderModal 
            onClose={() => setShowCreateModal(false)}
            onCreated={() => { setShowCreateModal(false); mutateOrders(); }}
          />
      )}
    </div>
  );
}

function NewOrderModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
    const toast = useToast();
    const [working, setWorking] = useState(false);
    const [shopId, setShopId] = useState("");
    const [notes, setNotes] = useState("");
    const [orderItems, setOrderItems] = useState<{ productId: string; quantity: number; unitPrice: number; name: string; sku: string }[]>([]);

    const { data: shopsData } = useSWR<{ ok: boolean; shops: Shop[] }>("/api/manager/shops", fetcher);
    const { data: productsData } = useSWR<{ ok: boolean; products: Product[] }>("/api/manager/products", fetcher);
    
    const shops = shopsData?.shops || [];
    const products = productsData?.products || [];

    const [productSearch, setProductSearch] = useState("");
    const filteredProducts = useMemo(() => {
        if (!productSearch) return products;
        const q = productSearch.toLowerCase();
        return products.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
    }, [products, productSearch]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!shopId) return toast.error("Please select a shop");
        if (orderItems.length === 0) return toast.error("Please add at least one item");

        setWorking(true);
        const res = await fetch("/api/manager/orders", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                shopId,
                notes,
                items: orderItems.map(i => ({
                    productId: i.productId,
                    productName: i.name,
                    productSku: i.sku,
                    quantity: i.quantity,
                    unitPrice: i.unitPrice
                }))
            }),
        });
        const data = await res.json();
        setWorking(false);
        if (data.ok) {
            toast.success("Order created successfully");
            onCreated();
        } else {
            toast.error(data.error || "Failed to create order");
        }
    }

    const addItem = (pId: string) => {
        const p = products.find(x => x.id === pId);
        if (!p) return;
        setOrderItems(prev => [...prev, {
            productId: p.id,
            name: p.name,
            sku: p.sku,
            quantity: 1,
            unitPrice: Number(p.current_price || 0)
        }]);
    };

    const inputClass = "w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-900 outline-none ring-zinc-500/10 transition-all focus:border-zinc-400 focus:ring-4 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-500";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="absolute inset-0 bg-zinc-900/60" />
            <div className="relative w-full max-w-4xl rounded-[32px] border border-zinc-200 bg-white p-8 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="mb-8 flex items-center justify-between">
                    <h2 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">New Sales Order</h2>
                    <button onClick={onClose} className="rounded-full bg-zinc-50 p-2 text-zinc-400 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8 max-h-[70vh] overflow-y-auto pr-2">
                    <div className="space-y-6">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Select Client / Shop</label>
                            <select required className={inputClass} value={shopId} onChange={e => setShopId(e.target.value)}>
                                <option value="">Choose a shop...</option>
                                {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Add Product (Search by Name or SKU)</label>
                            <div className="space-y-2">
                                <div className="relative">
                                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                                    <input 
                                        type="text" 
                                        placeholder="Search products..." 
                                        className="w-full rounded-lg border border-zinc-200 bg-white pl-8 pr-4 py-2 text-[11px] font-bold outline-none dark:bg-zinc-800 dark:border-zinc-700"
                                        value={productSearch}
                                        onChange={e => setProductSearch(e.target.value)}
                                    />
                                </div>
                                <select 
                                    className="w-full text-[11px] font-bold bg-white border border-zinc-200 rounded-lg px-3 py-2 outline-none dark:bg-zinc-800 dark:border-zinc-700" 
                                    onChange={e => { if(e.target.value) addItem(e.target.value); e.target.value = ""; setProductSearch(""); }}
                                >
                                    <option value="">{productSearch ? `Found ${filteredProducts.length} results...` : "+ Select Product to Add"}</option>
                                    {filteredProducts.map(p => <option key={p.id} value={p.id}>[{p.sku}] {p.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Order Notes / Delivery Instructions</label>
                            <textarea className={`${inputClass} h-32 resize-none`} value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Leave at front desk, fragile items included..." />
                        </div>
                    </div>

                    <div className="space-y-6 border-l border-zinc-100 pl-8 dark:border-zinc-800">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Order Summary</label>
                        <div className="min-h-[200px] space-y-4">
                            {orderItems.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between group">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[13px] font-black text-indigo-600 dark:text-indigo-400 shrink-0">[{item.sku}]</span>
                                            <p className="text-[13px] font-bold text-zinc-900 dark:text-zinc-100 truncate">{item.name}</p>
                                        </div>
                                        <div className="flex items-center gap-3 mt-1">
                                            <input 
                                                type="number" 
                                                min="1" 
                                                className="w-16 rounded-lg border border-zinc-100 bg-zinc-50 px-2 py-1 text-xs font-bold text-zinc-600 focus:bg-white" 
                                                value={item.quantity} 
                                                onChange={e => {
                                                    const next = [...orderItems];
                                                    next[idx].quantity = Number(e.target.value);
                                                    setOrderItems(next);
                                                }}
                                            />
                                            <span className="text-[11px] font-bold text-zinc-400">× NPR {item.unitPrice.toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <div className="text-right flex items-center gap-4">
                                        <span className="text-[13px] font-black text-zinc-900 dark:text-zinc-100">NPR {(item.quantity * item.unitPrice).toLocaleString()}</span>
                                        <button 
                                            type="button" 
                                            onClick={() => setOrderItems(prev => prev.filter((_, i) => i !== idx))}
                                            className="text-zinc-300 hover:text-rose-500 transition-colors"
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {orderItems.length === 0 && (
                                <div className="h-40 flex items-center justify-center border-2 border-dashed border-zinc-100 rounded-2xl dark:border-zinc-800">
                                    <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-300">No items added yet</p>
                                </div>
                            )}
                        </div>

                        <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800">
                            <div className="flex justify-between items-baseline mb-6">
                                <span className="text-[11px] font-black uppercase tracking-widest text-zinc-400">Total Payable</span>
                                <span className="text-3xl font-black text-zinc-900 dark:text-zinc-100">
                                    NPR {orderItems.reduce((acc, i) => acc + (i.quantity * i.unitPrice), 0).toLocaleString()}
                                </span>
                            </div>
                            <button disabled={working} className="h-14 w-full rounded-2xl bg-[#f4a261] text-[11px] font-black uppercase tracking-widest text-white shadow-lg shadow-[#f4a261]/20 hover:brightness-110 disabled:opacity-50">
                                {working ? "Processing Order..." : "Finalize & Place Order"}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

function OrderDetailsDrawer({ orderId, onClose, mutateOrders }: { orderId: string; onClose: () => void; mutateOrders: () => void }) {
    const toast = useToast();
    const [working, setWorking] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editNotes, setEditNotes] = useState("");
    const [editItems, setEditItems] = useState<{ productId: string; name: string; sku: string; quantity: number; unitPrice: number; notes: string | null }[]>([]);

    const { data: orderData, mutate: mutateDetail } = useSWR<{ ok: boolean; order: OrderDetail }>(
        `/api/manager/orders/${orderId}`,
        fetcher
    );

    const { data: productsData } = useSWR<{ ok: boolean; products: Product[] }>(
        isEditing ? "/api/manager/products" : null,
        fetcher
    );

    const order = orderData?.order;
    const products = productsData?.products || [];

    useEffect(() => {
        if (order && !isEditing) {
            setEditNotes(order.notes || "");
            setEditItems((order.items || []).map(i => ({
                productId: i.product_id || "",
                name: i.product_name,
                sku: i.product_sku || "",
                quantity: Number(i.quantity),
                unitPrice: Number(i.unit_price),
                notes: i.notes
            })));
        }
    }, [order, isEditing]);

    async function transition(nextStatus: string) {
        setWorking(true);
        const res = await fetch(`/api/manager/orders/${orderId}`, {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ status: nextStatus }),
        });
        const data = await res.json();
        setWorking(false);
        if (data.ok) {
            toast.success(`Order moving to ${nextStatus}`);
            mutateOrders();
            mutateDetail();
            if (nextStatus === "closed" || nextStatus === "cancelled") onClose();
        } else {
            toast.error(data.error || "Update failed");
        }
    }

    async function handleSaveEdits() {
        if (editItems.length === 0) return toast.error("At least one item is required");
        setWorking(true);
        const res = await fetch(`/api/manager/orders/${orderId}`, {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                notes: editNotes,
                items: editItems.map(i => ({
                    productId: i.productId,
                    productName: i.name,
                    productSku: i.sku,
                    quantity: i.quantity,
                    unitPrice: i.unitPrice,
                    notes: i.notes || undefined
                }))
            }),
        });
        const data = await res.json();
        setWorking(false);
        if (data.ok) {
            toast.success("Order updated successfully");
            setIsEditing(false);
            mutateOrders();
            mutateDetail();
        } else {
            toast.error(data.message || "Failed to update order");
        }
    }

    const [productSearch, setProductSearch] = useState("");
    const filteredProducts = useMemo(() => {
        if (!productSearch) return products;
        const q = productSearch.toLowerCase();
        return products.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
    }, [products, productSearch]);

    const addItem = (pId: string) => {
        const p = products.find(x => x.id === pId);
        if (!p) return;
        setEditItems(prev => [...prev, {
            productId: p.id,
            name: p.name,
            sku: p.sku,
            quantity: 1,
            unitPrice: Number(p.current_price || 0),
            notes: null
        }]);
    };

    if (!order) return null;

    const inputClass = "w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-900 outline-none ring-zinc-500/10 transition-all focus:border-zinc-400 focus:ring-4 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-zinc-900/60 backdrop-blur-sm" onClick={onClose}>
            <div className="h-full w-full max-w-xl bg-white p-8 shadow-2xl dark:bg-zinc-900 overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="mb-10 flex items-center justify-between">
                    <div>
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest ${STATUS_CONFIG[order.status].color}`}>
                            <span className={`h-1 w-1 rounded-full ${STATUS_CONFIG[order.status].dot}`} />
                            {STATUS_CONFIG[order.status].label}
                        </span>
                        <h2 className="mt-3 text-2xl font-black text-zinc-900 dark:text-zinc-100">{order.order_number}</h2>
                    </div>
                    <div className="flex gap-2">
                         {!isEditing && (order.status === "received" || order.status === "processing") && (
                            <button 
                                onClick={() => setIsEditing(true)}
                                className="rounded-full bg-zinc-50 p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </button>
                        )}
                        <button onClick={onClose} className="rounded-full bg-zinc-50 p-2 text-zinc-400 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                    </div>
                </div>

                <div className="space-y-10">
                    <section className="grid grid-cols-2 gap-8">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Client / Shop</p>
                            <p className="mt-1 text-[14px] font-black text-zinc-900 dark:text-zinc-100">{order.shop_name || order.lead_name || "Direct Sale"}</p>
                            <p className="text-[12px] font-medium text-zinc-500 mt-0.5">{order.shop_address || "No address provided"}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Placed By</p>
                            <p className="mt-1 text-[14px] font-black text-zinc-900 dark:text-zinc-100">{order.placed_by_name || "Field Agent"}</p>
                            <p className="text-[12px] font-medium text-zinc-500 mt-0.5">{new Date(order.placed_at).toLocaleString()}</p>
                        </div>
                    </section>

                    <section className="rounded-[24px] border border-zinc-100 bg-zinc-50/20 p-6 dark:border-zinc-800 dark:bg-zinc-800/20">
                        <div className="flex flex-col gap-4 mb-6">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Line Items</h3>
                            {isEditing && (
                                <div className="space-y-2">
                                    <div className="relative">
                                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                                        <input 
                                            type="text" 
                                            placeholder="Search products..." 
                                            className="w-full rounded-lg border border-zinc-200 bg-white pl-8 pr-4 py-2 text-[11px] font-bold outline-none dark:bg-zinc-800 dark:border-zinc-700"
                                            value={productSearch}
                                            onChange={e => setProductSearch(e.target.value)}
                                        />
                                    </div>
                                    <select 
                                        className="w-full text-[11px] font-bold bg-white border border-zinc-200 rounded-lg px-3 py-2 outline-none dark:bg-zinc-800 dark:border-zinc-700" 
                                        onChange={e => { if(e.target.value) addItem(e.target.value); e.target.value = ""; setProductSearch(""); }}
                                    >
                                        <option value="">{productSearch ? `Found ${filteredProducts.length} results...` : "+ Select Product to Add"}</option>
                                        {filteredProducts.map(p => <option key={p.id} value={p.id}>[{p.sku}] {p.name}</option>)}
                                    </select>
                                </div>
                            )}
                        </div>
                        
                        <div className="space-y-4">
                            {isEditing ? (
                                editItems.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between group">
                                    <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[13px] font-black text-indigo-600 dark:text-indigo-400 shrink-0">[{item.sku}]</span>
                                                <p className="text-[13px] font-bold text-zinc-900 dark:text-zinc-100 truncate">{item.name}</p>
                                            </div>
                                            <div className="flex items-center gap-3 mt-1">
                                                <input 
                                                    type="number" 
                                                    min="1" 
                                                    className="w-16 rounded-lg border border-zinc-100 bg-zinc-50 px-2 py-1 text-xs font-bold text-zinc-600 focus:bg-white dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300" 
                                                    value={item.quantity} 
                                                    onChange={e => {
                                                        const next = [...editItems];
                                                        next[idx].quantity = Number(e.target.value);
                                                        setEditItems(next);
                                                    }}
                                                />
                                                <span className="text-[11px] font-bold text-zinc-400">× {order.currency_code} {item.unitPrice.toLocaleString()}</span>
                                            </div>
                                        </div>
                                        <div className="text-right flex items-center gap-4">
                                            <span className="text-[13px] font-black text-zinc-900 dark:text-zinc-100">{order.currency_code} {(item.quantity * item.unitPrice).toLocaleString()}</span>
                                            <button 
                                                type="button" 
                                                onClick={() => setEditItems(prev => prev.filter((_, i) => i !== idx))}
                                                className="text-zinc-300 hover:text-rose-500 transition-colors"
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                (order.items || []).map(item => (
                                    <div key={item.id} className="flex items-center justify-between">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[13px] font-black text-indigo-600 dark:text-indigo-400">[{item.product_sku}]</span>
                                                <p className="text-[13px] font-bold text-zinc-900 dark:text-zinc-100">{item.product_name}</p>
                                            </div>
                                            <p className="text-[11px] font-medium text-zinc-400">Qty: {Number(item.quantity)} × {order.currency_code} {Number(item.unit_price).toLocaleString()}</p>
                                        </div>
                                        <span className="text-[13px] font-black text-zinc-900 dark:text-zinc-100">
                                            {order.currency_code} {Number(item.line_total).toLocaleString()}
                                        </span>
                                    </div>
                                ))
                            )}
                            
                            {((!isEditing && (!order.items || order.items.length === 0)) || (isEditing && editItems.length === 0)) && (
                                <div className="py-6 text-center border-2 border-dashed border-zinc-100 rounded-2xl dark:border-zinc-800">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-300">No products listed</p>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 border-t border-zinc-100 pt-6 flex justify-end dark:border-zinc-800">
                            <div className="text-right">
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Order Total</p>
                                <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
                                    {order.currency_code} {isEditing 
                                        ? editItems.reduce((acc, i) => acc + (i.quantity * i.unitPrice), 0).toLocaleString()
                                        : Number(order.total_amount).toLocaleString()
                                    }
                                </p>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-3">Customer Notes</h3>
                        {isEditing ? (
                            <textarea 
                                className={`${inputClass} h-32 resize-none`} 
                                value={editNotes} 
                                onChange={e => setEditNotes(e.target.value)} 
                                placeholder="Edit order notes..." 
                            />
                        ) : (
                            order.notes && (
                                <div className="rounded-2xl border-l-4 border-orange-200 bg-orange-50/30 p-4 dark:bg-amber-900/10">
                                    <p className="text-[13px] font-medium text-zinc-600 dark:text-zinc-400">{order.notes}</p>
                                </div>
                            )
                        )}
                        {!isEditing && !order.notes && (
                            <p className="text-[11px] font-bold text-zinc-300 italic">No notes provided</p>
                        )}
                    </section>

                    <div className="pt-10 border-t border-zinc-100 flex flex-col gap-3 dark:border-zinc-800">
                        {isEditing ? (
                            <>
                                <button onClick={handleSaveEdits} disabled={working} className="h-14 w-full rounded-2xl bg-emerald-600 text-[11px] font-black uppercase tracking-widest text-white shadow-lg shadow-emerald-600/20 hover:brightness-110">
                                    {working ? "Saving Changes..." : "Save Changes"}
                                </button>
                                <button onClick={() => setIsEditing(false)} disabled={working} className="h-14 w-full rounded-2xl border border-zinc-200 text-[11px] font-black uppercase tracking-widest text-zinc-400 hover:bg-zinc-50">Cancel Editing</button>
                            </>
                        ) : (
                            <>
                                {order.status === "received" && (
                                    <button onClick={() => transition("processing")} disabled={working} className="h-14 w-full rounded-2xl bg-[#f4a261] text-[11px] font-black uppercase tracking-widest text-white shadow-lg shadow-[#f4a261]/20 hover:brightness-110">Start Processing</button>
                                )}
                                {order.status === "processing" && (
                                    <button onClick={() => transition("shipped")} disabled={working} className="h-14 w-full rounded-2xl bg-indigo-600 text-[11px] font-black uppercase tracking-widest text-white shadow-lg hover:brightness-110">Mark as Dispatched</button>
                                )}
                                {order.status === "shipped" && (
                                    <button onClick={() => transition("closed")} disabled={working} className="h-14 w-full rounded-2xl bg-emerald-600 text-[11px] font-black uppercase tracking-widest text-white shadow-lg hover:brightness-110">Complete Order</button>
                                )}
                                <button onClick={onClose} className="h-14 w-full rounded-2xl border border-zinc-200 text-[11px] font-black uppercase tracking-widest text-zinc-400 hover:bg-zinc-50">Close Detail</button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
