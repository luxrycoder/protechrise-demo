import { describe, expect, test } from "vitest";
import { SIGN_IN_HREF, eyebrowText, gateCopy, screenFromResult, welcomeText } from "@/features/portal/portal-screen";
import { buildError } from "@/lib/api/result";
import type { ApiResult } from "@/lib/api/result";
import type { PortalHomeResponse } from "@/lib/api/schemas/portal";
import { MAX_POLLS, MAX_RETRY_SECONDS, nextPollSeconds } from "@/lib/portal";
import { isSafeLocalPath } from "@/features/status/status-view";

const fail = (kind: Parameters<typeof buildError>[0], status: number | null): ApiResult<PortalHomeResponse> => ({ ok: false, error: buildError(kind, status, null) });
const okBody = (body: PortalHomeResponse): ApiResult<PortalHomeResponse> => ({ ok: true, data: body });

describe("screenFromResult", () => {
  test("401 asks to sign in; 404 is the switched-off portal", () => {
    expect(screenFromResult(fail("unauthorized", 401))).toEqual({ kind: "signIn" });
    expect(screenFromResult(fail("not_found", 404))).toEqual({ kind: "off" });
  });
  test("a cancelled request keeps showing loading", () => {
    expect(screenFromResult(fail("aborted", null))).toEqual({ kind: "loading" });
  });
  test.each([["network", null, true], ["timeout", null, true], ["rate_limited", 429, true], ["busy", 503, true], ["server", 500, true], ["invalid_response", 200, false]] as const)(
    "%s is an error screen (retryable: %s)", (kind, status, retryable) => {
      const screen = screenFromResult(fail(kind, status));
      expect(screen).toMatchObject({ kind: "error", retryable });
      if (screen.kind === "error") expect(screen.message.length).toBeGreaterThan(0);
    });
  test("gate and home answers", () => {
    expect(screenFromResult(okBody({ state: "confirming", retryAfterSeconds: 30 }))).toMatchObject({ kind: "gate", gate: "confirming", retryAfterSeconds: 30 });
    expect(screenFromResult(okBody({ state: "eligible" }))).toMatchObject({ kind: "home" });
    expect(screenFromResult(okBody({ state: "???" }))).toMatchObject({ kind: "gate", gate: "unavailable" });
  });
});

describe("gateCopy", () => {
  test("only confirming waits; only stuck shows support; not_paid links to status", () => {
    expect(gateCopy("confirming")).toMatchObject({ waiting: true, showSupport: false, action: null });
    expect(gateCopy("stuck")).toMatchObject({ waiting: false, showSupport: true });
    expect(gateCopy("not_paid").action).toEqual({ label: "Check your status", href: "/status" });
    expect(gateCopy("unavailable").waiting).toBe(false);
  });
});

test("the sign-in link returns to the portal through a path the status page accepts", () => {
  const next = new URL(SIGN_IN_HREF, "https://x.test").searchParams.get("next");
  expect(next).toBe("/portal");
  expect(isSafeLocalPath(next)).toBe(true);
});

describe("welcome and eyebrow", () => {
  test("skip what is missing", () => {
    expect(welcomeText({ state: "eligible", learner: { firstName: " Ada " } })).toBe("Welcome, Ada");
    expect(welcomeText({ state: "eligible" })).toBe("Welcome, scholar");
    expect(welcomeText({ state: "eligible", learner: { firstName: "  " } })).toBe("Welcome, scholar");
    expect(eyebrowText({ state: "eligible", learner: { track: "Data", cohortName: "Cohort 1" } })).toBe("Data · Cohort 1");
    expect(eyebrowText({ state: "eligible", learner: { track: null, cohortName: "Cohort 1" } })).toBe("Cohort 1");
    expect(eyebrowText({ state: "eligible" })).toBe("");
  });
});

describe("nextPollSeconds", () => {
  test("uses the hint, backs off, and stops", () => {
    expect(nextPollSeconds(30, 0)).toBe(30);
    expect(nextPollSeconds(30, 9)).toBe(30);
    expect(nextPollSeconds(30, 10)).toBe(45);
    expect(nextPollSeconds(30, 20)).toBe(60);
    expect(nextPollSeconds(undefined, 0)).toBe(30);
    expect(nextPollSeconds(300, 110)).toBe(MAX_RETRY_SECONDS);
    expect(nextPollSeconds(30, MAX_POLLS)).toBeNull();
    expect(nextPollSeconds(30, -1)).toBeNull();
    expect(nextPollSeconds(30, 1.5)).toBeNull();
  });
});
