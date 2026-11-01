"use client";

import { formatTs, formatVital } from "@/lib/format";
import type { Alert, VitalObservation } from "@/lib/types";

export function ObservationTimeline({
  observations,
  alerts,
  selectedId,
  onSelect,
}: {
  observations: VitalObservation[];
  alerts: Alert[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const sorted = [...observations].sort(
    (a, b) => new Date(a.observedAt).getTime() - new Date(b.observedAt).getTime()
  );

  return (
    <ol className="space-y-2">
      {sorted.map((o, i) => {
        const related = alerts.filter((a) =>
          a.triggeringObservationIds.includes(o.id)
        );
        const selected = selectedId === o.id;
        return (
          <li key={o.id}>
            <button
              type="button"
              onClick={() => onSelect(o.id)}
              className={`w-full border px-3 py-2 text-left text-sm ${
                selected
                  ? "border-[#17191D] bg-[#EEF0F3]"
                  : "border-[#D8DBE0] bg-white hover:bg-[#F7F8FA]"
              }`}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-mono text-xs">{formatTs(o.observedAt)}</span>
                <span className="text-[11px] uppercase tracking-wide text-[#5C616B]">
                  {o.source} · obs {i + 1}
                </span>
              </div>
              <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-0.5 font-mono text-xs sm:grid-cols-3 lg:grid-cols-6">
                <span>HR {formatVital(o.heartRate, "bpm")}</span>
                <span>RR {formatVital(o.respiratoryRate, "/min")}</span>
                <span>
                  BP{" "}
                  {o.systolicBloodPressure === null ||
                  o.diastolicBloodPressure === null
                    ? "— missing"
                    : `${o.systolicBloodPressure}/${o.diastolicBloodPressure} mmHg`}
                </span>
                <span>SpO₂ {formatVital(o.oxygenSaturation, "%")}</span>
                <span>T {formatVital(o.temperature, "°C", 1)}</span>
                <span className="text-[#5C616B]">{o.id}</span>
              </div>
              {related.map((a) => (
                <div key={a.id} className="mt-1 text-xs text-[#B54708]">
                  Alert {a.status}: {a.triggeredRules.map((r) => r.name).join("; ")}
                </div>
              ))}
            </button>
          </li>
        );
      })}
    </ol>
  );
}
