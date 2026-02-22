"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { useToast } from "../../dashboard/_lib/toast-context";
import { useWarehouseSession } from "./_lib/warehouse-session-context";

type PickingItem = {
  product_id: string | null;
  product_name: string;
  product_sku: string | null;
  total_quantity: number;
};

type OrderItem = {
  id: string;
  product_name: string;
  product_sku: string | null;
  quantity: string | number;
  unit_price: string | number;
  line_total: string | number;
  notes: string | null;
};

type Order = {
  id: string;
  order_number: string;
  status: "received" | "processing" | "shipped" | "closed" | "cancelled";
  total_amount: string | number;
  currency_code: string;
  placed_at: string;
  shop_name: string | null;
  shop_address: string | null;
  lead_name: string | null;
  placed_by_name: string | null;
  items_count?: number;
  items?: OrderItem[];
};

export default function WarehouseDashboardPage() {
  const { user, company } = useWarehouseSession();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<"shipments" | "picking">("shipments");
  const [shopSearch, setShopSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [working, setWorking] = useState(false);

  // Fetch only processing orders
  const { data: ordersData, mutate: mutateOrders } = useSWR<{ ok: boolean; orders?: Order[] }>(
    `/api/manager/orders?status=processing${shopSearch ? `&q=${encodeURIComponent(shopSearch)}` : ""}`,
    fetcher,
    { refreshInterval: 10000 }
  );

  // Fetch picking manifest
  const { data: pickingData } = useSWR<{ ok: boolean; items?: PickingItem[] }>(
    activeTab === "picking" ? "/api/manager/orders/picking-list" : null,
    fetcher,
    { refreshInterval: 10000 }
  );

  const orders = ordersData?.orders ?? [];
  const pickingItems = pickingData?.items ?? [];

  async function handleMarkAsShipped(orderId: string) {
    setWorking(true);
    try {
      const res = await fetch(`/api/manager/orders/${orderId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "shipped" }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success("Order marked as shipped!");
        setSelectedOrder(null);
        mutateOrders();
      } else {
        toast.error(data.message || "Failed to update order");
      }
    } catch (error) {
      toast.error("An error occurred while updating the order");
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
            Warehouse Operations
          </h1>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Managing <span className="text-[#f4a261] font-bold">{company.name}</span> processing queue.
          </p>
        </div>

        <div className="flex shrink-0 gap-1 rounded-2xl bg-zinc-100 p-1 dark:bg-zinc-800/60">
          <button
            onClick={() => setActiveTab("shipments")}
            className={`rounded-xl px-5 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === "shipments"
                ? "bg-white text-[#f4a261] shadow-sm dark:bg-zinc-700"
                : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            }`}
          >
            Individual Shipments
          </button>
          <button
            onClick={() => setActiveTab("picking")}
            className={`rounded-xl px-5 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === "picking"
                ? "bg-white text-[#f4a261] shadow-sm dark:bg-zinc-700"
                : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            }`}
          >
            Picking manifest
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Orders to Dispatch</p>
              <p className="text-3xl font-black text-zinc-900 dark:text-zinc-100">{orders.length}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-500 dark:bg-amber-900/20">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 8V21H3V8"/><path d="M1 3H23V8H1V3ZM10 12H14"/></svg>
            </div>
          </div>
        </div>
        
        <div className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Unique SKUs</p>
              <p className="text-3xl font-black text-zinc-900 dark:text-zinc-100">{pickingItems.length}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500 dark:bg-indigo-900/20">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="3" y1="9" x2="21" y2="9"/></svg>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[32px] border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100">
              {activeTab === "shipments" ? "Individual Orders" : "Consolidated Picking List"}
            </h2>
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">
              {activeTab === "shipments" ? "Pick and ship specific customer orders" : "Collective totals for all pending processing orders"}
            </p>
          </div>
          
          <div className="relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input 
              type="text" 
              placeholder="Search by shop or order #..."
              value={shopSearch}
              onChange={(e) => setShopSearch(e.target.value)}
              className="h-11 w-full rounded-xl border border-zinc-100 bg-zinc-50/50 pl-11 pr-4 text-[11px] font-bold outline-none ring-zinc-500/10 transition-all focus:border-zinc-300 focus:ring-4 dark:border-zinc-800 dark:bg-zinc-800/40 md:w-64"
            />
          </div>
        </div>

        {activeTab === "shipments" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800/60">
                  <th className="pb-5 pl-2 text-[10px] font-black uppercase tracking-widest text-zinc-400">Order #</th>
                  <th className="pb-5 text-[10px] font-black uppercase tracking-widest text-zinc-400">Shop / Destination</th>
                  <th className="pb-5 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-right">Items</th>
                  <th className="pb-5 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-right">Total</th>
                  <th className="pb-5 text-right text-[10px] font-black uppercase tracking-widest text-zinc-400">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/40">
                {orders.map((o) => (
                  <tr key={o.id} className="group hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20">
                    <td className="py-5 pl-2">
                      <span className="text-[13px] font-black font-mono text-zinc-900 dark:text-zinc-100">{o.order_number}</span>
                      <p className="text-[10px] font-bold text-zinc-400">{new Date(o.placed_at).toLocaleDateString()}</p>
                    </td>
                    <td className="py-5">
                      <div>
                        <p className="text-[13px] font-black text-zinc-900 dark:text-zinc-100">{o.shop_name || o.lead_name || "Direct Sale"}</p>
                        <p className="text-[11px] font-medium text-zinc-400 truncate max-w-[200px]">{o.shop_address || "No address"}</p>
                      </div>
                    </td>
                    <td className="py-5 text-right font-black text-zinc-900 dark:text-zinc-100 text-[13px]">
                      {o.items_count || 0}
                    </td>
                    <td className="py-5 text-right">
                      <span className="text-[13px] font-black text-zinc-900 dark:text-zinc-100">
                        {o.currency_code} {Number(o.total_amount).toLocaleString()}
                      </span>
                    </td>
                    <td className="py-5 text-right">
                      <button 
                        onClick={() => setSelectedOrder(o)}
                        className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-600 transition-all hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-20 text-center">
                      <p className="text-[11px] font-black uppercase tracking-widest text-zinc-300">No orders found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800/60">
                  <th className="pb-5 pl-2 text-[10px] font-black uppercase tracking-widest text-zinc-400">SKU</th>
                  <th className="pb-5 text-[10px] font-black uppercase tracking-widest text-zinc-400">Product Name</th>
                  <th className="pb-5 text-right text-[10px] font-black uppercase tracking-widest text-zinc-400">Quantity Needed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/40">
                {pickingItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20">
                    <td className="py-5 pl-2">
                      <span className="text-[13px] font-black font-mono text-indigo-600 dark:text-indigo-400">{item.product_sku || "N/A"}</span>
                    </td>
                    <td className="py-5">
                      <p className="text-[13px] font-black text-zinc-900 dark:text-zinc-100">{item.product_name}</p>
                    </td>
                    <td className="py-5 text-right">
                      <span className="inline-flex h-10 min-w-16 items-center justify-center rounded-xl bg-zinc-900 px-4 text-[13px] font-black text-white dark:bg-zinc-100 dark:text-zinc-900">
                        {item.total_quantity.toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))}
                {pickingItems.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-20 text-center">
                      <p className="text-[11px] font-black uppercase tracking-widest text-zinc-300">No items to pick</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedOrder && (
        <OrderDetailsModal 
          orderId={selectedOrder.id} 
          onClose={() => setSelectedOrder(null)} 
          onShip={() => handleMarkAsShipped(selectedOrder.id)}
          working={working}
        />
      )}
    </div>
  );
}

function OrderDetailsModal({ orderId, onClose, onShip, working }: { orderId: string; onClose: () => void; onShip: () => void; working: boolean }) {
  const { data: orderData } = useSWR<{ ok: boolean; order: Order }>(
    `/api/manager/orders/${orderId}`,
    fetcher
  );

  const order = orderData?.order;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="absolute inset-0 bg-zinc-900/60" />
      <div className="relative w-full max-w-2xl rounded-[32px] border border-zinc-200 bg-white p-8 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden" onClick={e => e.stopPropagation()}>
        {!order ? (
          <div className="py-20 text-center">
            <p className="text-[11px] font-black uppercase tracking-widest text-zinc-400">Loading order details...</p>
          </div>
        ) : (
          <>
            <div className="mb-8 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#f4a261]">Order Details</p>
                <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">{order.order_number}</h2>
              </div>
              <button onClick={onClose} className="rounded-full bg-zinc-50 p-2 text-zinc-400 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div className="mb-8 grid grid-cols-2 gap-8 border-b border-zinc-100 pb-8 dark:border-zinc-800">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Shop / Client</p>
                <p className="text-[14px] font-black text-zinc-900 dark:text-zinc-100">{order.shop_name || order.lead_name || "Direct Sale"}</p>
                <p className="text-[12px] font-medium text-zinc-500">{order.shop_address || "No address"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Placed At</p>
                <p className="text-[14px] font-black text-zinc-900 dark:text-zinc-100">{new Date(order.placed_at).toLocaleDateString()}</p>
                <p className="text-[12px] font-medium text-zinc-500">{new Date(order.placed_at).toLocaleTimeString()}</p>
              </div>
            </div>

            <div className="mb-8 max-h-[30vh] overflow-y-auto pr-2">
              <p className="mb-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Line Items</p>
              <div className="space-y-4">
                {order.items?.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between border-b border-zinc-50 pb-3 last:border-0 dark:border-zinc-800/40">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {item.product_sku && <span className="text-[11px] font-black text-indigo-600 dark:text-indigo-400">[{item.product_sku}]</span>}
                        <p className="text-[13px] font-bold text-zinc-900 dark:text-zinc-100 truncate">{item.product_name}</p>
                      </div>
                      <p className="text-[11px] font-medium text-zinc-400">{item.quantity} units x {order.currency_code} {Number(item.unit_price).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[13px] font-black text-zinc-900 dark:text-zinc-100">{order.currency_code} {Number(item.line_total).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-zinc-100 pt-8 dark:border-zinc-800">
              <div className="text-left">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Payable Amount</p>
                <p className="text-3xl font-black text-zinc-900 dark:text-zinc-100">
                  {order.currency_code} {Number(order.total_amount).toLocaleString()}
                </p>
              </div>
              <button 
                onClick={onShip}
                disabled={working}
                className="flex h-14 items-center gap-3 rounded-2xl bg-[#f4a261] px-8 text-[11px] font-black uppercase tracking-widest text-white shadow-xl shadow-[#f4a261]/20 hover:brightness-110 disabled:opacity-50"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="1" y="3" width="15" height="13"/><polyline points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                {working ? "Processing..." : "Confirm Dispatch"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
