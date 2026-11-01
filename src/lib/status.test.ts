import { beforeEach, describe, expect, it } from "vitest";
import {
  confirmPatientAlert,
  getDashboardSummary,
  getStore,
  getPatient,
  overridePatientAlert,
  resetStore,
  simulateNext,
} from "./store";
import { deriveBoardPriority, observationHasMissing } from "./status";

describe("board status derivation", () => {
  beforeEach(() => {
    resetStore();
  });

  it("P001 begins stable before its deterioration script is applied", () => {
    const p = getPatient("P001")!;
    expect(p.currentStatus).toBe("stable");
    expect(p.initialEsi).toBe(3);
  });

  it("P001 is not STABLE after deterioration simulation", () => {
    const sim = simulateNext("P001");
    expect(sim.alert).not.toBeNull();
    expect(sim.observation.respiratoryRate).toBe(24);
    expect(sim.observation.systolicBloodPressure).toBe(98);

    const p = getPatient("P001")!;
    expect(p.currentStatus).toBe("review_needed");
    expect(p.currentStatus).not.toBe("stable");

    const summary = getDashboardSummary();
    const row = summary.patients.find((x) => x.id === "P001")!;
    expect(row.boardPriority.code).toBe("critical");
    expect(row.boardPriority.shortLabel).toBe("CRITICAL");
    expect(summary.critical).toBe(3);
    expect(summary.activeAlerts).toBe(4);
    expect(summary.attention).toHaveLength(4);
    expect(summary.attention.some((item) => item.alert.id === sim.alert!.id)).toBe(true);
    const attention = summary.attention.find((item) => item.alert.id === sim.alert!.id)!;
    expect(attention.patient.previousObservation?.respiratoryRate).toBe(14);
    expect(attention.patient.latestObservation?.respiratoryRate).toBe(24);
    expect(summary.recentEvents.some((event) => event.kind === "alert" && event.alertId === sim.alert!.id)).toBe(true);
    expect(summary.recentEvents.some((event) => event.id === sim.observation.id)).toBe(true);
    expect(summary.recentEvents[0].timestamp >= summary.recentEvents[1].timestamp).toBe(true);
    expect(summary.patients[0].id).toBe("P001");
  });

  it("confirmation does not mark deteriorated observations as stable", () => {
    const sim = simulateNext("P001");
    confirmPatientAlert("P001", sim.alert!.id);
    const p = getPatient("P001")!;
    expect(p.currentStatus).toBe("alert_acknowledged");
    expect(p.currentStatus).not.toBe("stable");
    expect(p.initialEsi).toBe(3);
    const latest = getDashboardSummary().patients.find((x) => x.id === "P001")!;
    expect(latest.latestObservation?.respiratoryRate).toBe(24);
    expect(latest.boardPriority.code).toBe("priority");
    expect(getDashboardSummary().attention).toHaveLength(3);
    expect(getDashboardSummary().attention.some((item) => item.patient.id === "P001")).toBe(false);
    expect(getDashboardSummary().recentEvents.some((event) => event.kind === "decision")).toBe(true);
  });

  it("override does not imply clinical recovery", () => {
    const sim = simulateNext("P001");
    overridePatientAlert("P001", sim.alert!.id, "Demo override.");
    const p = getPatient("P001")!;
    expect(p.currentStatus).toBe("alert_overridden");
    expect(p.currentStatus).not.toBe("stable");
    expect(p.initialEsi).toBe(3);
    const summary = getDashboardSummary();
    expect(summary.attention).toHaveLength(3);
    expect(summary.recentEvents.some((event) => event.detail.includes("Demo override."))).toBe(true);
    expect(summary.recentEvents.some((event) => event.kind === "alert")).toBe(true);
  });

  it("P002 remains stable with no false alert", () => {
    expect(getPatient("P002")!.currentStatus).toBe("stable");
    simulateNext("P002");
    expect(getPatient("P002")!.currentStatus).toBe("stable");
    const summary = getDashboardSummary();
    expect(summary.attention).toHaveLength(3);
    expect(summary.patients.find((patient) => patient.id === "P002")?.boardPriority.code).toBe("stable");
  });

  it("P004 missing data is incomplete, not critical or stable", () => {
    const p = getPatient("P004")!;
    expect(p.currentStatus).toBe("missing_data");
    const row = getDashboardSummary().patients.find((x) => x.id === "P004")!;
    expect(row.boardPriority.code).toBe("incomplete");
  });

  it("patients without observations are incomplete unless explicitly awaiting their first observation", () => {
    expect(observationHasMissing(null)).toBe(true);
    expect(
      deriveBoardPriority({
        alerts: [],
        latestObservation: null,
        awaitingScriptedObservation: false,
      }).status
    ).toBe("missing_data");
    expect(
      deriveBoardPriority({
        alerts: [],
        latestObservation: null,
        awaitingScriptedObservation: true,
      }).status
    ).toBe("awaiting_observation");
  });

  it("seeded review categories come from configured observation-pair rules", () => {
    const summary = getDashboardSummary();
    const active = summary.attention;
    expect(active.filter(({ patient }) => patient.boardPriority.code === "critical")).toHaveLength(2);
    expect(active.filter(({ patient }) => patient.boardPriority.code === "urgent")).toHaveLength(1);
    expect(summary.priorityReview).toBe(3);

    for (const patientId of ["P005", "P010"]) {
      const item = active.find(({ patient }) => patient.id === patientId)!;
      expect(item.alert.triggeredRules.length).toBeGreaterThan(0);
      expect(item.alert.explanation).toContain("configured demonstration rule");
      expect(item.alert.triggeringObservationIds).toHaveLength(2);
    }
    expect(summary.patients.find(({ id }) => id === "P008")?.boardPriority.shortLabel).toBe("OVERRIDDEN");
    expect(summary.patients.find(({ id }) => id === "P011")?.currentStatus).toBe("awaiting_observation");
  });

  it("confirmation and override preserve original observations and decision history", () => {
    const originalObservations = getDashboardSummary().patients.find(({ id }) => id === "P005")?.latestObservation;
    const p005Alert = getDashboardSummary().attention.find(({ patient }) => patient.id === "P005")!.alert;
    confirmPatientAlert("P005", p005Alert.id);
    const p005 = getDashboardSummary().patients.find(({ id }) => id === "P005")!;
    expect(p005.currentStatus).toBe("alert_acknowledged");
    expect(p005.latestObservation).toEqual(originalObservations);
    expect(p005.initialEsi).toBe(3);

    const p001Alert = simulateNext("P001").alert!;
    const before = getDashboardSummary().patients.find(({ id }) => id === "P001")?.latestObservation;
    overridePatientAlert("P001", p001Alert.id, "Reviewed synthetic scenario.");
    const after = getDashboardSummary().patients.find(({ id }) => id === "P001")!;
    expect(after.currentStatus).toBe("alert_overridden");
    expect(after.latestObservation).toEqual(before);
    expect(after.initialEsi).toBe(3);
    expect(getDashboardSummary().recentEvents.some((event) => event.kind === "decision" && event.detail.includes("Reviewed synthetic scenario."))).toBe(true);
  });

  it("a resolved alert does not conceal missing values in the latest observation", () => {
    const confirmedObservation = getStore().observations.find((observation) => observation.id === "OBS-P007-002")!;
    const overriddenObservation = getStore().observations.find((observation) => observation.id === "OBS-P008-003")!;
    confirmedObservation.temperature = null;
    overriddenObservation.oxygenSaturation = null;

    expect(getPatient("P007")!.currentStatus).toBe("missing_data");
    expect(getPatient("P008")!.currentStatus).toBe("missing_data");
    const summary = getDashboardSummary();
    expect(summary.patients.find(({ id }) => id === "P007")?.boardPriority.shortLabel).toBe("MISSING DATA");
    expect(summary.patients.find(({ id }) => id === "P008")?.boardPriority.shortLabel).toBe("MISSING DATA");
  });
});
