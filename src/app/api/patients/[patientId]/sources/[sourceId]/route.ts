import { jsonError, jsonOk } from "@/lib/api-helpers";
import { getPatient, getSource } from "@/lib/store";

type Params = { params: Promise<{ patientId: string; sourceId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { patientId, sourceId } = await params;
  if (!getPatient(patientId)) {
    return jsonError(`Unknown patient: ${patientId}`, 404);
  }
  const source = getSource(patientId, sourceId);
  if (!source) {
    return jsonError(`Unknown source: ${sourceId}`, 404);
  }
  return jsonOk({ patientId, source });
}
