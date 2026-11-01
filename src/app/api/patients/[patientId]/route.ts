import { jsonError, jsonOk } from "@/lib/api-helpers";
import {
  getAlerts,
  getDecisions,
  getObservations,
  getPatient,
} from "@/lib/store";

type Params = { params: Promise<{ patientId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { patientId } = await params;
  const patient = getPatient(patientId);
  if (!patient) {
    return jsonError(`Unknown patient: ${patientId}`, 404);
  }

  const observations = getObservations(patientId);
  const latestObservation =
    observations.length > 0 ? observations[observations.length - 1] : null;

  return jsonOk({
    patient,
    latestObservation,
    observationCount: observations.length,
    alerts: getAlerts(patientId),
    decisions: getDecisions(patientId),
  });
}
