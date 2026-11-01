"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowLeft, Play } from "lucide-react";
import { AlertPanel } from "@/components/AlertPanel";
import { AuditLog } from "@/components/AuditLog";
import { HistoryPanel } from "@/components/HistoryPanel";
import { ObservationTimeline } from "@/components/ObservationTimeline";
import { StatusPill } from "@/components/StatusPill";
import { TriageBadge } from "@/components/TriageBadge";
import { VitalValue } from "@/components/VitalValue";
import { VitalsChart } from "@/components/VitalsChart";
import type { AssembledHistoryItem } from "@/lib/historical-assembly";
import { formatSex, formatTs } from "@/lib/format";
import type { BoardPriority } from "@/lib/status";
import type {
  Alert,
  DecisionLogEntry,
  Patient,
  VitalObservation,
} from "@/lib/types";

export function PatientDetailClient({
  patient,
  boardPriority,
  observations,
  alerts,
  decisions,
  history,
  historyEmptyMessage,
  remainingScripted,
  backHref,
}: {
  patient: Patient;
  boardPriority: BoardPriority;
  observations: VitalObservation[];
  alerts: Alert[];
  decisions: DecisionLogEntry[];
  history: AssembledHistoryItem[];
  historyEmptyMessage?: string;
  remainingScripted: number;
  backHref: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedObsId, setSelectedObsId] = useState<string | null>(null);

  const sorted = useMemo(
    () =>
      [...observations].sort(
        (a, b) =>
          new Date(a.observedAt).getTime() - new Date(b.observedAt).getTime()
      ),
    [observations]
  );
  const latest = sorted[sorted.length - 1] ?? null;
  const previous = sorted.length > 1 ? sorted[sorted.length - 2] : null;
  const activeAlert = alerts.find((a) => a.status === "active");
  const triggered = new Set(
    (activeAlert ?? alerts[0])?.triggeredRules.map((r) => r.id) ?? []
  );

  async function simulate() {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/patients/${patient.id}/simulate-next`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Simulation failed");
      if (data.observation?.id) setSelectedObsId(data.observation.id);
      setMessage(
        data.alert
          ? "Scripted synthetic observation added. Demonstration alert triggered."
          : "Scripted synthetic observation added. No demonstration rules triggered."
      );
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Simulation failed");
    } finally {
      setBusy(false);
    }
  }

  async function confirm(alertId: string) {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(
        `/api/patients/${patient.id}/alerts/${encodeURIComponent(alertId)}/confirm`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ actor: "Demo Clinician" }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Confirm failed");
      setMessage(
        `Alert confirmed. ESI remains ${data.initialEsi} (unchanged). Observations unchanged.`
      );
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Confirm failed");
    } finally {
      setBusy(false);
    }
  }

  async function override(alertId: string, rationale: string) {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(
        `/api/patients/${patient.id}/alerts/${encodeURIComponent(alertId)}/override`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rationale, actor: "Demo Clinician" }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Override failed");
      setMessage(
        `Alert overridden. ESI remains ${data.initialEsi} (unchanged). Observations unchanged.`
      );
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Override failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href={backHref}
            className="inline-flex min-h-11 touch-manipulation items-center gap-1 pr-2 text-xs font-semibold uppercase tracking-wide text-[#5C616B] hover:text-[#17191D]"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            Back to board
          </Link>
          <div className="mt-2 flex flex-wrap items-baseline gap-2">
            <h1 className="text-xl font-semibold tracking-tight">
              {patient.displayName}
            </h1>
            <span className="font-mono text-sm text-[#5C616B]">{patient.id}</span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="border border-[#D8DBE0] bg-[#F7F8FA] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide">
              Synthetic patient
            </span>
            <TriageBadge priority={boardPriority} />
            <StatusPill status={patient.currentStatus} />
            {activeAlert && <StatusPill status={activeAlert.status} />}
            <span className="text-xs text-[#5C616B]">
              ESI {patient.initialEsi} (synthetic demonstration value) ·{" "}
              {patient.age} / {formatSex(patient.sex)} · {patient.assignedArea}
              {latest ? ` · latest ${formatTs(latest.observedAt)}` : ""}
            </span>
          </div>
        </div>
        <div className="text-right">
          <button
            type="button"
            onClick={simulate}
            disabled={busy || remainingScripted <= 0}
            className="inline-flex min-h-11 touch-manipulation items-center gap-2 border border-[#17191D] bg-[#17191D] px-3 text-sm font-semibold text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Play className="h-4 w-4" aria-hidden />
            Simulate Next Observation
          </button>
          <p className="mt-1 text-[11px] text-[#5C616B]">
            {remainingScripted > 0
              ? "Adds a scripted synthetic observation"
              : "No further scripted observations"}
          </p>
        </div>
      </div>

      {(message || error) && (
        <div
          className={`border px-3 py-2 text-sm ${
            error
              ? "border-[#F97066] bg-[#FEF3F2] text-[#B42318]"
              : "border-[#75E0A7] bg-[#EDFCF2] text-[#067647]"
          }`}
          role="status"
        >
          {error ?? message}
        </div>
      )}

      <section className="panel p-3" aria-labelledby="latest-vitals">
        <h2 id="latest-vitals" className="text-xs font-semibold uppercase tracking-wide">
          Latest observations
        </h2>
        {latest ? (
          <>
            <p className="mt-1 text-xs text-[#5C616B]">
              Observed {formatTs(latest.observedAt)} · source {latest.source} ·
              synthetic
              {previous && ` · previous ${formatTs(previous.observedAt)}`}
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <VitalValue
                label="Heart rate"
                value={latest.heartRate}
                unit="bpm"
                previous={previous?.heartRate}
                timestamp={formatTs(latest.observedAt)}
              />
              <VitalValue
                label="Respiratory rate"
                value={latest.respiratoryRate}
                unit="breaths/min"
                previous={previous?.respiratoryRate}
                timestamp={formatTs(latest.observedAt)}
                highlight={triggered.has("rr_increase_8")}
              />
              <VitalValue
                label="Systolic BP"
                value={latest.systolicBloodPressure}
                unit="mmHg"
                previous={previous?.systolicBloodPressure}
                timestamp={formatTs(latest.observedAt)}
                highlight={triggered.has("sbp_decrease_25")}
              />
              <VitalValue
                label="Diastolic BP"
                value={latest.diastolicBloodPressure}
                unit="mmHg"
                previous={previous?.diastolicBloodPressure}
                timestamp={formatTs(latest.observedAt)}
              />
              <VitalValue
                label="Oxygen saturation"
                value={latest.oxygenSaturation}
                unit="%"
                previous={previous?.oxygenSaturation}
                timestamp={formatTs(latest.observedAt)}
              />
              <VitalValue
                label="Temperature"
                value={latest.temperature}
                unit="°C"
                digits={1}
                previous={previous?.temperature}
                timestamp={formatTs(latest.observedAt)}
              />
            </div>
          </>
        ) : (
          <p className="mt-2 text-sm text-[#5C616B]">No observations recorded.</p>
        )}
      </section>

      <section className="panel p-3" aria-labelledby="timeline">
        <h2 id="timeline" className="text-xs font-semibold uppercase tracking-wide">
          Observation timeline
        </h2>
        <div className="mt-3">
          <VitalsChart observations={sorted} alerts={alerts} selectedId={selectedObsId} />
        </div>
        <div className="mt-3">
          <ObservationTimeline
            observations={sorted}
            alerts={alerts}
            selectedId={selectedObsId}
            onSelect={setSelectedObsId}
          />
        </div>
      </section>

      <section className="space-y-3" aria-labelledby="alerts-heading">
        <h2 id="alerts-heading" className="text-xs font-semibold uppercase tracking-wide">
          Demonstration alerts
        </h2>
        {alerts.length === 0 ? (
          <p className="text-sm text-[#5C616B]">
            No demonstration alerts for this patient. Configured rules have not
            been triggered by consecutive synthetic observations.
          </p>
        ) : (
          alerts.map((alert) => (
            <AlertPanel
              key={alert.id}
              alert={alert}
              busy={busy}
              onConfirm={() => confirm(alert.id)}
              onOverride={(rationale) => override(alert.id, rationale)}
              onJumpToObservation={(id) => setSelectedObsId(id)}
            />
          ))
        )}
      </section>

      <section className="panel p-3" aria-labelledby="history-heading">
        <h2 id="history-heading" className="text-xs font-semibold uppercase tracking-wide">
          Historical Assembly
        </h2>
        <p className="mt-1 text-xs text-[#5C616B]">
          Predefined synthetic records only. Contextual information — not a
          diagnosis.
        </p>
        <div className="mt-3">
          <HistoryPanel
            patientId={patient.id}
            items={history}
            emptyMessage={historyEmptyMessage}
          />
        </div>
      </section>

      <section className="panel p-3" aria-labelledby="audit-heading">
        <h2 id="audit-heading" className="text-xs font-semibold uppercase tracking-wide">
          Decision audit log
        </h2>
        <p className="mt-1 text-xs text-[#5C616B]">
          Actor identity is a demo label (Demo Clinician). No authentication in
          this prototype.
        </p>
        <div className="mt-3">
          <AuditLog decisions={decisions} />
        </div>
      </section>
    </div>
  );
}
