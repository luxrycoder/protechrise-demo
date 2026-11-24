import { describe, expect, test } from "vitest";
import { ApplicationInputSchema } from "@/lib/api/schemas/applications";
import { emptyValues, STEP_FIELDS, stepFieldsFor, stepsFor, type FormValues } from "@/features/application/fields";
import { buildApplicationInput, buildShortApplicationInput, validateField, validateStep } from "@/features/application/validation";

const valid: FormValues = {
  ...emptyValues(),
  firstName: "Ada",
  lastName: "Obi",
  email: "ada@example.com",
  country: "Nigeria",
  phoneCode: "+234",
  phone: "801 234 5678",
  city: "Lagos",
  currentStatus: "Student",
  preferredTrack: "Frontend Development",
  experienceLevel: "Complete beginner",
  weeklyHours: "5-10 hours",
  motivationEssay: "m".repeat(120),
  careerGoal: "g".repeat(20),
  commitmentPlan: "c".repeat(60),
  canSelfFund: "No",
  referralSource: "Social media",
  consent: true,
  refundPolicy: true,
};
const v = (override: Partial<FormValues>): FormValues => ({ ...valid, ...override });

describe("validateField: the legacy client messages", () => {
  test("a fully valid form has no errors", () => {
    for (const id of Object.values(STEP_FIELDS).flat()) expect(validateField(id, valid), id).toBe("");
  });

  test.each([
    ["firstName", { firstName: "" }, "Enter your first name."],
    ["firstName", { firstName: "   " }, "Enter your first name."],
    ["lastName", { lastName: "" }, "Enter your last name."],
    ["email", { email: "" }, "Enter your email address."],
    ["email", { email: "not-an-email" }, "Enter a valid email address."],
    ["email", { email: "a@b" }, "Enter a valid email address."],
    ["country", { country: "" }, "Select your country."],
    ["city", { city: "" }, "Select your city."],
    ["currentStatus", { currentStatus: "" }, "Select your current status."],
    ["preferredTrack", { preferredTrack: "" }, "Select a preferred track."],
    ["experienceLevel", { experienceLevel: "" }, "Select your experience level."],
    ["weeklyHours", { weeklyHours: "" }, "Select your weekly time commitment."],
    ["motivationEssay", { motivationEssay: "m".repeat(119) }, "Motivation must be at least 120 characters."],
    ["careerGoal", { careerGoal: "g".repeat(19) }, "Your 6-month goal must be at least 20 characters."],
    ["commitmentPlan", { commitmentPlan: "c".repeat(59) }, "Your commitment plan must be at least 60 characters."],
    ["canSelfFund", { canSelfFund: "" }, "Let us know if you need scholarship support."],
    ["referralSource", { referralSource: "" }, "Let us know how you heard about us."],
    ["consent", { consent: false }, "You must agree to the application terms."],
    ["refundPolicy", { refundPolicy: false }, "You must accept the policies."],
  ] as const)("%s: %j -> %s", (id, override, message) => {
    expect(validateField(id, v(override))).toBe(message);
  });

  test("lengths are measured after trimming, like the legacy value() helper", () => {
    expect(validateField("careerGoal", v({ careerGoal: `${"g".repeat(19)}      ` }))).toBe("Your 6-month goal must be at least 20 characters.");
  });

  describe("phone", () => {
    test.each([
      [{ phone: "" }, "Enter your phone number."],
      [{ phone: "abc123" }, "Enter a valid phone number (digits only)."],
      [{ phone: "12345" }, "Enter a valid phone number (digits only)."],
      [{ phone: "1".repeat(16) }, "Enter a valid phone number (digits only)."],
      [{ phoneCode: "" }, "Select your dialing code."],
    ] as const)("%j -> %s", (override, message) => {
      expect(validateField("phone", v(override))).toBe(message);
    });

    test("accepts digits, spaces and hyphens, 6 to 15 characters", () => {
      expect(validateField("phone", v({ phone: "801-234 5678" }))).toBe("");
      expect(validateField("phone", v({ phone: "123456" }))).toBe("");
    });

    test("checks the combined number the way the server will", () => {
      expect(validateField("phone", v({ phoneCode: "+" + "1".repeat(20), phone: "1".repeat(15) }))).toBe("Enter a valid phone number.");
    });
  });

  describe("conditional 'other' fields", () => {
    test("an 'Other' city needs a city name, a listed city does not", () => {
      expect(validateField("cityOther", v({ city: "Other", cityOther: "" }))).toBe("Enter your city.");
      expect(validateField("cityOther", v({ city: "Other", cityOther: "Ibadan" }))).toBe("");
      expect(validateField("cityOther", v({ city: "Lagos", cityOther: "" }))).toBe("");
    });

    test("an 'Other' referral source needs details, any other source does not", () => {
      expect(validateField("referralSourceOther", v({ referralSource: "Other", referralSourceOther: "" }))).toBe("Tell us how you heard about us.");
      expect(validateField("referralSourceOther", v({ referralSource: "Other", referralSourceOther: "A podcast" }))).toBe("");
      expect(validateField("referralSourceOther", v({ referralSource: "Search engine" }))).toBe("");
    });
  });
});

