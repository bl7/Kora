"use client";

import Link from "next/link";
import React from "react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-6">
      <Link href="/dashboard" className="hover:text-zinc-600 transition-colors">DASHBOARD</Link>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-zinc-300">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
          {item.href ? (
            <Link href={item.href} className="hover:text-zinc-600 transition-colors uppercase">
              {item.label}
            </Link>
          ) : (
            <span className="text-zinc-200 uppercase">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
