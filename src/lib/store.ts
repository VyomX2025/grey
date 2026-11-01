import {
  ClinicianActionError,
  confirmAlert,
  overrideAlert,
} from "./clinician-actions";
import { assembleRelevantHistory } from "./historical-assembly";
import { DEMO_FEED_INTERVAL_MS } from "./demo-feed";
import { evaluateObservationPair } from "./rules-engine";
import { createInitialStore } from "./seed";
import { deriveBoardPriority, type BoardPriority } from "./status";
import type {
  Alert,
  DecisionLogEntry,
  DemoStore,
  DemonstrationStatus,
  Patient,
  VitalObservation,
} from "./types";

/**
 * In-memory demonstration store.
 * Survives while the Node process is alive (local `next dev` / `next start`).
 * On serverless platforms, cold starts reset to seed — use Reset Demo / localStorage sync.
 */
let store: DemoStore = createInitialStore();
let lastAutomaticFeedAt = 0;

export function getStore(): DemoStore {
  return store;
}

export function resetStore(): DemoStore {
  store = createInitialStore();
  lastAutomaticFeedAt = 0;
  return store;
}

/** Replace store (used when hydrating from client localStorage). */
export function replaceStore(next: DemoStore): DemoStore {
  store = next;
  return store;
}

function observationsFor(patientId: string): VitalObservation[] {
  return store.observations
    .filter((o) => o.patientId === patientId)
    .sort(
      (a, b) =>
        new Date(a.observedAt).getTime() - new Date(b.observedAt).getTime()
    );
}

function latestObservation(patientId: string): VitalObservation | null {
  const list = observationsFor(patientId);
  return list.length ? list[list.length - 1] : null;
}

function isAwaitingScripted(patientId: string): boolean {
  const cursor = store.simulationCursor[patientId] ?? 0;
  const sequence = store.scriptedSequences[patientId] ?? [];
  const patient = store.patients.find((candidate) => candidate.id === patientId);
  return patient?.awaitingObservation === true && cursor < sequence.length;
}

export function getBoardPriority(patientId: string): BoardPriority {
  const latest = latestObservation(patientId);
  const alerts = store.alerts.filter((a) => a.patientId === patientId);
  return deriveBoardPriority({
    alerts,
    latestObservation: latest,
    awaitingScriptedObservation: isAwaitingScripted(patientId),
  });
}

function recomputePatientStatus(patientId: string): void {
  const patient = store.patients.find((p) => p.id === patientId);
  if (!patient) return;
  const priority = getBoardPriority(patientId);
  patient.currentStatus = priority.status;
}

export function listPatients(): Patient[] {
  for (const p of store.patients) {
    recomputePatientStatus(p.id);
  }
  return store.patients;
}

export function getPatient(patientId: string): Patient | null {
  const p = store.patients.find((x) => x.id === patientId) ?? null;
  if (p) recomputePatientStatus(patientId);
  return p;
}

export function getObservations(patientId: string): VitalObservation[] {
  return observationsFor(patientId);
}

export function getAlerts(patientId: string): Alert[] {
  return store.alerts
    .filter((a) => a.patientId === patientId)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}

export function getDecisions(patientId: string): DecisionLogEntry[] {
  return store.decisions
    .filter((d) => d.patientId === patientId)
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
}

export function getHistory(patientId: string) {
  const latest = latestObservation(patientId);
  const alerts = getAlerts(patientId);
  return assembleRelevantHistory(store.historicalRecords, {
    patientId,
    latestObservation: latest,
    activeAlerts: alerts,
  });
}

export function getSource(patientId: string, sourceId: string) {
  const related = store.historicalRecords.some(
    (r) => r.patientId === patientId && r.sourceId === sourceId
  );
  const source = store.sourceRecords.find((s) => s.id === sourceId);
  if (!source || !related) return null;
  return source;
}

