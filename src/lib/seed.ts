import type {
  Alert,
  DecisionLogEntry,
  DemoStore,
  HistoricalRecord,
  Patient,
  ScriptedObservation,
  SourceRecord,
  SourceType,
  VitalObservation,
} from "./types";
import { evaluatePatientObservations } from "./rules-engine";

const T0 = "2026-10-28T08:00:00.000Z";
const T1 = "2026-10-28T08:15:00.000Z";
const T2 = "2026-10-28T08:30:00.000Z";
const T3 = "2026-10-28T08:45:00.000Z";
const ARRIVAL = "2026-10-28T07:45:00.000Z";

export const patients: Patient[] = [
  {
    id: "P001",
    synthetic: true,
    displayName: "Aarav Sharma",
    age: 58,
    sex: "male",
    arrivalAt: ARRIVAL,
    initialEsi: 3,
    currentStatus: "awaiting_observation",
    assignedArea: "Resuscitation Bay",
    notes: "Primary deterioration demonstration patient (synthetic).",
  },
  {
    id: "P002",
    synthetic: true,
    displayName: "Ananya Patel",
    age: 34,
    sex: "female",
    arrivalAt: "2026-10-28T07:50:00.000Z",
    initialEsi: 4,
    currentStatus: "stable",
    assignedArea: "General Emergency",
    notes: "Stable comparison patient (synthetic).",
  },
  {
    id: "P003",
    synthetic: true,
    displayName: "Rohan Nair",
    age: 71,
    sex: "male",
    arrivalAt: "2026-10-28T07:30:00.000Z",
    initialEsi: 3,
    currentStatus: "stable",
    assignedArea: "Observation Bay",
    notes: "Historical context demonstration patient (synthetic).",
  },
  {
    id: "P004",
    synthetic: true,
    displayName: "Meera Iyer",
    age: 42,
    sex: "female",
    arrivalAt: "2026-10-28T08:05:00.000Z",
    initialEsi: 3,
    currentStatus: "missing_data",
    assignedArea: "Triage",
    notes: "Missing-data demonstration patient (synthetic).",
  },
  { id: "P005", synthetic: true, displayName: "Kavya Reddy", age: 46, sex: "female", arrivalAt: "2026-10-28T07:20:00.000Z", initialEsi: 3, currentStatus: "stable", assignedArea: "Emergency Pod A", notes: "Synthetic dual-rule critical review scenario." },
  { id: "P006", synthetic: true, displayName: "Arjun Menon", age: 63, sex: "male", arrivalAt: "2026-10-28T07:35:00.000Z", initialEsi: 3, currentStatus: "stable", assignedArea: "Emergency Pod B", notes: "Synthetic single-rule urgent review scenario." },
  { id: "P007", synthetic: true, displayName: "Priya Nair", age: 29, sex: "female", arrivalAt: "2026-10-28T07:40:00.000Z", initialEsi: 4, currentStatus: "stable", assignedArea: "Observation Bay", notes: "Synthetic acknowledged review scenario." },
  { id: "P008", synthetic: true, displayName: "Ishaan Mehta", age: 55, sex: "male", arrivalAt: "2026-10-28T07:25:00.000Z", initialEsi: 3, currentStatus: "stable", assignedArea: "Emergency Pod A", notes: "Synthetic rising heart-rate trend and overridden alert scenario." },
  { id: "P009", synthetic: true, displayName: "Diya Kulkarni", age: 38, sex: "female", arrivalAt: "2026-10-28T07:55:00.000Z", initialEsi: 4, currentStatus: "stable", assignedArea: "Emergency Pod B", notes: "Synthetic acknowledged review scenario." },
  { id: "P010", synthetic: true, displayName: "Aditya Rao", age: 67, sex: "male", arrivalAt: "2026-10-28T07:15:00.000Z", initialEsi: 2, currentStatus: "stable", assignedArea: "Resuscitation Bay", notes: "Synthetic dual-rule critical review and scripted threshold scenario." },
  { id: "P011", synthetic: true, displayName: "Sana Khan", age: 24, sex: "female", arrivalAt: "2026-10-28T08:10:00.000Z", initialEsi: 4, currentStatus: "awaiting_observation", assignedArea: "Triage", awaitingObservation: true, notes: "Synthetic patient awaiting first observation." },
  { id: "P012", synthetic: true, displayName: "Vikram Desai", age: 51, sex: "male", arrivalAt: "2026-10-28T07:48:00.000Z", initialEsi: 4, currentStatus: "stable", assignedArea: "Observation Bay", notes: "Stable synthetic comparison patient." },
];

