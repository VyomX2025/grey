import { describe, expect, it } from "vitest";
import {
  postDemoRequest,
  validateDemoFeedTick,
  validateDemoReset,
} from "./demo-requests";

describe("demo request handling", () => {
  it("returns parsed success data for reset and feed callers", async () => {
    const fetcher: typeof fetch = async () =>
      new Response(JSON.stringify({ ok: true, advanced: true }), { status: 200 });

    await expect(postDemoRequest("/api/demo/tick", fetcher)).resolves.toEqual({
      ok: true,
      advanced: true,
    });
  });

  it("surfaces server and malformed-response errors instead of false success", async () => {
    const failedResponse: typeof fetch = async () =>
      new Response(JSON.stringify({ error: "Feed unavailable" }), { status: 503 });
    await expect(postDemoRequest("/api/demo/tick", failedResponse)).rejects.toThrow("Feed unavailable");

    const malformedResponse: typeof fetch = async () =>
      new Response("not-json", { status: 200 });
    await expect(postDemoRequest("/api/demo/reset", malformedResponse)).rejects.toThrow();
  });

  it("rejects structurally invalid successful tick and reset payloads", () => {
    expect(() => validateDemoFeedTick({})).toThrow(/invalid response/);
    expect(() => validateDemoFeedTick({ advanced: false, reason: "unknown" })).toThrow(/unknown state/);
    expect(() => validateDemoReset({ ok: false })).toThrow(/not confirmed/);
    expect(validateDemoFeedTick({ advanced: false, reason: "interval_guard" }).advanced).toBe(false);
    expect(() => validateDemoReset({ ok: true })).not.toThrow();
  });
});