import { describe, expect, test } from "vitest";
import {
  ApplicationInputSchema,
  CAN_SELF_FUND_OPTIONS,
  CURRENT_STATUS_OPTIONS,
  EXPERIENCE_LEVEL_OPTIONS,
  FIELD_LIMITS,
  REFERRAL_SOURCE_OPTIONS,
  WEEKLY_HOURS_OPTIONS,
  applicationFieldErrors,
} from "@/lib/api/schemas/applications";

const valid = {
  firstName: "Ada",
  lastName: "Obi",
  email: "Ada.Obi@Example.com",
  phone: "+234 801 234 5678",
  country: "Nigeria",
  city: "Lagos",
  preferredTrack: "Frontend Development",
  motivationEssay: "m".repeat(120),
  commitmentPlan: "c".repeat(60),
  currentStatus: "Student",
  experienceLevel: "Complete beginner",
  weeklyHours: "5-10 hours",
  careerGoal: "g".repeat(20),
  canSelfFund: "No",
  referralSource: "Social media",
  consent: true,
  refundPolicyAccepted: true,
};

const errorsFor = (override: Record<string, unknown>) => {
  const result = ApplicationInputSchema.safeParse({ ...valid, ...override });
  return result.success ? null : applicationFieldErrors(result.error);
};

