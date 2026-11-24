import { describe, expect, test } from "vitest";
import { destinationAfterSubmit } from "@/features/application/after-submit";

const ids = { tiktokEventId: "tt-1", metaEventId: "meta-1" };

describe("destinationAfterSubmit", () => {
  test("goes straight to payment when the API returned a pay link (apply-and-pay)", () => {
    expect(destinationAfterSubmit({ payUrl: "/claim?token=abc" }, { track: "Cloud", ...ids })).toBe("/claim?token=abc");
  });

  test("goes to the thank-you page when there is no pay link (award flow, or a link we refused)", () => {
    const url = destinationAfterSubmit({}, { track: "Cloud", ...ids });
    expect(url.startsWith("/thank-you?")).toBe(true);
    expect(new URL(url, "https://x.test").searchParams.get("track")).toBe("Cloud");
  });
});
