import { describe, expect, test } from "vitest";
import { buildError } from "@/lib/api/result";
import { describeSubmitError, CONTACT_EMAIL } from "@/features/application/submit-errors";
import { emailCheckOutcome } from "@/features/application/email-check";
import { thankYouUrl } from "@/features/application/thank-you-url";

const err = (kind: Parameters<typeof buildError>[0], status: number | null, body?: unknown) => buildError(kind, status, body);

describe("describeSubmitError: the legacy wording for each failure", () => {
  test("a duplicate application explains what to do and offers the contact address", () => {
    const d = describeSubmitError(err("conflict", 409, { ok: false, error: "An application with this email has already been submitted for this cohort." }));
    expect(d.message).toBe(
      "You've already submitted an application for this cohort with this email. If you need to correct something or check your status, contact us at",
    );
    expect(d.contactEmail).toBe(CONTACT_EMAIL);
    expect(CONTACT_EMAIL).toBe("hello@protechrise.com");
  });

  test("being rate limited reads as a deliberate, temporary limit", () => {
    const d = describeSubmitError(err("rate_limited", 429, { ok: false, error: "Too many requests." }));
    expect(d).toEqual({ message: "You've submitted a few times in a row — please wait a few minutes before trying again." });
  });

  test("a database that stayed busy tells the applicant their answers are safe and to try again", () => {
    const d = describeSubmitError(err("busy", 503, { ok: false, retryable: true }));
    expect(d.message).toBe(
      "We could not save your application because the site is very busy. Your answers are still here: please click Submit again in a minute.",
    );
  });

  test("applications being closed is NOT described as the site being busy", () => {
    const d = describeSubmitError(err("unavailable", 503, { ok: false, error: "Applications are not open right now. Please check back soon." }));
    expect(d.message).toBe("Applications are not open right now. Please check back soon.");
  });

  test("a network failure or timeout says the server could not be reached", () => {
    expect(describeSubmitError(err("network", null)).message).toBe("Could not reach the server. Please try again.");
    expect(describeSubmitError(err("timeout", null)).message).toBe("Could not reach the server. Please try again.");
  });

  test("a validation error from the server shows the server's own text", () => {
    expect(describeSubmitError(err("validation", 400, { ok: false, error: "Select a valid country." })).message).toBe("Select a valid country.");
  });

  test("anything else uses the API's message, or the legacy fallback when it has none", () => {
    expect(describeSubmitError(err("server", 500, { ok: false, error: "Could not submit application." })).message).toBe("Could not submit application. Please try again.");
    expect(describeSubmitError(err("invalid_response", 200)).message).toBe("Could not submit application. Please try again.");
  });

  test("only the duplicate message carries a contact address", () => {
    expect(describeSubmitError(err("rate_limited", 429)).contactEmail).toBeUndefined();
    expect(describeSubmitError(err("busy", 503, { retryable: true })).contactEmail).toBeUndefined();
  });
});

describe("emailCheckOutcome", () => {
  const ok = (deliverable: boolean, alreadyRegistered: boolean) => ({ ok: true as const, data: { ok: true as const, deliverable, alreadyRegistered } });

  test("an address that is already registered is a duplicate (and wins over deliverability)", () => {
    expect(emailCheckOutcome(ok(true, true))).toBe("duplicate");
    expect(emailCheckOutcome(ok(false, true))).toBe("duplicate");
  });

  test("an address that cannot receive mail is undeliverable", () => {
    expect(emailCheckOutcome(ok(false, false))).toBe("undeliverable");
  });

  test("a clean address is ok", () => {
    expect(emailCheckOutcome(ok(true, false))).toBe("ok");
  });

  test("a failed check is unknown: best effort, the server still checks at submit", () => {
    expect(emailCheckOutcome({ ok: false, error: err("network", null) })).toBe("unknown");
    expect(emailCheckOutcome({ ok: false, error: err("rate_limited", 429) })).toBe("unknown");
  });
});

describe("thankYouUrl", () => {
  test("carries the track and both event ids, and never the applicant's name", () => {
    const url = thankYouUrl({ track: "Frontend Development", tiktokEventId: "tt-1", metaEventId: "meta-1" });
    const params = new URL(url, "https://x.test").searchParams;
    expect(url.startsWith("/thank-you?")).toBe(true);
    expect(Object.fromEntries(params)).toEqual({ track: "Frontend Development", eid: "tt-1", meid: "meta-1" });
  });

  test("keeps the event-id keys even when there are none (analytics then skips de-duplication)", () => {
    const params = new URL(thankYouUrl({ track: "Data Analytics", tiktokEventId: null, metaEventId: null }), "https://x.test").searchParams;
    expect(params.get("eid")).toBe("");
    expect(params.get("meid")).toBe("");
  });

  test("encodes awkward characters safely", () => {
    const url = thankYouUrl({ track: "AI/Automation <b>", tiktokEventId: null, metaEventId: null });
    expect(url).not.toContain("<");
    expect(new URL(url, "https://x.test").searchParams.get("track")).toBe("AI/Automation <b>");
  });

  test("trims the track", () => {
    expect(new URL(thankYouUrl({ track: " Cloud ", tiktokEventId: null, metaEventId: null }), "https://x.test").searchParams.get("track")).toBe("Cloud");
  });
});
