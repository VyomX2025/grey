"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { useState } from "react";

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function resetDemo() {
    const ok = window.confirm(
      "Reset the demonstration to the initial seeded state? Clinician decisions and simulated observations will be cleared."
    );
    if (!ok) return;
    setBusy(true);
    try {
      const res = await fetch("/api/demo/reset", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Reset failed");
      }
      try {
        localStorage.removeItem("grey-demo-hint");
      } catch {
        /* ignore */
      }
      router.refresh();
      if (pathname !== "/") {
        router.push("/");
      } else {
        window.location.reload();
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "Reset failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <header className="border-b border-grey-300 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="group flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-grey-950">
            GREY<span className="text-amber-700">.</span>
          </span>
          <span className="hidden text-xs font-medium uppercase tracking-[0.18em] text-grey-500 sm:inline">
            Clinical operations demo
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={resetDemo}
            disabled={busy}
            className="inline-flex items-center gap-1.5 border border-grey-400 bg-white px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-grey-800 hover:bg-grey-50 disabled:opacity-50"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden />
            Reset Demo
          </button>
        </div>
      </div>
    </header>
  );
}
