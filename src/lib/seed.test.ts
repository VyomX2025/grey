import { describe, expect, it } from "vitest";
import {
  createInitialStore,
  historicalRecords,
  observations,
  patients,
  sourceRecords,
} from "./seed";

describe("seed data integrity", () => {
  it("marks every patient as synthetic", () => {
    expect(patients).toHaveLength(12);
    for (const p of patients) {
      expect(p.synthetic).toBe(true);
    }
  });

  it("uses Indian synthetic identities", () => {
    const names = patients.map((p) => `${p.id}:${p.displayName}`);
    expect(names).toEqual([
      "P001:Aarav Sharma",
      "P002:Ananya Patel",
      "P003:Rohan Nair",
      "P004:Meera Iyer",
      "P005:Kavya Reddy",
      "P006:Arjun Menon",
      "P007:Priya Nair",
      "P008:Ishaan Mehta",
      "P009:Diya Kulkarni",
      "P010:Aditya Rao",
      "P011:Sana Khan",
      "P012:Vikram Desai",
    ]);
  });

  it("marks every seeded record as synthetic", () => {
    for (const o of observations) expect(o.synthetic).toBe(true);
    for (const h of historicalRecords) expect(h.synthetic).toBe(true);
    for (const s of sourceRecords) expect(s.synthetic).toBe(true);
    expect(observations.every((observation) => observation.synthetic)).toBe(true);
  });

  it("has unique patient IDs", () => {
    const ids = patients.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has unique observation IDs", () => {
    const ids = observations.map((o) => o.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("observations reference existing patients", () => {
    const ids = new Set(patients.map((p) => p.id));
    for (const o of observations) {
      expect(ids.has(o.patientId)).toBe(true);
    }
  });

  it("historical records reference valid patients and sources", () => {
    const patientIds = new Set(patients.map((p) => p.id));
    const sources = new Map(sourceRecords.map((source) => [source.id, source]));
    for (const h of historicalRecords) {
      expect(patientIds.has(h.patientId)).toBe(true);
      expect(sources.get(h.sourceId)?.relatedRecordIds).toContain(h.id);
    }
  });

  it("seeds two to four linked historical records for every patient", () => {
    for (const patient of patients) {
      const records = historicalRecords.filter(
        (record) => record.patientId === patient.id
      );
      expect(records.length, patient.id).toBeGreaterThanOrEqual(2);
      expect(records.length, patient.id).toBeLessThanOrEqual(4);
      expect(records.every((record) => record.synthetic)).toBe(true);
      expect(
        records.every((record) =>
          sourceRecords.some(
            (source) =>
              source.id === record.sourceId &&
              source.relatedRecordIds.includes(record.id)
          )
        )
      ).toBe(true);
    }
  });

  it("represents missing values explicitly as null", () => {
    const missing = observations.find((o) => o.id === "OBS-P004-002");
    expect(missing).toBeTruthy();
    expect(missing!.oxygenSaturation).toBeNull();
    expect(missing!.temperature).toBeNull();
  });

  it("createInitialStore is deterministic", () => {
    const a = createInitialStore();
    const b = createInitialStore();
    expect(a.patients).toEqual(b.patients);
    expect(a.observations).toEqual(b.observations);
    expect(a.alerts).toEqual(b.alerts);
    expect(a.decisions).toEqual(b.decisions);
    expect(a.alerts).toHaveLength(6);
    expect(a.alerts.filter((alert) => alert.status === "active" && alert.triggeredRules.length === 2)).toHaveLength(2);
    expect(a.alerts.filter((alert) => alert.status === "active" && alert.triggeredRules.length === 1)).toHaveLength(1);
    expect(a.alerts.filter((alert) => alert.status !== "active")).toHaveLength(3);
  });

  it("every patient has a stable ID, location, and timestamped history or explicit awaiting state", () => {
    const store = createInitialStore();
    expect(new Set(store.patients.map((patient) => patient.id)).size).toBe(12);
    for (const patient of store.patients) {
      expect(patient.assignedArea.length).toBeGreaterThan(0);
      const history = store.observations.filter((observation) => observation.patientId === patient.id);
      if (patient.id === "P011") {
        expect(patient.awaitingObservation).toBe(true);
        expect(history).toHaveLength(0);
      } else {
        expect(history.length).toBeGreaterThan(0);
        expect(history.every((observation) => Number.isFinite(Date.parse(observation.observedAt)))).toBe(true);
      }
    }
  });
});
