import { jsonError, jsonOk } from "@/lib/api-helpers";
import { getHistory, getPatient } from "@/lib/store";

type Params = { params: Promise<{ patientId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { patientId } = await params;
  if (!getPatient(patientId)) {
    return jsonError(`Unknown patient: ${patientId}`, 404);
  }
  const items = getHistory(patientId);
  return jsonOk({
    patientId,
    items,
    empty: items.length === 0,
    message:
      items.length === 0
        ? "No synthetic historical records are seeded for this patient."
        : undefined,
  });
}
