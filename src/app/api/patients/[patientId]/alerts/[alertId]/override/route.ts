import { handleRouteError, jsonOk } from "@/lib/api-helpers";
import { overrideBodySchema } from "@/lib/schemas";
import { overridePatientAlert } from "@/lib/store";

type Params = { params: Promise<{ patientId: string; alertId: string }> };

export async function POST(req: Request, { params }: Params) {
  try {
    const { patientId, alertId } = await params;
    const body = await req.json().catch(() => ({}));
    const parsed = overrideBodySchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request body" },
        { status: 400 }
      );
    }
    const result = overridePatientAlert(
      patientId,
      alertId,
      parsed.data.rationale,
      parsed.data.actor
    );
    return jsonOk(result);
  } catch (err) {
    return handleRouteError(err);
  }
}
