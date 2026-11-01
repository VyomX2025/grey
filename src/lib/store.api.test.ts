import { beforeEach, describe, expect, it } from "vitest";
import {
  confirmPatientAlert,
  getDashboardSummary,
  getPatientReview,
  getDecisions,
  advanceDemoFeed,
  getPatient,
  getHistory,
  getSource,
  overridePatientAlert,
  resetStore,
  simulateNext,
} from "./store";
import { historicalRecords, patients } from "./seed";
import { GET as getHistoryRoute } from "../app/api/patients/[patientId]/history/route";
import { GET as getSourceRoute } from "../app/api/patients/[patientId]/sources/[sourceId]/route";

describe("store / API-facing behavior", () => {
  beforeEach(() => {
    resetStore();
  });

  it("dashboard lists twelve synthetic patients and data-derived workflow states", () => {
    const summary = getDashboardSummary();
    expect(summary.totalPatients).toBe(12);
    expect(summary.patients.every((p) => p.synthetic)).toBe(true);
    expect(summary.activeAlerts).toBe(3);
    expect(summary.critical).toBe(2);
    expect(summary.urgent).toBe(1);
    expect(summary.priorityReview).toBe(3);
    expect(summary.patients.filter((patient) => patient.boardPriority.code === "priority")).toHaveLength(3);
    expect(summary.stable).toBe(4);
    expect(summary.awaitingObservation).toBe(1);
    expect(summary.missingData).toBe(1);
  });

  it("unknown patient returns null", () => {
    expect(getPatient("P999")).toBeNull();
  });

  it("unknown source returns null", () => {
    expect(getSource("P001", "SRC-DOES-NOT-EXIST")).toBeNull();
  });

  it("assembles each seeded patient's history with its matching source", () => {
    for (const { id: patientId } of patients) {
      const expected = historicalRecords.filter(
        (record) => record.patientId === patientId
      );
      const items = getHistory(patientId);

      expect(items.length, patientId).toBeGreaterThanOrEqual(2);
      expect(items.length, patientId).toBeLessThanOrEqual(4);
      expect(items.map((item) => item.record.id).sort()).toEqual(
        expected.map((record) => record.id).sort()
      );
      for (const item of items) {
        expect(item.record.patientId).toBe(patientId);
        expect(item.sourceId).toBe(item.record.sourceId);
        expect(item.relevanceExplanation.trim()).not.toBe("");
        expect(
          getSource(patientId, item.sourceId)?.relatedRecordIds
        ).toContain(item.record.id);
      }
    }
  });

  it("serves assembled records for all patients through the API with linked sources", async () => {
    for (const patient of patients) {
      const historyResponse = await getHistoryRoute(
        new Request(`http://localhost/api/patients/${patient.id}/history`),
        { params: Promise.resolve({ patientId: patient.id }) }
      );
      expect(historyResponse.status, patient.id).toBe(200);
      const historyBody = await historyResponse.json();
      expect(historyBody.empty, patient.id).toBe(false);
      expect(historyBody.items.length, patient.id).toBeGreaterThanOrEqual(2);
      expect(historyBody.items.length, patient.id).toBeLessThanOrEqual(4);
      expect(
        historyBody.items.every(
          (item: { record: { patientId: string }; relevanceExplanation: string; sourceId: string }) =>
            item.record.patientId === patient.id &&
            item.relevanceExplanation.length > 0 &&
            Boolean(item.sourceId)
        )
      ).toBe(true);
    }

    const sourceResponse = await getSourceRoute(
      new Request(
        "http://localhost/api/patients/P003/sources/SRC-P003-LAB-001"
      ),
      {
        params: Promise.resolve({
          patientId: "P003",
          sourceId: "SRC-P003-LAB-001",
        }),
      }
    );
    expect(sourceResponse.status).toBe(200);
    const sourceBody = await sourceResponse.json();
    expect(sourceBody.source.relatedRecordIds).toContain("HIST-P003-LAB-001");
  });

  it("simulate then reset restores seed", () => {
    const seededDecisionIds = getDashboardSummary().recentEvents
      .filter((event) => event.kind === "decision")
      .map((event) => event.id);
    const seededObservationIds = getDashboardSummary().patients.flatMap((patient) =>
      patient.latestObservation ? [patient.latestObservation.id] : []
    );
    const simulated = simulateNext("P001");
    expect(getDashboardSummary().activeAlerts).toBe(4);
    expect(getDashboardSummary().attention).toHaveLength(4);
    confirmPatientAlert("P001", simulated.alert!.id);
    const p006Alert = getPatientReview("P006")!.alerts.find((alert) => alert.status === "active")!;
    overridePatientAlert("P006", p006Alert.id, "Reset regression override.");
    expect(getDecisions("P001")).toHaveLength(1);
    expect(getDecisions("P006")).toHaveLength(1);
    resetStore();
    const summary = getDashboardSummary();
    expect(summary.activeAlerts).toBe(3);
    expect(summary.attention).toHaveLength(3);
    expect(summary.recentEvents.some((event) => event.kind === "alert" || event.kind === "decision")).toBe(true);
    expect(getPatient("P001")!.currentStatus).toBe("stable");
    expect(summary.totalPatients).toBe(12);
    expect(summary.patients.flatMap((patient) => patient.latestObservation ? [patient.latestObservation.id] : [])).toEqual(seededObservationIds);
    expect(getDecisions("P001")).toHaveLength(0);
    expect(getDecisions("P006")).toHaveLength(0);
    expect(summary.recentEvents.filter((event) => event.kind === "decision").map((event) => event.id)).toEqual(seededDecisionIds);
  });

  it("stable patient simulate does not create alert under demo rules", () => {
    const result = simulateNext("P002");
    expect(result.alert).toBeNull();
  });

  it("automatic feed advances one scripted patient and guards duplicate rapid ticks", () => {
    const first = advanceDemoFeed();
    expect(first.advanced).toBe(true);
    if (!first.advanced) return;
    expect(first.patientId).toBe("P001");
    expect(first.result.observation.id).toBe("OBS-P001-SIM-001");
    expect(getDashboardSummary().activeAlerts).toBe(4);

    const immediateRetry = advanceDemoFeed();
    expect(immediateRetry).toEqual({ advanced: false, reason: "interval_guard" });
    expect(getDashboardSummary().patients.find((patient) => patient.id === "P001")?.latestObservation?.id).toBe("OBS-P001-SIM-001");
  });

  it("quick review returns the live patient and current observation history", () => {
    simulateNext("P001");
    const review = getPatientReview("P001");
    expect(review?.patient.currentStatus).toBe("review_needed");
    expect(review?.observations).toHaveLength(2);
    expect(review?.alerts[0].triggeredRules.map((rule) => rule.id)).toEqual([
      "rr_increase_8",
      "sbp_decrease_25",
    ]);
    expect(getPatientReview("P999")).toBeNull();
  });

  it("dashboard event details reflect each alert's persisted decision status", () => {
    const events = getDashboardSummary().recentEvents.filter((event) => event.kind === "alert");
    expect(events.some((event) => event.detail.includes("active"))).toBe(true);
    expect(events.some((event) => event.detail.includes("confirmed"))).toBe(true);
    expect(events.some((event) => event.detail.includes("overridden"))).toBe(true);
  });
});
