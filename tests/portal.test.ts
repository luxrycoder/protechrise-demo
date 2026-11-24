import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";
import { PortalCompleteResponseSchema, PortalHomeResponseSchema, type PortalHome, type PortalTask } from "@/lib/api/schemas/portal";
import {
  checklistSummary, completionInput, countdownText, formatDay, formatInstant, instantMs, handoffHref, interpretPortal, isActionable, parseLmsOrigin,
  replaceTask, requiredLeft, retryDelaySeconds, safeLink, safeSupportUrl, startText, supportView, validTimeZone, DEFAULT_SUPPORT_TEXT,
} from "@/lib/portal";

const fixture = (name: string) => (JSON.parse(readFileSync(path.resolve(__dirname, "fixtures/api/from-code", `${name}.json`), "utf8")) as { body: unknown }).body;
const task = (over: Partial<PortalTask>): PortalTask => ({ id: 1, title: "t", taskType: "confirm", required: true, done: false, ...over });

describe("safeLink", () => {
  test.each(["https://example.com/a", "/community", "/status", "/portal"])("keeps %s", (v) => expect(safeLink(v)).not.toBeNull());
  test.each(["javascript:alert(1)", "http://example.com", "data:text/html,x", "//evil.test", "/admin", "https://user:pw@example.com", "", null, 5, undefined])("drops %s", (v) => expect(safeLink(v)).toBeNull());
});

describe("safeSupportUrl and supportView", () => {
  test("accepts https and mailto only", () => {
    expect(safeSupportUrl("mailto:help@example.com")).toBe("mailto:help@example.com");
    expect(safeSupportUrl("https://example.com/help")).toBe("https://example.com/help");
    expect(safeSupportUrl("http://example.com")).toBeNull();
    expect(safeSupportUrl("javascript:alert(1)")).toBeNull();
    expect(safeSupportUrl("mailto: ")).toBeNull();
  });
  test("falls back to the default wording", () => {
    expect(supportView(null)).toEqual({ text: DEFAULT_SUPPORT_TEXT, url: null });
    expect(supportView({ text: "  ", url: "http://x.test" })).toEqual({ text: DEFAULT_SUPPORT_TEXT, url: null });
    expect(supportView({ text: "Call us", url: "https://x.test/" })).toEqual({ text: "Call us", url: "https://x.test/" });
  });
});

describe("parseLmsOrigin", () => {
  test("an https origin, normalised", () => {
    expect(parseLmsOrigin("https://learn.example.com")).toBe("https://learn.example.com");
    expect(parseLmsOrigin(" https://learn.example.com/ ")).toBe("https://learn.example.com");
    expect(parseLmsOrigin("HTTPS://Learn.Example.com:8443/")).toBe("https://learn.example.com:8443");
  });
  test("plain http only for this machine, and only when allowed", () => {
    expect(parseLmsOrigin("http://localhost:3000")).toBeNull();
    expect(parseLmsOrigin("http://localhost:3000", true)).toBe("http://localhost:3000");
    expect(parseLmsOrigin("http://127.0.0.1:3000/", true)).toBe("http://127.0.0.1:3000");
    expect(parseLmsOrigin("http://learn.example.com", true)).toBeNull();
    expect(parseLmsOrigin("http://localhost.evil.example", true)).toBeNull();
  });
  test.each([
    ["a path", "https://learn.example.com/academy"],
    ["a query", "https://learn.example.com/?x=1"],
    ["a fragment", "https://learn.example.com/#x"],
    ["credentials", "https://u:p@learn.example.com"],
    ["a different scheme", "ftp://learn.example.com"],
    ["no scheme", "learn.example.com"],
    ["whitespace inside", "https://learn .example.com"],
    ["a newline inside", "https://learn.exam\nple.com"],
    ["a backslash", "https://learn.example.com\\@evil.example"],
    ["empty", ""],
  ])("refuses %s", (_n, v) => expect(parseLmsOrigin(v, true)).toBeNull());
  test("refuses non-strings; trims the whitespace an env file leaves around a value", () => {
    for (const v of [undefined, null, 5, {}]) expect(parseLmsOrigin(v)).toBeNull();
    expect(parseLmsOrigin("https://learn.example.com\n")).toBe("https://learn.example.com");
  });
});

