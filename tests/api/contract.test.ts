import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import type { z } from "zod";
import { describe, expect, test } from "vitest";
import { buildError, kindForStatus } from "@/lib/api/result";
import { CheckEmailResponseSchema, SubmitResponseSchema } from "@/lib/api/schemas/applications";
import { OkMessageSchema, OkSchema } from "@/lib/api/schemas/common";
import { ClaimAcceptResponseSchema, ClaimConfirmedSchema, ClaimStartInfoSchema } from "@/lib/api/schemas/claim";
import { PortalGateSchema, PortalHomeResponseSchema } from "@/lib/api/schemas/portal";
import { ReferrerMeSchema } from "@/lib/api/schemas/referrer";
import { StatusMeSchema } from "@/lib/api/schemas/status";
import { parseFeeResponse } from "@/lib/fee";
import { parseTracksResponse } from "@/lib/tracks";

type Fixture = { _source?: string; request: { method: string; path: string }; status: number; body: unknown };

const DIR = path.resolve(__dirname, "../fixtures/api");
const CODE_DIR = path.join(DIR, "from-code");
const load = (dir: string, name: string): Fixture => JSON.parse(readFileSync(path.join(dir, `${name}.json`), "utf8")) as Fixture;
const names = (dir: string) => readdirSync(dir).filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, ""));

const ok = (schema: z.ZodType) => (body: unknown) => schema.safeParse(body).success;

/**
 * Recorded from the dev API (scripts/record-api-fixtures.mjs). Success bodies must satisfy their schema;
 * every non-2xx body must be the API's error envelope. A new recording fails this test until it is listed.
 */
const RECORDED_SUCCESS: Record<string, (body: unknown) => boolean> = {
  tracks: (b) => parseTracksResponse(b) !== null,
  "public-fee": (b) => parseFeeResponse(b) !== null,
  "check-email-ok": ok(CheckEmailResponseSchema),
  "claim-confirmed-unknown": ok(ClaimConfirmedSchema),
  "status-request-link-invalid": ok(OkMessageSchema),
  "referrer-request-link-invalid": ok(OkMessageSchema),
  "status-logout": ok(OkSchema),
  "referrer-logout": ok(OkSchema),
};

const RECORDED_ERRORS: Record<string, string> = {
  "check-email-invalid": "validation",
  "applications-empty": "validation",
  "waitlist-empty": "validation",
  "referrer-apply-empty": "validation",
  "status-me-anonymous": "unauthorized",
  "status-track-change-anonymous": "unauthorized",
  "referrer-me-anonymous": "unauthorized",
  "claim-start-info-bogus": "not_found",
  "claim-accept-bogus": "not_found",
  "portal-state-anonymous": "not_found",
  "portal-home-anonymous": "not_found",
};

describe("contract: recorded dev-API responses", () => {
  test("every recorded fixture is covered by this test", () => {
    const covered = new Set([...Object.keys(RECORDED_SUCCESS), ...Object.keys(RECORDED_ERRORS)]);
    expect(names(DIR).filter((n) => !covered.has(n))).toEqual([]);
  });

  test.each(Object.keys(RECORDED_SUCCESS))("%s: a 2xx body that satisfies its schema", (name) => {
    const fixture = load(DIR, name);
    expect(fixture.status).toBeGreaterThanOrEqual(200);
    expect(fixture.status).toBeLessThan(300);
    expect(RECORDED_SUCCESS[name]?.(fixture.body)).toBe(true);
  });

  test.each(Object.entries(RECORDED_ERRORS))("%s: an error envelope the client classifies as %s", (name, kind) => {
    const fixture = load(DIR, name);
    expect(fixture.status).toBeGreaterThanOrEqual(400);
    const body = fixture.body as { ok?: boolean; error?: string };
    expect(body.ok).toBe(false);
    const error = buildError(kindForStatus(fixture.status, false), fixture.status, fixture.body);
    expect(error.kind).toBe(kind);
    expect(error.message.length).toBeGreaterThan(0);
    expect(error.message).not.toMatch(/[<>]/);
  });

  test("a 400 from the application endpoint gives a message safe to show next to the form", () => {
    const fixture = load(DIR, "applications-empty");
    expect(buildError("validation", fixture.status, fixture.body).message).toBe("Enter a valid first name.");
  });

  test("an anonymous portal request is a plain 404 (the portal flag is off on dev)", () => {
    expect(load(DIR, "portal-state-anonymous").status).toBe(404);
    expect(PortalGateSchema.safeParse({ ok: true, state: "eligible", extra: 1 }).success).toBe(true);
  });
});