export const observations: VitalObservation[] = [
  // P001 — initial
  {
    id: "OBS-P001-001",
    patientId: "P001",
    observedAt: T0,
    heartRate: 82,
    respiratoryRate: 14,
    systolicBloodPressure: 130,
    diastolicBloodPressure: 82,
    oxygenSaturation: 98,
    temperature: 36.8,
    source: "monitor",
    synthetic: true,
  },
  // P002 — stable series
  {
    id: "OBS-P002-001",
    patientId: "P002",
    observedAt: T0,
    heartRate: 72,
    respiratoryRate: 16,
    systolicBloodPressure: 118,
    diastolicBloodPressure: 76,
    oxygenSaturation: 99,
    temperature: 36.6,
    source: "monitor",
    synthetic: true,
  },
  {
    id: "OBS-P002-002",
    patientId: "P002",
    observedAt: T1,
    heartRate: 74,
    respiratoryRate: 15,
    systolicBloodPressure: 120,
    diastolicBloodPressure: 78,
    oxygenSaturation: 99,
    temperature: 36.7,
    source: "monitor",
    synthetic: true,
  },
  {
    id: "OBS-P002-003",
    patientId: "P002",
    observedAt: T2,
    heartRate: 73,
    respiratoryRate: 16,
    systolicBloodPressure: 118,
    diastolicBloodPressure: 76,
    oxygenSaturation: 98,
    temperature: 36.6,
    source: "monitor",
    synthetic: true,
  },
  // P003 — mild variation, no alert rules
  {
    id: "OBS-P003-001",
    patientId: "P003",
    observedAt: "2026-10-28T07:40:00.000Z",
    heartRate: 68,
    respiratoryRate: 15,
    systolicBloodPressure: 142,
    diastolicBloodPressure: 88,
    oxygenSaturation: 97,
    temperature: 36.5,
    source: "monitor",
    synthetic: true,
  },
  {
    id: "OBS-P003-002",
    patientId: "P003",
    observedAt: T1,
    heartRate: 70,
    respiratoryRate: 16,
    systolicBloodPressure: 138,
    diastolicBloodPressure: 86,
    oxygenSaturation: 97,
    temperature: 36.6,
    source: "manual",
    synthetic: true,
  },
  // P004 — missing SpO2 and temperature on latest
  {
    id: "OBS-P004-001",
    patientId: "P004",
    observedAt: T1,
    heartRate: 88,
    respiratoryRate: 18,
    systolicBloodPressure: 124,
    diastolicBloodPressure: 80,
    oxygenSaturation: 97,
    temperature: 37.1,
    source: "monitor",
    synthetic: true,
  },
  {
    id: "OBS-P004-002",
    patientId: "P004",
    observedAt: T3,
    heartRate: 90,
    respiratoryRate: 18,
    systolicBloodPressure: 122,
    diastolicBloodPressure: 78,
    oxygenSaturation: null,
    temperature: null,
    source: "manual",
    synthetic: true,
  },
  { id: "OBS-P005-001", patientId: "P005", observedAt: "2026-10-28T07:30:00.000Z", heartRate: 88, respiratoryRate: 15, systolicBloodPressure: 132, diastolicBloodPressure: 84, oxygenSaturation: 98, temperature: 36.7, source: "monitor", synthetic: true },
  { id: "OBS-P005-002", patientId: "P005", observedAt: "2026-10-28T07:50:00.000Z", heartRate: 108, respiratoryRate: 25, systolicBloodPressure: 100, diastolicBloodPressure: 68, oxygenSaturation: 95, temperature: 37.0, source: "monitor", synthetic: true },
  { id: "OBS-P006-001", patientId: "P006", observedAt: "2026-10-28T07:45:00.000Z", heartRate: 84, respiratoryRate: 14, systolicBloodPressure: 126, diastolicBloodPressure: 80, oxygenSaturation: 97, temperature: 36.8, source: "monitor", synthetic: true },
  { id: "OBS-P006-002", patientId: "P006", observedAt: "2026-10-28T08:00:00.000Z", heartRate: 90, respiratoryRate: 23, systolicBloodPressure: 124, diastolicBloodPressure: 78, oxygenSaturation: 96, temperature: 36.9, source: "manual", synthetic: true },
  { id: "OBS-P007-001", patientId: "P007", observedAt: "2026-10-28T07:45:00.000Z", heartRate: 76, respiratoryRate: 14, systolicBloodPressure: 118, diastolicBloodPressure: 74, oxygenSaturation: 99, temperature: 36.6, source: "monitor", synthetic: true },
  { id: "OBS-P007-002", patientId: "P007", observedAt: "2026-10-28T08:00:00.000Z", heartRate: 82, respiratoryRate: 23, systolicBloodPressure: 116, diastolicBloodPressure: 72, oxygenSaturation: 98, temperature: 36.7, source: "monitor", synthetic: true },
  { id: "OBS-P008-001", patientId: "P008", observedAt: "2026-10-28T07:30:00.000Z", heartRate: 72, respiratoryRate: 15, systolicBloodPressure: 132, diastolicBloodPressure: 84, oxygenSaturation: 98, temperature: 36.7, source: "monitor", synthetic: true },
  { id: "OBS-P008-002", patientId: "P008", observedAt: "2026-10-28T07:45:00.000Z", heartRate: 84, respiratoryRate: 16, systolicBloodPressure: 100, diastolicBloodPressure: 68, oxygenSaturation: 97, temperature: 36.8, source: "monitor", synthetic: true },
  { id: "OBS-P008-003", patientId: "P008", observedAt: "2026-10-28T08:00:00.000Z", heartRate: 96, respiratoryRate: 16, systolicBloodPressure: 102, diastolicBloodPressure: 70, oxygenSaturation: 97, temperature: 36.8, source: "manual", synthetic: true },
  { id: "OBS-P009-001", patientId: "P009", observedAt: "2026-10-28T07:50:00.000Z", heartRate: 80, respiratoryRate: 15, systolicBloodPressure: 120, diastolicBloodPressure: 76, oxygenSaturation: 98, temperature: 36.5, source: "monitor", synthetic: true },
  { id: "OBS-P009-002", patientId: "P009", observedAt: "2026-10-28T08:05:00.000Z", heartRate: 87, respiratoryRate: 24, systolicBloodPressure: 118, diastolicBloodPressure: 74, oxygenSaturation: 97, temperature: 36.6, source: "monitor", synthetic: true },
  { id: "OBS-P010-001", patientId: "P010", observedAt: "2026-10-28T07:25:00.000Z", heartRate: 86, respiratoryRate: 15, systolicBloodPressure: 128, diastolicBloodPressure: 82, oxygenSaturation: 98, temperature: 36.8, source: "monitor", synthetic: true },
  { id: "OBS-P010-002", patientId: "P010", observedAt: "2026-10-28T07:45:00.000Z", heartRate: 104, respiratoryRate: 25, systolicBloodPressure: 96, diastolicBloodPressure: 64, oxygenSaturation: 94, temperature: 37.1, source: "monitor", synthetic: true },
  { id: "OBS-P012-001", patientId: "P012", observedAt: "2026-10-28T07:50:00.000Z", heartRate: 74, respiratoryRate: 16, systolicBloodPressure: 122, diastolicBloodPressure: 78, oxygenSaturation: 99, temperature: 36.6, source: "monitor", synthetic: true },
  { id: "OBS-P012-002", patientId: "P012", observedAt: "2026-10-28T08:05:00.000Z", heartRate: 76, respiratoryRate: 17, systolicBloodPressure: 120, diastolicBloodPressure: 78, oxygenSaturation: 99, temperature: 36.6, source: "manual", synthetic: true },
];

