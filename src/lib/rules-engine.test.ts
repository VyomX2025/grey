import { beforeEach, describe, expect, it } from "vitest";
import {
  detectTriggeredRules,
  evaluateObservationPair,
  evaluatePatientObservations,
} from "./rules-engine";
import { observations } from "./seed";
import { resetStore, simulateNext } from "./store";
import type { VitalObservation } from "./types";

function obs(
  partial: Partial<VitalObservation> &
    Pick<VitalObservation, "id" | "patientId" | "observedAt">
): VitalObservation {
  return {
    heartRate: 80,
    respiratoryRate: 14,
    systolicBloodPressure: 120,
    diastolicBloodPressure: 80,
    oxygenSaturation: 98,
    temperature: 36.8,
    source: "monitor",
    synthetic: true,
    ...partial,
  };
}

describe("rules engine", () => {
  beforeEach(() => {
    resetStore();
  });

  it("does not trigger for a stable observation pair", () => {
    const prev = obs({
      id: "a",
      patientId: "P002",
      observedAt: "2026-10-28T08:00:00.000Z",
      heartRate: 72,
      respiratoryRate: 16,
      systolicBloodPressure: 118,
    });
    const curr = obs({
      id: "b",
      patientId: "P002",
      observedAt: "2026-10-28T08:15:00.000Z",
      heartRate: 74,
      respiratoryRate: 15,
      systolicBloodPressure: 120,
    });
    expect(detectTriggeredRules(prev, curr)).toHaveLength(0);
    expect(evaluateObservationPair(prev, curr)).toBeNull();
  });

  it("P001 later observation triggers RR and SBP rules with correct explanation", () => {
    const result = simulateNext("P001");
    expect(result.alert).not.toBeNull();
    const alert = result.alert!;
    const ruleIds = alert.triggeredRules.map((r) => r.id);
    expect(ruleIds).toContain("rr_increase_8");
    expect(ruleIds).toContain("sbp_decrease_25");

    const rr = alert.triggeredRules.find((r) => r.id === "rr_increase_8")!;
    const sbp = alert.triggeredRules.find((r) => r.id === "sbp_decrease_25")!;
    expect(rr.previousValue).toBe(14);
    expect(rr.currentValue).toBe(24);
    expect(sbp.previousValue).toBe(130);
    expect(sbp.currentValue).toBe(98);

    expect(alert.explanation).toContain("14");
    expect(alert.explanation).toContain("24");
    expect(alert.explanation).toContain("130");
    expect(alert.explanation).toContain("98");
    expect(alert.explanation).toContain("Both configured demonstration rules were triggered");
  });

  it("does not interpret missing values as normal", () => {
    const prev = obs({
      id: "m1",
      patientId: "P004",
      observedAt: "2026-10-28T08:00:00.000Z",
      respiratoryRate: 14,
      systolicBloodPressure: 130,
    });
    const curr = obs({
      id: "m2",
      patientId: "P004",
      observedAt: "2026-10-28T08:20:00.000Z",
      respiratoryRate: null,
      systolicBloodPressure: null,
    });
    expect(detectTriggeredRules(prev, curr)).toHaveLength(0);
  });

  it("rejects comparison across different patients", () => {
    const a = obs({
      id: "x",
      patientId: "P001",
      observedAt: "2026-10-28T08:00:00.000Z",
    });
    const b = obs({
      id: "y",
      patientId: "P002",
      observedAt: "2026-10-28T08:20:00.000Z",
      respiratoryRate: 30,
      systolicBloodPressure: 80,
    });
    expect(() => detectTriggeredRules(a, b)).toThrow(/different patients/);
  });

  it("does not create duplicate alerts for the same observation pair and rules", () => {
    const prev = observations.find((o) => o.id === "OBS-P001-001")!;
    const curr = obs({
      id: "OBS-P001-SIM-001",
      patientId: "P001",
      observedAt: "2026-10-28T08:20:00.000Z",
      heartRate: 96,
      respiratoryRate: 24,
      systolicBloodPressure: 98,
      diastolicBloodPressure: 66,
      oxygenSaturation: 95,
      temperature: 37.0,
      source: "simulated",
    });
    const first = evaluateObservationPair(prev, curr, []);
    expect(first).not.toBeNull();
    const second = evaluateObservationPair(prev, curr, [first!]);
    expect(second).toBeNull();
  });

  it("seeded P002 observations do not produce alerts", () => {
    const p002 = observations.filter((o) => o.patientId === "P002");
    const alerts = evaluatePatientObservations(p002, []);
    expect(alerts).toHaveLength(0);
  });
});
