import type { BoardPriority } from "./status";
import type {
  Alert,
  DecisionLogEntry,
  Patient,
  VitalObservation,
} from "./types";

export interface BoardPatient extends Patient {
  latestObservation: VitalObservation | null;
  previousObservation: VitalObservation | null;
  activeAlertCount: number;
  alertStatuses: string[];
  triggeredRuleIds: string[];
  lastAlertAt: string | null;
  boardPriority: BoardPriority;
  remainingScripted: number;
}

export interface DashboardAttentionItem {
  patient: BoardPatient;
  alert: Alert;
  decision: DecisionLogEntry | null;
  history: {
    title: string;
    summary: string;
    relevanceExplanation: string;
    recordedAt: string;
  }[];
}

export interface DashboardEvent {
  id: string;
  patientId: string;
  patientName: string;
  timestamp: string;
  kind: "observation" | "alert" | "decision";
  title: string;
  detail: string;
  alertId?: string;
}

export interface DashboardSummary {
  totalPatients: number;
  critical: number;
  urgent: number;
  priorityReview: number;
  stable: number;
  activeAlerts: number;
  reviewNeeded: number;
  awaitingObservation: number;
  missingData: number;
  demoNowIso: string;
  patients: BoardPatient[];
  attention: DashboardAttentionItem[];
  recentEvents: DashboardEvent[];
}

export type BoardFilter =
  | "all"
  | "critical"
  | "urgent"
  | "stable"
  | "awaiting"
  | "missing"
  | "reassessment";