const additionalHistoryDefinitions: {
  patientId: Patient["id"];
  suffix: string;
  recordType: HistoricalRecord["recordType"];
  title: string;
  recordedAt: string;
}[] = [
  { patientId: "P002", suffix: "VISIT-001", recordType: "prior_visit", title: "Prior synthetic encounter", recordedAt: "2026-05-14T09:00:00.000Z" },
  { patientId: "P002", suffix: "NOTE-001", recordType: "note", title: "Synthetic observation context note", recordedAt: "2026-06-02T11:30:00.000Z" },
  { patientId: "P004", suffix: "VISIT-001", recordType: "prior_visit", title: "Prior synthetic encounter", recordedAt: "2026-04-20T08:15:00.000Z" },
  { patientId: "P004", suffix: "ALLERGY-001", recordType: "allergy", title: "Synthetic allergy-list fixture", recordedAt: "2026-03-11T12:00:00.000Z" },
  { patientId: "P005", suffix: "MED-002", recordType: "medication", title: "Synthetic medication-history fixture", recordedAt: "2026-05-03T10:00:00.000Z" },
  { patientId: "P005", suffix: "NOTE-001", recordType: "note", title: "Synthetic observation context note", recordedAt: "2026-06-18T14:00:00.000Z" },
  { patientId: "P006", suffix: "MED-001", recordType: "medication", title: "Synthetic medication-history fixture", recordedAt: "2026-07-07T10:30:00.000Z" },
  { patientId: "P006", suffix: "VISIT-001", recordType: "prior_visit", title: "Prior synthetic encounter", recordedAt: "2026-08-16T08:45:00.000Z" },
  { patientId: "P007", suffix: "VISIT-001", recordType: "prior_visit", title: "Prior synthetic encounter", recordedAt: "2026-02-22T13:00:00.000Z" },
  { patientId: "P007", suffix: "NOTE-001", recordType: "note", title: "Synthetic observation context note", recordedAt: "2026-07-21T11:00:00.000Z" },
  { patientId: "P008", suffix: "VISIT-001", recordType: "prior_visit", title: "Prior synthetic encounter", recordedAt: "2026-05-28T09:30:00.000Z" },
  { patientId: "P008", suffix: "NOTE-001", recordType: "note", title: "Synthetic observation context note", recordedAt: "2026-07-02T15:10:00.000Z" },
  { patientId: "P009", suffix: "VISIT-001", recordType: "prior_visit", title: "Prior synthetic encounter", recordedAt: "2026-03-08T10:15:00.000Z" },
  { patientId: "P009", suffix: "MED-001", recordType: "medication", title: "Synthetic medication-history fixture", recordedAt: "2026-09-06T09:45:00.000Z" },
  { patientId: "P010", suffix: "VISIT-001", recordType: "prior_visit", title: "Prior synthetic encounter", recordedAt: "2026-07-18T07:50:00.000Z" },
  { patientId: "P010", suffix: "MED-001", recordType: "medication", title: "Synthetic medication-history fixture", recordedAt: "2026-08-02T12:20:00.000Z" },
  { patientId: "P011", suffix: "VISIT-001", recordType: "prior_visit", title: "Prior synthetic encounter", recordedAt: "2026-01-19T10:00:00.000Z" },
  { patientId: "P011", suffix: "NOTE-001", recordType: "note", title: "Synthetic intake context note", recordedAt: "2026-04-15T08:30:00.000Z" },
  { patientId: "P012", suffix: "MED-001", recordType: "medication", title: "Synthetic medication-history fixture", recordedAt: "2026-06-24T11:45:00.000Z" },
  { patientId: "P012", suffix: "VISIT-001", recordType: "prior_visit", title: "Prior synthetic encounter", recordedAt: "2026-09-12T08:00:00.000Z" },
];

