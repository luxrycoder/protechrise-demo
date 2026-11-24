export const STEP_NAMES = ["About You", "Background & Goals", "Scholarship"] as const;
export const TOTAL_STEPS = STEP_NAMES.length;

export type StepNumber = 1 | 2 | 3;

/** Text fields of the form (everything except the two checkboxes). */
export type TextFieldId =
  | "website"
  | "firstName"
  | "lastName"
  | "email"
  | "country"
  | "phoneCode"
  | "phone"
  | "city"
  | "cityOther"
  | "currentStatus"
  | "preferredTrack"
  | "experienceLevel"
  | "weeklyHours"
  | "motivationEssay"
  | "careerGoal"
  | "commitmentPlan"
  | "canSelfFund"
  | "referralSource"
  | "referralSourceOther";

export type CheckboxFieldId = "consent" | "refundPolicy";

/** A field that can carry a validation error. `phoneCode` shares the phone field's error slot, as in the legacy form. */
export type FieldId = Exclude<TextFieldId, "website" | "phoneCode"> | "phone" | CheckboxFieldId;

export type FormValues = Record<TextFieldId, string> & Record<CheckboxFieldId, boolean>;

/** Which fields belong to which step, in the order their errors are reported. */
export const STEP_FIELDS: Readonly<Record<StepNumber, readonly FieldId[]>> = {
  1: ["firstName", "lastName", "email", "country", "phone", "city", "cityOther"],
  2: ["currentStatus", "preferredTrack", "experienceLevel", "weeklyHours", "motivationEssay", "careerGoal", "commitmentPlan"],
  3: ["canSelfFund", "referralSource", "referralSourceOther", "consent", "refundPolicy"],
};

export const STEPS: readonly StepNumber[] = [1, 2, 3];

/**
 * Which application the open cohort takes. `award` is the three-step scholarship application; `payAtApply` is the
 * one-screen short form that goes straight to payment (waitlist-api `cohorts.pay_at_apply`).
 */
export type FlowId = "award" | "payAtApply";

/** The short form's fields, in the legacy order. It is a single step. */
const PAY_AT_APPLY_FIELDS: readonly FieldId[] = ["firstName", "lastName", "email", "country", "phone", "preferredTrack", "experienceLevel", "consent", "refundPolicy"];

export function stepsFor(flow: FlowId): readonly StepNumber[] {
  return flow === "payAtApply" ? [1] : STEPS;
}

export function stepFieldsFor(flow: FlowId, step: StepNumber): readonly FieldId[] {
  return flow === "payAtApply" ? (step === 1 ? PAY_AT_APPLY_FIELDS : []) : STEP_FIELDS[step];
}

export function emptyValues(): FormValues {
  return {
    website: "",
    firstName: "",
    lastName: "",
    email: "",
    country: "",
    phoneCode: "",
    phone: "",
    city: "",
    cityOther: "",
    currentStatus: "",
    preferredTrack: "",
    experienceLevel: "",
    weeklyHours: "",
    motivationEssay: "",
    careerGoal: "",
    commitmentPlan: "",
    canSelfFund: "",
    referralSource: "",
    referralSourceOther: "",
    consent: false,
    refundPolicy: false,
  };
}

/** Where each step's fields are checked: the step a field belongs to. */
export function stepOf(field: FieldId): StepNumber {
  return STEPS.find((step) => STEP_FIELDS[step].includes(field)) ?? 1;
}
