import { describe, expect, test } from "vitest";
import { LMS_NOT_OPEN, LMS_READY, LMS_UNAVAILABLE, lmsCardView, lmsOpenOutcome } from "@/features/portal/lms-card";
import { buildError } from "@/lib/api/result";
import type { ApiResult } from "@/lib/api/result";
import type { StatusLms } from "@/lib/api/schemas/status";

const ticket = "A".repeat(43);
const ORIGIN = "https://lms.example.com";
const good = `${ORIGIN}/academy/handoff#${ticket}`;
const ok = (data: StatusLms): ApiResult<StatusLms> => ({ ok: true, data });
const fail = (kind: Parameters<typeof buildError>[0], status: number | null): ApiResult<StatusLms> => ({ ok: false, error: buildError(kind, status, null) });

describe("lmsCardView", () => {
  test("ready has the button and no support", () => {
    expect(lmsCardView({ state: "ready" }, "Africa/Lagos", ORIGIN)).toEqual({ state: "ready", message: LMS_READY, opens: null, button: true, showSupport: false });
  });
  test("not open says when, in the cohort's time zone", () => {
    const v = lmsCardView({ state: "not_open", opensAt: "2027-02-01T07:00:00.000Z" }, "Africa/Lagos", ORIGIN);
    expect(v?.message).toBe(LMS_NOT_OPEN);
    expect(v?.opens).toMatch(/^From Monday,? 1 February 2027 (at )?08:00 WAT$/);
    expect(v?.button).toBe(false);
  });
  test("not open with a missing or invalid time gives no time line, and never throws", () => {
    expect(lmsCardView({ state: "not_open" }, "Africa/Lagos", ORIGIN)?.opens).toBeNull();
    expect(lmsCardView({ state: "not_open", opensAt: "garbage" }, "Bad/Zone", ORIGIN)?.opens).toBeNull();
    expect(lmsCardView({ state: "not_open", opensAt: "2027-02-01T07:00:00.000Z" }, "Bad/Zone", ORIGIN)?.opens).toContain("08:00");
    expect(lmsCardView({ state: "not_open", opensAt: "2027-02-01T07:00:00.000Z" }, null, ORIGIN)?.opens).toContain("08:00");
  });
  test("a ready classroom without a configured LMS origin is unavailable, never a dead button", () => {
    expect(lmsCardView({ state: "ready" }, null, null)).toMatchObject({ state: "unavailable", button: false, showSupport: true });
    expect(lmsCardView({ state: "not_open", opensAt: "2027-02-01T07:00:00.000Z" }, null, null)?.state).toBe("not_open");
    expect(lmsCardView({ state: "hidden" }, null, null)).toBeNull();
  });
  test("unavailable points to support and has no button", () => {
    expect(lmsCardView({ state: "unavailable" }, null, ORIGIN)).toEqual({ state: "unavailable", message: LMS_UNAVAILABLE, opens: null, button: false, showSupport: true });
  });
  test.each([[undefined], [{}], [{ state: "hidden" }], [{ state: "disabled" }], [{ state: "something-new" }], [{ state: "" }]])("%j hides the card", (lms) => {
    expect(lmsCardView(lms as never, null, ORIGIN)).toBeNull();
  });
});

describe("lmsOpenOutcome", () => {
  test("opens only the exact hand-off address", () => {
    expect(lmsOpenOutcome(ok({ ok: true, handoffUrl: good }), ORIGIN)).toEqual({ kind: "open", url: good });
  });
  test("an address on any other origin is a failure (the host is pinned)", () => {
    expect(lmsOpenOutcome(ok({ ok: true, handoffUrl: `https://evil.example/academy/handoff#${ticket}` }), ORIGIN)).toEqual({ kind: "failed" });
    expect(lmsOpenOutcome(ok({ ok: true, handoffUrl: `https://lms.example.com.evil.example/academy/handoff#${ticket}` }), ORIGIN)).toEqual({ kind: "failed" });
    expect(lmsOpenOutcome(ok({ ok: true, handoffUrl: good }), null)).toEqual({ kind: "failed" });
  });
  test.each([
    ["ok false", { ok: false, handoffUrl: good }],
    ["no url", { ok: true }],
    ["http", { ok: true, handoffUrl: good.replace("https", "http") }],
    ["other path", { ok: true, handoffUrl: `https://lms.example.com/login#${ticket}` }],
    ["no ticket", { ok: true, handoffUrl: "https://lms.example.com/academy/handoff" }],
    ["javascript", { ok: true, handoffUrl: "javascript:alert(1)" }],
    ["credentials", { ok: true, handoffUrl: `https://a:b@lms.example.com/academy/handoff#${ticket}` }],
  ])("%s is a failure, not a navigation", (_n, data) => {
    expect(lmsOpenOutcome(ok(data as StatusLms), ORIGIN)).toEqual({ kind: "failed" });
  });
  test("401 means signed out; every other error is a failure", () => {
    expect(lmsOpenOutcome(fail("unauthorized", 401), ORIGIN)).toEqual({ kind: "signedOut" });
    for (const [k, s] of [["network", null], ["timeout", null], ["rate_limited", 429], ["server", 500], ["forbidden", 403], ["not_found", 404], ["unavailable", 503]] as const) {
      expect(lmsOpenOutcome(fail(k, s), ORIGIN)).toEqual({ kind: "failed" });
    }
  });
  test("a failure never carries the address", () => {
    expect(JSON.stringify(lmsOpenOutcome(ok({ ok: false, handoffUrl: good }), ORIGIN))).not.toContain(ticket);
  });
});
