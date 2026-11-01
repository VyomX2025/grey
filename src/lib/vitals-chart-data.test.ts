import { describe, expect, it } from "vitest";
import { createInitialStore, observations } from "./seed";
import {
  alertObservationIdsForRules,
  toVitalChartData,
} from "./vitals-chart-data";

describe("vital chart data", () => {
  it("orders observations chronologically and preserves null measurements", () => {
    const p004 = observations.filter((observation) => observation.patientId === "P004");
    const data = toVitalChartData([...p004].reverse());

    expect(data.map((point) => point.id)).toEqual([
      "OBS-P004-001",
      "OBS-P004-002",
    ]);
    expect(data[1].values.oxygenSaturation).toBeNull();
    expect(data[1].values.temperature).toBeNull();
    expect(data[1].timestamp).toBeGreaterThan(data[0].timestamp);
  });

  it("marks only observations that triggered the requested configured rule", () => {
    const alerts = createInitialStore().alerts;
    const rrMarkers = alertObservationIdsForRules(alerts, ["rr_increase_8"]);
    const sbpMarkers = alertObservationIdsForRules(alerts, ["sbp_decrease_25"]);

    expect(rrMarkers.has("OBS-P005-002")).toBe(true);
    expect(sbpMarkers.has("OBS-P005-002")).toBe(true);
    expect(rrMarkers.has("OBS-P008-002")).toBe(false);
    expect(sbpMarkers.has("OBS-P008-002")).toBe(true);
  });
});