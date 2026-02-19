"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { fetcher } from "@/lib/fetcher";
import { Breadcrumbs } from "../_lib/breadcrumbs";
import Link from "next/link";

interface Region {
  id: string;
  name: string;
  description: string | null;
  color: string;
  shop_count: number;
}

export default function RegionsPage() {
  const { data, isLoading } = useSWR<{ ok: boolean; regions: Region[] }>("/api/manager/regions", fetcher);
  const regions = data?.regions || [];

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingRegion, setEditingRegion] = useState<Region | null>(null);
  const [search, setSearch] = useState("");

  const filteredRegions = regions.filter(r => 
    r.name.toLowerCase().includes(search.toLowerCase()) || 
    (r.description || "").toLowerCase().includes(search.toLowerCase())
  );

  async function handleDelete(id: string) {
    if (!confirm("Are you sure? This will unassign all shops in this region.")) return;
    const res = await fetch(`/api/manager/regions/${id}`, { method: "DELETE" });
    if (res.ok) {
      mutate("/api/manager/regions");
    } else {
      alert("Failed to delete region");
    }
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col gap-2">
        <Breadcrumbs items={[{ label: "REGIONS" }]} />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">Regions</h1>
            <p className="text-sm font-medium text-zinc-500">Define geographic areas for your shops and reps.</p>
          </div>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 rounded-2xl bg-[#f4a261] px-5 py-3 text-[11px] font-black uppercase tracking-widest text-white shadow-md transition-transform hover:scale-105 hover:bg-[#e79450]"
          >
            {/* Plus Icon */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add Region
          </button>
        </div>
      </div>

      <div className="relative max-w-sm">
        {/* Search Icon */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>
        <input
          type="text"
          placeholder="Search regions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-12 w-full rounded-2xl border border-zinc-100 bg-white pl-11 pr-4 text-sm font-medium shadow-sm outline-none transition-all focus:border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => <div key={i} className="h-40 animate-pulse rounded-[32px] bg-zinc-100 dark:bg-zinc-800" />)}
        </div>
      ) : filteredRegions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[40px] border border-dashed border-zinc-200 bg-zinc-50 py-20 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-zinc-100 text-zinc-400 dark:bg-zinc-800">
            {/* MapPin Icon */}
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
          </div>
          <h3 className="mt-6 text-lg font-black text-zinc-900 dark:text-zinc-100">No regions yet</h3>
          <p className="mt-2 max-w-xs text-sm font-medium text-zinc-500">Create your first region to start organizing your territory.</p>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="mt-8 text-[11px] font-black uppercase tracking-widest text-[#f4a261] hover:underline"
          >
            Create Region
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredRegions.map(region => (
            <div key={region.id} className="group relative overflow-hidden rounded-[32px] border border-zinc-100 bg-white p-8 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
              <div className="absolute right-4 top-4 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                <button 
                  onClick={() => setEditingRegion(region)}
                  className="rounded-xl p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                </button>
                <button 
                  onClick={() => handleDelete(region.id)}
                  className="rounded-xl p-2 text-zinc-400 hover:bg-red-50 hover:text-red-500"
                >
                  {/* Trash2 Icon */}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                  </svg>
                </button>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-sm" style={{ backgroundColor: region.color }}>
                  {/* MapPin Icon */}
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100">{region.name}</h3>
                  <p className="text-[11px] font-bold text-zinc-500">{region.shop_count} shop{region.shop_count !== 1 ? 's' : ''}</p>
                </div>
              </div>

              {region.description && (
                <p className="mt-6 text-sm font-medium text-zinc-500 line-clamp-2">{region.description}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <CreateRegionModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      
      {/* Edit Modal */}
      {editingRegion && (
        <EditRegionModal 
          isOpen={!!editingRegion} 
          onClose={() => setEditingRegion(null)} 
          region={editingRegion} 
        />
      )}
    </div>
  );
}

function CreateRegionModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: "", description: "", color: "#f4a261" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/manager/regions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    setLoading(false);
    if (res.ok) {
      mutate("/api/manager/regions");
      onClose();
      setFormData({ name: "", description: "", color: "#f4a261" });
    } else {
      const data = await res.json();
      alert(data.message || "Failed to create region");
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[40px] bg-white p-8 shadow-2xl dark:bg-zinc-900">
        <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">New Region</h2>
        <p className="text-sm font-medium text-zinc-500">Add a geographic zone to your territory.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Region Name</label>
            <input
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. North Zone, Kathmandu Valley"
              className="h-12 w-full rounded-2xl border border-zinc-100 bg-zinc-50 px-4 text-sm font-bold outline-none focus:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-800/50"
            />
          </div>

          <div className="space-y-2">
             <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Label Color</label>
             <div className="flex gap-2">
               {['#f4a261','#e76f51','#2a9d8f','#264653','#e9c46a'].map(c => (
                 <button
                   key={c}
                   type="button"
                   onClick={() => setFormData({ ...formData, color: c })}
                   className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 ${formData.color === c ? 'border-zinc-900 dark:border-white' : 'border-transparent'}`}
                   style={{ backgroundColor: c }}
                 />
               ))}
             </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Description (Optional)</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Notes about this territory..."
              className="h-24 w-full resize-none rounded-2xl border border-zinc-100 bg-zinc-50 p-4 text-sm font-medium outline-none focus:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-800/50"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl px-6 py-3 text-[11px] font-black uppercase tracking-widest text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-2xl bg-[#f4a261] px-8 py-3 text-[11px] font-black uppercase tracking-widest text-white shadow-lg shadow-orange-500/20 transition-transform hover:scale-105 hover:bg-[#e79450] disabled:opacity-70"
            >
              {loading ? "Creating..." : "Create Region"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditRegionModal({ isOpen, onClose, region }: { isOpen: boolean; onClose: () => void; region: Region }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: region.name, description: region.description || "", color: region.color });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch(`/api/manager/regions/${region.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    setLoading(false);
    if (res.ok) {
      mutate("/api/manager/regions");
      onClose();
    } else {
      const data = await res.json();
      alert(data.message || "Failed to update region");
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[40px] bg-white p-8 shadow-2xl dark:bg-zinc-900">
        <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">Edit Region</h2>
        <p className="text-sm font-medium text-zinc-500">Update region details.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Region Name</label>
            <input
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="h-12 w-full rounded-2xl border border-zinc-100 bg-zinc-50 px-4 text-sm font-bold outline-none focus:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-800/50"
            />
          </div>

          <div className="space-y-2">
             <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Label Color</label>
             <div className="flex gap-2">
               {['#f4a261','#e76f51','#2a9d8f','#264653','#e9c46a'].map(c => (
                 <button
                   key={c}
                   type="button"
                   onClick={() => setFormData({ ...formData, color: c })}
                   className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 ${formData.color === c ? 'border-zinc-900 dark:border-white' : 'border-transparent'}`}
                   style={{ backgroundColor: c }}
                 />
               ))}
             </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Description (Optional)</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="h-24 w-full resize-none rounded-2xl border border-zinc-100 bg-zinc-50 p-4 text-sm font-medium outline-none focus:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-800/50"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl px-6 py-3 text-[11px] font-black uppercase tracking-widest text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-2xl bg-[#f4a261] px-8 py-3 text-[11px] font-black uppercase tracking-widest text-white shadow-lg shadow-orange-500/20 transition-transform hover:scale-105 hover:bg-[#e79450] disabled:opacity-70"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
