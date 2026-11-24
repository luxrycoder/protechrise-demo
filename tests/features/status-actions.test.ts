import { describe, expect, test } from "vitest";
import {
  DEFAULT_TRACK_NOTE,
  describeLms,
  describeSwitcher,
  describeTrackChange,
  handoffOutcome,
  trackChangeConfirmText,
  trackChangeOutcome,
} from "@/features/status/status-actions";
import type { ApiError, ApiResult } from "@/lib/api/result";
import type { StatusMe } from "@/lib/api/schemas/status";

type Full = Extract<StatusMe, { eligible: true }>;

const me = (over: Partial<Full> = {}): Full => ({
  ok: true,
  eligible: true,
  currentApplicationId: 7,
  applications: [{ id: 7, cohortName: "Cohort 2", preferredTrack: "Data Analysis" }],
  fullName: "Ada Obi",
  preferredTrack: "Data Analysis",
  timezone: "Africa/Lagos",
  currentStatus: "accepted",
  statusHistory: [],
  pod: { name: null, state: "preparing", url: null },
  trackChangeEligible: false,
  trackChangeReissuesStudentId: false,
  ...over,
});

const err = (kind: ApiError["kind"], status: number | null, message = "msg", body?: unknown): ApiResult<never> => ({
  ok: false,
  error: { kind, status, message, retryable: false, ...(body === undefined ? {} : { body }) },
});

describe("describeTrackChange", () => {
  test("is absent when the change is closed and nothing was requested", () => {
    expect(describeTrackChange(me())).toBeNull();
  });

  test("offers the other courses with the default note", () => {
    const view = describeTrackChange(me({ trackChangeEligible: true, availableTracks: ["Frontend", "Cyber Security"] }));
    expect(view).toEqual({ kind: "form", options: ["Frontend", "Cyber Security"], note: DEFAULT_TRACK_NOTE, reissueNote: null });
  });

  test("prefers the note the API sends", () => {
    const view = describeTrackChange(me({ trackChangeEligible: true, availableTracks: ["Frontend"], trackChangeLmsNote: "Custom note" }));
    expect(view).toMatchObject({ kind: "form", note: "Custom note" });
  });

  test("warns a paid learner that their Student ID is replaced", () => {
    const view = describeTrackChange(
      me({ trackChangeEligible: true, availableTracks: ["Frontend"], trackChangeReissuesStudentId: true, studentId: "PTR-C02-0042" }),
    );
    expect(view).toMatchObject({ kind: "form" });
    expect((view as { reissueNote: string }).reissueNote).toBe(
      "You can change course once, and an admin reviews every request. If it is approved you will get a new Student ID, and PTR-C02-0042 will stop working.",
    );
  });

  test("the reissue note works without a Student ID on file", () => {
    const view = describeTrackChange(me({ trackChangeEligible: true, availableTracks: [], trackChangeReissuesStudentId: true }));
    expect((view as { reissueNote: string }).reissueNote).toMatch(/new Student ID\.$/);
  });

  test("shows a pending request", () => {
    const view = describeTrackChange(me({ trackChangeRequest: { requestedTrack: "Frontend", status: "pending", decisionNote: null } }));
    expect(view).toEqual({ kind: "request", tone: "pending", text: "Waiting for admin review. Your request to switch to Frontend is pending." });
  });

  test("shows an approved request, with the new Student ID for a paid learner", () => {
    const view = describeTrackChange(
      me({ paymentConfirmed: true, studentId: "PTR-C02-0099", trackChangeRequest: { requestedTrack: "Frontend", status: "approved", decisionNote: null } }),
    );
    expect(view).toEqual({ kind: "request", tone: "approved", text: "Your course change to Frontend was approved. Your new Student ID is PTR-C02-0099." });
  });

  test("shows a declined request with the admin's note", () => {
    const view = describeTrackChange(me({ trackChangeRequest: { requestedTrack: "Frontend", status: "rejected", decisionNote: "Class is full." } }));
    expect(view).toEqual({ kind: "request", tone: "rejected", text: "Your request to switch to Frontend was declined. Class is full." });
  });

  test("explains why the change is closed", () => {
    const view = describeTrackChange(me({ trackChangeClosedReason: "You have already used your one course change." }));
    expect(view).toEqual({ kind: "closed", text: "You have already used your one course change." });
  });

  test("an unknown request status shows nothing rather than a wrong message", () => {
    expect(describeTrackChange(me({ trackChangeRequest: { requestedTrack: "X", status: "weird", decisionNote: null } }))).toBeNull();
  });
});

describe("trackChangeConfirmText", () => {
  test("names both courses", () => {
    expect(trackChangeConfirmText("Data Analysis", "Frontend")).toBe(
      "Switch from Data Analysis to Frontend? Once it is approved you cannot change again.",
    );
  });
});

