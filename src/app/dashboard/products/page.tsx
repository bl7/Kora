"use client";

import { useEffect, useState } from "react";
import { useSession } from "../_lib/session-context";

type Product = {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  unit: string;
  is_active: boolean;
  current_price: string | null;
  currency_code: string | null;
  created_at: string;
  updated_at: string;
};

type ProductListResponse = { ok: boolean; error?: string; products?: Product[] };

export default function ProductsPage() {
  const session = useSession();
  const canManageProducts =
    session.user.role === "boss" ||
    session.user.role === "manager" ||
    session.user.role === "back_office";
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [priceEditId, setPriceEditId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  async function loadProducts(q = "") {
    const res = await fetch(`/api/manager/products?q=${encodeURIComponent(q)}`);
    const data = (await res.json()) as ProductListResponse;
    if (res.ok && data.ok) setProducts(data.products ?? []);
    else setError(data.error ?? "Failed to load products");
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await loadProducts();
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  async function onCreate(payload: {
    sku: string;
    name: string;
    description?: string;
    unit: string;
    price?: number;
    currencyCode: string;
  }) {
    setWorking(true);
    setError(null);
    const res = await fetch("/api/manager/products", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as { ok: boolean; error?: string };
    setWorking(false);
    if (!res.ok || !data.ok) {
      setError(data.error ?? "Could not create product");
      return;
    }
    setShowForm(false);
    await loadProducts();
  }

  async function onUpdate(productId: string, payload: Record<string, unknown>) {
    setWorking(true);
    setError(null);
    const res = await fetch(`/api/manager/products/${productId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as { ok: boolean; error?: string };
    setWorking(false);
    if (!res.ok || !data.ok) {
      setError(data.error ?? "Could not update product");
      return;
    }
    setEditingId(null);
    await loadProducts();
  }

  async function onDelete(productId: string) {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    setWorking(true);
    setError(null);
    const res = await fetch(`/api/manager/products/${productId}`, { method: "DELETE" });
    const data = (await res.json()) as { ok: boolean; error?: string };
    setWorking(false);
    if (!res.ok || !data.ok) {
      setError(data.error ?? "Could not delete product");
      return;
    }
    await loadProducts();
  }

  async function onSetPrice(productId: string, price: number, currencyCode: string) {
    setWorking(true);
    setError(null);
    const res = await fetch(`/api/manager/products/${productId}/prices`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ price, currencyCode }),
    });
    const data = (await res.json()) as { ok: boolean; error?: string };
    setWorking(false);
    if (!res.ok || !data.ok) {
      setError(data.error ?? "Could not update price");
      return;
    }
    setPriceEditId(null);
    await loadProducts();
  }

  async function handleSearch(value: string) {
    setSearch(value);
    await loadProducts(value);
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Products</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Manage your product catalog and pricing.
          </p>
        </div>
        {canManageProducts && (
          <button
            onClick={() => {
              setShowForm(!showForm);
              setEditingId(null);
            }}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {showForm ? "Cancel" : "+ Add Product"}
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800/40 dark:bg-red-900/20 dark:text-red-400">
          {error}
          <button onClick={() => setError(null)} className="ml-2 font-medium underline">dismiss</button>
        </div>
      )}

      {showForm && canManageProducts && (
        <div className="mb-6 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-100">New Product</h2>
          <CreateProductForm disabled={working} onSubmit={onCreate} />
        </div>
      )}

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search by name or SKU…"
          className="w-full max-w-sm rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition-colors focus:border-zinc-400 focus:bg-white dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-500"
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
                <th className="px-5 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Product</th>
                <th className="px-5 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">SKU</th>
                <th className="px-5 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Unit</th>
                <th className="px-5 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Price</th>
                <th className="px-5 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-zinc-100 last:border-0 dark:border-zinc-800/60">
                  {editingId === p.id ? (
                    <EditRow
                      product={p}
                      disabled={working}
                      onSave={(payload) => onUpdate(p.id, payload)}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <>
                      <td className="px-5 py-3.5">
                        <div>
                          <p className="font-medium text-zinc-900 dark:text-zinc-100">{p.name}</p>
                          {p.description && (
                            <p className="mt-0.5 max-w-xs truncate text-xs text-zinc-500 dark:text-zinc-400">{p.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-zinc-600 dark:text-zinc-400">{p.sku}</td>
                      <td className="px-5 py-3.5 text-zinc-600 dark:text-zinc-400">{p.unit}</td>
                      <td className="px-5 py-3.5">
                        {canManageProducts ? (
                          priceEditId === p.id ? (
                            <InlinePriceForm
                              currentPrice={p.current_price}
                              currencyCode={p.currency_code ?? "NPR"}
                              disabled={working}
                              onSave={(price, currency) => onSetPrice(p.id, price, currency)}
                              onCancel={() => setPriceEditId(null)}
                            />
                          ) : (
                            <button
                              onClick={() => setPriceEditId(p.id)}
                              className="text-zinc-900 hover:underline dark:text-zinc-100"
                              title="Click to update price"
                            >
                              {p.current_price ? (
                                `${p.currency_code ?? "NPR"} ${Number(p.current_price).toLocaleString()}`
                              ) : (
                                <span className="text-zinc-400">Set price</span>
                              )}
                            </button>
                          )
                        ) : p.current_price ? (
                          <span className="text-zinc-900 dark:text-zinc-100">
                            {`${p.currency_code ?? "NPR"} ${Number(p.current_price).toLocaleString()}`}
                          </span>
                        ) : (
                          <span className="text-zinc-400">No price set</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          p.is_active
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                        }`}>
                          {p.is_active ? "active" : "inactive"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {canManageProducts && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditingId(p.id);
                                setShowForm(false);
                                setPriceEditId(null);
                              }}
                              className="rounded-md border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => onUpdate(p.id, { isActive: !p.is_active })}
                              disabled={working}
                              className="rounded-md border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                            >
                              {p.is_active ? "Deactivate" : "Activate"}
                            </button>
                            <button
                              onClick={() => onDelete(p.id)}
                              disabled={working}
                              className="rounded-md border border-red-200 px-3 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-red-800/40 dark:text-red-400 dark:hover:bg-red-900/20"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {!products.length && (
            <div className="px-5 py-10 text-center text-sm text-zinc-400">
              No products yet. Click &quot;+ Add Product&quot; to get started.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Create form ── */

function CreateProductForm(props: {
  disabled: boolean;
  onSubmit: (payload: {
    sku: string;
    name: string;
    description?: string;
    unit: string;
    price?: number;
    currencyCode: string;
  }) => Promise<void>;
}) {
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [unit, setUnit] = useState("unit");
  const [price, setPrice] = useState("");
  const [currencyCode, setCurrencyCode] = useState("NPR");

  const inputClass =
    "w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition-colors focus:border-zinc-400 focus:bg-white dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-500 dark:focus:bg-zinc-800";

  return (
    <form
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      onSubmit={async (e) => {
        e.preventDefault();
        await props.onSubmit({
          sku,
          name,
          description: description || undefined,
          unit,
          price: price ? Number(price) : undefined,
          currencyCode,
        });
        setSku("");
        setName("");
        setDescription("");
        setUnit("unit");
        setPrice("");
        setCurrencyCode("NPR");
      }}
    >
      <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Product name" className={inputClass} />
      <input required value={sku} onChange={(e) => setSku(e.target.value)} placeholder="SKU" className={inputClass} />
      <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Unit (e.g. kg, pc, box)" className={inputClass} />
      <input type="number" min={0} step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Price (optional)" className={inputClass} />
      <select value={currencyCode} onChange={(e) => setCurrencyCode(e.target.value)} className={inputClass}>
        <option value="NPR">NPR</option>
        <option value="USD">USD</option>
        <option value="INR">INR</option>
      </select>
      <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" className={inputClass} />
      <div className="flex items-end sm:col-span-2 lg:col-span-3">
        <button
          disabled={props.disabled}
          type="submit"
          className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Add Product
        </button>
      </div>
    </form>
  );
}

/* ── Inline edit row ── */

function EditRow(props: {
  product: Product;
  disabled: boolean;
  onSave: (payload: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
}) {
  const { product: p } = props;
  const [name, setName] = useState(p.name);
  const [sku, setSku] = useState(p.sku);
  const [unit, setUnit] = useState(p.unit);
  const [description, setDescription] = useState(p.description ?? "");

  const inputClass =
    "w-full rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100";

  return (
    <>
      <td className="px-5 py-2.5">
        <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" className={`${inputClass} mt-1`} />
      </td>
      <td className="px-5 py-2.5">
        <input value={sku} onChange={(e) => setSku(e.target.value)} className={inputClass} />
      </td>
      <td className="px-5 py-2.5">
        <input value={unit} onChange={(e) => setUnit(e.target.value)} className={inputClass} />
      </td>
      <td className="px-5 py-2.5 text-zinc-500">—</td>
      <td className="px-5 py-2.5 text-zinc-500">—</td>
      <td className="px-5 py-2.5">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => props.onSave({ name, sku, unit, description: description || null })}
            disabled={props.disabled}
            className="rounded-md bg-zinc-900 px-3 py-1 text-xs font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          >
            Save
          </button>
          <button
            onClick={props.onCancel}
            className="rounded-md border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"
          >
            Cancel
          </button>
        </div>
      </td>
    </>
  );
}

/* ── Inline price editor ── */

function InlinePriceForm(props: {
  currentPrice: string | null;
  currencyCode: string;
  disabled: boolean;
  onSave: (price: number, currencyCode: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [price, setPrice] = useState(props.currentPrice ?? "");
  const [currency, setCurrency] = useState(props.currencyCode);

  return (
    <div className="flex items-center gap-1.5">
      <select
        value={currency}
        onChange={(e) => setCurrency(e.target.value)}
        className="rounded-md border border-zinc-300 bg-white px-1 py-1 text-xs dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
      >
        <option value="NPR">NPR</option>
        <option value="USD">USD</option>
        <option value="INR">INR</option>
      </select>
      <input
        type="number"
        min={0}
        step="0.01"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        className="w-20 rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
      />
      <button
        onClick={() => { if (price) props.onSave(Number(price), currency); }}
        disabled={props.disabled || !price}
        className="rounded-md bg-zinc-900 px-2 py-1 text-xs font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
      >
        ✓
      </button>
      <button
        onClick={props.onCancel}
        className="rounded-md px-1.5 py-1 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
      >
        ✕
      </button>
    </div>
  );
}

