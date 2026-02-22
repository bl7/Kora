export function LoadingState() {
  return (
    <div className="flex h-[400px] w-full flex-col items-center justify-center gap-4 rounded-[40px] border border-zinc-100 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="relative h-12 w-12">
        <div className="absolute inset-0 rounded-full border-4 border-zinc-100 dark:border-zinc-800"></div>
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-[#f4a261] border-t-transparent"></div>
      </div>
      <p className="animate-pulse text-xs font-black uppercase tracking-widest text-zinc-400">Loading resources...</p>
    </div>
  );
}

export function EmptyState({ title, message, icon }: { title: string; message: string; icon?: React.ReactNode }) {
  return (
    <div className="flex h-[400px] w-full flex-col items-center justify-center gap-2 rounded-[40px] border border-dashed border-zinc-200 bg-zinc-50/50 p-8 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
      {icon && <div className="mb-4 text-zinc-300 dark:text-zinc-700">{icon}</div>}
      <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">{title}</h3>
      <p className="max-w-[240px] text-xs font-medium text-zinc-500">{message}</p>
    </div>
  );
}