function sourceTypeFor(recordType: HistoricalRecord["recordType"]): SourceType {
  switch (recordType) {
    case "medication":
      return "emar";
    case "allergy":
      return "allergy_list";
    case "prior_visit":
      return "visit_summary";
    case "lab":
      return "lab_report";
    case "note":
      return "ehr_note";
  }
}

const additionalHistoryFixtures = additionalHistoryDefinitions.map((definition) => {
  const patient = patients.find((candidate) => candidate.id === definition.patientId);
  if (!patient) {
    throw new Error(`Unknown patient in synthetic history fixture: ${definition.patientId}`);
  }

  const id = `HIST-${definition.patientId}-${definition.suffix}`;
  const sourceId = `SRC-${definition.patientId}-${definition.suffix}`;
  const summary = `Predefined synthetic ${definition.recordType.replace("_", " ")} fixture for Historical Assembly. This is not a real patient record and does not assert a connection to current observations.`;

  return {
    record: {
      id,
      patientId: definition.patientId,
      recordType: definition.recordType,
      title: definition.title,
      summary,
      recordedAt: definition.recordedAt,
      relevanceTags: [definition.recordType.replace("_", "-"), "synthetic-history"],
      sourceId,
      synthetic: true as const,
    },
    source: {
      id: sourceId,
      title: `${definition.title} — synthetic source`,
      sourceType: sourceTypeFor(definition.recordType),
      recordedAt: definition.recordedAt,
      content: `SYNTHETIC DEMO FIXTURE\nPatient: ${patient.displayName} (${patient.id})\nRecord: ${definition.title}\nRecorded: ${definition.recordedAt}\n\nFictional fixture only; not a real patient record. No causal link to current observations is asserted.`,
      relatedRecordIds: [id],
      synthetic: true as const,
    },
  };
});