describe("handoffHref", () => {
  const ticket = "A".repeat(43);
  const origin = "https://learn.example.com";
  const good = `${origin}/academy/handoff#${ticket}`;
  test("accepts the exact hand-off address on the configured origin, and returns the parsed href", () => {
    expect(handoffHref(good, origin)).toBe(good);
    expect(handoffHref(`HTTPS://LEARN.EXAMPLE.COM/academy/handoff#${ticket}`, origin)).toBe(good);
    expect(handoffHref(`http://localhost:3000/academy/handoff#${ticket}`, "http://localhost:3000")).toBe(`http://localhost:3000/academy/handoff#${ticket}`);
  });
  test("nothing is accepted without a configured origin", () => {
    expect(handoffHref(good, null)).toBeNull();
    expect(handoffHref(good, undefined)).toBeNull();
    expect(handoffHref(good, "")).toBeNull();
  });
  test.each([
    ["an attacker host with the right path", `https://evil.example/academy/handoff#${ticket}`],
    ["a look-alike suffix host", `https://learn.example.com.evil.example/academy/handoff#${ticket}`],
    ["a look-alike prefix host", `https://evil-learn.example.com/academy/handoff#${ticket}`],
    ["a user-info trick", `https://learn.example.com@evil.example/academy/handoff#${ticket}`],
    ["credentials on the real host", `https://u:p@learn.example.com/academy/handoff#${ticket}`],
    ["a different port", `https://learn.example.com:8443/academy/handoff#${ticket}`],
    ["a unicode look-alike host", `https://learn.exampl\u0435.com/academy/handoff#${ticket}`],
    ["plain http on the real host", `http://learn.example.com/academy/handoff#${ticket}`],
    ["http loopback when the origin is the real one", `http://localhost:9999/academy/handoff#${ticket}`],
    ["another path", `${origin}/login#${ticket}`],
    ["a trailing slash", `${origin}/academy/handoff/#${ticket}`],
    ["an encoded path", `${origin}/academy/%68andoff#${ticket}`],
    ["a query", `${origin}/academy/handoff?next=//evil.example#${ticket}`],
    ["a 44-character ticket", `${good}A`],
    ["a 42-character ticket", `${origin}/academy/handoff#${ticket.slice(1)}`],
    ["a ticket with a slash", `${origin}/academy/handoff#${"A".repeat(42)}/`],
    ["no ticket", `${origin}/academy/handoff`],
    ["a trailing newline", `${good}\n`],
    ["a tab inside", `https://learn.exam\tple.com/academy/handoff#${ticket}`],
    ["a backslash", `https://evil.example\\@learn.example.com/academy/handoff#${ticket}`],
    ["javascript:", `javascript:alert(1)//${origin}/academy/handoff#${ticket}`],
    ["not a URL", "nope"],
  ])("refuses %s", (_n, url) => expect(handoffHref(url, origin)).toBeNull());
  test("refuses non-strings", () => {
    for (const v of [undefined, null, 42, {}, []]) expect(handoffHref(v, origin)).toBeNull();
  });
  test("dot segments cannot smuggle another path past the check", () => {
    // The browser would open the normalised address, which is what is checked and returned.
    expect(handoffHref(`${origin}/x/../academy/handoff#${ticket}`, origin)).toBe(good);
    expect(handoffHref(`${origin}/academy/handoff/../login#${ticket}`, origin)).toBeNull();
  });
});

describe("time zones and instants", () => {
  test("validTimeZone never throws", () => {
    expect(validTimeZone("Europe/London")).toBe("Europe/London");
    expect(validTimeZone("Not/AZone")).toBe("Africa/Lagos");
    expect(validTimeZone(5)).toBe("Africa/Lagos");
    expect(validTimeZone("bogus", null)).toBeNull();
  });
  test("instantMs", () => {
    expect(instantMs("2027-02-01T08:00:00.000Z")).toBe(Date.UTC(2027, 1, 1, 8));
    expect(instantMs("not a date")).toBeNull();
    expect(instantMs(null)).toBeNull();
  });
  test("formatInstant and formatDay tolerate bad input", () => {
    expect(formatInstant("2027-02-01T08:00:00.000Z", "Africa/Lagos")).toMatch(/^Monday,? 1 February 2027 (at )?09:00 WAT$/);
    expect(formatInstant("nope", "Africa/Lagos")).toBeNull();
    expect(formatInstant("2027-02-01T08:00:00.000Z", "Bad/Zone")).toContain("09:00");
    expect(formatDay("2026-11-02T23:30:00.000Z", "Africa/Lagos")).toBe("3 November 2026");
    expect(formatDay(undefined, "Africa/Lagos")).toBeNull();
  });
});

