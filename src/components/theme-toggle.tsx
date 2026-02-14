"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "kora-theme";

type ThemeMode = "light" | "dark";

export function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setMode(isDark ? "dark" : "light");
    setMounted(true);
  }, []);

  function toggleTheme() {
    const root = document.documentElement;
    const nextMode: ThemeMode = mode === "dark" ? "light" : "dark";
    root.classList.toggle("dark", nextMode === "dark");
    localStorage.setItem(STORAGE_KEY, nextMode);
    setMode(nextMode);
  }

  if (!mounted) {
    return (
      <div
        className="fixed bottom-5 right-5 z-[100] h-11 w-11 rounded-full border border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900"
        aria-hidden
      />
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="fixed bottom-5 right-5 z-[100] inline-flex h-11 w-11 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-700 shadow-sm transition hover:scale-[1.03] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
      aria-label={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={mode === "dark" ? "Light mode" : "Dark mode"}
    >
      {mode === "dark" ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

function SunIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3a7.5 7.5 0 1 0 9 9A9 9 0 1 1 12 3Z" />
    </svg>
  );
}

