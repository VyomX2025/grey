import { handleRouteError, jsonOk } from "@/lib/api-helpers";
import { getDashboardSummary, resetStore } from "@/lib/store";

export async function POST() {
  try {
    resetStore();
    return jsonOk({
      ok: true,
      message: "Demonstration state restored to deterministic seed data.",
      dashboard: getDashboardSummary(),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
