import { describe, expect, test } from "vitest";
import { ShortApplicationInputSchema, SubmitResponseSchema } from "@/lib/api/schemas/applications";

const valid = {
  firstName: "Ada",
  lastName: "Obi",
  email: " Ada@Example.com ",
  phone: "+2348012345678",
  country: "Nigeria",
  preferredTrack: "Frontend Development",
  experienceLevel: "Complete beginner",
  consent: true,
  refundPolicyAccepted: true,
} as const;

describe("ShortApplicationInputSchema (apply-and-pay)", () => {
  test("accepts the short form with no city, essays, status, hours, self-fund or referral source, and normalises the email", () => {
    const parsed = ShortApplicationInputSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.email).toBe("ada@example.com");
  });

  test("still requires consent, the refund policy and an experience level", () => {
    for (const bad of [{ consent: false }, { refundPolicyAccepted: false }, { experienceLevel: "" }, { experienceLevel: "Guru" }, { preferredTrack: "" }]) {
      expect(ShortApplicationInputSchema.safeParse({ ...valid, ...bad }).success, JSON.stringify(bad)).toBe(false);
    }
  });

  test("keeps the optional attribution fields, the honeypot and the referral code", () => {
    const parsed = ShortApplicationInputSchema.parse({ ...valid, utm_source: "tiktok", ttp1: "a", referrerCode: "ABC", website: "", timezone: "Africa/Lagos", analyticsConsent: true });
    expect(parsed).toMatchObject({ utm_source: "tiktok", ttp1: "a", referrerCode: "ABC", timezone: "Africa/Lagos", analyticsConsent: true });
  });

  test("uses the same messages as the long form for the shared fields", () => {
    const parsed = ShortApplicationInputSchema.safeParse({ ...valid, firstName: "", consent: false });
    expect(parsed.success).toBe(false);
    if (parsed.success) return;
    const messages = parsed.error.issues.map((i) => i.message);
    expect(messages).toContain("Enter a valid first name.");
    expect(messages).toContain("You must agree to the application terms.");
  });
});

describe("SubmitResponseSchema payUrl", () => {
  const ok = { ok: true, message: "application-submitted" };

  test("keeps a pay link to the claim route", () => {
    expect(SubmitResponseSchema.parse({ ...ok, payUrl: "/claim?token=8il7P6Y3YzyvDzqh5-jpcDrC2tg_x%3D" }).payUrl).toBe("/claim?token=8il7P6Y3YzyvDzqh5-jpcDrC2tg_x%3D");
  });

  test("no pay link is fine: the award flow does not return one", () => {
    expect(SubmitResponseSchema.parse(ok).payUrl).toBeUndefined();
  });

  test("drops anything that is not a claim link, so the browser can never be sent to another site, but the response still succeeds", () => {
    for (const payUrl of ["https://evil.example/pay", "//evil.example/claim?token=x", "javascript:alert(1)", "/claim?token=", "/claim?token=a b", "/other?token=abc", "/claim?token=abc&next=https://evil.example", 42]) {
      const parsed = SubmitResponseSchema.safeParse({ ...ok, payUrl });
      expect(parsed.success, String(payUrl)).toBe(true);
      expect(parsed.success && parsed.data.payUrl, String(payUrl)).toBeUndefined();
    }
  });
});
