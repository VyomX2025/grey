import { jsonOk } from "@/lib/api-helpers";

export async function GET() {
  return jsonOk({
    status: "ok",
    service: "GREY.",
    synthetic: true,
    message: "Demo environment — not for clinical use",
    timestamp: new Date().toISOString(),
  });
}
