import { describe, expect, test } from "vitest";
import {
  FEE_FALLBACK_WORD,
  NO_TERMS,
  fillFeeToken,
  fillTokens,
  getPublicFee,
  getPublicTerms,
  loadPublicFee,
  loadPublicTerms,
  parseFeeResponse,
  parseTermsResponse,
} from "@/lib/fee";

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

describe("getPublicFee", () => {
  test("returns the fee and calls the API's public-fee endpoint", async () => {
    let calledUrl = "";
    const fee = await getPublicFee("https://api.test", async (url) => {
      calledUrl = url;
      return jsonResponse({ ok: true, fee: "₦19,500" });
    });
    expect(fee).toBe("₦19,500");
    expect(calledUrl).toBe("https://api.test/api/public-fee");
  });

  test("returns null when the API errors, returns junk, or is unreachable", async () => {
    expect(await getPublicFee("https://api.test", async () => jsonResponse({ ok: false }, 500))).toBeNull();
    expect(await getPublicFee("https://api.test", async () => jsonResponse({ ok: true, fee: "free" }))).toBeNull();
    expect(
      await getPublicFee("https://api.test", async () => {
        throw new Error("ECONNREFUSED");
      }),
    ).toBeNull();
  });
});

describe("loadPublicFee", () => {
  test("returns null instead of throwing when API_ORIGIN is not configured", async () => {
    const saved = process.env.API_ORIGIN;
    delete process.env.API_ORIGIN;
    try {
      expect(await loadPublicFee()).toBeNull();
    } finally {
      if (saved !== undefined) process.env.API_ORIGIN = saved;
    }
  });
});

describe("parseFeeResponse", () => {
  test("accepts the API's naira amount", () => {
    expect(parseFeeResponse({ ok: true, fee: "₦19,500" })).toBe("₦19,500");
    expect(parseFeeResponse({ ok: true, fee: "₦9,500.50" })).toBe("₦9,500.50");
  });

  test("rejects anything that is not a naira amount, so odd data never reaches the page", () => {
    expect(parseFeeResponse({ ok: true, fee: "<script>alert(1)</script>" })).toBeNull();
    expect(parseFeeResponse({ ok: true, fee: "$20" })).toBeNull();
    expect(parseFeeResponse({ ok: false, fee: "₦19,500" })).toBeNull();
    expect(parseFeeResponse({ ok: true })).toBeNull();
    expect(parseFeeResponse(null)).toBeNull();
    expect(parseFeeResponse("₦19,500")).toBeNull();
  });
});

describe("fillFeeToken", () => {
  const sentence = "with only a {{ONBOARDING_FEE}} onboarding/certification fee to pay.";

  test("replaces every token with the live fee", () => {
    expect(fillFeeToken(`${sentence} ${sentence}`, "₦19,500")).toBe(
      "with only a ₦19,500 onboarding/certification fee to pay. with only a ₦19,500 onboarding/certification fee to pay.",
    );
  });

  test("degrades to a number-free word when the fee is unavailable, never a stale amount", () => {
    const out = fillFeeToken(sentence, null);
    expect(out).toContain(FEE_FALLBACK_WORD);
    expect(out).not.toMatch(/₦|\{\{/);
  });

  test("leaves text without the token untouched", () => {
    expect(fillFeeToken("No fee here.", "₦19,500")).toBe("No fee here.");
  });
});

describe("public terms (fee, tuition, scholarship percent)", () => {
  const ALL = { ok: true, fee: "₦9,500", tuition: "₦280,000", scholarshipPercent: 96 };

  test("parseTermsResponse reads all three values", () => {
    expect(parseTermsResponse(ALL)).toEqual({ fee: "₦9,500", tuition: "₦280,000", scholarshipPercent: 96 });
  });

  test("an API that only knows the fee (not yet upgraded) still yields the fee", () => {
    expect(parseTermsResponse({ ok: true, fee: "₦19,500" })).toEqual({ fee: "₦19,500", tuition: null, scholarshipPercent: null });
  });

  test("each value is checked on its own, so one odd value never poisons the others or reaches the page", () => {
    expect(parseTermsResponse({ ...ALL, tuition: "<b>x</b>" })).toEqual({ fee: "₦9,500", tuition: null, scholarshipPercent: 96 });
    expect(parseTermsResponse({ ...ALL, scholarshipPercent: 140 }).scholarshipPercent).toBeNull();
    expect(parseTermsResponse({ ...ALL, scholarshipPercent: "96" }).scholarshipPercent).toBeNull();
    expect(parseTermsResponse({ ...ALL, scholarshipPercent: 96.5 }).scholarshipPercent).toBeNull();
    expect(parseTermsResponse({ ...ALL, fee: "free" }).fee).toBeNull();
  });

  test("anything that is not a successful response gives no terms", () => {
    expect(parseTermsResponse({ ...ALL, ok: false })).toEqual(NO_TERMS);
    expect(parseTermsResponse(null)).toEqual(NO_TERMS);
    expect(parseTermsResponse("x")).toEqual(NO_TERMS);
  });

  test("getPublicTerms returns the terms, and no terms when the API fails", async () => {
    expect(await getPublicTerms("https://api.test", async () => jsonResponse(ALL))).toEqual({ fee: "₦9,500", tuition: "₦280,000", scholarshipPercent: 96 });
    expect(await getPublicTerms("https://api.test", async () => jsonResponse({}, 500))).toEqual(NO_TERMS);
  });

  test("loadPublicTerms gives no terms instead of throwing when API_ORIGIN is not configured", async () => {
    const saved = process.env.API_ORIGIN;
    delete process.env.API_ORIGIN;
    try {
      expect(await loadPublicTerms()).toEqual(NO_TERMS);
    } finally {
      if (saved !== undefined) process.env.API_ORIGIN = saved;
    }
  });
});

describe("fillTokens", () => {
  const sentence = "Tuition is {{TUITION_FEE}}. With our {{SCHOLARSHIP_PERCENT}}% scholarship you pay {{ONBOARDING_FEE}}.";

  test("fills all three tokens, and the percent sign goes with the number", () => {
    expect(fillTokens(sentence, { fee: "₦9,500", tuition: "₦280,000", scholarshipPercent: 96 })).toBe(
      "Tuition is ₦280,000. With our 96% scholarship you pay ₦9,500.",
    );
  });

  test("degrades to number-free words when the terms are unavailable, never a stale amount or a bare token", () => {
    const out = fillTokens(sentence, NO_TERMS);
    expect(out).not.toMatch(/₦|\d|\{\{|%/);
    expect(out).toContain(FEE_FALLBACK_WORD);
  });

  test("fillFeeToken still fills only the fee", () => {
    expect(fillFeeToken("Pay {{ONBOARDING_FEE}}.", "₦9,500")).toBe("Pay ₦9,500.");
  });
});
