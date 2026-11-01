"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowDownRight, ArrowUpRight, Clock3 } from "lucide-react";
import { formatTime } from "@/lib/format";
import type { DashboardEvent, DashboardSummary } from "@/lib/board-types";

function value(value: number | null | undefined, unit = "") {
  return value === null || value === undefined ? "—" : `${value}${unit}`;
}

function Comparison({
  label,
  previous,
  current,
  unit,
  triggered,
}: {
  label: string;
  previous: number | null | undefined;
  current: number | null | undefined;
  unit: string;
  triggered: boolean;
}) {
  const missingPrevious = previous === null || previous === undefined;
  const decreasing = !missingPrevious && current !== null && current! < previous!;
  const Icon = decreasing ? ArrowDownRight : ArrowUpRight;

  return (
    <div className={`flex items-center justify-between gap-3 border-t px-3 py-2 ${triggered ? "border-amber-200 bg-amber-50/70" : "border-[#E8EAEE]"}`}>
      <span className="text-[11px] font-semibold uppercase text-[#5C616B]">{label}</span>
      <span className={`inline-flex items-center gap-1 font-mono text-xs tabular-nums ${triggered ? "font-semibold text-[#854D0E]" : "text-[#17191D]"}`}>
        {missingPrevious ? "Previous reading unavailable" : value(previous, unit)}
        {!missingPrevious && <Icon className="h-3.5 w-3.5" aria-hidden />}
        <span>{value(current, unit)}</span>
      </span>
    </div>
  );
}

