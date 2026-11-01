import { handleRouteError, jsonOk } from "@/lib/api-helpers";
import { confirmBodySchema } from "@/lib/schemas";
import { confirmPatientAlert } from "@/lib/store";

type Params = { params: Promise<{ patientId: string; alertId: string }> };

export async function POST(req: Request, { params }: Params) {
  try {
    const { patientId, alertId } = await params;
    const body = await req.json().catch(() => ({}));
    const parsed = confirmBodySchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request body" },
        { status: 400 }
      );
    }
    const result = confirmPatientAlert(patientId, alertId, parsed.data.actor);
    return jsonOk(result);
  } catch (err) {
    return handleRouteError(err);
  }
}