describe("ApplicationInputSchema: valid input", () => {
  test("accepts a complete application and normalises it the way the API does", () => {
    const result = ApplicationInputSchema.safeParse({ ...valid, firstName: "  Ada  ", email: "  Ada.Obi@Example.com " });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.firstName).toBe("Ada");
    expect(result.data.email).toBe("ada.obi@example.com");
  });

  test("accepts the optional tracking fields and the honeypot", () => {
    const result = ApplicationInputSchema.safeParse({
      ...valid,
      timezone: "Africa/Lagos",
      analyticsConsent: true,
      utm_source: "ig",
      utm_medium: "social",
      utm_campaign: "oct",
      fbp: "fb.1.1.2",
      fbc: "fb.1.1.3",
      fbclid: "abc",
      ttp: "t",
      ttclid: "u",
      documentReferrer: "https://example.test/",
      website: "",
    });
    expect(result.success).toBe(true);
  });

  test("keeps the referral code and the second TikTok cookie values the legacy form sent, instead of stripping them", () => {
    const result = ApplicationInputSchema.safeParse({ ...valid, referrerCode: "ngozi-b", ttp1: "a", ttp2: "b" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toMatchObject({ referrerCode: "ngozi-b", ttp1: "a", ttp2: "b" });
  });

  test("accepts an 'Other' city with a city name and an 'Other' referral source with details", () => {
    expect(errorsFor({ city: "Other", cityOther: "Ibadan" })).toBeNull();
    expect(errorsFor({ referralSource: "Other", referralSourceOther: "A podcast" })).toBeNull();
  });
});

describe("ApplicationInputSchema: rules and messages match the legacy validator", () => {
  test.each([
    ["firstName", { firstName: "" }, "Enter a valid first name."],
    ["firstName", { firstName: "a".repeat(FIELD_LIMITS.firstName + 1) }, "Enter a valid first name."],
    ["lastName", { lastName: "   " }, "Enter a valid last name."],
    ["email", { email: "not-an-email" }, "Enter a valid email address."],
    ["email", { email: `${"a".repeat(250)}@b.co` }, "Enter a valid email address."],
    ["phone", { phone: "12" }, "Enter a valid phone number."],
    ["phone", { phone: "abc-defg-hij" }, "Enter a valid phone number."],
    ["country", { country: "" }, "Select a valid country."],
    ["city", { city: "" }, "Select a valid city for your country."],
    ["cityOther", { city: "Other", cityOther: "" }, "Enter your city."],
    ["cityOther", { city: "Other", cityOther: "x".repeat(101) }, "Enter your city."],
    ["preferredTrack", { preferredTrack: "" }, "Select a valid preferred track."],
    ["motivationEssay", { motivationEssay: "short" }, "Your motivation response must be between 120 and 3000 characters."],
    ["motivationEssay", { motivationEssay: "m".repeat(3001) }, "Your motivation response must be between 120 and 3000 characters."],
    ["commitmentPlan", { commitmentPlan: "c".repeat(59) }, "Your commitment plan must be between 60 and 1000 characters."],
    ["commitmentPlan", { commitmentPlan: "c".repeat(1001) }, "Your commitment plan must be between 60 and 1000 characters."],
    ["careerGoal", { careerGoal: "g".repeat(19) }, "Your 6-month goal must be between 20 and 400 characters."],
    ["careerGoal", { careerGoal: "g".repeat(401) }, "Your 6-month goal must be between 20 and 400 characters."],
    ["consent", { consent: false }, "You must agree to the application terms."],
    ["refundPolicyAccepted", { refundPolicyAccepted: false }, "You must accept the policies."],
    ["currentStatus", { currentStatus: "Astronaut" }, "Select a valid current status."],
    ["experienceLevel", { experienceLevel: "Expert" }, "Select a valid experience level."],
    ["weeklyHours", { weeklyHours: "1 hour" }, "Select a valid weekly time commitment."],
    ["canSelfFund", { canSelfFund: "Maybe" }, "Select whether you can self-fund."],
    ["referralSource", { referralSource: "Carrier pigeon" }, "Select how you heard about us."],
    ["referralSourceOther", { referralSource: "Other", referralSourceOther: "" }, "Tell us how you heard about us."],
    ["referralSourceOther", { referralSource: "Other", referralSourceOther: "x".repeat(101) }, "Tell us how you heard about us."],
  ])("%s: %j -> %s", (field, override, message) => {
    expect(errorsFor(override)?.[field]).toBe(message);
  });

  test("consent must be exactly true, not truthy", () => {
    expect(errorsFor({ consent: "yes" })?.consent).toBe("You must agree to the application terms.");
    expect(errorsFor({ refundPolicyAccepted: 1 })?.refundPolicyAccepted).toBe("You must accept the policies.");
  });

  test("a missing field is reported with the same message as an empty one", () => {
    const rest: Record<string, unknown> = { ...valid };
    delete rest.firstName;
    const result = ApplicationInputSchema.safeParse(rest);
    expect(result.success).toBe(false);
    if (!result.success) expect(applicationFieldErrors(result.error).firstName).toBe("Enter a valid first name.");
  });

  test("reports every failing field at once, one message per field", () => {
    const errors = errorsFor({ firstName: "", email: "x", consent: false });
    expect(Object.keys(errors ?? {}).sort()).toEqual(["consent", "email", "firstName"]);
  });
});

describe("option lists match the legacy server exactly (value and order)", () => {
  test("select options", () => {
    expect([...CURRENT_STATUS_OPTIONS]).toEqual([
      "Student",
      "Employed full-time",
      "Employed part-time",
      "Self-employed / Freelancer",
      "Unemployed - job seeking",
    ]);
    expect([...EXPERIENCE_LEVEL_OPTIONS]).toEqual(["Complete beginner", "Some exposure", "Intermediate", "Advanced"]);
    expect([...WEEKLY_HOURS_OPTIONS]).toEqual(["Under 5 hours", "5-10 hours", "10-15 hours", "15-20 hours", "20+ hours"]);
    expect([...CAN_SELF_FUND_OPTIONS]).toEqual(["Yes", "No"]);
    expect([...REFERRAL_SOURCE_OPTIONS]).toEqual(["Social media", "Friend or referral", "Search engine", "Community event", "Other"]);
  });

  test("field limits", () => {
    expect(FIELD_LIMITS).toMatchObject({ firstName: 60, lastName: 60, email: 254, phone: 32, city: 100, motivationEssay: 3000, careerGoal: 400, commitmentPlan: 1000 });
  });
});
