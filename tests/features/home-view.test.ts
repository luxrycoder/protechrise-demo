import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";
import { COMMUNITY_PREPARING, DASH, buildHomeView } from "@/features/portal/home-view";
import { PortalHomeSchema, type PortalHome } from "@/lib/api/schemas/portal";
import { BEING_ASSIGNED, DEFAULT_SUPPORT_TEXT } from "@/lib/portal";

const full = PortalHomeSchema.parse((JSON.parse(readFileSync(path.resolve(__dirname, "../fixtures/api/from-code/portal-home-eligible.json"), "utf8")) as { body: unknown }).body);
const bare: PortalHome = { state: "eligible" };
const row = (rows: readonly { label: string; value: string }[] | null | undefined, label: string) => rows?.find((r) => r.label === label)?.value;

describe("buildHomeView: a complete home", () => {
  const v = buildHomeView(full);
  test("heading and start", () => {
    expect(v.welcome).toBe("Welcome, Ada");
    expect(v.eyebrow).toBe("Data Analysis · Cohort 1");
    expect(v.startLine).toContain("where you are");
    expect(v.countdown(Date.parse("2027-01-30T08:00:00.000Z"))).toBe("2 days, 0 hours");
    expect(v.countdown(Date.parse("2027-03-01T00:00:00.000Z"))).toBe("Classes have started");
  });
  test("details", () => {
    expect(v.details).toEqual([
      { label: "Student ID", value: "PTR-0001" },
      { label: "Track", value: "Data Analysis" },
      { label: "Cohort", value: "Cohort 1" },
      { label: "Pod", value: "Pod 4" },
    ]);
  });
  test("community, receipt and support", () => {
    expect(v.community).toEqual({ state: "ready", href: "/community" });
    expect(v.receipt?.reference).toBe("…ab12cd");
    expect(row(v.receipt?.rows, "Amount paid")).toBe("₦5,000");
    expect(row(v.receipt?.rows, "Date paid")).toBe("2 November 2026");
    expect(row(v.receipt?.rows, "Student ID")).toBe("PTR-0001");
    expect(v.support).toEqual({ text: DEFAULT_SUPPORT_TEXT, url: "mailto:help@example.com" });
  });
});

describe("buildHomeView: missing data hides cards or shows honest placeholders", () => {
  const v = buildHomeView(bare);
  test("nothing invented", () => {
    expect(v.welcome).toBe("Welcome, scholar");
    expect(v.eyebrow).toBe("");
    expect(v.details).toBeNull();
    expect(v.community).toBeNull();
    expect(v.receipt).toBeNull();
    expect(v.startLine).toBe("We will confirm your start date soon.");
    expect(v.countdown(0)).toBe("To be confirmed");
    expect(v.support).toEqual({ text: DEFAULT_SUPPORT_TEXT, url: null });
  });
  test("a learner with no IDs yet", () => {
    const d = buildHomeView({ state: "eligible", learner: { firstName: "Ada" }, pod: { state: "preparing", name: "Pod 9" } }).details;
    expect(row(d, "Student ID")).toBe(BEING_ASSIGNED);
    expect(row(d, "Track")).toBe(DASH);
    expect(row(d, "Cohort")).toBe(DASH);
    // A pod that is not ready is never named, even if the API sent a name.
    expect(row(d, "Pod")).toBe(BEING_ASSIGNED);
  });
  test("a ready pod with a blank name is still being assigned", () => {
    expect(row(buildHomeView({ state: "eligible", learner: {}, pod: { state: "ready", name: "  " } }).details, "Pod")).toBe(BEING_ASSIGNED);
  });
  test("whitespace-only values count as missing", () => {
    const d = buildHomeView({ state: "eligible", learner: { studentId: "  ", track: " ", cohortName: "" } }).details;
    expect(row(d, "Student ID")).toBe(BEING_ASSIGNED);
    expect(row(d, "Track")).toBe(DASH);
  });
  test("community not ready says so; any state other than ready is not a link", () => {
    expect(buildHomeView({ state: "eligible", community: { state: "preparing" } }).community).toEqual({ state: "preparing", message: COMMUNITY_PREPARING });
    expect(buildHomeView({ state: "eligible", community: {} }).community).toMatchObject({ state: "preparing" });
    expect(buildHomeView({ state: "eligible", community: { state: "weird", url: "https://evil.test" } }).community).toMatchObject({ state: "preparing" });
  });
  test("the community link is always our own page, never the API's url", () => {
    expect(buildHomeView({ state: "eligible", community: { state: "ready", url: "https://evil.test" } }).community).toEqual({ state: "ready", href: "/community" });
  });
  test("a receipt with gaps shows dashes, not blanks", () => {
    const r = buildHomeView({ state: "eligible", receipt: {} }).receipt;
    expect(r?.reference).toBe(DASH);
    expect(row(r?.rows, "Amount paid")).toBe(DASH);
    expect(row(r?.rows, "Date paid")).toBe(DASH);
    expect(row(r?.rows, "Student ID")).toBe(BEING_ASSIGNED);
  });
  test("receipt falls back to the learner's student id", () => {
    expect(row(buildHomeView({ state: "eligible", learner: { studentId: "PTR-7" }, receipt: {} }).receipt?.rows, "Student ID")).toBe("PTR-7");
  });
  test("an invalid paid date or time zone does not throw", () => {
    expect(row(buildHomeView({ state: "eligible", receipt: { paidAt: "garbage" } }).receipt?.rows, "Date paid")).toBe(DASH);
    expect(row(buildHomeView({ state: "eligible", schedule: { cohortTimezone: "Bad/Zone" }, receipt: { paidAt: "2026-11-02T10:00:00.000Z" } }).receipt?.rows, "Date paid")).toBe("2 November 2026");
  });
  test("an unsafe support link is dropped", () => {
    expect(buildHomeView({ state: "eligible", support: { text: "Help", url: "javascript:alert(1)" } }).support).toEqual({ text: "Help", url: null });
  });
  test("a bad start date or time zones never throw", () => {
    const v2 = buildHomeView({ state: "eligible", schedule: { startsAt: "nope", cohortTimezone: "Bad/Zone", learnerTimezone: "Worse/Zone" } });
    expect(v2.startLine).toBe("We will confirm your start date soon.");
    expect(v2.countdown(1)).toBe("To be confirmed");
  });
});
