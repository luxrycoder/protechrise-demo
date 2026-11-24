import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";
import { TASK_CHANGED_NOTICE, announcementsView, checklistView, completeOutcome, eventsView, taskView } from "@/features/portal/items-view";
import { buildError } from "@/lib/api/result";
import type { ApiResult } from "@/lib/api/result";
import { PortalCompleteResponseSchema, PortalHomeSchema, type PortalCompleteResponse, type PortalTask } from "@/lib/api/schemas/portal";

const home = PortalHomeSchema.parse((JSON.parse(readFileSync(path.resolve(__dirname, "../fixtures/api/from-code/portal-home-eligible.json"), "utf8")) as { body: unknown }).body);
const items = home.items!;
const task = (over: Partial<PortalTask> = {}): PortalTask => ({ id: 1, title: "T", taskType: "confirm", required: true, done: false, ...over });
const ok = (data: unknown): ApiResult<PortalCompleteResponse> => ({ ok: true, data: PortalCompleteResponseSchema.parse(data) });
const fail = (kind: Parameters<typeof buildError>[0], status: number | null, body?: unknown): ApiResult<PortalCompleteResponse> => ({ ok: false, error: buildError(kind, status, body ?? null) });

describe("taskView", () => {
  test("confirm, consent and info", () => {
    expect(taskView(task())).toMatchObject({ kind: "confirm", actionable: true, required: true, button: "I've done this", doneLabel: null, canComplete: true });
    expect(taskView(task({ taskType: "consent", contentHash: "h" }))).toMatchObject({ kind: "consent", button: "I accept", canComplete: true });
    expect(taskView(task({ taskType: "info", required: false }))).toMatchObject({ kind: "info", actionable: false, button: null, doneLabel: null, canComplete: false });
  });
  test("done tasks show their label and no button", () => {
    expect(taskView(task({ done: true }))).toMatchObject({ button: null, doneLabel: "Done" });
    expect(taskView(task({ taskType: "consent", contentHash: "h", done: true }))).toMatchObject({ button: null, doneLabel: "Accepted" });
  });
  test("a consent task without a wording hash cannot be completed", () => {
    expect(taskView(task({ taskType: "consent" }))?.canComplete).toBe(false);
  });
  test("a read-only task is never 'required', even if flagged", () => {
    expect(taskView(task({ taskType: "info", required: true }))?.required).toBe(false);
    expect(taskView(task({ taskType: "weird", required: true }))).toMatchObject({ kind: "info", required: false });
  });
  test("blank titles are dropped; text is trimmed; unsafe links are dropped", () => {
    expect(taskView(task({ title: "   " }))).toBeNull();
    expect(taskView(task({ title: " Hi ", body: "  ", linkUrl: "javascript:alert(1)" }))).toMatchObject({ title: "Hi", body: null, link: null });
    expect(taskView(task({ linkUrl: "https://example.com/x" }))?.link).toBe("https://example.com/x");
    expect(taskView(task({ linkUrl: "/community" }))?.link).toBe("/community");
  });
  test("html in staff text stays text (the view never interprets it)", () => {
    expect(taskView(task({ title: "<img src=x onerror=alert(1)>" }))?.title).toBe("<img src=x onerror=alert(1)>");
  });
});

describe("checklistView", () => {
  test("from the fixture: three tasks, two required steps left", () => {
    const v = checklistView(items.tasks);
    expect(v?.tasks).toHaveLength(3);
    expect(v?.summary).toBe("2 required steps left");
  });
  test("empty or all-blank means the section is hidden", () => {
    expect(checklistView([])).toBeNull();
    expect(checklistView([task({ title: " " })])).toBeNull();
  });
  test("all done, and no required tasks", () => {
    expect(checklistView([task({ done: true })])?.summary).toBe("All required steps are done");
    expect(checklistView([task({ taskType: "info", required: false })])?.summary).toBeNull();
  });
});

describe("announcementsView and eventsView", () => {
  test("announcements: a day in the cohort's zone", () => {
    expect(announcementsView(items.announcements, "Africa/Lagos")).toEqual([{ id: 4, title: "Welcome", body: "We start soon.", day: "3 November 2026" }]);
    expect(announcementsView([{ id: 1, title: "X", publishedAt: "garbage" }], "Bad/Zone")?.[0]?.day).toBeNull();
    expect(announcementsView([], null)).toBeNull();
    expect(announcementsView([{ id: 1, title: " " }], null)).toBeNull();
  });
  test("events: when, safe link", () => {
    const v = eventsView(items.events, "Africa/Lagos");
    expect(v?.[0]).toMatchObject({ id: 5, title: "Orientation", link: "https://example.com/join" });
    expect(v?.[0]?.when).toMatch(/^Saturday,? 30 January 2027 (at )?17:00 WAT$/);
    expect(eventsView([{ id: 1, title: "E", startsAt: "2027-01-30T16:00:00.000Z", linkUrl: "http://insecure.test" }], null)?.[0]?.link).toBeNull();
  });
  test("an event with an unreadable start is dropped, not shown with a made-up time", () => {
    expect(eventsView([{ id: 1, title: "E", startsAt: "soon" }], null)).toBeNull();
    expect(eventsView([], null)).toBeNull();
  });
});

describe("completeOutcome", () => {
  const done = { id: 1, title: "T", taskType: "confirm", required: true, done: true };
  test("success returns the updated task", () => {
    expect(completeOutcome(ok({ ok: true, task: done }), 1)).toMatchObject({ kind: "updated", task: { id: 1, done: true } });
  });
  test("a gate body (no task) or a task for a different item means reload", () => {
    expect(completeOutcome(ok({ ok: true, state: "not_paid" }), 1)).toEqual({ kind: "reload" });
    expect(completeOutcome(ok({ ok: true, task: { ...done, id: 2 } }), 1)).toEqual({ kind: "reload" });
    expect(completeOutcome(ok({ ok: true, task: "garbage" }), 1)).toEqual({ kind: "reload" });
  });
  test("409 with the fresh task asks to read again", () => {
    const fresh = { id: 1, title: "T", taskType: "consent", contentHash: "new", done: false };
    expect(completeOutcome(fail("conflict", 409, { ok: false, error: "x", task: fresh }), 1)).toMatchObject({ kind: "changed", task: { contentHash: "new" } });
    expect(TASK_CHANGED_NOTICE).toContain("wording changed");
  });
  test("409 without a usable task, or for another item, is a failure", () => {
    expect(completeOutcome(fail("conflict", 409, { ok: false }), 1)).toEqual({ kind: "failed" });
    expect(completeOutcome(fail("conflict", 409, null), 1)).toEqual({ kind: "failed" });
    expect(completeOutcome(fail("conflict", 409, { task: { id: 9, title: "x" } }), 1)).toEqual({ kind: "failed" });
  });
  test("401 signs out; 404 reloads; everything else fails", () => {
    expect(completeOutcome(fail("unauthorized", 401), 1)).toEqual({ kind: "signedOut" });
    expect(completeOutcome(fail("not_found", 404), 1)).toEqual({ kind: "reload" });
    for (const [k, s] of [["network", null], ["timeout", null], ["rate_limited", 429], ["validation", 400], ["server", 500], ["busy", 503], ["forbidden", 403]] as const) {
      expect(completeOutcome(fail(k, s), 1)).toEqual({ kind: "failed" });
    }
  });
});
