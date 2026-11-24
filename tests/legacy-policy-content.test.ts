import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { FAQ } from "@/content/faq";
import { PRIVACY_BLOCKS } from "@/content/privacy";
import { REFUND_BLOCKS } from "@/content/refund-policy";
import { parseFaq, parsePolicyBlocks } from "@/lib/legacy-policy-html";

// tests/fixtures/legacy-html holds the legacy pages the content was generated from (scripts/sync-policy-content.ts
// copies them there). If someone edits the content by hand, or re-syncs without pinning, this fails.
const pinned = (page: string): string => readFileSync(`tests/fixtures/legacy-html/${page}.html`, "utf8");

describe("the policy and FAQ content is exactly what the sync script makes of the pinned legacy pages", () => {
  test("refund policy", () => expect(REFUND_BLOCKS).toEqual(parsePolicyBlocks(pinned("refund-policy"))));
  test("privacy policy", () => expect(PRIVACY_BLOCKS).toEqual(parsePolicyBlocks(pinned("privacy"))));
  test("FAQ", () => expect(FAQ).toEqual(parseFaq(pinned("faq"))));
});