export const sourceRecords: SourceRecord[] = [
  {
    id: "SRC-P001-EMAR-001",
    title: "eMAR — Outpatient medications (synthetic)",
    sourceType: "emar",
    recordedAt: "2026-09-12T14:20:00.000Z",
    content:
      "SYNTHETIC eMAR EXTRACT\nPatient: Aarav Sharma (P001)\nMedication: Metoprolol tartrate 25 mg PO BID\nIndication: Hypertension (documented in synthetic chart)\nStart date: 2025-03-01\nPrescriber: Demo Prescriber\nStatus: Active\n\nNOTE: This record is entirely fictional and exists only for demonstration of Historical Assembly.",
    relatedRecordIds: ["HIST-P001-MED-001"],
    synthetic: true,
  },
  {
    id: "SRC-P001-NOTE-001",
    title: "Prior ED visit summary (synthetic)",
    sourceType: "visit_summary",
    recordedAt: "2026-06-03T11:00:00.000Z",
    content:
      "SYNTHETIC VISIT SUMMARY\nPatient: Aarav Sharma (P001)\nVisit date: 03 Jun 2026\nChief complaint: Palpitations (synthetic)\nDisposition: Discharged\nFollow-up: Outpatient cardiology (synthetic)\n\nThis document is fictional demonstration content.",
    relatedRecordIds: ["HIST-P001-VISIT-001"],
    synthetic: true,
  },
  {
    id: "SRC-P003-ALLERGY-001",
    title: "Allergy list (synthetic)",
    sourceType: "allergy_list",
    recordedAt: "2026-01-15T09:00:00.000Z",
    content:
      "SYNTHETIC ALLERGY LIST\nPatient: Rohan Nair (P003)\nAllergy: Penicillin\nReaction: Rash (documented severity: moderate)\nStatus: Active\n\nFictional demonstration content only.",
    relatedRecordIds: ["HIST-P003-ALLERGY-001"],
    synthetic: true,
  },
  {
    id: "SRC-P003-LAB-001",
    title: "Recent laboratory panel (synthetic)",
    sourceType: "lab_report",
    recordedAt: "2026-10-20T16:30:00.000Z",
    content:
      "SYNTHETIC LAB REPORT\nPatient: Rohan Nair (P003)\nCreatinine: 1.4 mg/dL\nPotassium: 4.1 mmol/L\nHemoglobin: 11.2 g/dL\nCollected: 20 Oct 2026\n\nValues are fictional and for demonstration only.",
    relatedRecordIds: ["HIST-P003-LAB-001"],
    synthetic: true,
  },
  {
    id: "SRC-P003-MED-001",
    title: "Home medication list (synthetic)",
    sourceType: "emar",
    recordedAt: "2026-10-01T10:00:00.000Z",
    content:
      "SYNTHETIC HOME MEDICATIONS\nPatient: Rohan Nair (P003)\n1. Lisinopril 10 mg PO daily\n2. Atorvastatin 20 mg PO nightly\n3. Aspirin 81 mg PO daily\n\nFictional demonstration content.",
    relatedRecordIds: ["HIST-P003-MED-001"],
    synthetic: true,
  },
  {
    id: "SRC-P003-NOTE-001",
    title: "Cardiology follow-up note (synthetic)",
    sourceType: "ehr_note",
    recordedAt: "2026-08-22T13:15:00.000Z",
    content:
      "SYNTHETIC CLINIC NOTE\nPatient: Rohan Nair (P003)\nImpression: Chronic hypertension under outpatient management (synthetic).\nPlan: Continue current regimen; routine follow-up.\n\nNot a real clinical document.",
    relatedRecordIds: ["HIST-P003-NOTE-001"],
    synthetic: true,
  },
  { id: "SRC-P005-VISIT-001", title: "Prior synthetic ED visit", sourceType: "visit_summary", recordedAt: "2026-07-12T10:00:00.000Z", content: "FICTIONAL SYNTHETIC VISIT SUMMARY\nPatient: Kavya Reddy (P005)\nPrior visit documentation for demonstration context only.", relatedRecordIds: ["HIST-P005-VISIT-001"], synthetic: true },
  { id: "SRC-P008-MED-001", title: "Synthetic medication history", sourceType: "emar", recordedAt: "2026-09-18T09:00:00.000Z", content: "FICTIONAL SYNTHETIC MEDICATION RECORD\nPatient: Ishaan Mehta (P008)\nMedication context supplied for the GREY. demonstration only.", relatedRecordIds: ["HIST-P008-MED-001"], synthetic: true },
  { id: "SRC-P010-NOTE-001", title: "Synthetic observation context note", sourceType: "ehr_note", recordedAt: "2026-10-10T12:00:00.000Z", content: "FICTIONAL SYNTHETIC NOTE\nPatient: Aditya Rao (P010)\nDemonstration context only; not a diagnosis or treatment recommendation.", relatedRecordIds: ["HIST-P010-NOTE-001"], synthetic: true },
  ...additionalHistoryFixtures.map(({ source }) => source),
];

