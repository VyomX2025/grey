import { jsonError, jsonOk } from "@/lib/api-helpers";
import { getObservations, getPatient } from "@/lib/store";

type Params = { params: Promise<{ patientId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { patientId } = await params;
  if (!getPatient(patientId)) {
    return jsonError(`Unknown patient: ${patientId}`, 404);
  }
  return jsonOk({ patientId, observations: getObservations(patientId) });
}