describe("countdownText", () => {
  const now = Date.UTC(2027, 0, 1, 0, 0);
  test("days and hours", () => expect(countdownText(new Date(now + (68 * 24 + 2) * 3_600_000).toISOString(), now)).toBe("68 days, 2 hours"));
  test("singular", () => expect(countdownText(new Date(now + (24 + 1) * 3_600_000).toISOString(), now)).toBe("1 day, 1 hour"));
  test("hours and minutes", () => expect(countdownText(new Date(now + (3 * 60 + 5) * 60_000).toISOString(), now)).toBe("3 hours, 5 minutes"));
  test("never shows 0 minutes", () => expect(countdownText(new Date(now + 5_000).toISOString(), now)).toBe("1 minute"));
  test("started, never negative", () => {
    expect(countdownText(new Date(now).toISOString(), now)).toBe("Classes have started");
    expect(countdownText(new Date(now - 1e9).toISOString(), now)).toBe("Classes have started");
  });
  test("unknown start", () => {
    expect(countdownText(null, now)).toBe("To be confirmed");
    expect(countdownText("garbage", now)).toBe("To be confirmed");
  });
});

describe("startText", () => {
  test("cohort zone only when the learner is in the same zone or has none", () => {
    expect(startText({ startsAt: "2027-02-01T08:00:00.000Z", cohortTimezone: "Africa/Lagos", learnerTimezone: null })).toMatch(/^Monday,? 1 February 2027 (at )?09:00 WAT$/);
    expect(startText({ startsAt: "2027-02-01T08:00:00.000Z", cohortTimezone: "Africa/Lagos", learnerTimezone: "Africa/Lagos" })).not.toContain("where you are");
  });
  test("adds the learner's time when it is the same day", () => {
    const text = startText({ startsAt: "2027-02-01T08:00:00.000Z", cohortTimezone: "Africa/Lagos", learnerTimezone: "Europe/London" });
    expect(text).toMatch(/\(08:00 (GMT|UTC)[^)]* where you are\)$/);
  });
  test("adds the full date when the day differs", () => {
    const text = startText({ startsAt: "2027-02-01T23:30:00.000Z", cohortTimezone: "Africa/Lagos", learnerTimezone: "America/Los_Angeles" });
    expect(text).toMatch(/^Tuesday,? 2 February 2027/);
    expect(text).toMatch(/\(Monday,? 1 February 2027/);
    expect(text).toContain("where you are");
  });
  test("an invalid learner zone is ignored; a missing start says so", () => {
    expect(startText({ startsAt: "2027-02-01T08:00:00.000Z", learnerTimezone: "Bad/Zone" })).not.toContain("where you are");
    expect(startText(undefined)).toBe("We will confirm your start date soon.");
    expect(startText({ startsAt: "nope" })).toBe("We will confirm your start date soon.");
  });
});

describe("retryDelaySeconds", () => {
  test.each([[30, 30], [undefined, 30], [null, 30], [0, 30], [-5, 30], [1, 10], [99999, 300], [Number.NaN, 30]])("%s -> %s", (hint, expected) => expect(retryDelaySeconds(hint as number | undefined)).toBe(expected));
});

