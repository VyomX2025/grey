import { DEMONSTRATION_RULES } from "./rules-config";
import type {
  Alert,
  TriggeredRule,
  VitalObservation,
  VitalSnapshot,
} from "./types";

function toSnapshot(obs: VitalObservation): VitalSnapshot {
  return {
    heartRate: obs.heartRate,
    respiratoryRate: obs.respiratoryRate,
    systolicBloodPressure: obs.systolicBloodPressure,
    diastolicBloodPressure: obs.diastolicBloodPressure,
    oxygenSaturation: obs.oxygenSaturation,
    temperature: obs.temperature,
  };
}

function evaluateRulePair(
  previous: VitalObservation,
  current: VitalObservation
): TriggeredRule[] {
  if (previous.patientId !== current.patientId) {
    throw new Error(
      "Cannot compare observations from different patients in the demonstration rules engine."
    );
  }

  const triggered: TriggeredRule[] = [];

  for (const rule of DEMONSTRATION_RULES) {
    const prevVal = previous[rule.vitalKey];
    const currVal = current[rule.vitalKey];

    // Missing values are never treated as normal — skip the rule.
    if (prevVal === null || currVal === null) {
      continue;
    }

    const absoluteChange = Math.abs(currVal - prevVal);
    const directionOk =
      rule.direction === "increase"
        ? currVal > prevVal
        : currVal < prevVal;

    if (directionOk && absoluteChange >= rule.absoluteThreshold) {
      triggered.push({
        id: rule.id,
        name: rule.name,
        description: rule.description,
        previousValue: prevVal,
        currentValue: currVal,
        absoluteChange,
        threshold: rule.absoluteThreshold,
        unit: rule.unit,
      });
    }
  }

  return triggered;
}

export function buildExplanation(
  triggeredRules: TriggeredRule[],
  previousObservedAt: string,
  currentObservedAt: string
): string {
  if (triggeredRules.length === 0) {
    return "";
  }

  const changeParts = triggeredRules.map((r) => {
    const verb = r.currentValue > r.previousValue ? "increased" : "decreased";
    return `${r.name} ${verb} from ${r.previousValue} to ${r.currentValue} ${r.unit} (absolute change ${r.absoluteChange} ${r.unit}; demonstration threshold ≥ ${r.threshold} ${r.unit}).`;
  });

  // Prefer human-readable narrative for the primary demo scenario.
  const rr = triggeredRules.find((r) => r.id === "rr_increase_8");
  const sbp = triggeredRules.find((r) => r.id === "sbp_decrease_25");

  let narrative = "";
  if (rr && sbp) {
    narrative =
      `Respiratory rate increased from ${rr.previousValue} to ${rr.currentValue} breaths/min. ` +
      `Systolic blood pressure decreased from ${sbp.previousValue} to ${sbp.currentValue} mmHg. ` +
      `Both configured demonstration rules were triggered. `;
  } else if (rr) {
    narrative = `Respiratory rate increased from ${rr.previousValue} to ${rr.currentValue} breaths/min. The configured demonstration rule was triggered. `;
  } else if (sbp) {
    narrative = `Systolic blood pressure decreased from ${sbp.previousValue} to ${sbp.currentValue} mmHg. The configured demonstration rule was triggered. `;
  } else {
    narrative = `Configured demonstration rules were triggered. `;
  }

  const ruleNames = triggeredRules.map((r) => r.id).join(", ");

  return (
    `${narrative}` +
    `Previous observation: ${previousObservedAt}. Current observation: ${currentObservedAt}. ` +
    `Rules: ${ruleNames}. ${changeParts.join(" ")} ` +
    `These thresholds are illustrative and unvalidated — not for clinical use.`
  );
}

export function alertFingerprint(
  patientId: string,
  previousObsId: string,
  currentObsId: string,
  ruleIds: string[]
): string {
  const rules = [...ruleIds].sort().join("+");
  return `ALERT-${patientId}-${previousObsId}-${currentObsId}-${rules}`;
}

/**
 * Compare two consecutive observations for the same patient.
 * Returns null when no configured demonstration rule is triggered.
 */
export function evaluateObservationPair(
  previous: VitalObservation,
  current: VitalObservation,
  existingAlerts: Alert[] = []
): Alert | null {
  if (previous.patientId !== current.patientId) {
    throw new Error(
      "Cannot compare observations from different patients in the demonstration rules engine."
    );
  }

  const triggeredRules = evaluateRulePair(previous, current);
  if (triggeredRules.length === 0) {
    return null;
  }

  const id = alertFingerprint(
    previous.patientId,
    previous.id,
    current.id,
    triggeredRules.map((r) => r.id)
  );

  // Avoid duplicate active (or any) alerts for the same observation pair + rules.
  if (existingAlerts.some((a) => a.id === id)) {
    return null;
  }

  return {
    id,
    patientId: previous.patientId,
    createdAt: current.observedAt,
    status: "active",
    severityLabel: "demonstration_review",
    triggeringObservationIds: [previous.id, current.id],
    triggeredRules,
    explanation: buildExplanation(
      triggeredRules,
      previous.observedAt,
      current.observedAt
    ),
    previousValues: toSnapshot(previous),
    currentValues: toSnapshot(current),
    previousObservedAt: previous.observedAt,
    currentObservedAt: current.observedAt,
    synthetic: true,
  };
}

/**
 * Sort observations for a patient and evaluate each consecutive pair.
 * Returns newly created alerts only (skips duplicates already in existingAlerts).
 */
export function evaluatePatientObservations(
  observations: VitalObservation[],
  existingAlerts: Alert[] = []
): Alert[] {
  const byPatient = new Map<string, VitalObservation[]>();
  for (const obs of observations) {
    const list = byPatient.get(obs.patientId) ?? [];
    list.push(obs);
    byPatient.set(obs.patientId, list);
  }

  const newAlerts: Alert[] = [];
  const known = [...existingAlerts];

  for (const [, list] of byPatient) {
    const sorted = [...list].sort(
      (a, b) =>
        new Date(a.observedAt).getTime() - new Date(b.observedAt).getTime()
    );
    for (let i = 1; i < sorted.length; i++) {
      const alert = evaluateObservationPair(sorted[i - 1], sorted[i], [
        ...known,
        ...newAlerts,
      ]);
      if (alert) {
        newAlerts.push(alert);
      }
    }
  }

  return newAlerts;
}

/** Exported for unit tests — evaluates rules without wrapping in Alert. */
export function detectTriggeredRules(
  previous: VitalObservation,
  current: VitalObservation
): TriggeredRule[] {
  return evaluateRulePair(previous, current);
}
