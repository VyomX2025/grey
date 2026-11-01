/**
 * GREY. domain types — all entities are synthetic demonstration data.
 */

export type Sex = "female" | "male" | "other" | "unspecified";

/**
 * Workflow demonstration status — separate from initial ESI / triage category.
 * - review_needed: active demonstration alert
 * - alert_acknowledged: clinician confirmed; observations unchanged
 * - alert_overridden: clinician overrode with rationale; observations unchanged
 * - missing_data / awaiting_observation: incomplete demonstration data
 * - stable: no active/resolved deterioration alert on current observations
 */
export type DemonstrationStatus =
  | "stable"
  | "review_needed"
  | "alert_acknowledged"
  | "alert_overridden"
  | "awaiting_observation"
  | "missing_data";

export type AlertStatus = "active" | "confirmed" | "overridden";

export type DecisionAction = "confirm" | "override";

export type VitalSource = "monitor" | "manual" | "simulated";

export type HistoricalRecordType =
  | "medication"
  | "allergy"
  | "prior_visit"
  | "lab"
  | "note";

export type SourceType =
  | "emar"
  | "ehr_note"
  | "lab_report"
  | "allergy_list"
  | "visit_summary";

export interface Patient {
  id: string;
  synthetic: true;
  displayName: string;
  age: number;
  sex: Sex;
  arrivalAt: string;
  /** Synthetic demonstration ESI only — not clinically assigned. */
  initialEsi: number;
  currentStatus: DemonstrationStatus;
  assignedArea: string;
  awaitingObservation?: boolean;
  notes?: string;
}

export interface VitalObservation {
  id: string;
  patientId: string;
  observedAt: string;
  heartRate: number | null;
  respiratoryRate: number | null;
  systolicBloodPressure: number | null;
  diastolicBloodPressure: number | null;
  oxygenSaturation: number | null;
  temperature: number | null;
  source: VitalSource;
  synthetic: true;
}

export interface HistoricalRecord {
  id: string;
  patientId: string;
  recordType: HistoricalRecordType;
  title: string;
  summary: string;
  recordedAt: string;
  relevanceTags: string[];
  sourceId: string;
  synthetic: true;
}

export interface SourceRecord {
  id: string;
  title: string;
  sourceType: SourceType;
  recordedAt: string;
  content: string;
  relatedRecordIds: string[];
  synthetic: true;
}

export interface VitalSnapshot {
  heartRate: number | null;
  respiratoryRate: number | null;
  systolicBloodPressure: number | null;
  diastolicBloodPressure: number | null;
  oxygenSaturation: number | null;
  temperature: number | null;
}

export interface TriggeredRule {
  id: string;
  name: string;
  description: string;
  previousValue: number;
  currentValue: number;
  absoluteChange: number;
  threshold: number;
  unit: string;
}

export interface Alert {
  id: string;
  patientId: string;
  createdAt: string;
  status: AlertStatus;
  severityLabel: "demonstration_review";
  triggeringObservationIds: [string, string];
  triggeredRules: TriggeredRule[];
  explanation: string;
  previousValues: VitalSnapshot;
  currentValues: VitalSnapshot;
  previousObservedAt: string;
  currentObservedAt: string;
  synthetic: true;
}

export interface DecisionLogEntry {
  id: string;
  patientId: string;
  alertId: string;
  action: DecisionAction;
  actor: string;
  timestamp: string;
  rationale: string | null;
  previousAlertStatus: AlertStatus;
  newAlertStatus: AlertStatus;
  synthetic: true;
}

/** Scripted next observations for simulate-next (deterministic). */
export interface ScriptedObservation {
  heartRate: number | null;
  respiratoryRate: number | null;
  systolicBloodPressure: number | null;
  diastolicBloodPressure: number | null;
  oxygenSaturation: number | null;
  temperature: number | null;
  /** Minutes after previous observation */
  offsetMinutes: number;
}

export interface DemoStore {
  patients: Patient[];
  observations: VitalObservation[];
  historicalRecords: HistoricalRecord[];
  sourceRecords: SourceRecord[];
  alerts: Alert[];
  decisions: DecisionLogEntry[];
  /** Index into each patient's scripted sequence (next to apply). */
  simulationCursor: Record<string, number>;
  scriptedSequences: Record<string, ScriptedObservation[]>;
}
