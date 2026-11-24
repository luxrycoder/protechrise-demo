import { describe, expect, test } from "vitest";
import {
  acceptOutcome,
  canContinue,
  claimToken,
  describeStartError,
  describeStartInfo,
  type StartInfo,
} from "@/features/claim-start/start";
import type { ApiError, ApiResult } from "@/lib/api/result";
import { ClaimStartInfoSchema } from "@/lib/api/schemas/claim";

const info = (over: Partial<StartInfo> = {}): StartInfo => ({
  ok: true,
  firstName: "Ada",
  cohortName: "Cohort 2",
  feeText: "₦19,500",
  currentTrack: "Data Analysis",
  tracks: ["Data Analysis", "Frontend Development"],
  policyAccepted: false,
  ...over,
});

const error = (kind: ApiError["kind"], status: number | null, message = "msg"): ApiError => ({ kind, status, message, retryable: false });
const failed = <T>(kind: ApiError["kind"], status: number | null, message?: string): ApiResult<T> => ({ ok: false, error: error(kind, status, message) });

describe("claimToken", () => {
  test("reads a plain token", () => expect(claimToken({ token: "abc123_-.~%2F" })).toBe("abc123_-.~%2F"));
  test("takes the first value of a repeated parameter", () => expect(claimToken({ token: ["abc", "def"] })).toBe("abc"));
  test("is empty when missing or blank", () => {
    expect(claimToken({})).toBe("");
    expect(claimToken({ token: "  " })).toBe("");
  });
  test("rejects a token with unexpected characters", () => {
    expect(claimToken({ token: "a b" })).toBe("");
    expect(claimToken({ token: "<script>" })).toBe("");
  });
});

describe("start-info schema", () => {
  test("accepts the plain track names the API sends", () => {
    expect(ClaimStartInfoSchema.parse({ ...info() }).tracks).toEqual(["Data Analysis", "Frontend Development"]);
  });
  test("still accepts track objects and reduces them to names", () => {
    const parsed = ClaimStartInfoSchema.parse({ ...info(), tracks: [{ name: "Data Analysis", slug: "data" }] });
    expect(parsed.tracks).toEqual(["Data Analysis"]);
  });
});

describe("describeStartInfo", () => {
  test("greets the applicant and shows the live fee and cohort", () => {
    const view = describeStartInfo(info());
    expect(view.heading).toBe("Confirm your place, Ada");
    expect(view.intro).toContain("Cohort 2");
    expect(view.feeText).toBe("₦19,500");
  });

  test("preselects the current course", () => {
    const view = describeStartInfo(info());
    expect(view.selectedTrack).toBe("Data Analysis");
    expect(view.options).toEqual([
      { value: "Data Analysis", label: "Data Analysis" },
      { value: "Frontend Development", label: "Frontend Development" },
    ]);
  });

  test("asks the applicant to choose when the old course is not offered in this cohort", () => {
    const view = describeStartInfo(info({ currentTrack: "Cyber Security" }));
    expect(view.selectedTrack).toBe("");
    expect(view.options[0]).toEqual({ value: "", label: "Choose a course" });
    expect(view.options).toHaveLength(3);
  });

  test("handles a missing current course the same way", () => {
    expect(describeStartInfo(info({ currentTrack: "" })).selectedTrack).toBe("");
  });
});

describe("canContinue", () => {
  test("needs the policies accepted and a course chosen", () => {
    expect(canContinue({ accepted: true, track: "Data Analysis" })).toBe(true);
    expect(canContinue({ accepted: false, track: "Data Analysis" })).toBe(false);
    expect(canContinue({ accepted: true, track: "" })).toBe(false);
  });
});

describe("describeStartError", () => {
  test.each([
    ["not_found", 404],
    ["validation", 400],
    ["conflict", 409],
    ["gone", 410],
  ] as const)("a %s answer means the link is not valid any more", (kind, status) => {
    expect(describeStartError(error(kind, status))).toEqual({ kind: "closed" });
  });

  test.each([
    ["rate_limited", 429],
    ["network", null],
    ["timeout", null],
    ["server", 500],
    ["busy", 503],
    ["invalid_response", 200],
  ] as const)("a %s answer is retryable and does not call the link invalid", (kind, status) => {
    expect(describeStartError(error(kind, status))).toEqual({ kind: "retry" });
  });
});

describe("acceptOutcome", () => {
  test("goes to the pay path the API returned", () => {
    expect(acceptOutcome({ ok: true, data: { ok: true, payUrl: "/claim?token=abc-123" } })).toEqual({ kind: "pay", url: "/claim?token=abc-123" });
  });

  test.each(["https://evil.example/claim?token=x", "//evil.example", "/status", "/claim?token=a b", "javascript:alert(1)"])(
    "refuses to follow %s",
    (payUrl) => {
      const outcome = acceptOutcome({ ok: true, data: { ok: true, payUrl } });
      expect(outcome.kind).toBe("error");
    },
  );

  test("shows the API's message when the policies were not accepted", () => {
    expect(acceptOutcome(failed("validation", 400, "You must accept the policies to continue."))).toEqual({
      kind: "error",
      message: "You must accept the policies to continue.",
    });
  });

  test("a course not offered in this cohort stays on the page so another can be picked", () => {
    expect(acceptOutcome(failed("validation", 400, "That course is not offered in this cohort."))).toEqual({
      kind: "error",
      message: "That course is not offered in this cohort.",
    });
  });

  test.each([["not_found", 404], ["gone", 410], ["conflict", 409]] as const)("a %s answer closes the page", (kind, status) => {
    expect(acceptOutcome(failed(kind, status))).toEqual({ kind: "closed" });
  });

  test("a network fault asks the applicant to try again", () => {
    const outcome = acceptOutcome(failed("network", null, "We could not reach the server. Check your connection and try again."));
    expect(outcome).toEqual({ kind: "error", message: "We could not reach the server. Check your connection and try again." });
  });
});