export function LiveSituationOverview({ summary }: { summary: DashboardSummary }) {
  const critical = summary.attention.filter(({ patient }) => patient.boardPriority.code === "critical").length;
  const urgent = summary.attention.filter(({ patient }) => patient.boardPriority.code === "urgent").length;

  return (
    <section aria-label="Live situation overview" className="border-y border-[#D9DED8] bg-white">
      <div className="grid grid-cols-2 divide-x divide-y divide-[#E8EAEE] sm:grid-cols-3 lg:grid-cols-5 lg:divide-y-0">
        {[
          { label: "Patients", value: summary.totalPatients, filter: "all", colour: "text-[#202522]" },
          { label: "Critical review", value: critical, filter: "critical", colour: "text-[#C62828]" },
          { label: "Urgent review", value: urgent, filter: "urgent", colour: "text-[#D97706]" },
          { label: "Active alerts", value: summary.activeAlerts, filter: "reassessment", colour: "text-[#C62828]" },
          { label: "Awaiting observation", value: summary.awaitingObservation, filter: "awaiting", colour: "text-[#69736C]" },
        ].map((item) => (
        <Link key={item.label} href={item.filter === "all" ? "/" : `/?filter=${item.filter}`} className="min-h-11 px-3 py-2 hover:bg-[#F1F3F0]">
            <span className="block text-[9px] font-semibold uppercase tracking-wide text-[#69736C]">{item.label}</span>
            <span className={`mt-0.5 block font-mono text-lg font-semibold tabular-nums ${item.colour}`}>{String(item.value).padStart(2, "0")}</span>
          </Link>
        ))}
      </div>

      <div className="grid border-t border-[#D9DED8] lg:grid-cols-[auto_1fr]">
          <h2 className="px-3 py-2 text-xs font-semibold">Needs Attention <span className="ml-1 font-mono text-[#69736C]">{String(summary.attention.length).padStart(2, "0")}</span></h2>
          {summary.attention.length > 0 ? <div className="divide-y divide-[#E8EAEE] lg:divide-y-0 lg:divide-x">
            {summary.attention.map(({ patient, alert, decision, history }) => {
              const triggered = new Set(alert.triggeredRules.map((rule) => rule.id));
              return (
                <article key={alert.id} className="border-l-4 border-[#C62828] bg-[#FCE8E8]/35 px-3 py-2 lg:inline-block lg:w-full">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <Link href={`/patients/${patient.id}#alert-${alert.id}`} className="text-sm font-semibold hover:underline">{patient.id} · {patient.displayName}</Link>
                        <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-[#B42318]">Reassessment flagged · {patient.boardPriority.label}</p>
                      </div>
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] text-[#5C616B]"><Clock3 className="h-3 w-3" aria-hidden />{formatTime(alert.createdAt)} IST</span>
                    </div>
                    <div className="mt-2 grid max-w-xl grid-cols-1 border border-[#E8EAEE] bg-white sm:grid-cols-2">
                      <Comparison label="RR" previous={alert.previousValues.respiratoryRate} current={alert.currentValues.respiratoryRate} unit=" breaths/min" triggered={triggered.has("rr_increase_8")} />
                      <Comparison label="Systolic BP" previous={alert.previousValues.systolicBloodPressure} current={alert.currentValues.systolicBloodPressure} unit=" mmHg" triggered={triggered.has("sbp_decrease_25")} />
                    </div>
                    <details className="mt-2 max-w-2xl text-xs">
                      <summary className="flex min-h-11 cursor-pointer items-center font-semibold text-[#174D3A]">Why this rule fired · illustrative and unvalidated</summary>
                      <div className="mt-2 space-y-2 border-l border-[#D8DBE0] pl-3">
                        <p>{alert.explanation}</p>
                        <p>Measured observations: previous {formatTime(alert.previousObservedAt)} and current {formatTime(alert.currentObservedAt)} IST.</p>
                        {alert.triggeredRules.map((rule) => <p key={rule.id}><strong>{rule.name}:</strong> {rule.previousValue} → {rule.currentValue} {rule.unit} (change {rule.absoluteChange}; configured threshold ≥ {rule.threshold}). {rule.description}</p>)}
                        <p>Review status: {alert.status}{decision ? ` · ${decision.action} by ${decision.actor}${decision.rationale ? ` · ${decision.rationale}` : ""}` : ""}. These configured demonstration rules are not clinically validated.</p>
                        {history.map((item) => (
                          <p key={`${alert.id}-${item.title}`}><strong>Historical record: {item.title}</strong> · {item.summary} {item.relevanceExplanation}</p>
                        ))}
                      </div>
                    </details>
                    <Link href={`/patients/${patient.id}#alert-${alert.id}`} className="mt-2 inline-flex text-xs font-semibold text-[#174D3A] underline underline-offset-2">Review patient and alert</Link>
                </article>
              );
            })}
          </div> : <p className="px-3 py-2 text-xs text-[#69736C]">No active alerts in the configured demonstration rules.</p>}
      </div>
    </section>
  );
}

export function RecentEvents({ events }: { events: DashboardEvent[] }) {
  const [showAllEvents, setShowAllEvents] = useState(false);
  return (
    <section aria-labelledby="events-heading" className="border-t border-[#D9DED8] pt-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="events-heading" className="text-xs font-semibold">Recent Events</h2>
        <span className="text-[9px] uppercase tracking-wide text-[#69736C]">Asia/Kolkata</span>
      </div>
      {events.length === 0 ? <p className="mt-2 text-xs text-[#69736C]">No observations or decisions recorded.</p> : (
        <ol className="mt-2 divide-y divide-[#E8EAEE] border-y border-[#E8EAEE] sm:grid sm:grid-cols-2 sm:divide-x sm:divide-y-0">
          {events.slice(0, showAllEvents ? 12 : 4).map((event) => (
            <li key={event.id}>
              <Link href={`/patients/${event.patientId}${event.alertId ? `#alert-${event.alertId}` : ""}`} className="grid min-h-11 w-full grid-cols-[44px_1fr] items-center gap-2 px-2 py-2 text-left hover:bg-[#F7F8FA]">
                <time className="font-mono text-[10px] text-[#69736C]">{formatTime(event.timestamp)}</time>
                <span className="min-w-0 truncate text-[10px]"><strong>{event.patientName} · {event.patientId}</strong><span className="ml-1">{event.title}</span><span className="ml-1 text-[#69736C]">{event.detail}</span></span>
              </Link>
            </li>
          ))}
        </ol>
      )}
      {events.length > 4 && <button type="button" onClick={() => setShowAllEvents((shown) => !shown)} className="mt-1 inline-flex min-h-11 touch-manipulation items-center text-xs font-semibold text-[#23483B] underline" aria-expanded={showAllEvents}>{showAllEvents ? "Show fewer" : "Show recent activity"}</button>}
    </section>
  );
}