export const historicalRecords: HistoricalRecord[] = [
  {
    id: "HIST-P001-MED-001",
    patientId: "P001",
    recordType: "medication",
    title: "Beta-blocker therapy (metoprolol)",
    summary:
      "Synthetic medication record documents metoprolol tartrate 25 mg PO BID for hypertension.",
    recordedAt: "2026-09-12T14:20:00.000Z",
    relevanceTags: ["beta-blocker", "heart-rate", "medication", "vitals-context"],
    sourceId: "SRC-P001-EMAR-001",
    synthetic: true,
  },
  {
    id: "HIST-P001-VISIT-001",
    patientId: "P001",
    recordType: "prior_visit",
    title: "Prior ED visit — palpitations",
    summary:
      "Synthetic prior visit for palpitations with discharge to outpatient cardiology follow-up.",
    recordedAt: "2026-06-03T11:00:00.000Z",
    relevanceTags: ["prior-visit", "cardiac"],
    sourceId: "SRC-P001-NOTE-001",
    synthetic: true,
  },
  {
    id: "HIST-P003-ALLERGY-001",
    patientId: "P003",
    recordType: "allergy",
    title: "Penicillin allergy",
    summary: "Synthetic allergy list documents penicillin with rash reaction.",
    recordedAt: "2026-01-15T09:00:00.000Z",
    relevanceTags: ["allergy", "medication-safety"],
    sourceId: "SRC-P003-ALLERGY-001",
    synthetic: true,
  },
  {
    id: "HIST-P003-LAB-001",
    patientId: "P003",
    recordType: "lab",
    title: "Recent chemistry panel",
    summary: "Synthetic labs include creatinine 1.4 mg/dL and potassium 4.1 mmol/L.",
    recordedAt: "2026-10-20T16:30:00.000Z",
    relevanceTags: ["lab", "renal", "vitals-context"],
    sourceId: "SRC-P003-LAB-001",
    synthetic: true,
  },
  {
    id: "HIST-P003-MED-001",
    patientId: "P003",
    recordType: "medication",
    title: "Home antihypertensive regimen",
    summary: "Synthetic home meds include lisinopril, atorvastatin, and aspirin.",
    recordedAt: "2026-10-01T10:00:00.000Z",
    relevanceTags: ["medication", "blood-pressure", "vitals-context"],
    sourceId: "SRC-P003-MED-001",
    synthetic: true,
  },
  {
    id: "HIST-P003-NOTE-001",
    patientId: "P003",
    recordType: "note",
    title: "Cardiology clinic note",
    summary: "Synthetic note describes chronic hypertension under outpatient management.",
    recordedAt: "2026-08-22T13:15:00.000Z",
    relevanceTags: ["note", "cardiac", "blood-pressure"],
    sourceId: "SRC-P003-NOTE-001",
    synthetic: true,
  },
  { id: "HIST-P005-VISIT-001", patientId: "P005", recordType: "prior_visit", title: "Prior ED visit", summary: "Fictional prior visit entry retained for contextual-review demonstration.", recordedAt: "2026-07-12T10:00:00.000Z", relevanceTags: ["prior-visit", "vitals-context"], sourceId: "SRC-P005-VISIT-001", synthetic: true },
  { id: "HIST-P008-MED-001", patientId: "P008", recordType: "medication", title: "Medication history", summary: "Fictional medication context for the synthetic patient scenario.", recordedAt: "2026-09-18T09:00:00.000Z", relevanceTags: ["medication", "heart-rate", "vitals-context"], sourceId: "SRC-P008-MED-001", synthetic: true },
  { id: "HIST-P010-NOTE-001", patientId: "P010", recordType: "note", title: "Observation context note", summary: "Fictional observation context note for the synthetic patient scenario.", recordedAt: "2026-10-10T12:00:00.000Z", relevanceTags: ["note", "vitals-context"], sourceId: "SRC-P010-NOTE-001", synthetic: true },
  ...additionalHistoryFixtures.map(({ record }) => record),
];

