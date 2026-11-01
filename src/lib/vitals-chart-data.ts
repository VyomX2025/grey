import type { Alert, VitalObservation } from "./types";

export type VitalChartKey =
  | "heartRate"
  | "respiratoryRate"
  | "systolicBloodPressure"
  | "diastolicBloodPressure"
  | "oxygenSaturation"
  | "temperature";

export interface VitalChartPoint {
  id: string;
  timestamp: number;
  values: Record<VitalChartKey, number | null>;
}

export function toVitalChartData(
  observations: VitalObservation[]
): VitalChartPoint[] {
  return [...observations]
    .sort(
      (a, b) =>
        new Date(a.observedAt).getTime() - new Date(b.observedAt).getTime()
    )
    .map((observation) => ({
      id: observation.id,
      timestamp: new Date(observation.observedAt).getTime(),
      values: {
        heartRate: observation.heartRate,
        respiratoryRate: observation.respiratoryRate,
        systolicBloodPressure: observation.systolicBloodPressure,
        diastolicBloodPressure: observation.diastolicBloodPressure,
        oxygenSaturation: observation.oxygenSaturation,
        temperature: observation.temperature,
      },
    }));
}

export function alertObservationIdsForRules(
  alerts: Alert[],
  ruleIds: string[]
): Set<string> {
  const ruleIdSet = new Set(ruleIds);
  return new Set(
    alerts
      .filter((alert) =>
        alert.triggeredRules.some((rule) => ruleIdSet.has(rule.id))
      )
      .map((alert) => alert.triggeringObservationIds[1])
  );
}