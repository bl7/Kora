"use client";

import Image from "next/image";
import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";

type LoginResponse = {
  ok: boolean;
  error?: string;
  session?: { role: string };
};

function WarehouseLoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = (await response.json()) as LoginResponse;
    setLoading(false);

    if (!response.ok || !data.ok) {
      setError(data.error ?? "Login failed");
      return;
    }

    if ((data as any).user?.role === "dispatch_supervisor") {
      router.push("/warehouse/dashboard");
    } else {
      setError("This login is only for Dispatch Supervisors.");
      // Optionally logout if they logged in with a different role but shouldn't have
      await fetch("/api/auth/logout", { method: "POST" });
    }
  }

  return (
    <div className="min-h-screen overflow-y-auto bg-zinc-50 px-6 py-6 dark:bg-[#0d1117]">
      <div className="mx-auto flex h-full max-w-2xl items-center">
        <div className="w-full text-center">
          <div className="mb-6 flex justify-center">
            <Image
              src="/logo.svg"
              alt="SalesSuite"
              width={90}
              height={90}
              className="dark:hidden"
            />
            <Image
              src="/logo-dark.svg"
              alt="SalesSuite"
              width={90}
              height={90}
              className="hidden dark:block"
            />
          </div>
          <h1 className="text-[56px] leading-none font-serif text-zinc-900 md:text-[48px] dark:text-zinc-100">
            Warehouse Access
          </h1>
          <p className="mt-4 text-[18px] text-zinc-500 dark:text-zinc-400">
            Sign in as Dispatch Supervisor to manage warehouse operations
          </p>

          <form onSubmit={onSubmit} className="mx-auto mt-8 max-w-xl space-y-4">
            <label className="block">
              <input
                required
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Email"
                className="h-14 w-full rounded-2xl border border-zinc-200 bg-white px-5 text-[18px] text-zinc-800 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
              />
            </label>

            <label className="block">
              <div className="relative">
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Password"
                  className="h-14 w-full rounded-2xl border border-zinc-200 bg-white px-5 pr-16 text-[18px] text-zinc-800 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </label>

            {error ? <p className="text-center text-sm text-red-600">{error}</p> : null}

            <div className="pt-2 text-center">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-14 min-w-64 items-center justify-center rounded-full bg-zinc-900 px-10 text-[18px] font-medium text-white shadow-xl disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
              >
                {loading ? "Signing in..." : "Continue"}
              </button>
            </div>
          </form>
          
          <p className="mt-8 text-xs text-zinc-400">
            Dispatch Supervisor login only. For other roles, use the <button onClick={() => router.push("/auth/login")} className="hover:underline text-zinc-500 font-medium">main login</button>.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function WarehouseLoginPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
      <WarehouseLoginForm />
    </Suspense>
  );
}
