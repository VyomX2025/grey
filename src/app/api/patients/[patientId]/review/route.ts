import { handleRouteError, jsonError, jsonOk } from "@/lib/api-helpers";
import { getPatientReview } from "@/lib/store";

type Params = { params: Promise<{ patientId: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { patientId } = await params;
    const review = getPatientReview(patientId);
    if (!review) return jsonError("Patient not found", 404);
    return jsonOk(review);
  } catch (error) {
    return handleRouteError(error);
  }
}