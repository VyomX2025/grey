/**
 * Single source of truth for demonstration board priority / workflow status.
 *
 * Board colours are illustrative UI categories — not validated clinical triage,
 * and separate from the patient's initial synthetic ESI value.
 */

import type { Alert, DemonstrationStatus, VitalObservation } from "./types";

export type BoardPriorityCode =
  | "critical"
  | "urgent"
  | "priority"
  | "stable"
  | "incomplete";

export interface BoardPriority {
  code: BoardPriorityCode;
  /** RED / AMBER / YELLOW / GREEN / GREY */
  colour: "red" | "amber" | "yellow" | "green" | "grey";
  label: string;
  shortLabel: string;
  /** Mapped demonstration workflow status stored on the patient */
  status: DemonstrationStatus;
}

export function observationHasMissing(obs: VitalObservation | null): boolean {
  if (!obs) return true;
  return (
    obs.heartRate === null ||
    obs.respiratoryRate === null ||
    obs.systolicBloodPressure === null ||
    obs.diastolicBloodPressure === null ||
    obs.oxygenSaturation === null ||
    obs.temperature === null
  );
}

/**
 * Derive board priority from alerts + observations.
 * Precedence:
 * 1. Active alert → critical (both RR+SBP) or urgent (any other active alert)
 * 2. Confirmed / overridden alert on latest observation pair → priority review
 *    (never silently shown as clinically "stable")
 * 3. Missing essential observation → incomplete
 * 4. Awaiting scripted observation → incomplete / awaiting
 * 5. Otherwise stable
 */
export function deriveBoardPriority(params: {
  alerts: Alert[];
  latestObservation: VitalObservation | null;
  awaitingScriptedObservation: boolean;
}): BoardPriority {
  const { alerts, latestObservation, awaitingScriptedObservation } = params;

  const active = alerts.filter((a) => a.status === "active");
  if (active.length > 0) {
    const mostSevere = active.find((a) => {
      const ids = new Set(a.triggeredRules.map((r) => r.id));
      return ids.has("rr_increase_8") && ids.has("sbp_decrease_25");
    });
    if (mostSevere) {
      return {
        code: "critical",
        colour: "red",
        label: "Critical review",
        shortLabel: "CRITICAL",
        status: "review_needed",
      };
    }
    return {
      code: "urgent",
      colour: "amber",
      label: "Urgent review",
      shortLabel: "URGENT",
      status: "review_needed",
    };
  }

  if (latestObservation && observationHasMissing(latestObservation)) {
    return {
      code: "incomplete",
      colour: "grey",
      label: "Missing data",
      shortLabel: "MISSING DATA",
      status: "missing_data",
    };
  }

  // A decision records review, not recovery. Keep the latest resolved event in
  // the workflow status until an explicit recovery state is modeled.
  const resolved = alerts.filter(
    (a) => a.status === "confirmed" || a.status === "overridden"
  );
  if (resolved.length > 0) {
    const latestResolved = [...resolved].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];
    if (latestResolved.status === "confirmed") {
      return {
        code: "priority",
        colour: "yellow",
        label: "Review acknowledged",
        shortLabel: "ACKNOWLEDGED",
        status: "alert_acknowledged",
      };
    }
    return {
      code: "priority",
      colour: "yellow",
      label: "Review overridden",
      shortLabel: "OVERRIDDEN",
      status: "alert_overridden",
    };
  }

  if (awaitingScriptedObservation) {
    return {
      code: "incomplete",
      colour: "grey",
      label: "Awaiting observation",
      shortLabel: "AWAITING OBS",
      status: "awaiting_observation",
    };
  }

  if (!latestObservation) {
    return {
      code: "incomplete",
      colour: "grey",
      label: "Missing data",
      shortLabel: "MISSING DATA",
      status: "missing_data",
    };
  }

  return {
    code: "stable",
    colour: "green",
    label: "Stable",
    shortLabel: "STABLE",
    status: "stable",
  };
}

export function boardPriorityFromStatus(
  status: DemonstrationStatus
): BoardPriority {
  switch (status) {
    case "review_needed":
      return {
        code: "urgent",
        colour: "amber",
        label: "Urgent review",
        shortLabel: "URGENT",
        status,
      };
    case "alert_acknowledged":
      return {
        code: "priority",
        colour: "yellow",
        label: "Review acknowledged",
        shortLabel: "ACKNOWLEDGED",
        status,
      };
    case "alert_overridden":
      return {
        code: "priority",
        colour: "yellow",
        label: "Review overridden",
        shortLabel: "OVERRIDDEN",
        status,
      };
    case "missing_data":
      return {
        code: "incomplete",
        colour: "grey",
        label: "Missing data",
        shortLabel: "MISSING DATA",
        status,
      };
    case "awaiting_observation":
      return {
        code: "incomplete",
        colour: "grey",
        label: "Awaiting observation",
        shortLabel: "AWAITING OBS",
        status,
      };
    case "stable":
    default:
      return {
        code: "stable",
        colour: "green",
        label: "Stable",
        shortLabel: "STABLE",
        status: "stable",
      };
  }
}
