import { describe, expect, test } from "vitest";
import { z } from "zod";
import { BUSY_RETRY_DELAYS_MS, apiRequest } from "@/lib/api/client";
import { jsonResponse, noSleep, recordingFetch, textResponse } from "./helpers";

const Schema = z.object({ ok: z.literal(true), value: z.number() });

describe("apiRequest: requests", () => {
  test("GET builds the URL from baseUrl, path and an encoded query, with no body or content type", async () => {
    const { fetchImpl, calls } = recordingFetch([jsonResponse(200, { ok: true, value: 1 })]);
    const res = await apiRequest({ fetchImpl, sleep: noSleep, baseUrl: "https://api.test" }, {
      path: "/api/applications/check-email",
      query: { email: "a+b@c.test" },
      schema: Schema,
    });
    expect(res).toEqual({ ok: true, data: { ok: true, value: 1 } });
    expect(calls[0]?.url).toBe("https://api.test/api/applications/check-email?email=a%2Bb%40c.test");
    expect(calls[0]?.init?.method).toBe("GET");
    expect(calls[0]?.init?.body).toBeUndefined();
  });

  test("POST sends the body as JSON with a JSON content type, and defaults to a relative URL", async () => {
    const { fetchImpl, calls } = recordingFetch([jsonResponse(201, { ok: true, value: 2 })]);
    await apiRequest({ fetchImpl, sleep: noSleep }, { method: "POST", path: "/api/waitlist", body: { email: "a@b.test" }, schema: Schema });
    expect(calls[0]?.url).toBe("/api/waitlist");
    expect(calls[0]?.init?.method).toBe("POST");
    expect(calls[0]?.init?.body).toBe('{"email":"a@b.test"}');
    expect((calls[0]?.init?.headers as Record<string, string>)["Content-Type"]).toBe("application/json");
  });
});

describe("apiRequest: onResponse hook", () => {
  test("hands the successful response to the caller so it can read headers, without changing the result", async () => {
    const response = () =>
      new Response(JSON.stringify({ ok: true, value: 7 }), {
        status: 201,
        headers: { "content-type": "application/json", "X-Meta-Event-Id": "meta-123", "X-TikTok-Event-Id": "tt-456" },
      });
    const { fetchImpl } = recordingFetch([response]);
    const seen: Array<string | null> = [];
    const res = await apiRequest({ fetchImpl, sleep: noSleep }, {
      method: "POST",
      path: "/x",
      body: {},
      schema: Schema,
      onResponse: (r) => seen.push(r.headers.get("X-Meta-Event-Id"), r.headers.get("X-TikTok-Event-Id")),
    });
    expect(res).toEqual({ ok: true, data: { ok: true, value: 7 } });
    expect(seen).toEqual(["meta-123", "tt-456"]);
  });

  test("is not called for failures", async () => {
    const { fetchImpl } = recordingFetch([jsonResponse(409, { ok: false, error: "dup" })]);
    let called = false;
    await apiRequest({ fetchImpl, sleep: noSleep }, { path: "/x", schema: Schema, onResponse: () => void (called = true) });
    expect(called).toBe(false);
  });

  test("is not called when the body does not match the schema", async () => {
    const { fetchImpl } = recordingFetch([jsonResponse(200, { ok: true, value: "nope" })]);
    let called = false;
    await apiRequest({ fetchImpl, sleep: noSleep }, { path: "/x", schema: Schema, onResponse: () => void (called = true) });
    expect(called).toBe(false);
  });
});