export function getDashboardSummary() {
  const patients = listPatients();
  const rows = patients.map((p) => {
    const observations = observationsFor(p.id);
    const latest = observations[observations.length - 1] ?? null;
    const alerts = getAlerts(p.id);
    const boardPriority = getBoardPriority(p.id);
    return {
      ...p,
      currentStatus: boardPriority.status,
      latestObservation: latest,
      previousObservation: observations[observations.length - 2] ?? null,
      activeAlertCount: alerts.filter((a) => a.status === "active").length,
      alertStatuses: alerts.map((a) => a.status),
      triggeredRuleIds: [...new Set(alerts.flatMap((alert) => alert.triggeredRules.map((rule) => rule.id)))],
      lastAlertAt: alerts[0]?.createdAt ?? null,
      boardPriority,
      remainingScripted:
        (store.scriptedSequences[p.id]?.length ?? 0) -
        (store.simulationCursor[p.id] ?? 0),
    };
  });

  const demoNowIso = store.observations.reduce((latest, o) => {
    return o.observedAt > latest ? o.observedAt : latest;
  }, patients[0]?.arrivalAt ?? new Date().toISOString());

  const attention = rows.flatMap((patient) =>
    getAlerts(patient.id)
      .filter((alert) => alert.status === "active")
      .map((alert) => ({
        patient,
        alert,
        decision:
          getDecisions(patient.id).find((entry) => entry.alertId === alert.id) ??
          null,
        history: assembleRelevantHistory(store.historicalRecords, {
          patientId: patient.id,
          latestObservation: patient.latestObservation,
          activeAlerts: [alert],
        }).map(({ record, relevanceExplanation }) => ({
          title: record.title,
          summary: record.summary,
          relevanceExplanation,
          recordedAt: record.recordedAt,
        })),
      }))
  );

  const recentEvents = [
    ...store.observations.map((observation) => ({
      id: observation.id,
      patientId: observation.patientId,
      patientName: store.patients.find((p) => p.id === observation.patientId)?.displayName ?? observation.patientId,
      timestamp: observation.observedAt,
      kind: "observation" as const,
      title: "Observation recorded",
      detail: `${store.patients.find((p) => p.id === observation.patientId)?.displayName ?? observation.patientId} · ${observation.source} synthetic observation`,
    })),
    ...store.alerts.flatMap((alert) =>
      alert.triggeredRules.map((rule) => ({
        id: `${alert.id}-${rule.id}`,
        patientId: alert.patientId,
        patientName: store.patients.find((p) => p.id === alert.patientId)?.displayName ?? alert.patientId,
        timestamp: alert.createdAt,
        kind: "alert" as const,
        title: `${rule.name} rule triggered`,
        detail: `${rule.previousValue} → ${rule.currentValue} ${rule.unit} · ${alert.status} · illustrative rule`,
        alertId: alert.id,
      }))
    ),
    ...store.decisions.map((decision) => ({
      id: decision.id,
      patientId: decision.patientId,
      patientName: store.patients.find((p) => p.id === decision.patientId)?.displayName ?? decision.patientId,
      timestamp: decision.timestamp,
      kind: "decision" as const,
      title: `Alert ${decision.action === "confirm" ? "confirmed" : "overridden"}`,
      detail: `${decision.actor}${decision.rationale ? ` · ${decision.rationale}` : ""}`,
      alertId: decision.alertId,
    })),
  ].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return {
    totalPatients: rows.length,
    critical: rows.filter((p) => p.boardPriority.code === "critical").length,
    urgent: rows.filter((p) => p.boardPriority.code === "urgent").length,
    priorityReview: rows.filter((p) => p.boardPriority.code === "priority").length,
    stable: rows.filter((p) => p.boardPriority.code === "stable").length,
    activeAlerts: store.alerts.filter((a) => a.status === "active").length,
    reviewNeeded: rows.filter((p) => p.currentStatus === "review_needed")
      .length,
    awaitingObservation: rows.filter(
      (p) => p.currentStatus === "awaiting_observation"
    ).length,
    missingData: rows.filter((p) => p.currentStatus === "missing_data").length,
    demoNowIso,
    patients: rows.sort((a, b) => {
      const priorityOrder = { critical: 0, urgent: 1, priority: 2, incomplete: 3, stable: 4 };
      return priorityOrder[a.boardPriority.code] - priorityOrder[b.boardPriority.code] ||
        (b.lastAlertAt ?? "").localeCompare(a.lastAlertAt ?? "") ||
        a.arrivalAt.localeCompare(b.arrivalAt);
    }),
    attention: attention.sort(
      (a, b) => new Date(b.alert.createdAt).getTime() - new Date(a.alert.createdAt).getTime()
    ),
    recentEvents: recentEvents.slice(0, 30),
  };
}

export function getPatientReview(patientId: string) {
  const patient = getDashboardSummary().patients.find((candidate) => candidate.id === patientId);
  if (!patient) return null;
  return {
    patient,
    observations: observationsFor(patientId),
    alerts: getAlerts(patientId),
    decisions: getDecisions(patientId),
  };
}

