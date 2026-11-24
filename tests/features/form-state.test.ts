import { describe, expect, test } from "vitest";
import { emptyValues, type FormValues } from "@/features/application/fields";
import { firstBlockedStep, firstInvalidStep, formReducer, initialState, type FormState } from "@/features/application/form-state";

const complete: FormValues = {
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

const at = (overrides: Partial<FormState> = {}): FormState => ({ ...initialState(complete), ...overrides });

describe("editing fields", () => {
  test("starts on step 1 with nothing touched", () => {
    const state = initialState();
    expect(state).toMatchObject({ step: 1, maxStep: 1, errors: {}, summary: "", focusField: null });
  });

  test("changing a field updates its value and clears only that field's error", () => {
    const state = at({ errors: { firstName: "Enter your first name.", lastName: "Enter your last name." } });
    const next = formReducer(state, { type: "change", field: "firstName", value: "Ada" });
    expect(next.values.firstName).toBe("Ada");
    expect(next.errors).toEqual({ lastName: "Enter your last name." });
  });

  test("changing the dialling code clears the phone error (they share a slot)", () => {
    const next = formReducer(at({ errors: { phone: "Select your dialing code." } }), { type: "change", field: "phoneCode", value: "+233" });
    expect(next.values.phoneCode).toBe("+233");
    expect(next.errors.phone).toBeUndefined();
  });

  test("choosing a country fills the dial code and resets the city", () => {
    const next = formReducer(at(), { type: "change", field: "country", value: "Ghana" });
    expect(next.values).toMatchObject({ country: "Ghana", phoneCode: "+233", city: "", cityOther: "" });
  });

  test("clearing the country keeps the dial code and clears the city", () => {
    const next = formReducer(at(), { type: "change", field: "country", value: "" });
    expect(next.values).toMatchObject({ country: "", phoneCode: "+234", city: "" });
  });

  test("an unknown country name leaves the dial code alone", () => {
    const next = formReducer(at(), { type: "change", field: "country", value: "Atlantis" });
    expect(next.values.phoneCode).toBe("+234");
  });

  test("moving off 'Other' for the city or referral source clears the extra text and its error", () => {
    const withOther = at({
      values: { ...complete, city: "Other", cityOther: "Ibadan", referralSource: "Other", referralSourceOther: "A podcast" },
      errors: { cityOther: "Enter your city.", referralSourceOther: "Tell us how you heard about us." },
    });
    const city = formReducer(withOther, { type: "change", field: "city", value: "Lagos" });
    expect(city.values.cityOther).toBe("");
    expect(city.errors.cityOther).toBeUndefined();
    const source = formReducer(withOther, { type: "change", field: "referralSource", value: "Search engine" });
    expect(source.values.referralSourceOther).toBe("");
    expect(source.errors.referralSourceOther).toBeUndefined();
  });

  test("choosing 'Other' keeps what was typed", () => {
    const next = formReducer(at({ values: { ...complete, cityOther: "Ibadan" } }), { type: "change", field: "city", value: "Other" });
    expect(next.values.cityOther).toBe("Ibadan");
  });

  test("checkboxes toggle and clear their error", () => {
    const next = formReducer(at({ values: { ...complete, consent: false }, errors: { consent: "You must agree to the application terms." } }), {
      type: "toggle",
      field: "consent",
      checked: true,
    });
    expect(next.values.consent).toBe(true);
    expect(next.errors.consent).toBeUndefined();
  });

  test("blur validates one field, setting or clearing its error", () => {
    const bad = formReducer(at({ values: { ...complete, email: "nope" } }), { type: "blur", field: "email" });
    expect(bad.errors.email).toBe("Enter a valid email address.");
    const good = formReducer({ ...bad, values: { ...bad.values, email: "ada@example.com" } }, { type: "blur", field: "email" });
    expect(good.errors.email).toBeUndefined();
  });
});

describe("the error summary goes away once what it refers to is fixed", () => {
  const failing = () => formReducer(at({ values: { ...complete, firstName: "", email: "x" } }), { type: "next" });

  test("a failed Next remembers which field the summary is about", () => {
    expect(failing()).toMatchObject({ summary: "Enter your first name.", summaryField: "firstName" });
  });

  test("editing that field clears the summary", () => {
    const next = formReducer(failing(), { type: "change", field: "firstName", value: "Ada" });
    expect(next.summary).toBe("");
    expect(next.summaryField).toBeNull();
  });

  test("editing a different field leaves the summary alone", () => {
    const next = formReducer(failing(), { type: "change", field: "lastName", value: "Obi" });
    expect(next.summary).toBe("Enter your first name.");
  });

  test("a country change clears a summary about the city, because it resets the city", () => {
    const state = at({ summary: "Select your city.", summaryField: "city" });
    expect(formReducer(state, { type: "change", field: "country", value: "Ghana" }).summary).toBe("");
  });

  test("ticking the checkbox the summary is about clears it", () => {
    const state = at({ values: { ...complete, consent: false }, summary: "You must agree to the application terms.", summaryField: "consent" });
    expect(formReducer(state, { type: "toggle", field: "consent", checked: true }).summary).toBe("");
  });

  test("blur clears it when the field is now valid, and keeps it while it is still invalid", () => {
    const valid = at({ summary: "Enter your first name.", summaryField: "firstName" });
    expect(formReducer(valid, { type: "blur", field: "firstName" }).summary).toBe("");
    const stillBad = at({ values: { ...complete, firstName: "" }, summary: "Enter your first name.", summaryField: "firstName" });
    expect(formReducer(stillBad, { type: "blur", field: "firstName" }).summary).toBe("Enter your first name.");
  });

  test("a failed submit attempt also records the summary's field, and moving steps clears both", () => {
    const attempt = formReducer(at({ step: 3, maxStep: 3, values: { ...complete, careerGoal: "short" } }), { type: "submitAttempt" });
    expect(attempt.summaryField).toBe("careerGoal");
    expect(formReducer(attempt, { type: "back" })).toMatchObject({ summary: "", summaryField: null });
  });
});

describe("email check: duplicates and deliverability", () => {
  const EMAIL = complete.email;
  const checking = () => formReducer(at(), { type: "emailCheckStarted", email: EMAIL });
  const resolved = (outcome: "ok" | "duplicate" | "undeliverable" | "unknown", state = checking()) =>
    formReducer(state, { type: "emailCheckResolved", email: EMAIL, outcome });
  const DUPLICATE = "You've already submitted an application for this cohort with this email.";
  const UNDELIVERABLE = "We could not verify that email domain. Please check for typos.";
  const CHECKING = "Still checking your email — please wait a moment and try again.";

  test("starts idle, and a started check is pending for that address", () => {
    expect(initialState().emailCheck).toEqual({ email: "", status: "idle", error: "" });
    expect(checking().emailCheck).toEqual({ email: EMAIL, status: "pending", error: "" });
  });

  test("editing the email forgets any earlier check", () => {
    const next = formReducer(resolved("duplicate"), { type: "change", field: "email", value: "other@example.com" });
    expect(next.emailCheck).toEqual({ email: "", status: "idle", error: "" });
    expect(next.errors.email).toBeUndefined();
  });

  test.each([
    ["duplicate", DUPLICATE],
    ["undeliverable", UNDELIVERABLE],
  ] as const)("a %s address is flagged and shown on the email field", (outcome, message) => {
    const next = resolved(outcome);
    expect(next.emailCheck).toEqual({ email: EMAIL, status: "flagged", error: message });
    expect(next.errors.email).toBe(message);
  });

  test("a clean address, or a check that failed, is simply ok and shows nothing", () => {
    for (const outcome of ["ok", "unknown"] as const) {
      const next = resolved(outcome);
      expect(next.emailCheck.status).toBe("ok");
      expect(next.errors.email).toBeUndefined();
    }
  });

  test("a late answer for an address the applicant has since changed is ignored", () => {
    const state = formReducer(checking(), { type: "change", field: "email", value: "other@example.com" });
    const next = formReducer(state, { type: "emailCheckResolved", email: EMAIL, outcome: "duplicate" });
    expect(next).toEqual(state);
  });

  test("a late answer from a superseded check is ignored", () => {
    const superseded = { ...checking(), emailCheck: { email: "newer@example.com", status: "pending" as const, error: "" } };
    const next = formReducer(superseded, { type: "emailCheckResolved", email: EMAIL, outcome: "duplicate" });
    expect(next.emailCheck.status).toBe("pending");
    expect(next.errors.email).toBeUndefined();
  });

  test("blurring the email does not wipe a flagged error, even though its format is fine", () => {
    const next = formReducer(resolved("duplicate"), { type: "blur", field: "email" });
    expect(next.errors.email).toBe(DUPLICATE);
  });

  test("blurring an email that was never flagged still checks only its format", () => {
    expect(formReducer(at({ values: { ...complete, email: "nope" } }), { type: "blur", field: "email" }).errors.email).toBe("Enter a valid email address.");
    expect(formReducer(resolved("ok"), { type: "blur", field: "email" }).errors.email).toBeUndefined();
  });

  describe("gating Next", () => {
    test("a flagged address blocks Next, shows its message, and focuses the email field", () => {
      const next = formReducer(resolved("duplicate"), { type: "next" });
      expect(next.step).toBe(1);
      expect(next.summary).toBe(DUPLICATE);
      expect(next.summaryField).toBe("email");
      expect(next.focusField).toBe("email");
      expect(next.errors.email).toBe(DUPLICATE);
    });

    test("a check still in flight pauses Next with the legacy message and no field error", () => {
      const next = formReducer(checking(), { type: "next" });
      expect(next.step).toBe(1);
      expect(next.summary).toBe(CHECKING);
      expect(next.errors.email).toBeUndefined();
      expect(next.focusField).toBe("email");
    });

    test("that waiting message disappears when the check resolves ok", () => {
      const waiting = formReducer(checking(), { type: "next" });
      expect(resolved("ok", waiting).summary).toBe("");
    });

    test("it turns into the duplicate message when the check resolves as a duplicate", () => {
      const waiting = formReducer(checking(), { type: "next" });
      expect(resolved("duplicate", waiting).errors.email).toBe(DUPLICATE);
    });

    test("a clean or unchecked address lets Next through", () => {
      expect(formReducer(resolved("ok"), { type: "next" }).step).toBe(2);
      expect(formReducer(at(), { type: "next" }).step).toBe(2);
    });

    test("an old result for a different address does not block", () => {
      const stale = at({ emailCheck: { email: "old@example.com", status: "flagged", error: "x" } });
      expect(formReducer(stale, { type: "next" }).step).toBe(2);
    });

    test("ordinary field errors on the step come first, so the gate never hides them", () => {
      const state = { ...resolved("duplicate"), values: { ...complete, firstName: "" } };
      const next = formReducer(state, { type: "next" });
      expect(next.summary).toBe("Enter your first name.");
      expect(next.focusField).toBe("firstName");
    });
  });

  describe("gating Submit", () => {
    const onLastStep = (state: FormState): FormState => ({ ...state, step: 3, maxStep: 3 });

    test("firstBlockedStep sees a flagged address even though the fields themselves are valid", () => {
      expect(firstInvalidStep(complete)).toBeNull();
      expect(firstBlockedStep(resolved("duplicate"))).toBe(1);
      expect(firstBlockedStep(resolved("ok"))).toBeNull();
      expect(firstBlockedStep(at())).toBeNull();
    });

    test("a failed submit attempt jumps back to step 1 and flags the email", () => {
      const next = formReducer(onLastStep(resolved("undeliverable")), { type: "submitAttempt" });
      expect(next.step).toBe(1);
      expect(next.errors.email).toBe(UNDELIVERABLE);
      expect(next.focusField).toBe("email");
    });

    test("a still-pending check also holds the submission", () => {
      const next = formReducer(onLastStep(checking()), { type: "submitAttempt" });
      expect(next.step).toBe(1);
      expect(next.summary).toBe(CHECKING);
    });
  });
});

describe("moving between steps", () => {
  test("Next on a valid step advances, remembers the furthest step and clears the summary", () => {
    const next = formReducer(at({ summary: "old", errors: { firstName: "x" } }), { type: "next" });
    expect(next).toMatchObject({ step: 2, maxStep: 2, summary: "", focusField: null, errors: {} });
  });

  test("Next on an invalid step stays put, shows the errors and says where to focus", () => {
    const state = at({ values: { ...complete, firstName: "", email: "x" } });
    const next = formReducer(state, { type: "next" });
    expect(next.step).toBe(1);
    expect(next.errors).toEqual({ firstName: "Enter your first name.", email: "Enter a valid email address." });
    expect(next.summary).toBe("Enter your first name.");
    expect(next.focusField).toBe("firstName");
  });

  test("Next on the last step does nothing", () => {
    const state = at({ step: 3, maxStep: 3 });
    expect(formReducer(state, { type: "next" })).toEqual(state);
  });

  test("Back goes up one step without validating, and never below step 1", () => {
    const back = formReducer(at({ step: 2, maxStep: 2, summary: "x" }), { type: "back" });
    expect(back).toMatchObject({ step: 1, maxStep: 2, summary: "" });
    expect(formReducer(at(), { type: "back" }).step).toBe(1);
  });

  test("progress dots only reach steps already visited", () => {
    const state = at({ step: 2, maxStep: 2 });
    expect(formReducer(state, { type: "goto", step: 1 }).step).toBe(1);
    expect(formReducer(state, { type: "goto", step: 3 }).step).toBe(2);
    expect(formReducer(at({ step: 1, maxStep: 3 }), { type: "goto", step: 3 }).step).toBe(3);
  });
});

describe("submitting", () => {
  test("firstInvalidStep finds the earliest step with an error, or null when everything is valid", () => {
    expect(firstInvalidStep(complete)).toBeNull();
    expect(firstInvalidStep({ ...complete, consent: false })).toBe(3);
    expect(firstInvalidStep({ ...complete, motivationEssay: "x", consent: false })).toBe(2);
    expect(firstInvalidStep({ ...complete, firstName: "" })).toBe(1);
  });

  test("a failed submit attempt jumps to the first invalid step and shows its errors", () => {
    const state = at({ step: 3, maxStep: 3, values: { ...complete, careerGoal: "short" } });
    const next = formReducer(state, { type: "submitAttempt" });
    expect(next.step).toBe(2);
    expect(next.errors).toEqual({ careerGoal: "Your 6-month goal must be at least 20 characters." });
    expect(next.summary).toBe("Your 6-month goal must be at least 20 characters.");
    expect(next.focusField).toBe("careerGoal");
  });

  test("a valid submit attempt changes nothing", () => {
    const state = at({ step: 3, maxStep: 3 });
    expect(formReducer(state, { type: "submitAttempt" })).toEqual(state);
  });
});

describe("the apply-and-pay flow (one step)", () => {
  const shortOnly: FormValues = {
    ...emptyValues(),
    firstName: "Ada",
    lastName: "Obi",
    email: "ada@example.com",
    country: "Nigeria",
    phoneCode: "+234",
    phone: "801 234 5678",
    preferredTrack: "Frontend Development",
    experienceLevel: "Complete beginner",
    consent: true,
    refundPolicy: true,
  };
  const pay = (values: FormValues = shortOnly): FormState => initialState(values, "payAtApply");

  test("starts as a single step", () => {
    expect(pay().flow).toBe("payAtApply");
    expect(initialState().flow).toBe("award");
  });

  test("can be submitted from step 1 without the long form's fields", () => {
    expect(firstBlockedStep(pay())).toBeNull();
    expect(firstBlockedStep(initialState(shortOnly, "award"))).toBe(1);
  });

  test("a failed submit shows every short-form error and focuses the first", () => {
    const next = formReducer(pay(emptyValues()), { type: "submitAttempt" });
    expect(next.step).toBe(1);
    expect(next.focusField).toBe("firstName");
    expect(Object.keys(next.errors)).toEqual(["firstName", "lastName", "email", "country", "phone", "preferredTrack", "experienceLevel", "consent", "refundPolicy"]);
  });

  test("not accepting the policies blocks the submit, with the legacy message", () => {
    const next = formReducer(pay({ ...shortOnly, refundPolicy: false }), { type: "submitAttempt" });
    expect(next.errors.refundPolicy).toBe("You must accept the policies.");
    expect(next.focusField).toBe("refundPolicy");
  });

  test("there is no next step to move to", () => {
    const state = pay();
    expect(formReducer(state, { type: "next" })).toBe(state);
  });

  test("the email check still gates the submit", () => {
    const flagged = { ...pay(), emailCheck: { email: "ada@example.com", status: "flagged" as const, error: "You've already submitted an application for this cohort with this email." } };
    expect(firstBlockedStep(flagged)).toBe(1);
  });
});