describe("apiRequest: error mapping (it never throws)", () => {
  const cases: Array<[number, unknown, string, boolean]> = [
    [400, { ok: false, error: "Enter a valid first name." }, "validation", false],
    [401, { ok: false }, "unauthorized", false],
    [403, { ok: false, error: "cross_site_request_blocked" }, "forbidden", false],
    [404, { ok: false, error: "Not found" }, "not_found", false],
    [409, { ok: false, reason: "closed", error: "Closed." }, "conflict", false],
    [410, { ok: false, error: "This claim is closed." }, "gone", false],
    [413, { ok: false, error: "Payload too large." }, "too_large", false],
    [429, { ok: false, error: "Too many requests." }, "rate_limited", true],
    [500, { ok: false, error: "Could not submit application." }, "server", true],
    [418, { ok: false }, "unexpected", false],
  ];

  test.each(cases)("status %i maps to %s", async (status, body, kind, retryable) => {
    const { fetchImpl } = recordingFetch([jsonResponse(status, body)]);
    const res = await apiRequest({ fetchImpl, sleep: noSleep }, { path: "/x", schema: Schema });
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error.kind).toBe(kind);
    expect(res.error.status).toBe(status);
    expect(res.error.retryable).toBe(retryable);
  });

  test("uses the API's own user-facing message when it sends one, and a safe default when it does not", async () => {
    const withMsg = await apiRequest({ fetchImpl: recordingFetch([jsonResponse(400, { ok: false, error: "Select a valid country." })]).fetchImpl, sleep: noSleep }, { path: "/x", schema: Schema });
    const without = await apiRequest({ fetchImpl: recordingFetch([jsonResponse(401, { ok: false })]).fetchImpl, sleep: noSleep }, { path: "/x", schema: Schema });
    expect(!withMsg.ok && withMsg.error.message).toBe("Select a valid country.");
    expect(!without.ok && without.error.message).toMatch(/sign in/i);
  });

  test("keeps the parsed body on the error so callers can read extra fields like `reason`", async () => {
    const { fetchImpl } = recordingFetch([jsonResponse(409, { ok: false, reason: "closed", error: "Closed." })]);
    const res = await apiRequest({ fetchImpl, sleep: noSleep }, { path: "/x", schema: Schema });
    expect(!res.ok && (res.error.body as { reason: string }).reason).toBe("closed");
  });

  test("an HTML error page (a proxy or gateway failure) becomes a generic server error, never raw markup", async () => {
    const { fetchImpl } = recordingFetch([textResponse(502, "<html><body>Bad gateway</body></html>")]);
    const res = await apiRequest({ fetchImpl, sleep: noSleep }, { path: "/x", schema: Schema });
    expect(!res.ok && res.error.kind).toBe("server");
    expect(!res.ok && res.error.message).not.toContain("<");
  });

  test("a success response that does not match the schema is rejected, not rendered", async () => {
    const { fetchImpl } = recordingFetch([jsonResponse(200, { ok: true, value: "not a number" })]);
    const res = await apiRequest({ fetchImpl, sleep: noSleep }, { path: "/x", schema: Schema });
    expect(res.ok).toBe(false);
    expect(!res.ok && res.error.kind).toBe("invalid_response");
    expect(!res.ok && res.error.detail).toContain("value");
  });

  test("a success response that is not JSON is an invalid response", async () => {
    const { fetchImpl } = recordingFetch([textResponse(200, "<html>ok</html>")]);
    const res = await apiRequest({ fetchImpl, sleep: noSleep }, { path: "/x", schema: Schema });
    expect(!res.ok && res.error.kind).toBe("invalid_response");
  });

  test("network failures and timeouts are typed, retryable errors", async () => {
    const net = await apiRequest({ fetchImpl: recordingFetch([new TypeError("fetch failed")]).fetchImpl, sleep: noSleep }, { path: "/x", schema: Schema });
    const timeout = await apiRequest({ fetchImpl: recordingFetch([new DOMException("t", "TimeoutError")]).fetchImpl, sleep: noSleep }, { path: "/x", schema: Schema });
    expect(!net.ok && net.error).toMatchObject({ kind: "network", retryable: true, status: null });
    expect(!timeout.ok && timeout.error).toMatchObject({ kind: "timeout", retryable: true });
  });

  test("even a non-Error throw is contained", async () => {
    const fetchImpl = async () => {
      throw "boom";
    };
    const res = await apiRequest({ fetchImpl, sleep: noSleep }, { path: "/x", schema: Schema });
    expect(!res.ok && res.error.kind).toBe("network");
  });
});

describe("apiRequest: busy retry", () => {
  const busy = () => jsonResponse(503, { ok: false, retryable: true, error: "The site is busy right now." });

  test("keeps the legacy schedule of ten waits, about five and a half minutes", () => {
    expect(BUSY_RETRY_DELAYS_MS).toEqual([2000, 4000, 8000, 15000, 30000, 30000, 60000, 60000, 60000, 60000]);
  });

  test("retries a retryable 503 with the same body and succeeds when the lock clears", async () => {
    const { fetchImpl, calls } = recordingFetch([busy, busy, jsonResponse(201, { ok: true, value: 3 })]);
    const waits: Array<[number, number]> = [];
    const slept: number[] = [];
    const res = await apiRequest(
      { fetchImpl, sleep: async (ms) => void slept.push(ms) },
      { method: "POST", path: "/api/applications", body: { a: 1 }, schema: Schema, onWait: (attempt, delay) => waits.push([attempt, delay]) },
    );
    expect(res).toEqual({ ok: true, data: { ok: true, value: 3 } });
    expect(calls).toHaveLength(3);
    expect(new Set(calls.map((c) => c.init?.body)).size).toBe(1);
    expect(slept).toEqual([2000, 4000]);
    expect(waits).toEqual([[1, 2000], [2, 4000]]);
  });

  test("gives up after the schedule and reports a busy error", async () => {
    const { fetchImpl, calls } = recordingFetch([busy]);
    const res = await apiRequest({ fetchImpl, sleep: noSleep }, { method: "POST", path: "/x", body: {}, schema: Schema });
    expect(calls).toHaveLength(BUSY_RETRY_DELAYS_MS.length + 1);
    expect(!res.ok && res.error).toMatchObject({ kind: "busy", status: 503, retryable: true });
  });

  test("does NOT retry a 503 the API did not mark retryable (for example applications closed)", async () => {
    const { fetchImpl, calls } = recordingFetch([jsonResponse(503, { ok: false, error: "Applications are not open right now. Please check back soon." })]);
    const res = await apiRequest({ fetchImpl, sleep: noSleep }, { method: "POST", path: "/x", body: {}, schema: Schema });
    expect(calls).toHaveLength(1);
    expect(!res.ok && res.error.kind).toBe("unavailable");
    expect(!res.ok && res.error.message).toBe("Applications are not open right now. Please check back soon.");
  });

  test("retry can be switched off per request", async () => {
    const { fetchImpl, calls } = recordingFetch([busy]);
    const res = await apiRequest({ fetchImpl, sleep: noSleep }, { path: "/x", schema: Schema, retryBusy: false });
    expect(calls).toHaveLength(1);
    expect(!res.ok && res.error.kind).toBe("busy");
  });

  test("stops retrying when the caller aborts", async () => {
    const controller = new AbortController();
    const { fetchImpl, calls } = recordingFetch([busy]);
    const res = await apiRequest(
      { fetchImpl, sleep: async () => controller.abort() },
      { method: "POST", path: "/x", body: {}, schema: Schema, signal: controller.signal },
    );
    expect(calls).toHaveLength(1);
    expect(!res.ok && res.error.kind).toBe("aborted");
  });
});