describe("contract: shapes derived from the legacy handlers (not recordable without a session)", () => {
  const SUCCESS: Record<string, z.ZodType> = {
    "application-submit-ok": SubmitResponseSchema,
    "status-me-eligible": StatusMeSchema,
    "status-me-paid": StatusMeSchema,
    "status-me-not-eligible": StatusMeSchema,
    "claim-start-info-ok": ClaimStartInfoSchema,
    "claim-accept-ok": ClaimAcceptResponseSchema,
    "claim-confirmed-paid": ClaimConfirmedSchema,
    "claim-confirmed-pending": ClaimConfirmedSchema,
    "referrer-me-ok": ReferrerMeSchema,
    "portal-home-eligible": PortalHomeResponseSchema,
    "portal-home-stuck": PortalHomeResponseSchema,
    "portal-home-not-paid": PortalHomeResponseSchema,
    "portal-state-confirming": PortalGateSchema,
  };
  const ERRORS: Record<string, { kind: string; retryable: boolean; extra?: string }> = {
    "application-submit-busy": { kind: "busy", retryable: true },
    "application-submit-closed": { kind: "unavailable", retryable: true },
    "application-submit-duplicate": { kind: "conflict", retryable: false },
    "status-track-change-closed": { kind: "conflict", retryable: false, extra: "reason" },
    "claim-accept-not-accepted": { kind: "validation", retryable: false },
  };

  test("every derived fixture is covered and says it is derived", () => {
    expect(names(CODE_DIR).filter((n) => !(n in SUCCESS) && !(n in ERRORS))).toEqual([]);
    for (const n of names(CODE_DIR)) expect(load(CODE_DIR, n)._source).toMatch(/Derived by hand/);
  });

  test.each(Object.keys(SUCCESS))("%s parses with its schema", (name) => {
    const result = SUCCESS[name]?.safeParse(load(CODE_DIR, name).body);
    expect(result?.success, JSON.stringify(result?.success === false ? result.error.issues : null)).toBe(true);
  });

  test.each(Object.entries(ERRORS))("%s is classified as %s", (name, expected) => {
    const fixture = load(CODE_DIR, name);
    const retryableFlag = (fixture.body as { retryable?: boolean }).retryable === true;
    const error = buildError(kindForStatus(fixture.status, retryableFlag), fixture.status, fixture.body);
    expect(error.kind).toBe(expected.kind);
    expect(error.retryable).toBe(expected.retryable);
    if (expected.extra) expect((error.body as Record<string, unknown>)[expected.extra]).toBeDefined();
  });

  test("the status payload is normalised so callers can switch on `eligible`", () => {
    const notYet = StatusMeSchema.parse(load(CODE_DIR, "status-me-not-eligible").body);
    const full = StatusMeSchema.parse(load(CODE_DIR, "status-me-eligible").body);
    expect(notYet.eligible).toBe(false);
    expect(full.eligible).toBe(true);
    if (full.eligible) expect(full.currentStatus).toBe("accepted");
  });

  test("an unexpected status payload is rejected rather than half-parsed", () => {
    expect(StatusMeSchema.safeParse({ ok: true, fullName: "x" }).success).toBe(false);
    expect(ClaimConfirmedSchema.safeParse({ ok: true, found: true, paid: "yes" }).success).toBe(false);
  });
});
