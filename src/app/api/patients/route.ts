import { jsonOk } from "@/lib/api-helpers";
import { getDashboardSummary } from "@/lib/store";

export async function GET() {
  return jsonOk(getDashboardSummary());
}
