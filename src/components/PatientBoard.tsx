"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { TriageBadge } from "@/components/TriageBadge";
import { StatusPill } from "@/components/StatusPill";
import {
  formatSex,
  formatTime,
  formatTs,
  formatVital,
  formatWaiting,
} from "@/lib/format";
import type { BoardFilter, BoardPatient, DashboardSummary } from "@/lib/board-types";
import type { Alert, DecisionLogEntry, VitalObservation } from "@/lib/types";

interface QuickReviewData {
  patient: BoardPatient;
  observations: VitalObservation[];
  alerts: Alert[];
  decisions: DecisionLogEntry[];
}

function previousReading(value: number | null | undefined, unit = "") {
  return value === undefined ? "unavailable" : formatVital(value, unit);
}

const FILTERS: { id: BoardFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "critical", label: "Critical" },
  { id: "urgent", label: "Urgent" },
  { id: "reassessment", label: "Reassessment" },
  { id: "stable", label: "Stable" },
  { id: "awaiting", label: "Awaiting observation" },
  { id: "missing", label: "Missing data" },
];

function matchesFilter(p: BoardPatient, filter: BoardFilter): boolean {
  switch (filter) {
    case "critical":
      return p.boardPriority.code === "critical";
    case "urgent":
      return p.boardPriority.code === "urgent";
    case "reassessment":
      return p.activeAlertCount > 0;
    case "stable":
      return p.currentStatus === "stable";
    case "awaiting":
      return p.currentStatus === "awaiting_observation";
    case "missing":
      return p.currentStatus === "missing_data";
    default:
      return true;
  }
}

function matchesQuery(p: BoardPatient, q: string): boolean {
  if (!q) return true;
  const hay = [
    p.id,
    p.displayName,
    p.boardPriority.label,
    p.boardPriority.shortLabel,
    p.currentStatus,
    `ESI ${p.initialEsi}`,
  ]
    .join(" ")
    .toLowerCase();
  return hay.includes(q.toLowerCase());
}

