import { describe, expect, it } from "vitest";
import { assembleRelevantHistory } from "./historical-assembly";
import { historicalRecords, sourceRecords } from "./seed";
import type { Alert } from "./types";

describe("historical assembly", () => {
  it("returns relevant records for P001 with explanations and valid sources", () => {
    const items = assembleRelevantHistory(historicalRecords, {
      patientId: "P001",
      latestObservation: {
        id: "OBS-P001-001",
        patientId: "P001",
        observedAt: "2026-10-28T08:00:00.000Z",
        heartRate: 82,
        respiratoryRate: 14,
        systolicBloodPressure: 130,
        diastolicBloodPressure: 82,
        oxygenSaturation: 98,
        temperature: 36.8,
        source: "monitor",
        synthetic: true,
      },
      activeAlerts: [],
    });

    expect(items.length).toBeGreaterThan(0);
    const beta = items.find((i) => i.record.id === "HIST-P001-MED-001");
    expect(beta).toBeTruthy();
    expect(beta!.relevanceExplanation.toLowerCase()).toContain("beta-blocker");
    expect(beta!.sourceId).toBe("SRC-P001-EMAR-001");

    const sourceIds = new Set(sourceRecords.map((s) => s.id));
    for (const item of items) {
      expect(sourceIds.has(item.sourceId)).toBe(true);
      expect(item.relevanceExplanation.length).toBeGreaterThan(0);
    }
  });

  it("does not invent records for patients without seeded history", () => {
    const items = assembleRelevantHistory(historicalRecords, {
      patientId: "P999",
    });
    expect(items).toHaveLength(0);
  });

  it("returns multiple contextual records for P003", () => {
    const items = assembleRelevantHistory(historicalRecords, {
      patientId: "P003",
    });
    expect(items.length).toBeGreaterThanOrEqual(3);
    expect(items.every((i) => i.record.patientId === "P003")).toBe(true);
  });

  it("never returns records for a different patient", () => {
    const items = assembleRelevantHistory(historicalRecords, {
      patientId: "P001",
    });
    expect(items.every((i) => i.record.patientId === "P001")).toBe(true);
  });

  it("does not infer documented beta-blocker therapy from a heart-rate tag", () => {
    const record = {
      ...historicalRecords[0],
      id: "HIST-TEST-HR-NOTE",
      patientId: "P999",
      recordType: "note" as const,
      title: "Heart-rate context note",
      relevanceTags: ["heart-rate"],
    };
    const items = assembleRelevantHistory([record], { patientId: "P999" });

    expect(items).toHaveLength(1);
    expect(items[0].relevanceExplanation).not.toContain("Beta-blocker therapy is documented");
    expect(items[0].relevanceExplanation).toContain("does not specify a beta-blocker");
  });

  it("does not describe a cardiac note as a prior visit just because an alert is active", () => {
    const record = {
      ...historicalRecords[0],
      id: "HIST-TEST-CARDIAC-NOTE",
      patientId: "P999",
      recordType: "note" as const,
      title: "Cardiac context note",
      relevanceTags: ["cardiac"],
    };
    const alert: Alert = {
      id: "ALERT-TEST",
      patientId: "P999",
      createdAt: "2026-10-28T08:00:00.000Z",
      status: "active",
      severityLabel: "demonstration_review",
      triggeringObservationIds: ["OBS-1", "OBS-2"],
      triggeredRules: [],
      explanation: "",
      previousValues: {
        heartRate: null,
        respiratoryRate: null,
        systolicBloodPressure: null,
        diastolicBloodPressure: null,
        oxygenSaturation: null,
        temperature: null,
      },
      currentValues: {
        heartRate: null,
        respiratoryRate: null,
        systolicBloodPressure: null,
        diastolicBloodPressure: null,
        oxygenSaturation: null,
        temperature: null,
      },
      previousObservedAt: "2026-10-28T07:45:00.000Z",
      currentObservedAt: "2026-10-28T08:00:00.000Z",
      synthetic: true,
    };
    const items = assembleRelevantHistory([record], {
      patientId: "P999",
      activeAlerts: [alert],
    });

    expect(items).toHaveLength(0);
  });
});
