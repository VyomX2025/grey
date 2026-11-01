export async function postDemoRequest<T>(
  url: string,
  fetcher: typeof fetch = fetch
): Promise<T> {
  const response = await fetcher(url, { method: "POST" });
  let data: Record<string, unknown> = {};
  try {
    data = await response.json();
  } catch {
    if (response.ok) {
      throw new Error("Demonstration request returned an invalid success response");
    }
  }
  if (!response.ok) {
    throw new Error(
      typeof data.error === "string" ? data.error : "Demonstration request failed"
    );
  }
  return data as T;
}

export interface DemoFeedTickResult {
  advanced: boolean;
  reason?: "interval_guard" | "exhausted";
}

export function validateDemoFeedTick(value: unknown): DemoFeedTickResult {
  if (!value || typeof value !== "object" || !("advanced" in value)) {
    throw new Error("Feed update returned an invalid response");
  }
  const result = value as Record<string, unknown>;
  if (typeof result.advanced !== "boolean") {
    throw new Error("Feed update returned an invalid response");
  }
  if (
    !result.advanced &&
    result.reason !== "interval_guard" &&
    result.reason !== "exhausted"
  ) {
    throw new Error("Feed update returned an unknown state");
  }
  return {
    advanced: result.advanced,
    reason:
      result.reason === "interval_guard" || result.reason === "exhausted"
        ? result.reason
        : undefined,
  };
}

export function validateDemoReset(value: unknown): void {
  if (!value || typeof value !== "object" || !("ok" in value) || value.ok !== true) {
    throw new Error("Reset was not confirmed by the server");
  }
}