import { handleRouteError, jsonOk } from "@/lib/api-helpers";
import { simulateNext } from "@/lib/store";

type Params = { params: Promise<{ patientId: string }> };

export async function POST(_req: Request, { params }: Params) {
  try {
    const { patientId } = await params;
    const result = simulateNext(patientId);
    return jsonOk(result);
  } catch (err) {
    return handleRouteError(err);
  }
}
