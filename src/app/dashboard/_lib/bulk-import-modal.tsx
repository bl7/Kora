import { useState } from "react";
import { useToast } from "./toast-context";

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  templateUrl: string;
  importUrl: string;
  onSuccess: () => void;
}

export function BulkImportModal({ isOpen, onClose, title, templateUrl, importUrl, onSuccess }: BulkImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [report, setReport] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);
  const toast = useToast();

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setReport(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(importUrl, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        let errMessage;
        try {
          const errJson = JSON.parse(text);
          errMessage = errJson.message || errJson.error;
        } catch {
          errMessage = text;
        }
        throw new Error(errMessage || `Upload failed with status ${res.status}`);
      }

      const data = await res.json();
      setReport(data);
      if (data.imported > 0) {
        toast.success(`Successfully imported ${data.imported} items.`);
        onSuccess();
      } else if (data.skipped > 0) {
        toast.error("Import completed with skips.");
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to upload file.");
      console.error(e);
    } finally {
      setUploading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-[40px] bg-white p-8 shadow-2xl dark:bg-zinc-900">
        <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">{title}</h2>
        <p className="text-sm font-medium text-zinc-500">Upload a CSV file to bulk import data.</p>
        
        {uploading && (
           <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-[40px] bg-white/80 backdrop-blur-sm dark:bg-zinc-900/80">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-200 border-t-[#f4a261]" />
              <p className="mt-4 text-xs font-black uppercase tracking-widest text-zinc-500">Processing Import...</p>
           </div>
        )}

        {!report ? (
          <div className="mt-8 space-y-6">
            <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-6 text-center dark:border-zinc-800 dark:bg-zinc-800/50">
               <p className="mb-4 text-xs font-bold uppercase tracking-widest text-zinc-400">Step 1: Download Template</p>
               <a 
                 href={templateUrl} 
                 download 
                 className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-bold text-indigo-600 shadow-sm transition-transform hover:scale-105 dark:bg-zinc-800 dark:text-indigo-400"
               >
                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                 Download CSV Template
               </a>
            </div>

            <div className="space-y-2">
               <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Step 2: Upload Data</p>
               <input 
                 type="file" 
                 accept=".csv"
                 onChange={e => setFile(e.target.files?.[0] || null)}
                 className="block w-full text-sm text-zinc-500 file:mr-4 file:rounded-xl file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-indigo-900/20 dark:file:text-indigo-400"
               />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={onClose}
                className="rounded-2xl px-6 py-3 text-[11px] font-black uppercase tracking-widest text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading || !file}
                className="rounded-2xl bg-[#f4a261] px-8 py-3 text-[11px] font-black uppercase tracking-widest text-white shadow-lg shadow-orange-500/20 transition-transform hover:scale-105 hover:bg-[#e79450] disabled:opacity-70"
              >
                {uploading ? "Importing..." : "Start Import"}
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-8 space-y-6">
             <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-emerald-50 p-4 text-center dark:bg-emerald-900/20">
                   <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{report.imported}</p>
                   <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600/60 dark:text-emerald-400/60">Imported</p>
                </div>
                <div className="rounded-2xl bg-rose-50 p-4 text-center dark:bg-rose-900/20">
                   <p className="text-3xl font-black text-rose-600 dark:text-rose-400">{report.skipped}</p>
                   <p className="text-[10px] font-bold uppercase tracking-widest text-rose-600/60 dark:text-rose-400/60">Skipped/Failed</p>
                </div>
             </div>

             {report.errors.length > 0 && (
                <div className="max-h-48 overflow-y-auto rounded-2xl border border-zinc-100 bg-zinc-50 p-4 text-xs font-mono text-rose-500 dark:border-zinc-800 dark:bg-zinc-900">
                   {report.errors.map((e, i) => <div key={i}>{e}</div>)}
                </div>
             )}

             <div className="flex justify-end pt-4">
                <button
                   onClick={() => { setReport(null); onClose(); }}
                   className="rounded-2xl bg-zinc-900 px-8 py-3 text-[11px] font-black uppercase tracking-widest text-white transition-transform hover:scale-105 dark:bg-white dark:text-zinc-900"
                >
                   Done
                </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
