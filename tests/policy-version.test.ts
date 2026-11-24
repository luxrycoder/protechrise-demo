import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { REFUND_BLOCKS } from "@/content/refund-policy";
import { REFUND_POLICY_UPDATED, REFUND_POLICY_VERSION } from "@/content/policy-versions";
import { parseVersionLine } from "@/lib/policy-version";
import type { PolicyBlock } from "@/content/types";

describe("parseVersionLine", () => {
  test("reads the version and the date from a policy page's version line", () => {
    const blocks: readonly PolicyBlock[] = [{ type: "updated", html: "Version 2026-11 &middot; Last updated November 7, 2026" }];
    expect(parseVersionLine(blocks)).toEqual({ version: "2026-11", updated: "November 7, 2026" });
  });

  test("accepts versions with a suffix", () => {
    const blocks: readonly PolicyBlock[] = [{ type: "updated", html: "Version 2026-10-v2 &middot; Last updated October 27, 2026" }];
    expect(parseVersionLine(blocks)?.version).toBe("2026-10-v2");
  });

  test("returns null when the page has no version line (the privacy page only has a date)", () => {
    expect(parseVersionLine([{ type: "updated", html: "Last updated August 23, 2026" }])).toBeNull();
    expect(parseVersionLine([{ type: "p", html: "Version 2026-11 &middot; Last updated X" }])).toBeNull();
    expect(parseVersionLine([])).toBeNull();
  });
});

describe("the refund policy version the applicant accepts", () => {
  test("comes from the refund policy page text itself", () => {
    expect(REFUND_POLICY_VERSION).toBe(parseVersionLine(REFUND_BLOCKS)?.version);
    expect(REFUND_POLICY_UPDATED).toBe(parseVersionLine(REFUND_BLOCKS)?.updated);
  });

  test("equals the version the waitlist-api records for the same acceptance", () => {
    // The API stamps the version itself (REFUND_POLICY_VERSION in waitlist-api lib/validators.js); the form only
    // sends refundPolicyAccepted: true. If the page is updated without updating the API (or the reverse), this
    // fails so the mismatch is noticed before applicants accept text that is recorded under another version.
    const contract = JSON.parse(readFileSync("tests/fixtures/policy-contract.json", "utf8")) as { refundPolicyVersion: string };
    expect(REFUND_POLICY_VERSION).toBe(contract.refundPolicyVersion);
  });
});
