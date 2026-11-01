"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pause, Play, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { DEMO_FEED_INTERVAL_MS } from "@/lib/demo-feed";
import {
  postDemoRequest,
  validateDemoFeedTick,
  validateDemoReset,
} from "@/lib/demo-requests";
import { formatClock, formatTime } from "@/lib/format";

export function CompactToolbar() {
  const router = useRouter();
  const [clock, setClock] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [userPaused, setUserPaused] = useState(false);
  const [tabVisible, setTabVisible] = useState(true);
  const [feedExhausted, setFeedExhausted] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [feedError, setFeedError] = useState(false);
  const requestInFlight = useRef<Promise<void> | null>(null);
  const resetInProgress = useRef(false);

  useEffect(() => {
    const tick = () => setClock(formatClock(new Date()));
    const visibilityChanged = () => setTabVisible(!document.hidden);
    tick();
    visibilityChanged();
    const clockId = window.setInterval(tick, 30_000);
    document.addEventListener("visibilitychange", visibilityChanged);
    return () => {
      window.clearInterval(clockId);
      document.removeEventListener("visibilitychange", visibilityChanged);
    };
  }, []);

  useEffect(() => {
    if (userPaused || !tabVisible || feedExhausted) return;
    let active = true;
    const advance = async () => {
      if (requestInFlight.current || resetInProgress.current) return;
      const request = (async () => {
        try {
          const response = await postDemoRequest<unknown>("/api/demo/tick");
          const result = validateDemoFeedTick(response);
          if (!active) return;
          setFeedError(false);
          if (result.advanced) {
            setLastUpdated(formatTime(new Date().toISOString()));
            router.refresh();
          } else if (result.reason === "exhausted") {
            setFeedExhausted(true);
          }
        } catch {
          if (active) setFeedError(true);
        }
      })();
      requestInFlight.current = request;
      try {
        await request;
      } finally {
        if (requestInFlight.current === request) requestInFlight.current = null;
      }
    };
    const id = window.setInterval(() => void advance(), DEMO_FEED_INTERVAL_MS);
    return () => {
      active = false;
      window.clearInterval(id);
    };
  }, [feedExhausted, router, tabVisible, userPaused]);

  async function resetDemo() {
    setBusy(true);
    setFeedback(null);
    setUserPaused(true);
    resetInProgress.current = true;
    try {
      if (requestInFlight.current) await requestInFlight.current;
      const result = await postDemoRequest<unknown>("/api/demo/reset");
      validateDemoReset(result);
      setConfirmOpen(false);
      setFeedback("Demo restored to seeded synthetic state.");
      setFeedExhausted(false);
      setLastUpdated(null);
      setFeedError(false);
      setUserPaused(false);
      router.refresh();
      window.setTimeout(() => window.location.assign("/"), 250);
    } catch (e) {
      setFeedback(e instanceof Error ? e.message : "Reset failed");
      setBusy(false);
      setUserPaused(false);
    } finally {
      resetInProgress.current = false;
    }
  }

  return (
    <>
      <header className="toolbar px-3">
        <div className="mx-auto flex w-full max-w-[1400px] items-center gap-3">
          <Link href="/" className="inline-flex min-h-11 shrink-0 items-center text-[15px] font-semibold text-black">
            GREY.
          </Link>
          <span className="hidden font-mono text-[10px] text-[#69736C] sm:inline">{clock}</span>
          <span className="ml-auto flex items-center gap-2">
            <span className="hidden text-right sm:block">
              <span className={`block text-[10px] font-semibold uppercase tracking-wide ${feedError ? "text-[#B42318]" : feedExhausted ? "text-[#69736C]" : userPaused || !tabVisible ? "text-[#69736C]" : "text-[#23483B]"}`}>
                <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-current" />
                {feedError ? "Feed error" : feedExhausted ? "No new observations" : userPaused || !tabVisible ? "Paused" : "Live simulation"}
              </span>
              <span className="block font-mono text-[9px] text-[#69736C]">
                {feedError ? "Last update failed" : lastUpdated ? `Updated ${lastUpdated}` : "Awaiting update"}
              </span>
            </span>
            {!feedExhausted && (
              <button
                type="button"
                onClick={() => setUserPaused((paused) => !paused)}
                disabled={busy}
                className="inline-flex h-11 w-11 touch-manipulation items-center justify-center border border-[#D9DED8] bg-white text-[#23483B] hover:bg-[#E7EEE8]"
                aria-label={userPaused ? "Resume live simulation" : "Pause live simulation"}
                title={userPaused ? "Resume live simulation" : "Pause live simulation"}
              >
                {userPaused ? <Play className="h-3.5 w-3.5" aria-hidden /> : <Pause className="h-3.5 w-3.5" aria-hidden />}
              </button>
            )}
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              className="inline-flex min-h-11 items-center gap-1 border border-[#D9DED8] bg-white px-3 text-[10px] font-semibold uppercase tracking-wide text-[#202522] hover:bg-[#F1F3F0]"
            >
              <RotateCcw className="h-3 w-3" aria-hidden />
              Reset demo
            </button>
          </span>
        </div>
      </header>
      {feedback && (
        <div className="border-b border-[#D8DBE0] bg-white px-3 py-1 text-center text-xs text-[#17191D]" role="status">
          {feedback}
        </div>
      )}
      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-title"
        >
          <div className="w-full max-w-sm border border-[#D8DBE0] bg-white p-4">
            <h2 id="reset-title" className="text-sm font-semibold">
              Reset demonstration?
            </h2>
            <p className="mt-2 text-sm text-[#5C616B]">
              This restores seeded observations, clears alerts and audit
              entries, and returns original synthetic ESI values. Simulated
              observations will be removed.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="min-h-11 touch-manipulation border border-[#D8DBE0] px-3 text-sm"
                onClick={() => setConfirmOpen(false)}
                disabled={busy}
              >
                Cancel
              </button>
              <button
                type="button"
                className="min-h-11 touch-manipulation border border-[#17191D] bg-[#17191D] px-3 text-sm text-white disabled:opacity-50"
                onClick={resetDemo}
                disabled={busy}
              >
                {busy ? "Resetting…" : "Reset demo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