export function simulateNext(patientId: string) {
  const patient = getPatient(patientId);
  if (!patient) {
    throw new ClinicianActionError(`Unknown patient: ${patientId}`, 404);
  }

  const cursor = store.simulationCursor[patientId] ?? 0;
  const sequence = store.scriptedSequences[patientId] ?? [];
  if (cursor >= sequence.length) {
    throw new ClinicianActionError(
      "No further scripted synthetic observations are available for this patient.",
      400
    );
  }

  const scripted = sequence[cursor];
  const prior = observationsFor(patientId);
  const last = prior[prior.length - 1];
  const baseTime = last
    ? new Date(last.observedAt)
    : new Date(patient.arrivalAt);
  const observedAt = new Date(
    baseTime.getTime() + scripted.offsetMinutes * 60_000
  ).toISOString();

  const newObs: VitalObservation = {
    id: `OBS-${patientId}-SIM-${String(cursor + 1).padStart(3, "0")}`,
    patientId,
    observedAt,
    heartRate: scripted.heartRate,
    respiratoryRate: scripted.respiratoryRate,
    systolicBloodPressure: scripted.systolicBloodPressure,
    diastolicBloodPressure: scripted.diastolicBloodPressure,
    oxygenSaturation: scripted.oxygenSaturation,
    temperature: scripted.temperature,
    source: "simulated",
    synthetic: true,
  };

  store.observations.push(newObs);
  store.simulationCursor[patientId] = cursor + 1;

  let newAlert: Alert | null = null;
  if (last) {
    newAlert = evaluateObservationPair(last, newObs, store.alerts);
    if (newAlert) {
      store.alerts.push(newAlert);
    }
  }

  recomputePatientStatus(patientId);

  return {
    observation: newObs,
    alert: newAlert,
    patient: getPatient(patientId),
    remainingScripted: sequence.length - store.simulationCursor[patientId],
  };
}

export function advanceDemoFeed() {
  const now = Date.now();
  if (now - lastAutomaticFeedAt < DEMO_FEED_INTERVAL_MS) {
    return { advanced: false as const, reason: "interval_guard" as const };
  }

  const patient = store.patients.find((candidate) => {
    const cursor = store.simulationCursor[candidate.id] ?? 0;
    return cursor < (store.scriptedSequences[candidate.id]?.length ?? 0);
  });
  if (!patient) {
    return { advanced: false as const, reason: "exhausted" as const };
  }

  lastAutomaticFeedAt = now;
  return {
    advanced: true as const,
    patientId: patient.id,
    result: simulateNext(patient.id),
  };
}

export function confirmPatientAlert(
  patientId: string,
  alertId: string,
  actor?: string
) {
  const patient = getPatient(patientId);
  if (!patient) {
    throw new ClinicianActionError(`Unknown patient: ${patientId}`, 404);
  }
  const alert = store.alerts.find((a) => a.id === alertId);
  if (!alert || alert.patientId !== patientId) {
    throw new ClinicianActionError(`Unknown alert: ${alertId}`, 404);
  }

  const esiBefore = patient.initialEsi;
  const obsBefore = observationsFor(patientId).map((o) => structuredClone(o));

  const result = confirmAlert({
    alert,
    patientId,
    observations: obsBefore,
    actor,
  });

  const idx = store.alerts.findIndex((a) => a.id === alertId);
  store.alerts[idx] = result.alert;
  store.decisions.push(result.decision);
  recomputePatientStatus(patientId);

  // Guard: ESI and observations must remain unchanged
  const patientAfter = getPatient(patientId)!;
  if (patientAfter.initialEsi !== esiBefore) {
    throw new Error("Invariant violated: ESI changed after confirm.");
  }

  return {
    alert: result.alert,
    decision: result.decision,
    initialEsi: patientAfter.initialEsi,
    observations: observationsFor(patientId),
  };
}

export function overridePatientAlert(
  patientId: string,
  alertId: string,
  rationale: string,
  actor?: string
) {
  const patient = getPatient(patientId);
  if (!patient) {
    throw new ClinicianActionError(`Unknown patient: ${patientId}`, 404);
  }
  const alert = store.alerts.find((a) => a.id === alertId);
  if (!alert || alert.patientId !== patientId) {
    throw new ClinicianActionError(`Unknown alert: ${alertId}`, 404);
  }

  const esiBefore = patient.initialEsi;

  const result = overrideAlert({
    alert,
    patientId,
    observations: observationsFor(patientId),
    rationale,
    actor,
  });

  const idx = store.alerts.findIndex((a) => a.id === alertId);
  store.alerts[idx] = result.alert;
  store.decisions.push(result.decision);
  recomputePatientStatus(patientId);

  const patientAfter = getPatient(patientId)!;
  if (patientAfter.initialEsi !== esiBefore) {
    throw new Error("Invariant violated: ESI changed after override.");
  }

  return {
    alert: result.alert,
    decision: result.decision,
    initialEsi: patientAfter.initialEsi,
    observations: observationsFor(patientId),
  };
}

export type { DemonstrationStatus };
