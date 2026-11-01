/**
 * Illustrative demonstration thresholds ONLY.
 * These are NOT clinically validated, NOT equivalent to NEWS2,
 * and NOT suitable for actual patient care.
 */
export interface DemonstrationRuleConfig {
  id: string;
  name: string;
  description: string;
  vitalKey:
    | "respiratoryRate"
    | "systolicBloodPressure"
    | "heartRate"
    | "oxygenSaturation"
    | "temperature"
    | "diastolicBloodPressure";
  /** Direction of change that triggers the rule */
  direction: "increase" | "decrease";
  /** Absolute change threshold (inclusive) */
  absoluteThreshold: number;
  unit: string;
}

export const DEMONSTRATION_RULES: DemonstrationRuleConfig[] = [
  {
    id: "rr_increase_8",
    name: "Respiratory rate rise",
    description:
      "Respiratory rate increased by at least 8 breaths/min between consecutive synthetic observations (illustrative threshold).",
    vitalKey: "respiratoryRate",
    direction: "increase",
    absoluteThreshold: 8,
    unit: "breaths/min",
  },
  {
    id: "sbp_decrease_25",
    name: "Systolic blood pressure drop",
    description:
      "Systolic blood pressure decreased by at least 25 mmHg between consecutive synthetic observations (illustrative threshold).",
    vitalKey: "systolicBloodPressure",
    direction: "decrease",
    absoluteThreshold: 25,
    unit: "mmHg",
  },
];

export const DEMO_ACTOR = "Demo Clinician";