export function PatientBoard({ summary }: { summary: DashboardSummary }) {
  const router = useRouter();
  const params = useSearchParams();
  const filter = (params.get("filter") as BoardFilter) || "all";
  const q = params.get("q") ?? "";
  const selected = params.get("sel") ?? "";
  const [review, setReview] = useState<QuickReviewData | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);

  useEffect(() => {
    if (!selected) {
      setReview(null);
      return;
    }
    const controller = new AbortController();
    setReviewError(null);
    fetch(`/api/patients/${encodeURIComponent(selected)}/review`, { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Unable to load patient review");
        setReview(data as QuickReviewData);
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setReviewError(error instanceof Error ? error.message : "Unable to load patient review");
      });
    return () => controller.abort();
  }, [selected, summary]);

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if ((key === "filter" && (!value || value === "all")) || !value) {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    const qs = next.toString();
    router.replace(qs ? `/?${qs}` : "/", { scroll: false });
  }

  const rows = useMemo(() => {
    return summary.patients.filter(
      (p) => matchesFilter(p, filter) && matchesQuery(p, q)
    );
  }, [summary.patients, filter, q]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold">Complete patient board</h2>
          <p className="text-xs text-[#5C616B]">All {summary.totalPatients} synthetic patients · review states sort first</p>
        </div>
        <span className="font-mono text-xs text-[#5C616B]">{rows.length} shown</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="board-search" className="sr-only">
          Search patients
        </label>
        <input
          id="board-search"
          value={q}
          onChange={(e) => setParam("q", e.target.value)}
          placeholder="Search ID, name, or triage category"
          className="min-h-11 min-w-[220px] flex-1 border border-[#D8DBE0] bg-white px-3 text-sm outline-none focus:border-[#17191D]"
        />
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setParam("filter", f.id)}
              className={`min-h-11 touch-manipulation border px-3 text-[11px] font-semibold uppercase tracking-wide ${
                filter === f.id
                  ? "border-[#17191D] bg-[#17191D] text-white"
                  : "border-[#D8DBE0] bg-white text-[#17191D] hover:bg-[#F7F8FA]"
              }`}
              aria-pressed={filter === f.id}
            >
              {f.label}
            </button>
          ))}
        </div>
        {filter !== "all" && (
          <button
            type="button"
            className="min-h-11 touch-manipulation px-2 text-xs font-semibold underline"
            onClick={() => setParam("filter", "all")}
          >
            Clear filter
          </button>
        )}
      </div>

      <p className="text-[11px] text-[#69736C]">
        Colour codes are illustrative demonstration categories. They are not a
        validated triage protocol and do not change the synthetic ESI value.
      </p>

      <div className="panel overflow-hidden">
        <div className="divide-y divide-[#E8EAEE] xl:hidden">
          {rows.map((patient) => {
            const observation = patient.latestObservation;
            return (
              <button key={patient.id} type="button" onClick={() => setParam("sel", patient.id)} className="grid w-full grid-cols-[4px_minmax(0,1fr)] gap-3 p-3 text-left hover:bg-[#F1F3F0]" data-attention={patient.activeAlertCount > 0}>
                <span className="triage-bar" data-colour={patient.boardPriority.colour} />
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold">{patient.displayName} <span className="font-mono text-xs font-normal text-[#69736C]">{patient.id}</span></span>
                    <span className="flex flex-wrap items-center gap-1">
                      <TriageBadge priority={patient.boardPriority} compact />
                      <StatusPill status={patient.currentStatus} />
                    </span>
                  </span>
                  <span className="mt-1 block text-[10px] text-[#69736C]">{patient.age} / {formatSex(patient.sex)} · {patient.assignedArea} · wait {formatWaiting(patient.arrivalAt, summary.demoNowIso)}</span>
                  <span className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-[10px] tabular-nums sm:grid-cols-3">
                    <span>HR {observation ? formatVital(observation.heartRate, " bpm") : "—"}</span>
                    <span className={patient.triggeredRuleIds.includes("rr_increase_8") ? "font-semibold text-[#C62828]" : ""}>RR {observation ? `${formatVital(patient.previousObservation?.respiratoryRate, "")} → ${formatVital(observation.respiratoryRate, " /min")}` : "—"}</span>
                    <span className={patient.triggeredRuleIds.includes("sbp_decrease_25") ? "font-semibold text-[#C62828]" : ""}>BP {observation ? `${patient.previousObservation?.systolicBloodPressure ?? "—"}/${patient.previousObservation?.diastolicBloodPressure ?? "—"} → ${observation.systolicBloodPressure ?? "—"}/${observation.diastolicBloodPressure ?? "—"}` : "—"}</span>
                    <span>SpO₂ {observation ? formatVital(observation.oxygenSaturation, "%") : "—"}</span>
                    <span>Temp {observation ? formatVital(observation.temperature, " °C", 1) : "—"}</span>
                    <span>{observation ? formatTs(observation.observedAt) : "No observations"}</span>
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        <div className="hidden xl:block">
          <table className="w-full min-w-[980px] border-collapse text-left text-[13px]">
            <thead>
              <tr className="border-b border-[#D8DBE0] bg-[#F7F8FA] text-[10px] font-semibold uppercase tracking-wide text-[#5C616B]">
                <th className="w-1 p-0" aria-hidden />
                <th className="px-2 py-1.5">Triage</th>
                <th className="px-2 py-1.5">Patient / ID</th>
                <th className="px-2 py-1.5">Age / sex</th>
                <th className="px-2 py-1.5">Location / wait</th>
                <th className="px-2 py-1.5">HR</th>
                <th className="px-2 py-1.5">RR change</th>
                <th className="px-2 py-1.5">BP change</th>
                <th className="px-2 py-1.5">SpO₂</th>
                <th className="px-2 py-1.5">Temp</th>
                <th className="px-2 py-1.5">Latest obs</th>
                <th className="px-2 py-1.5">Workflow</th>
                <th className="px-2 py-1.5">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const o = p.latestObservation;
                return (
                  <tr
                    key={p.id}
                    className="board-row border-b border-[#E8EAEE]"
                    data-selected={selected === p.id}
                    data-attention={p.activeAlertCount > 0}
                    tabIndex={0}
                    role="button"
                    aria-label={`Quick review ${p.displayName} ${p.id}`}
                    onClick={() => setParam("sel", p.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setParam("sel", p.id);
                      }
                    }}
                  >
                    <td className="p-0">
                      <div
                        className="triage-bar min-h-[44px]"
                        data-colour={p.boardPriority.colour}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <TriageBadge priority={p.boardPriority} compact />
                    </td>
                    <td className="px-2 py-2">
                      <div className="font-semibold">{p.displayName}</div>
                      <div className="font-mono text-[11px] text-[#5C616B]">
                        {p.id} · synthetic · ESI {p.initialEsi} (demo)
                      </div>
                    </td>
                    <td className="px-2 py-2 font-mono text-xs">
                      {p.age} / {formatSex(p.sex)}
                    </td>
                    <td className="px-2 py-2 font-mono text-xs">
                      <span className="block text-[10px] text-[#69736C]">{p.assignedArea}</span>
                      {formatWaiting(p.arrivalAt, summary.demoNowIso)}
                    </td>
                    <td className="px-2 py-2 font-mono text-xs">
                      {o ? formatVital(o.heartRate, "") : "—"}
                    </td>
                    <td className={`px-2 py-2 font-mono text-xs ${p.triggeredRuleIds.includes("rr_increase_8") ? "bg-amber-50 font-semibold text-[#854D0E]" : ""}`}>
                      {o ? `${previousReading(p.previousObservation?.respiratoryRate)} → ${formatVital(o.respiratoryRate, "")}` : "—"}
                    </td>
                    <td className={`px-2 py-2 font-mono text-xs ${p.triggeredRuleIds.includes("sbp_decrease_25") ? "bg-amber-50 font-semibold text-[#854D0E]" : ""}`}>
                      {o
                        ? `${previousReading(p.previousObservation?.systolicBloodPressure)}/${previousReading(p.previousObservation?.diastolicBloodPressure)} → ${o.systolicBloodPressure ?? "—"}/${o.diastolicBloodPressure ?? "—"}`
                        : "—"}
                    </td>
                    <td className="px-2 py-2 font-mono text-xs">
                      {o ? formatVital(o.oxygenSaturation, "") : "—"}
                    </td>
                    <td className="px-2 py-2 font-mono text-xs">
                      {o ? formatVital(o.temperature, "", 1) : "—"}
                    </td>
                    <td className="px-2 py-2 font-mono text-[11px]">
                      {o ? formatTs(o.observedAt) : "—"}
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex flex-col gap-1">
                          <StatusPill status={p.currentStatus} />
                        {p.activeAlertCount > 0 && (
                          <span className="status-pill" data-colour="amber">
                            {p.activeAlertCount} alert
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-[#23483B]">
                        Quick review
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-[#5C616B]">
            No synthetic patients match this search or filter. Clear the filter
            to restore the full board.
          </p>
        )}
      </div>
      {selected && (
        <>
          <button type="button" className="fixed inset-0 z-40 cursor-default bg-black/20" onClick={() => setParam("sel", "")} aria-label="Close patient review" />
          <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-[430px] overflow-y-auto border-l border-[#D9DED8] bg-white shadow-xl" role="dialog" aria-modal="true" aria-labelledby="quick-review-title">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#D9DED8] bg-white px-4 py-3">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wide text-[#69736C]">Quick Review</p>
                <h2 id="quick-review-title" className="text-base font-semibold">{review?.patient.displayName ?? selected}</h2>
              </div>
              <button type="button" onClick={() => setParam("sel", "")} className="inline-flex h-11 w-11 touch-manipulation items-center justify-center border border-[#D9DED8] hover:bg-[#F1F3F0]" aria-label="Close patient review"><X className="h-4 w-4" aria-hidden /></button>
            </div>
            <div className="space-y-4 p-4">
              {reviewError && <p className="text-sm text-[#C62828]" role="alert">{reviewError}</p>}
              {!review && !reviewError && <p className="text-sm text-[#69736C]">Loading current patient state…</p>}
              {review && (() => {
                const patient = review.patient;
                const latest = patient.latestObservation;
                const activeAlerts = review.alerts.filter((alert) => alert.status === "active");
                const fullParams = new URLSearchParams();
                if (filter !== "all") fullParams.set("filter", filter);
                if (q) fullParams.set("q", q);
                const detailHref = `/patients/${patient.id}${fullParams.size ? `?${fullParams}` : ""}`;
                return (
                  <>
                    <div className="flex flex-wrap items-center gap-2">
                      <TriageBadge priority={patient.boardPriority} compact />
                      <span className="text-xs text-[#69736C]">ESI {patient.initialEsi} · synthetic</span>
                    </div>
                    <p className="text-xs text-[#69736C]">{patient.age} / {formatSex(patient.sex)} · {patient.assignedArea} · {latest ? `Observed ${formatTs(latest.observedAt)}` : "No observations"}</p>
                    <div className="grid grid-cols-2 gap-px border border-[#D9DED8] bg-[#D9DED8]">
                      {[
                        ["HR", latest ? formatVital(latest.heartRate, " bpm") : "—"],
                        ["RR", latest ? `${previousReading(patient.previousObservation?.respiratoryRate)} → ${formatVital(latest.respiratoryRate, " breaths/min")}` : "—"],
                        ["BP", latest ? `${previousReading(patient.previousObservation?.systolicBloodPressure)}/${previousReading(patient.previousObservation?.diastolicBloodPressure)} → ${latest.systolicBloodPressure ?? "—"}/${latest.diastolicBloodPressure ?? "—"} mmHg` : "—"],
                        ["SpO₂", latest ? formatVital(latest.oxygenSaturation, "%") : "—"],
                        ["Temperature", latest ? formatVital(latest.temperature, " °C", 1) : "—"],
                        ["Waiting", formatWaiting(patient.arrivalAt, summary.demoNowIso)],
                      ].map(([label, reading]) => <div key={label} className="bg-white px-3 py-2"><span className="block text-[9px] font-semibold uppercase text-[#69736C]">{label}</span><span className="mt-0.5 block font-mono text-xs font-semibold tabular-nums">{reading}</span></div>)}
                    </div>
                    <section>
                      <h3 className="text-xs font-semibold uppercase">Active alerts</h3>
                      {activeAlerts.length ? activeAlerts.map((alert) => <div key={alert.id} className="mt-2 border-l-4 border-[#C62828] bg-[#FCE8E8] p-3"><p className="text-xs font-semibold">Reassessment flagged · {formatTime(alert.createdAt)} IST</p><p className="mt-1 text-xs">{alert.explanation}</p><Link href={`${detailHref}#alert-${alert.id}`} className="mt-2 inline-flex text-xs font-semibold text-[#23483B] underline">Open explanation</Link></div>) : <p className="mt-2 text-xs text-[#69736C]">No active alerts. Recorded decisions do not indicate recovery.</p>}
                    </section>
                    <Link href={detailHref} className="inline-flex items-center gap-1 border border-[#23483B] bg-[#23483B] px-3 py-2 text-xs font-semibold text-white hover:bg-[#19382E]">Open full patient detail <ArrowUpRight className="h-3.5 w-3.5" aria-hidden /></Link>
                  </>
                );
              })()}
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