describe("trackChangeOutcome", () => {
  test("a sent request waits for review", () => {
    expect(trackChangeOutcome({ ok: true, data: { ok: true } })).toEqual({ kind: "sent" });
  });
  test("a closed window shows the API's reason text and refreshes", () => {
    expect(trackChangeOutcome(err("conflict", 409, "You already have a course-change request waiting for review."))).toEqual({
      kind: "closed",
      text: "You already have a course-change request waiting for review.",
    });
  });
  test("a lost session asks to sign in again", () => {
    expect(trackChangeOutcome(err("unauthorized", 401))).toEqual({ kind: "signedOut" });
  });
  test("a course that is not offered is an error the applicant can fix", () => {
    expect(trackChangeOutcome(err("validation", 400, "That course is not available as a change for your cohort."))).toEqual({
      kind: "error",
      text: "That course is not available as a change for your cohort.",
    });
  });
  test("rate limiting and faults are retryable errors", () => {
    expect(trackChangeOutcome(err("rate_limited", 429, "Too many requests. Please try again in a few minutes."))).toEqual({
      kind: "error",
      text: "Too many requests. Please try again in a few minutes.",
    });
    expect(trackChangeOutcome(err("network", null, "We could not reach the server."))).toMatchObject({ kind: "error" });
  });
});

describe("describeSwitcher", () => {
  test("is absent with a single application", () => {
    expect(describeSwitcher(me())).toBeNull();
  });
  test("lists each cohort and selects the current one", () => {
    const view = describeSwitcher(
      me({
        currentApplicationId: 9,
        applications: [
          { id: 7, cohortName: "Cohort 1", preferredTrack: "Data Analysis" },
          { id: 9, cohortName: null, preferredTrack: "Frontend" },
        ],
      }),
    );
    expect(view).toEqual({
      selected: "9",
      options: [
        { value: "7", label: "Cohort 1 · Data Analysis" },
        { value: "9", label: "Earlier cohort · Frontend" },
      ],
    });
  });
});

describe("describeLms", () => {
  test("is hidden when the hand-off is switched off", () => {
    expect(describeLms({ state: "disabled" }).hidden).toBe(true);
  });
  test("ready offers Open LMS", () => {
    expect(describeLms({ state: "ready" })).toMatchObject({ hidden: false, ready: true, button: "Open LMS", message: "Your learning platform is ready. Activate your LMS account or continue to sign in." });
  });
  test("preparing and unavailable offer a re-check", () => {
    expect(describeLms({ state: "preparing" })).toMatchObject({ ready: false, button: "Check LMS access again" });
    expect(describeLms({ state: "unavailable" })).toMatchObject({ button: "Check LMS access again" });
  });
  test("not_eligible has no button", () => {
    expect(describeLms({ state: "not_eligible" })).toMatchObject({ button: null, message: "LMS access is not currently available for this application." });
  });
  test("not_open says when it opens", () => {
    const view = describeLms({ state: "not_open", availableAt: "2026-12-01T09:00:00Z" }, "Africa/Lagos");
    expect(view.message).toMatch(/^Your LMS access opens on Dec 1, 2026/);
    expect(view.button).toBeNull();
  });
  test("not_open without a date falls back to plain text", () => {
    expect(describeLms({ state: "not_open" }).message).toBe("Your LMS access has not opened yet.");
  });
  test("an unknown state is treated as unavailable", () => {
    expect(describeLms({ state: "mystery" }).message).toMatch(/temporarily unavailable/);
  });
  test("shows the LMS stage when it is known", () => {
    expect(describeLms({ state: "ready", lmsStage: "invited" }).stage).toBe("LMS update: your invitation has been sent.");
    expect(describeLms({ state: "ready", lmsStage: "nonsense" }).stage).toBeNull();
    expect(describeLms({ state: "ready" }).stage).toBeNull();
  });
});

describe("handoffOutcome", () => {
  const ORIGIN = "https://learn.example.com";
  const url = "https://learn.example.com/academy/handoff#" + "A".repeat(43);
  test("opens a well-formed hand-off address", () => {
    expect(handoffOutcome({ ok: true, data: { ok: true, state: "ready", handoffUrl: url } }, ORIGIN)).toEqual({ kind: "open", url });
  });
  test("an address on another origin, or with no configured origin, is refused", () => {
    const evil = "https://evil.example/academy/handoff#" + "A".repeat(43);
    expect(handoffOutcome({ ok: true, data: { ok: true, state: "ready", handoffUrl: evil } }, ORIGIN)).toEqual({ kind: "state", data: { state: "unavailable" } });
    expect(handoffOutcome({ ok: true, data: { ok: true, state: "ready", handoffUrl: url } }, null)).toEqual({ kind: "state", data: { state: "unavailable" } });
  });
  test.each([
    "http://learn.example.com/academy/handoff#x",
    "https://user:pw@learn.example.com/academy/handoff#x",
    "https://learn.example.com/elsewhere#x",
    "javascript:alert(1)",
    "not a url",
  ])("refuses %s", (bad) => {
    expect(handoffOutcome({ ok: true, data: { ok: true, state: "ready", handoffUrl: bad } }, ORIGIN)).toEqual({ kind: "state", data: { state: "unavailable" } });
  });
  test("a response without an address shows the state it reports", () => {
    expect(handoffOutcome({ ok: true, data: { ok: true, state: "ready" } }, ORIGIN)).toEqual({ kind: "state", data: { state: "unavailable" } });
  });
  test("a not-ready answer shows the state the API reports", () => {
    expect(handoffOutcome(err("conflict", 409, "x", { ok: false, state: "preparing" }), ORIGIN)).toEqual({ kind: "state", data: { state: "preparing" } });
  });
  test("a lost session asks to sign in again", () => {
    expect(handoffOutcome(err("unauthorized", 401), ORIGIN)).toEqual({ kind: "signedOut" });
  });
  test("an error without a state is unavailable", () => {
    expect(handoffOutcome(err("server", 500), ORIGIN)).toEqual({ kind: "state", data: { state: "unavailable" } });
  });
});