/** Deterministic scripted observations applied by Simulate Next. */
export const scriptedSequences: Record<string, ScriptedObservation[]> = {
  P001: [
    {
      heartRate: 96,
      respiratoryRate: 24,
      systolicBloodPressure: 98,
      diastolicBloodPressure: 66,
      oxygenSaturation: 95,
      temperature: 37.0,
      offsetMinutes: 20,
    },
  ],
  P002: [
    {
      heartRate: 75,
      respiratoryRate: 16,
      systolicBloodPressure: 119,
      diastolicBloodPressure: 77,
      oxygenSaturation: 99,
      temperature: 36.6,
      offsetMinutes: 15,
    },
  ],
  P003: [
    {
      heartRate: 72,
      respiratoryRate: 15,
      systolicBloodPressure: 140,
      diastolicBloodPressure: 86,
      oxygenSaturation: 96,
      temperature: 36.7,
      offsetMinutes: 20,
    },
  ],
  P004: [
    {
      heartRate: 91,
      respiratoryRate: 19,
      systolicBloodPressure: 120,
      diastolicBloodPressure: 78,
      oxygenSaturation: 96,
      temperature: 37.0,
      offsetMinutes: 15,
    },
  ],
  P005: [{ heartRate: 104, respiratoryRate: 24, systolicBloodPressure: 102, diastolicBloodPressure: 70, oxygenSaturation: 96, temperature: 36.9, offsetMinutes: 15 }],
  P006: [{ heartRate: 88, respiratoryRate: 21, systolicBloodPressure: 126, diastolicBloodPressure: 80, oxygenSaturation: 97, temperature: 36.8, offsetMinutes: 15 }],
  P007: [{ heartRate: 80, respiratoryRate: 21, systolicBloodPressure: 116, diastolicBloodPressure: 72, oxygenSaturation: 98, temperature: 36.7, offsetMinutes: 15 }],
  P008: [{ heartRate: 94, respiratoryRate: 16, systolicBloodPressure: 104, diastolicBloodPressure: 70, oxygenSaturation: 97, temperature: 36.8, offsetMinutes: 15 }],
  P009: [{ heartRate: 84, respiratoryRate: 22, systolicBloodPressure: 118, diastolicBloodPressure: 74, oxygenSaturation: 98, temperature: 36.6, offsetMinutes: 15 }],
  P010: [{ heartRate: 108, respiratoryRate: 34, systolicBloodPressure: 95, diastolicBloodPressure: 64, oxygenSaturation: 93, temperature: 37.2, offsetMinutes: 15 }],
  P011: [{ heartRate: 78, respiratoryRate: 16, systolicBloodPressure: 120, diastolicBloodPressure: 76, oxygenSaturation: 99, temperature: 36.6, offsetMinutes: 10 }],
  P012: [{ heartRate: 75, respiratoryRate: 16, systolicBloodPressure: 121, diastolicBloodPressure: 78, oxygenSaturation: 99, temperature: 36.6, offsetMinutes: 15 }],
};

