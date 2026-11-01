import { handleRouteError, jsonOk } from "@/lib/api-helpers";
import { advanceDemoFeed } from "@/lib/store";

export async function POST() {
  try {
    return jsonOk(advanceDemoFeed());
  } catch (error) {
    return handleRouteError(error);
  }
}