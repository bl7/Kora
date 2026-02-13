"use client";

import { useEffect, useState } from "react";

type OrderItem = {
  id: string;
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
  status: "received" | "processing" | "shipped" | "closed";
  notes: string | null;
  total_amount: string;
  currency_code: string;
  placed_at: string;
  processed_at: string | null;
  shipped_at: string | null;
  closed_at: string | null;
  shop_name: string | null;
  lead_name: string | null;
  placed_by_name: string | null;
  items: OrderItem[] | null;
};

type Shop = { id: string; name: string };
type Product = { id: string; name: string; sku: string; current_price: string | null; currency_code: string | null; unit: string };

const STATUS_COLORS: Record<string, string> = {
  received: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  processing: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  shipped: "bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  closed: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
};

const NEXT_STATUS: Record<string, string> = {
  received: "processing",
  processing: "shipped",
  shipped: "closed",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function loadOrders(status = filterStatus, q = search) {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (q) params.set("q", q);
    const res = await fetch(`/api/manager/orders?${params}`);
    const data = (await res.json()) as { ok: boolean; orders?: Order[]; error?: string };
    if (res.ok && data.ok) setOrders(data.orders ?? []);
    else setError(data.error ?? "Failed to load orders");
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [ordersRes, shopsRes, productsRes] = await Promise.all([
        fetch("/api/manager/orders"),
        fetch("/api/manager/shops"),
        fetch("/api/manager/products"),
      ]);
      const ordersData = (await ordersRes.json()) as { ok: boolean; orders?: Order[] };
      const shopsData = (await shopsRes.json()) as { shops?: Shop[] };
      const productsData = (await productsRes.json()) as { products?: Product[] };
      if (cancelled) return;
      if (ordersRes.ok && ordersData.ok) setOrders(ordersData.orders ?? []);
      setShops(shopsData.shops ?? []);
      setProducts(productsData.products ?? []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  async function onStatusChange(orderId: string, newStatus: string) {
    setWorking(true);
    setError(null);
    const res = await fetch(`/api/manager/orders/${orderId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    const data = (await res.json()) as { ok: boolean; error?: string };
    setWorking(false);
    if (!res.ok || !data.ok) { setError(data.error ?? "Could not update order"); return; }
    await loadOrders();
  }

  async function onCreate(payload: {
    shopId?: string;
    notes?: string;
    currencyCode: string;
    items: { productId?: string; productName: string; productSku?: string; quantity: number; unitPrice: number }[];
  }) {
    setWorking(true);
    setError(null);
    const res = await fetch("/api/manager/orders", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as { ok: boolean; error?: string };
    setWorking(false);
    if (!res.ok || !data.ok) { setError(data.error ?? "Could not create order"); return; }
    setShowForm(false);
    await loadOrders();
  }

  function handleFilter(status: string) {
    setFilterStatus(status);
    loadOrders(status, search);
  }

  function handleSearch(q: string) {
    setSearch(q);
    loadOrders(filterStatus, q);
  }

  const selectClass = "rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100";

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Orders</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Track and manage orders from the field.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {showForm ? "Cancel" : "+ New Order"}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800/40 dark:bg-red-900/20 dark:text-red-400">
          {error}
          <button onClick={() => setError(null)} className="ml-2 font-medium underline">dismiss</button>
        </div>
      )}

      {showForm && (
        <div className="mb-6 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-100">New Order</h2>
          <CreateOrderForm shops={shops} products={products} disabled={working} onSubmit={onCreate} />
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select value={filterStatus} onChange={(e) => handleFilter(e.target.value)} className={selectClass}>
          <option value="">All statuses</option>
          <option value="received">Received</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="closed">Closed</option>
        </select>
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search order # or shop…"
          className="max-w-xs rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-sm text-zinc-900 outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>

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
                <th className="px-5 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Order #</th>
                <th className="px-5 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Shop</th>
                <th className="px-5 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Total</th>
                <th className="px-5 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Status</th>
                <th className="px-5 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Placed</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <>
                  <tr key={o.id} className="border-b border-zinc-100 last:border-0 dark:border-zinc-800/60">
                    <td className="px-5 py-3.5">
                      <button onClick={() => setExpandedId(expandedId === o.id ? null : o.id)} className="font-mono font-medium text-zinc-900 hover:underline dark:text-zinc-100">
                        {o.order_number}
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-zinc-600 dark:text-zinc-400">{o.shop_name ?? "—"}</td>
                    <td className="px-5 py-3.5 font-medium text-zinc-900 dark:text-zinc-100">
                      {o.currency_code} {Number(o.total_amount).toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_COLORS[o.status] ?? ""}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-zinc-500 dark:text-zinc-400">
                      {new Date(o.placed_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {NEXT_STATUS[o.status] && (
                        <button
                          onClick={() => onStatusChange(o.id, NEXT_STATUS[o.status])}
                          disabled={working}
                          className="rounded-md border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                        >
                          → {NEXT_STATUS[o.status]}
                        </button>
                      )}
                    </td>
                  </tr>
                  {expandedId === o.id && (
                    <tr key={`${o.id}-details`}>
                      <td colSpan={6} className="bg-zinc-50 px-5 py-4 dark:bg-zinc-800/40">
                        <div className="space-y-2">
                          {o.placed_by_name && <p className="text-xs text-zinc-500 dark:text-zinc-400">Placed by: {o.placed_by_name}</p>}
                          {o.notes && <p className="text-xs text-zinc-500 dark:text-zinc-400">Notes: {o.notes}</p>}
                          {o.items && o.items.length > 0 && (
                            <table className="mt-2 w-full text-xs">
                              <thead>
                                <tr className="text-zinc-500 dark:text-zinc-400">
                                  <th className="py-1 text-left font-medium">Item</th>
                                  <th className="py-1 text-left font-medium">SKU</th>
                                  <th className="py-1 text-right font-medium">Qty</th>
                                  <th className="py-1 text-right font-medium">Price</th>
                                  <th className="py-1 text-right font-medium">Total</th>
                                </tr>
                              </thead>
                              <tbody>
                                {o.items.map((item) => (
                                  <tr key={item.id} className="text-zinc-700 dark:text-zinc-300">
                                    <td className="py-1">{item.product_name}</td>
                                    <td className="py-1 font-mono">{item.product_sku ?? "—"}</td>
                                    <td className="py-1 text-right">{Number(item.quantity)}</td>
                                    <td className="py-1 text-right">{Number(item.unit_price).toLocaleString()}</td>
                                    <td className="py-1 text-right font-medium">{Number(item.line_total).toLocaleString()}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
          {!orders.length && (
            <div className="px-5 py-10 text-center text-sm text-zinc-400">
              No orders yet. Click &quot;+ New Order&quot; to create one.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Create order form ── */

type LineItem = {
  key: number;
  productId: string;
  productName: string;
  productSku: string;
  quantity: string;
  unitPrice: string;
};

function CreateOrderForm(props: {
  shops: Shop[];
  products: Product[];
  disabled: boolean;
  onSubmit: (payload: {
    shopId?: string;
    notes?: string;
    currencyCode: string;
    items: { productId?: string; productName: string; productSku?: string; quantity: number; unitPrice: number }[];
  }) => Promise<void>;
}) {
  const [shopId, setShopId] = useState("");
  const [notes, setNotes] = useState("");
  const [currency, setCurrency] = useState("NPR");
  const [items, setItems] = useState<LineItem[]>([
    { key: 1, productId: "", productName: "", productSku: "", quantity: "1", unitPrice: "0" },
  ]);

  const inputClass =
    "w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100";

  function addItem() {
    setItems([...items, { key: Date.now(), productId: "", productName: "", productSku: "", quantity: "1", unitPrice: "0" }]);
  }

  function removeItem(key: number) {
    if (items.length <= 1) return;
    setItems(items.filter((i) => i.key !== key));
  }

  function updateItem(key: number, field: keyof LineItem, value: string) {
    setItems(items.map((i) => {
      if (i.key !== key) return i;
      const updated = { ...i, [field]: value };
      // Auto-fill from product catalog
      if (field === "productId" && value) {
        const p = props.products.find((pr) => pr.id === value);
        if (p) {
          updated.productName = p.name;
          updated.productSku = p.sku;
          updated.unitPrice = p.current_price ?? "0";
        }
      }
      return updated;
    }));
  }

  const total = items.reduce((sum, i) => sum + Number(i.quantity || 0) * Number(i.unitPrice || 0), 0);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const orderItems = items.map((i) => ({
          productId: i.productId || undefined,
          productName: i.productName,
          productSku: i.productSku || undefined,
          quantity: Number(i.quantity),
          unitPrice: Number(i.unitPrice),
        }));
        await props.onSubmit({
          shopId: shopId || undefined,
          notes: notes || undefined,
          currencyCode: currency,
          items: orderItems,
        });
        setShopId("");
        setNotes("");
        setItems([{ key: Date.now(), productId: "", productName: "", productSku: "", quantity: "1", unitPrice: "0" }]);
      }}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <select value={shopId} onChange={(e) => setShopId(e.target.value)} className={inputClass}>
          <option value="">Select shop (optional)</option>
          {props.shops.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={inputClass}>
          <option value="NPR">NPR</option>
          <option value="USD">USD</option>
          <option value="INR">INR</option>
        </select>
        <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (optional)" className={inputClass} />
      </div>

      {/* Line items */}
      <div className="mt-4 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Items</p>
        {items.map((item) => (
          <div key={item.key} className="grid grid-cols-[1fr_1fr_80px_100px_32px] gap-2 items-end">
            <select
              value={item.productId}
              onChange={(e) => updateItem(item.key, "productId", e.target.value)}
              className={inputClass}
            >
              <option value="">Select product…</option>
              {props.products.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
              ))}
            </select>
            <input
              required
              value={item.productName}
              onChange={(e) => updateItem(item.key, "productName", e.target.value)}
              placeholder="Product name"
              className={inputClass}
            />
            <input
              required
              type="number"
              min={1}
              step="any"
              value={item.quantity}
              onChange={(e) => updateItem(item.key, "quantity", e.target.value)}
              placeholder="Qty"
              className={inputClass}
            />
            <input
              required
              type="number"
              min={0}
              step="0.01"
              value={item.unitPrice}
              onChange={(e) => updateItem(item.key, "unitPrice", e.target.value)}
              placeholder="Price"
              className={inputClass}
            />
            <button
              type="button"
              onClick={() => removeItem(item.key)}
              className="flex h-[42px] items-center justify-center rounded-lg text-zinc-400 hover:text-red-500"
              title="Remove item"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addItem}
          className="text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          + Add another item
        </button>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Total: {currency} {total.toLocaleString()}
        </p>
        <button
          disabled={props.disabled}
          type="submit"
          className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Place Order
        </button>
      </div>
    </form>
  );
}