export function createInitialStore(): DemoStore {
  const resolvedStatuses: Record<string, "confirmed" | "overridden"> = {
    P007: "confirmed",
    P008: "overridden",
    P009: "confirmed",
  };
  const alerts: Alert[] = evaluatePatientObservations(observations).map((alert) => ({
    ...alert,
    status: resolvedStatuses[alert.patientId] ?? alert.status,
  }));
  const decisions: DecisionLogEntry[] = alerts.flatMap((alert) => {
    if (alert.status === "active") return [];
    const action = alert.status === "confirmed" ? "confirm" : "override";
    return [{
      id: `DEC-${alert.id}-${action}`,
      patientId: alert.patientId,
      alertId: alert.id,
      action,
      actor: "Demo Clinician",
      timestamp: new Date(new Date(alert.createdAt).getTime() + 60_000).toISOString(),
      rationale: action === "override" ? "Seeded synthetic override rationale for workflow demonstration." : null,
      previousAlertStatus: "active",
      newAlertStatus: alert.status,
      synthetic: true,
    }];
  });
  return {
    patients: structuredClone(patients),
    observations: structuredClone(observations),
    historicalRecords: structuredClone(historicalRecords),
    sourceRecords: structuredClone(sourceRecords),
    alerts,
    decisions,
    simulationCursor: Object.fromEntries(patients.map((patient) => [patient.id, 0])),
    scriptedSequences: structuredClone(scriptedSequences),
  };
}