describe("interpretPortal", () => {
  test("a cleared learner gets the home", () => {
    const view = interpretPortal(PortalHomeResponseSchema.parse(fixture("portal-home-eligible")));
    expect(view.kind).toBe("home");
    if (view.kind === "home") {
      expect(view.home.learner?.firstName).toBe("Ada");
      expect(view.home.items?.tasks).toHaveLength(3);
    }
  });
  test("confirming carries a bounded retry; stuck carries support", () => {
    expect(interpretPortal(PortalHomeResponseSchema.parse(fixture("portal-state-confirming")))).toMatchObject({ kind: "gate", gate: "confirming", retryAfterSeconds: 30 });
    const stuck = interpretPortal(PortalHomeResponseSchema.parse(fixture("portal-home-stuck")));
    expect(stuck).toMatchObject({ kind: "gate", gate: "stuck", retryAfterSeconds: null });
    if (stuck.kind === "gate") expect(stuck.support.url).toBe("https://example.com/help");
  });
  test("not_paid is its own gate", () => {
    expect(interpretPortal(PortalHomeResponseSchema.parse(fixture("portal-home-not-paid")))).toMatchObject({ kind: "gate", gate: "not_paid" });
  });
  test("an unknown or internal state is the generic unavailable gate", () => {
    for (const state of ["blocked", "closed", "something-new", ""]) {
      expect(interpretPortal({ ok: true, state })).toMatchObject({ kind: "gate", gate: "unavailable", retryAfterSeconds: null });
    }
  });
});

describe("home schema is lenient per block", () => {
  test("a malformed block hides that card, not the page", () => {
    const parsed = PortalHomeResponseSchema.parse({ ok: true, state: "eligible", learner: "oops", receipt: { reference: 5 }, lms: [], items: { tasks: "x" } }) as PortalHome;
    expect(parsed.learner).toBeUndefined();
    expect(parsed.receipt).toBeUndefined();
    expect(parsed.lms).toBeUndefined();
    expect(parsed.items?.tasks).toEqual([]);
  });
  test("bad list entries are dropped, good ones kept", () => {
    const parsed = PortalHomeResponseSchema.parse({ state: "eligible", items: { tasks: [{ id: 1, title: "ok" }, { id: "x" }, null], events: [{ id: 2, title: "e" }] } }) as PortalHome;
    expect(parsed.items?.tasks.map((t) => t.id)).toEqual([1]);
    expect(parsed.items?.events).toEqual([]);
  });
  test("extra fields from a newer API are tolerated", () => {
    expect(PortalHomeResponseSchema.safeParse({ state: "eligible", future: { a: 1 } }).success).toBe(true);
  });
  test("complete response carries the fresh task", () => {
    const parsed = PortalCompleteResponseSchema.parse({ ok: true, task: { id: 2, title: "x", taskType: "consent", done: true } });
    expect(parsed.task?.done).toBe(true);
    expect(PortalCompleteResponseSchema.parse({ ok: true, task: "bad" }).task).toBeUndefined();
  });
});

describe("checklist helpers", () => {
  const tasks = [task({ id: 1 }), task({ id: 2, taskType: "consent", contentHash: "h" }), task({ id: 3, taskType: "info", required: false }), task({ id: 4, done: true })];
  test("only confirm and consent are actionable", () => {
    expect(tasks.map(isActionable)).toEqual([true, true, false, true]);
  });
  test("requiredLeft and summary", () => {
    expect(requiredLeft(tasks)).toBe(2);
    expect(checklistSummary(tasks)).toBe("2 required steps left");
    expect(checklistSummary([task({ id: 1, done: true })])).toBe("All required steps are done");
    expect(checklistSummary([task({ id: 1, required: false }), task({ id: 2, taskType: "info" })])).toBeNull();
    expect(checklistSummary([task({})])).toBe("1 required step left");
    expect(checklistSummary([])).toBeNull();
  });
  test("completionInput", () => {
    expect(completionInput(tasks[0]!)).toEqual({ itemId: 1 });
    expect(completionInput(tasks[1]!)).toEqual({ itemId: 2, acceptedHash: "h" });
    expect(completionInput(task({ taskType: "consent" }))).toBeNull();
    expect(completionInput(tasks[2]!)).toBeNull();
  });
  test("replaceTask swaps by id and ignores unknown ids", () => {
    const next = task({ id: 2, done: true });
    expect(replaceTask(tasks, next)[1]).toBe(next);
    expect(replaceTask(tasks, task({ id: 99 }))).toEqual(tasks);
  });
});