describe("validateStep", () => {
  test("reports every failing field of the step, and the first message in field order", () => {
    const result = validateStep(1, v({ firstName: "", email: "x" }));
    expect(result.errors).toEqual({ firstName: "Enter your first name.", email: "Enter a valid email address." });
    expect(result.firstError).toBe("Enter your first name.");
    expect(result.firstField).toBe("firstName");
  });

  test("only looks at the fields of that step", () => {
    const base = v({ motivationEssay: "short", consent: false });
    expect(validateStep(1, base).errors).toEqual({});
    expect(Object.keys(validateStep(2, base).errors)).toEqual(["motivationEssay"]);
    expect(Object.keys(validateStep(3, base).errors)).toEqual(["consent"]);
  });

  test("a valid step has no error and no first field", () => {
    for (const step of [1, 2, 3] as const) {
      expect(validateStep(step, valid)).toEqual({ errors: {}, firstError: "", firstField: null });
    }
  });

  test("step 1 covers the contact fields, step 2 background and goals, step 3 consent", () => {
    expect(STEP_FIELDS[1]).toEqual(["firstName", "lastName", "email", "country", "phone", "city", "cityOther"]);
    expect(STEP_FIELDS[2]).toEqual(["currentStatus", "preferredTrack", "experienceLevel", "weeklyHours", "motivationEssay", "careerGoal", "commitmentPlan"]);
    expect(STEP_FIELDS[3]).toEqual(["canSelfFund", "referralSource", "referralSourceOther", "consent", "refundPolicy"]);
  });
});

describe("buildApplicationInput", () => {
  test("maps the form to the API payload exactly as the legacy form did", () => {
    const input = buildApplicationInput(v({ firstName: "  Ada ", phoneCode: "+234", phone: " 801 234 5678 " }));
    expect(input.phone).toBe("+234801 234 5678");
    expect(input.firstName).toBe("Ada");
    expect(input.refundPolicyAccepted).toBe(true);
    expect(input.consent).toBe(true);
    expect("refundPolicy" in input).toBe(false);
  });

  test("sends the 'need scholarship support' answer as-is: Yes means they need support", () => {
    expect(buildApplicationInput(v({ canSelfFund: "Yes" })).canSelfFund).toBe("Yes");
    expect(buildApplicationInput(v({ canSelfFund: "No" })).canSelfFund).toBe("No");
  });

  test("keeps the honeypot value and merges extras such as the time zone", () => {
    const input = buildApplicationInput(v({ website: "http://spam.test" }), { timezone: "Africa/Lagos" });
    expect(input.website).toBe("http://spam.test");
    expect(input.timezone).toBe("Africa/Lagos");
  });

  test("a valid form produces a payload the API client schema accepts", () => {
    const parsed = ApplicationInputSchema.safeParse(buildApplicationInput(valid));
    expect(parsed.success, JSON.stringify(parsed.success ? null : parsed.error.issues)).toBe(true);
  });

  test("an 'Other' city and 'Other' referral source are accepted by the schema too", () => {
    const parsed = ApplicationInputSchema.safeParse(
      buildApplicationInput(v({ city: "Other", cityOther: "Ibadan", referralSource: "Other", referralSourceOther: "A podcast" })),
    );
    expect(parsed.success).toBe(true);
  });
});

describe("the apply-and-pay flow", () => {
  const SHORT = ["firstName", "lastName", "email", "country", "phone", "preferredTrack", "experienceLevel", "consent", "refundPolicy"];

  test("has one step holding exactly the short form's fields, in the legacy order", () => {
    expect(stepsFor("payAtApply")).toEqual([1]);
    expect(stepFieldsFor("payAtApply", 1)).toEqual(SHORT);
  });

  test("the award flow is unchanged: three steps", () => {
    expect(stepsFor("award")).toEqual([1, 2, 3]);
    expect(stepFieldsFor("award", 2)).toEqual(STEP_FIELDS[2]);
  });

  test("validates only the short fields, so an applicant who never saw city or essays is not blocked by them", () => {
    const shortOnly = { ...emptyValues(), firstName: "Ada", lastName: "Obi", email: "ada@example.com", country: "Nigeria", phoneCode: "+234", phone: "801 234 5678", preferredTrack: "Frontend Development", experienceLevel: "Complete beginner", consent: true, refundPolicy: true };
    expect(validateStep(1, shortOnly, "payAtApply").firstField).toBeNull();
    expect(validateStep(1, shortOnly, "award").firstField).toBe("city");
  });

  test("reports the first missing field in order and requires both acceptances", () => {
    const result = validateStep(1, emptyValues(), "payAtApply");
    expect(result.firstField).toBe("firstName");
    expect(Object.keys(result.errors)).toEqual(SHORT);
  });

  test("buildShortApplicationInput sends the short payload as the legacy form did", () => {
    const values = { ...emptyValues(), firstName: " Ada ", lastName: "Obi", email: "ada@example.com", country: "Nigeria", phoneCode: "+234", phone: "801 234 5678", preferredTrack: "Frontend Development", experienceLevel: "Complete beginner", consent: true, refundPolicy: true, city: "Lagos", motivationEssay: "ignored" };
    const input = buildShortApplicationInput(values, { timezone: "Africa/Lagos" });
    expect(input).toEqual({
      website: "",
      firstName: "Ada",
      lastName: "Obi",
      email: "ada@example.com",
      phone: "+234801 234 5678",
      country: "Nigeria",
      preferredTrack: "Frontend Development",
      experienceLevel: "Complete beginner",
      consent: true,
      refundPolicyAccepted: true,
      timezone: "Africa/Lagos",
    });
  });
});
