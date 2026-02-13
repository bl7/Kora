"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setError(data.error ?? "Something went wrong");
      return;
    }

    setSent(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f3f2f6] px-4 dark:bg-[#0d1117]">
      <div className="w-full max-w-[400px]">
        <div className="mb-6 flex justify-center">
          <Image
            src="/logo.svg"
            alt="SalesSuite"
            width={72}
            height={72}
            className="dark:hidden"
          />
          <Image
            src="/logo-dark.svg"
            alt="SalesSuite"
            width={72}
            height={72}
            className="hidden dark:block"
          />
        </div>
        <h1 className="text-center text-[22px] font-semibold text-zinc-900 dark:text-zinc-100">
          Reset your password
        </h1>
        <p className="mt-2 text-center text-[13px] text-zinc-500 dark:text-zinc-400">
          Enter your email and we&apos;ll send you a reset link.
        </p>

        {sent ? (
          <div className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center text-sm text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-900/20 dark:text-emerald-400">
            <p className="font-medium">Check your email</p>
            <p className="mt-1 text-xs">If an account with that email exists, a reset link has been sent.</p>
            <Link href="/auth/login" className="mt-4 inline-block text-xs font-medium underline">
              Back to login
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800/40 dark:bg-red-900/20 dark:text-red-400">
                {error}
              </div>
            )}

            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-[14px] text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-500"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-zinc-900 py-3 text-[14px] font-semibold text-white transition-colors hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {loading ? "Sending…" : "Send reset link"}
            </button>

            <p className="text-center text-[12px] text-zinc-500 dark:text-zinc-400">
              Remember your password?{" "}
              <Link href="/auth/login" className="font-medium text-zinc-900 underline dark:text-zinc-100">
                Log in
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

