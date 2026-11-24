import type { ApplicationInput, ShortApplicationInput } from "@/lib/api/schemas/applications";
import { stepFieldsFor, type FieldId, type FlowId, type FormValues, type StepNumber } from "@/features/application/fields";

/**
 * Field validation for the form, with the legacy client's wording and rules ("Enter your first name."), which is
 * friendlier than the server's ("Enter a valid first name."). The server's rules (src/lib/api/schemas) still run
 * when the form is submitted and remain the authority.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** The national part of a phone number: digits, spaces and hyphens. */
const PHONE_NUMBER_RE = /^[\d\s-]{6,15}$/;
/** What the server accepts for the combined number. */
const SERVER_PHONE_RE = /^\+?[\d\s().-]{7,24}$/;
const SERVER_PHONE_MAX = 32;

const MIN = { motivationEssay: 120, careerGoal: 20, commitmentPlan: 60 } as const;

type Validator = (values: FormValues) => string;

const required = (field: keyof FormValues, message: string): Validator => (values) =>
  String(values[field]).trim() ? "" : message;

const minLength = (field: "motivationEssay" | "careerGoal" | "commitmentPlan", message: string): Validator => (values) =>
  values[field].trim().length < MIN[field] ? message : "";

const VALIDATORS: Readonly<Record<FieldId, Validator>> = {
  firstName: required("firstName", "Enter your first name."),
  lastName: required("lastName", "Enter your last name."),
  email: (values) => {
    const email = values.email.trim();
    if (!email) return "Enter your email address.";
    return EMAIL_RE.test(email) ? "" : "Enter a valid email address.";
  },
  country: required("country", "Select your country."),
  // The dialling code and the number share one error slot, so the code is checked here too.
  phone: (values) => {
    const code = values.phoneCode.trim();
    const number = values.phone.trim();
    if (!number) return "Enter your phone number.";
    if (!PHONE_NUMBER_RE.test(number)) return "Enter a valid phone number (digits only).";
    if (!code) return "Select your dialing code.";
    const combined = `${code}${number}`.trim();
    return combined.length > SERVER_PHONE_MAX || !SERVER_PHONE_RE.test(combined) ? "Enter a valid phone number." : "";
  },
  city: required("city", "Select your city."),
  cityOther: (values) => (values.city === "Other" && !values.cityOther.trim() ? "Enter your city." : ""),
  currentStatus: required("currentStatus", "Select your current status."),
  preferredTrack: required("preferredTrack", "Select a preferred track."),
  experienceLevel: required("experienceLevel", "Select your experience level."),
  weeklyHours: required("weeklyHours", "Select your weekly time commitment."),
  motivationEssay: minLength("motivationEssay", "Motivation must be at least 120 characters."),
  careerGoal: minLength("careerGoal", "Your 6-month goal must be at least 20 characters."),
  commitmentPlan: minLength("commitmentPlan", "Your commitment plan must be at least 60 characters."),
  // The question is "Do you need scholarship support?": the answer `Yes` means they need support.
  canSelfFund: required("canSelfFund", "Let us know if you need scholarship support."),
  referralSource: required("referralSource", "Let us know how you heard about us."),
  referralSourceOther: (values) =>
    values.referralSource === "Other" && !values.referralSourceOther.trim() ? "Tell us how you heard about us." : "",
  consent: (values) => (values.consent ? "" : "You must agree to the application terms."),
  refundPolicy: (values) => (values.refundPolicy ? "" : "You must accept the policies."),
};

/** The error message for one field, or an empty string when it is valid. */
export function validateField(field: FieldId, values: FormValues): string {
  return VALIDATORS[field](values);
}

export type StepValidation = {
  readonly errors: Partial<Record<FieldId, string>>;
  /** The first message in field order, for the error summary. */
  readonly firstError: string;
  /** The first field with an error, to move focus to. */
  readonly firstField: FieldId | null;
};

export function validateStep(step: StepNumber, values: FormValues, flow: FlowId = "award"): StepValidation {
  const errors: Partial<Record<FieldId, string>> = {};
  let firstField: FieldId | null = null;
  for (const field of stepFieldsFor(flow, step)) {
    const message = validateField(field, values);
    if (!message) continue;
    errors[field] = message;
    firstField ??= field;
  }
  return { errors, firstError: firstField ? (errors[firstField] ?? "") : "", firstField };
}

/**
 * Map the form to the API payload exactly as the legacy form did: strings trimmed, phone as the calling code
 * directly followed by the number, `refundPolicy` sent as `refundPolicyAccepted`, and `canSelfFund` sent as
 * chosen (it stores the answer to "Do you need scholarship support?", so `Yes` means they need it).
 *
 * The cast is deliberate: the form holds plain strings, and the API client validates the enum fields before sending.
 */
export function buildApplicationInput(values: FormValues, extras: Partial<ApplicationInput> = {}): ApplicationInput {
  const t = (s: string) => s.trim();
  return {
    website: t(values.website),
    firstName: t(values.firstName),
    lastName: t(values.lastName),
    email: t(values.email),
    phone: `${t(values.phoneCode)}${t(values.phone)}`.trim(),
    city: t(values.city),
    cityOther: t(values.cityOther),
    country: t(values.country),
    preferredTrack: t(values.preferredTrack),
    currentStatus: t(values.currentStatus),
    experienceLevel: t(values.experienceLevel),
    weeklyHours: t(values.weeklyHours),
    motivationEssay: t(values.motivationEssay),
    careerGoal: t(values.careerGoal),
    commitmentPlan: t(values.commitmentPlan),
    canSelfFund: t(values.canSelfFund),
    referralSource: t(values.referralSource),
    referralSourceOther: t(values.referralSourceOther),
    consent: values.consent,
    refundPolicyAccepted: values.refundPolicy,
    ...extras,
  } as ApplicationInput;
}

/**
 * The apply-and-pay short form's payload, as the legacy form sent it: the same trimming and phone rule as the long
 * form, and none of its other fields.
 */
export function buildShortApplicationInput(values: FormValues, extras: Partial<ShortApplicationInput> = {}): ShortApplicationInput {
  const t = (s: string) => s.trim();
  return {
    website: t(values.website),
    firstName: t(values.firstName),
    lastName: t(values.lastName),
    email: t(values.email),
    phone: `${t(values.phoneCode)}${t(values.phone)}`.trim(),
    country: t(values.country),
    preferredTrack: t(values.preferredTrack),
    experienceLevel: t(values.experienceLevel),
    consent: values.consent,
    refundPolicyAccepted: values.refundPolicy,
    ...extras,
  } as ShortApplicationInput;
}
