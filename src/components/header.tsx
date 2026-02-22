"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";

export function Header() {
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        setHasSession(res.ok);
      })
      .catch(() => {
        setHasSession(false);
      });
  }, []);

  return (
    <header className="flex items-center justify-between">
      <Link href="/" className="relative flex h-[80px] w-[190px] items-center">
        <Image
          src="/logo.svg"
          alt="SalesSuite logo"
          width={190}
          height={80}
          priority
          className="dark:hidden"
        />
        <Image
          src="/logo-dark.svg"
          alt="SalesSuite logo dark"
          width={190}
          height={80}
          priority
          className="hidden dark:block"
        />
      </Link>
      {hasSession === null ? (
        <div className="h-[42px] w-[120px] animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
      ) : (
        <Link
          href={hasSession ? "/dashboard" : "/auth/signup"}
          className="rounded-full bg-zinc-800 px-10 py-3 text-[16px] font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          {hasSession ? "Dashboard" : "Sign up"}
        </Link>
      )}
    </header>
  );
}
