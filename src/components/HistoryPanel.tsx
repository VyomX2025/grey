"use client";

import { useState } from "react";
import { FileText, X } from "lucide-react";
import { formatTs } from "@/lib/format";
import type { AssembledHistoryItem } from "@/lib/historical-assembly";
import type { SourceRecord } from "@/lib/types";

export function HistoryPanel({
  patientId,
  items,
  emptyMessage,
}: {
  patientId: string;
  items: AssembledHistoryItem[];
  emptyMessage?: string;
}) {
  const [source, setSource] = useState<SourceRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openSource(sourceId: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/patients/${patientId}/sources/${encodeURIComponent(sourceId)}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load source");
      setSource(data.source);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load source");
    } finally {
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-grey-600">
        {emptyMessage ??
          "No synthetic historical records are seeded for this patient."}
      </p>
    );
  }

  return (
    <>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.record.id} className="border border-grey-200 bg-grey-50 p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-grey-950">
                  {item.record.title}
                </div>
                <div className="text-xs text-grey-500">
                  {item.record.recordType} · {formatTs(item.record.recordedAt)} ·
                  synthetic
                </div>
                <div className="mt-1 break-all font-mono text-[10px] text-grey-500">
                  Source: {item.sourceId}
                </div>
              </div>
              <button
                type="button"
                onClick={() => openSource(item.sourceId)}
                disabled={loading}
                className="inline-flex min-h-11 touch-manipulation items-center gap-1 border border-grey-400 bg-white px-3 text-xs font-medium hover:bg-white disabled:opacity-50"
              >
                <FileText className="h-3.5 w-3.5" aria-hidden />
                View source
              </button>
            </div>
            <p className="mt-2 text-sm text-grey-700">{item.record.summary}</p>
            <p className="mt-2 border-l-2 border-grey-400 pl-2 text-sm text-grey-800">
              <span className="font-semibold">Why relevant: </span>
              {item.relevanceExplanation}
            </p>
          </li>
        ))}
      </ul>
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}

      {source && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="source-title"
        >
          <div className="max-h-[85vh] w-full max-w-2xl overflow-auto border border-grey-300 bg-white p-4 shadow-lg">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h4 id="source-title" className="text-base font-semibold">
                  {source.title}
                </h4>
                <p className="text-xs text-grey-500">
                  {source.sourceType} · {formatTs(source.recordedAt)} · ID{" "}
                  {source.id} · synthetic: true
                </p>
              </div>
              <button
                type="button"
                aria-label="Close source"
                onClick={() => setSource(null)}
                className="inline-flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center border border-grey-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <pre className="mt-3 whitespace-pre-wrap break-words border border-grey-200 bg-grey-50 p-3 font-mono text-xs leading-relaxed text-grey-900">
              {source.content}
            </pre>
          </div>
        </div>
      )}
    </>
  );
}
