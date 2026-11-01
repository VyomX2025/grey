import { DEMO_ACTOR } from "./rules-config";
import type {
  Alert,
  AlertStatus,
  DecisionLogEntry,
  VitalObservation,
} from "./types";

export class ClinicianActionError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "ClinicianActionError";
    this.status = status;
  }
}

export interface ActionResult {
  alert: Alert;
  decision: DecisionLogEntry;
  /** Snapshot proving observations were not mutated */
  observationsUnchanged: VitalObservation[];
}

function assertAlertMutable(alert: Alert): void {
  if (alert.status !== "active") {
    throw new ClinicianActionError(
      `Alert ${alert.id} is already ${alert.status} and cannot accept another decision.`,
      409
    );
  }
}

export function confirmAlert(params: {
  alert: Alert;
  patientId: string;
  observations: VitalObservation[];
  actor?: string;
  now?: string;
}): ActionResult {
  const { alert, patientId, observations } = params;
  if (alert.patientId !== patientId) {
    throw new ClinicianActionError("Alert does not belong to this patient.", 404);
  }
  assertAlertMutable(alert);

  const previousAlertStatus: AlertStatus = alert.status;
  const updated: Alert = { ...alert, status: "confirmed" };
  const decision: DecisionLogEntry = {
    id: `DEC-${alert.id}-confirm`,
    patientId,
    alertId: alert.id,
    action: "confirm",
    actor: params.actor?.trim() || DEMO_ACTOR,
    timestamp: params.now ?? new Date().toISOString(),
    rationale: null,
    previousAlertStatus,
    newAlertStatus: "confirmed",
    synthetic: true,
  };

  return {
    alert: updated,
    decision,
    observationsUnchanged: observations.map((o) => ({ ...o })),
  };
}

export function overrideAlert(params: {
  alert: Alert;
  patientId: string;
  observations: VitalObservation[];
  rationale: string;
  actor?: string;
  now?: string;
}): ActionResult {
  const { alert, patientId, observations } = params;
  if (alert.patientId !== patientId) {
    throw new ClinicianActionError("Alert does not belong to this patient.", 404);
  }
  assertAlertMutable(alert);

  const rationale = params.rationale?.trim() ?? "";
  if (!rationale) {
    throw new ClinicianActionError(
      "A nonempty rationale is required to override an alert.",
      400
    );
  }

  const previousAlertStatus: AlertStatus = alert.status;
  const updated: Alert = { ...alert, status: "overridden" };
  const decision: DecisionLogEntry = {
    id: `DEC-${alert.id}-override`,
    patientId,
    alertId: alert.id,
    action: "override",
    actor: params.actor?.trim() || DEMO_ACTOR,
    timestamp: params.now ?? new Date().toISOString(),
    rationale,
    previousAlertStatus,
    newAlertStatus: "overridden",
    synthetic: true,
  };

  return {
    alert: updated,
    decision,
    observationsUnchanged: observations.map((o) => ({ ...o })),
  };
}
