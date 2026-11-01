"use client";

import { useState } from "react";
import { AlertTriangle, Check, X } from "lucide-react";
import { formatTs } from "@/lib/format";
import type { Alert } from "@/lib/types";
import { StatusPill } from "./StatusPill";

export function AlertPanel({
  alert,
  onConfirm,
  onOverride,
  onJumpToObservation,
  busy,
}: {
  alert: Alert;
  onConfirm: () => Promise<void>;
  onOverride: (rationale: string) => Promise<void>;
  onJumpToObservation?: (observationId: string) => void;
  busy: boolean;
}) {
  const [showOverride, setShowOverride] = useState(false);
  const [rationale, setRationale] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submitOverride() {
    if (!rationale.trim()) {
      setError("A nonempty rationale is required.");
      return;
    }
    setError(null);
    await onOverride(rationale.trim());
    setShowOverride(false);
    setRationale("");
  }

  return (
    <section
      className="panel border-l-4 border-l-amber-600 p-4"
      aria-labelledby={`alert-${alert.id}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-700" aria-hidden />
          <div>
            <h3 id={`alert-${alert.id}`} className="text-sm font-semibold text-grey-950">
              Demonstration reassessment alert
            </h3>
            <p className="text-xs text-grey-500">
              ID {alert.id} · {formatTs(alert.createdAt)}
            </p>
          </div>
        </div>
        <StatusPill status={alert.status} />
      </div>

      <p className="mt-3 text-sm leading-relaxed text-grey-800">{alert.explanation}</p>
      <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-amber-800">
        Illustrative, unvalidated rule logic · synthetic observations only
      </p>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {alert.triggeredRules.map((rule) => (
          <div key={rule.id} className="border border-amber-200 bg-amber-50 px-3 py-2 text-sm">
            <div className="font-semibold text-amber-900">{rule.name}</div>
            <div className="mt-1 font-mono text-xs text-grey-800">
              {rule.previousValue} → {rule.currentValue} {rule.unit} (Δ{" "}
              {rule.absoluteChange}, threshold ≥ {rule.threshold})
            </div>
            <p className="mt-1 text-xs text-grey-600">{rule.description}</p>
          </div>
        ))}
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-grey-600 sm:grid-cols-4">
        <div>
          <dt className="font-semibold uppercase tracking-wide">Previous obs</dt>
          <dd>{formatTs(alert.previousObservedAt)}</dd>
        </div>
        <div>
          <dt className="font-semibold uppercase tracking-wide">Current obs</dt>
          <dd>{formatTs(alert.currentObservedAt)}</dd>
        </div>
        <div>
          <dt className="font-semibold uppercase tracking-wide">Severity</dt>
          <dd>demonstration_review</dd>
        </div>
        <div>
          <dt className="font-semibold uppercase tracking-wide">Synthetic</dt>
          <dd>true</dd>
        </div>
      </dl>
      {onJumpToObservation && (
        <button
          type="button"
          className="mt-2 inline-flex min-h-11 touch-manipulation items-center text-xs font-semibold underline"
          onClick={() =>
            onJumpToObservation(alert.triggeringObservationIds[1])
          }
        >
          Jump to triggering observation
        </button>
      )}

      {alert.status === "active" && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => onConfirm()}
            className="inline-flex min-h-11 touch-manipulation items-center gap-1.5 border border-emerald-700 bg-emerald-700 px-3 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
          >
            <Check className="h-4 w-4" aria-hidden />
            Confirm alert
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => setShowOverride(true)}
            className="inline-flex min-h-11 touch-manipulation items-center gap-1.5 border border-grey-400 bg-white px-3 text-sm font-medium text-grey-800 hover:bg-grey-50 disabled:opacity-50"
          >
            <X className="h-4 w-4" aria-hidden />
            Override / dismiss
          </button>
          <span className="text-xs text-grey-500">
            Actor: Demo Clinician (demo identity — no authentication)
          </span>
        </div>
      )}

      {showOverride && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="override-title"
        >
          <div className="w-full max-w-md border border-grey-300 bg-white p-4 shadow-lg">
            <h4 id="override-title" className="text-base font-semibold">
              Override demonstration alert
            </h4>
            <p className="mt-1 text-sm text-grey-600">
              A rationale is mandatory. This does not change observations or the
              synthetic ESI value.
            </p>
            <label htmlFor="rationale" className="mt-3 block text-sm font-medium">
              Rationale
            </label>
            <textarea
              id="rationale"
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              rows={4}
              className="mt-1 w-full border border-grey-300 px-2 py-1.5 text-sm outline-none focus:border-grey-700"
              placeholder="Explain why this demonstration alert is being overridden…"
            />
            {error && <p className="mt-1 text-sm text-red-700">{error}</p>}
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                className="min-h-11 touch-manipulation border border-grey-300 px-3 text-sm"
                onClick={() => {
                  setShowOverride(false);
                  setError(null);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy}
                className="min-h-11 touch-manipulation border border-grey-800 bg-grey-800 px-3 text-sm text-white disabled:opacity-50"
                onClick={submitOverride}
              >
                Submit override
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
