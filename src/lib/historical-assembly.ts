import type { Alert, HistoricalRecord, VitalObservation } from "./types";

export interface AssembledHistoryItem {
  record: HistoricalRecord;
  relevanceExplanation: string;
  sourceId: string;
}

export interface HistoricalAssemblyContext {
  patientId: string;
  latestObservation?: VitalObservation | null;
  activeAlerts?: Alert[];
}

/**
 * Deterministic Historical Assembly — never invents records.
 * Matches predefined synthetic historical records using tags / simple rules.
 */
export function assembleRelevantHistory(
  allRecords: HistoricalRecord[],
  context: HistoricalAssemblyContext
): AssembledHistoryItem[] {
  const patientRecords = allRecords.filter(
    (r) => r.patientId === context.patientId && r.synthetic === true
  );

  if (patientRecords.length === 0) {
    return [];
  }

  const results: AssembledHistoryItem[] = [];

  for (const record of patientRecords) {
    const tags = new Set(record.relevanceTags.map((t) => t.toLowerCase()));
    let explanation: string | null = null;

    if (record.recordType === "medication" && tags.has("beta-blocker")) {
      explanation =
        'This synthetic medication record is tagged "beta-blocker" in its source. It is included as history only; the tag does not establish a causal link to current observations.';
    } else if (tags.has("heart-rate")) {
      explanation =
        "This synthetic record is tagged with heart-rate context and does not specify a beta-blocker. The tag does not establish a causal link to current observations.";
    } else if (tags.has("blood-pressure")) {
      explanation =
        "This synthetic record is tagged with blood-pressure context. It is included as history only; the tag does not establish a causal link to current observations.";
    } else if (record.recordType === "lab" && (tags.has("lab") || tags.has("renal"))) {
      explanation =
        "Retrieved as a predefined synthetic laboratory record. No causal connection to current observations is asserted.";
    } else if (record.recordType === "allergy" && (tags.has("allergy") || tags.has("medication-safety"))) {
      explanation =
        "Retrieved as a predefined synthetic allergy record for contextual review. No connection to current observations is asserted.";
    } else if (record.recordType === "prior_visit" && (tags.has("prior-visit") || tags.has("cardiac"))) {
      explanation =
        "Retrieved as a predefined synthetic prior-visit record. No causal connection to current observations is asserted.";
    } else if (record.recordType === "note" && tags.has("note")) {
      explanation =
        "Retrieved as a predefined synthetic note for historical context. No causal connection to current observations is asserted.";
    } else if (record.recordType === "medication") {
      explanation =
        "Retrieved as a predefined synthetic medication-history record. No causal connection to current observations is asserted.";
    } else if (tags.has("vitals-context")) {
      explanation =
        "This synthetic record has a vital-sign context tag and is included as historical context only. No causal connection to current observations is asserted.";
    }

    if (explanation) {
      results.push({
        record,
        relevanceExplanation: explanation,
        sourceId: record.sourceId,
      });
    }
  }

  // Stable sort by recordedAt descending
  return results.sort(
    (a, b) =>
      new Date(b.record.recordedAt).getTime() -
      new Date(a.record.recordedAt).getTime()
  );
}
