import { beforeEach, describe, expect, it } from "vitest";
import { ClinicianActionError } from "./clinician-actions";
import {
  confirmPatientAlert,
  getAlerts,
  getDecisions,
  getObservations,
  getPatient,
  overridePatientAlert,
  resetStore,
  simulateNext,
} from "./store";

describe("clinician actions", () => {
  beforeEach(() => {
    resetStore();
  });

  it("confirmation changes alert status and creates audit entry without mutating observations or ESI", () => {
    const sim = simulateNext("P001");
    const alertId = sim.alert!.id;
    const obsBefore = structuredClone(getObservations("P001"));
    const esiBefore = getPatient("P001")!.initialEsi;

    const result = confirmPatientAlert("P001", alertId);
    expect(result.alert.status).toBe("confirmed");
    expect(result.decision.action).toBe("confirm");
    expect(result.decision.previousAlertStatus).toBe("active");
    expect(result.decision.newAlertStatus).toBe("confirmed");
    expect(getAlerts("P001").find((alert) => alert.id === alertId)?.status).toBe("confirmed");
    expect(getDecisions("P001")).toContainEqual(result.decision);
    expect(result.initialEsi).toBe(esiBefore);
    expect(getObservations("P001")).toEqual(obsBefore);
    expect(getPatient("P001")!.initialEsi).toBe(esiBefore);
    expect(getPatient("P001")!.currentStatus).toBe("alert_acknowledged");
    expect(getPatient("P001")!.currentStatus).not.toBe("stable");
  });

  it("override requires nonempty rationale and records it", () => {
    const sim = simulateNext("P001");
    const alertId = sim.alert!.id;

    expect(() => overridePatientAlert("P001", alertId, "   ")).toThrow(
      ClinicianActionError
    );

    const result = overridePatientAlert(
      "P001",
      alertId,
      "Clinician judged demo alert not actionable in this scenario."
    );
    expect(result.alert.status).toBe("overridden");
    expect(getAlerts("P001").find((alert) => alert.id === alertId)?.status).toBe("overridden");
    expect(getDecisions("P001")).toContainEqual(result.decision);
    expect(result.decision.rationale).toContain("not actionable");
    expect(getPatient("P001")!.initialEsi).toBe(3);
  });

  it("handles invalid patient and alert IDs", () => {
    expect(() => confirmPatientAlert("P999", "nope")).toThrow(/Unknown patient/);
    simulateNext("P001");
    expect(() => confirmPatientAlert("P001", "ALERT-MISSING")).toThrow(
      /Unknown alert/
    );
  });

  it("rejects a second decision on the same alert", () => {
    const sim = simulateNext("P001");
    confirmPatientAlert("P001", sim.alert!.id);
    expect(() =>
      overridePatientAlert("P001", sim.alert!.id, "late override")
    ).toThrow(/already confirmed/);
  });
});
