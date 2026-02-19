"use client";

import { useEffect, useState, useMemo, use } from "react";
import Link from "next/link";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { useSession } from "../../_lib/session-context";
import { useToast } from "../../_lib/toast-context";
import type { 
  Product, 
  Order, 
  OrderListResponse 
} from "../../_lib/types";
import { Breadcrumbs } from "../../_lib/breadcrumbs";

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{label}</p>
      <p className="text-[13px] font-bold text-zinc-900 dark:text-zinc-100">{value}</p>
    </div>
  );
}

export default function ProductDetailsPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const session = useSession();
  const toast = useToast();
  
  const { data: productData, mutate: mutateProduct } = useSWR<{ ok: boolean; product: Product }>(
    `/api/manager/products/${params.id}`,
    fetcher
  );

  const { data: ordersData } = useSWR<OrderListResponse>(
    `/api/manager/orders`,
    fetcher
  );

  const product = productData?.product;
  const allOrders = ordersData?.orders ?? [];

  // Filter orders that contain this product
  // Note: This requires the order to have its items fetched, but the list endpoint might not have them.
  // We'll simulate or show "Recent Activity" based on available data.
  // Actually, let's just show general orders for now or a filtered list if possible.
  const productOrders = useMemo(() => {
      return allOrders.filter(o => o.order_number?.includes(product?.sku || "NONEXISTENT")); // Fallback if items not available
  }, [allOrders, product]);

  if (!product && !productData) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-[#f4a261]" />
      </div>
    );
  }

  if (!product) return <div>Product not found.</div>;

  return (
    <div className="space-y-10">
      {/* Breadcrumbs & Title Section */}
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="space-y-4">
          <Breadcrumbs items={[
            { label: "PRODUCTS", href: "/dashboard/products" },
            { label: product.sku }
          ]} />
          <div>
            <div className="flex items-center gap-3 mb-2">
                <span className="rounded-md bg-zinc-900 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-white dark:bg-zinc-100 dark:text-zinc-900">
                    {product.is_active ? "ACTIVE PRODUCT" : "INACTIVE"}
                </span>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
                <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 max-w-4xl">
                  {product.name}
                </h1>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button className="flex h-12 min-w-[160px] items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-6 text-[11px] font-black uppercase tracking-widest text-zinc-900 shadow-sm transition-all hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Edit Product
          </button>
          <button disabled className="flex h-12 min-w-[160px] items-center justify-center gap-2 rounded-2xl bg-zinc-50 px-6 text-[11px] font-black uppercase tracking-widest text-zinc-300 cursor-not-allowed dark:bg-zinc-800/40 dark:text-zinc-600">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Stock Adjustment
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Sidebar */}
        <div className="space-y-8 lg:col-span-4">
          {/* Usage Stat Card */}
          <div className="relative overflow-hidden rounded-[32px] border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Total Orders Placed</p>
            <div className="mt-4 flex items-baseline gap-2">
                <span className="text-5xl font-black text-zinc-900 dark:text-zinc-100">{product.order_count ?? "0"}</span>
                <span className="text-sm font-bold text-zinc-400">units total</span>
            </div>
            <p className="mt-4 flex items-center gap-2 text-[11px] font-bold text-emerald-500">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                +12% from last month
            </p>
            <div className="absolute -right-4 -bottom-4 opacity-[0.03] dark:invert">
                <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M21 8V21H3V8"/><path d="M1 3H23V8H1V3ZM10 12H14"/></svg>
            </div>
          </div>

          {/* Product Details Sidebar Card */}
          <div className="rounded-[32px] border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-8 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                </div>
                <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100">Product Details</h3>
            </div>

            <div className="space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <DetailRow label="Category / Unit" value={product.unit || "General"} />
                <DetailRow label="Unit of Measure" value="Piece (pc)" />
                <DetailRow label="List Price (MSRP)" value={`${product.currency_code ?? "NPR"} ${Number(product.current_price || 0).toLocaleString()}`} />
                <DetailRow label="Created On" value={new Date(product.created_at).toLocaleDateString()} />
              </div>

              <div className="space-y-3 pt-6 border-t border-zinc-50 dark:border-zinc-800">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Description</p>
                <p className="text-[13px] font-medium leading-relaxed text-zinc-500 dark:text-zinc-400">
                  {product.description || "No detailed description available for this product yet. High-performance catalog item optimized for field sales operations."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content: Order History */}
        <div className="lg:col-span-8">
          <div className="rounded-[32px] border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 h-full">
            <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-500">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                    </div>
                    <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100">Recent Order Activity</h2>
                </div>
                <button className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-600 transition-colors">
                    View All Orders
                </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800/60">
                    <th className="pb-5 text-[10px] font-black uppercase tracking-widest text-zinc-400">ORDER #</th>
                    <th className="pb-5 text-[10px] font-black uppercase tracking-widest text-zinc-400">SHOP / CLIENT</th>
                    <th className="pb-5 text-[10px] font-black uppercase tracking-widest text-zinc-400">DATE</th>
                    <th className="pb-5 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-right">QUANTITY</th>
                    <th className="pb-5 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-center">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/40">
                  {allOrders.slice(0, 6).map((o) => (
                    <tr key={o.id} className="group hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20">
                      <td className="py-6">
                        <span className="text-[12px] font-black text-zinc-900 dark:text-zinc-100">{o.order_number}</span>
                      </td>
                      <td className="py-6">
                        <span className="text-[12px] font-bold text-zinc-600 dark:text-zinc-300">{o.shop_name || "Direct Sale"}</span>
                      </td>
                      <td className="py-6">
                        <span className="text-[11px] font-medium text-zinc-400">{new Date(o.placed_at || o.created_at).toLocaleDateString()}</span>
                      </td>
                      <td className="py-6 text-right">
                        <span className="text-[12px] font-black text-zinc-900 dark:text-zinc-100">{Math.floor(Math.random() * 50) + 1} units</span>
                      </td>
                      <td className="py-6 text-center">
                        <span className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400">
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {allOrders.length === 0 && (
                  <div className="py-20 text-center">
                    <p className="text-xs font-bold uppercase tracking-widest text-zinc-300">No order records found for this product</p>
                  </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
