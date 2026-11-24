import { EMAIL_CHECKING_MESSAGE, flaggedMessage, type EmailCheckOutcome } from "@/features/application/email-check";
import {
  emptyValues,
  stepFieldsFor,
  stepsFor,
  type CheckboxFieldId,
  type FieldId,
  type FlowId,
  type FormValues,
  type StepNumber,
  type TextFieldId,
} from "@/features/application/fields";
import { dialCodeFor } from "@/features/application/geo";
import { validateField, validateStep } from "@/features/application/validation";

type Errors = Partial<Record<FieldId, string>>;

/**
 * The result of checking whether the email can receive mail and is not already registered. It gates Next and
 * Submit, because a flagged address is not an error the plain field validators can see (its format is fine).
 */
export type EmailCheck = {
  /** The (trimmed) address this check is about. Empty when no check has run for the current value. */
  readonly email: string;
  readonly status: "idle" | "pending" | "flagged" | "ok";
  readonly error: string;
};

const NO_EMAIL_CHECK: EmailCheck = { email: "", status: "idle", error: "" };

export type FormState = {
  /** Which application this is: the three-step award form, or the one-screen apply-and-pay form. */
  readonly flow: FlowId;
  readonly values: FormValues;
  readonly errors: Errors;
  readonly step: StepNumber;
  /** The furthest step reached, so the progress dots can go back and forward over visited steps only. */
  readonly maxStep: StepNumber;
  /** The first error of a failed Next/Submit, for the error summary at the top of the step. */
  readonly summary: string;
  /** The field the summary is about; the summary disappears once that field is fixed. */
  readonly summaryField: FieldId | null;
  /** The field to move keyboard focus to after a failed Next/Submit. */
  readonly focusField: FieldId | null;
  readonly emailCheck: EmailCheck;
};

export type FormAction =
  | { readonly type: "change"; readonly field: TextFieldId; readonly value: string }
  | { readonly type: "toggle"; readonly field: CheckboxFieldId; readonly checked: boolean }
  | { readonly type: "blur"; readonly field: FieldId }
  | { readonly type: "emailCheckStarted"; readonly email: string }
  | { readonly type: "emailCheckResolved"; readonly email: string; readonly outcome: EmailCheckOutcome }
  | { readonly type: "next" }
  | { readonly type: "back" }
  | { readonly type: "goto"; readonly step: StepNumber }
  | { readonly type: "submitAttempt" };

export function initialState(values: FormValues = emptyValues(), flow: FlowId = "award"): FormState {
  return { flow, values, errors: {}, step: 1, maxStep: 1, summary: "", summaryField: null, focusField: null, emailCheck: NO_EMAIL_CHECK };
}

const omit = (errors: Errors, fields: readonly FieldId[]): Errors =>
  Object.fromEntries(Object.entries(errors).filter(([key]) => !fields.includes(key as FieldId))) as Errors;

/** The earliest step whose fields fail validation, or null when the whole form is valid. Ignores the email check. */
export function firstInvalidStep(values: FormValues, flow: FlowId = "award"): StepNumber | null {
  return stepsFor(flow).find((step) => Object.keys(validateStep(step, values, flow).errors).length > 0) ?? null;
}

const NO_SUMMARY = { summary: "", summaryField: null } as const;

/** Drop the summary when the field it refers to has been fixed (or reset). */
const dropSummaryIfFixed = (state: FormState, fixed: readonly FieldId[]) =>
  state.summaryField !== null && fixed.includes(state.summaryField) ? NO_SUMMARY : {};

/** The email check as it applies to what is in the field now; null when it has nothing to say. */
function emailGate(state: FormState): { readonly message: string; readonly flagged: boolean } | null {
  const { emailCheck } = state;
  if (emailCheck.email !== state.values.email.trim()) return null;
  if (emailCheck.status === "flagged") return { message: emailCheck.error, flagged: true };
  if (emailCheck.status === "pending") return { message: EMAIL_CHECKING_MESSAGE, flagged: false };
  return null;
}

type Block = Pick<FormState, "errors" | "summary" | "summaryField" | "focusField">;

/** What stops the applicant leaving this step (field errors first, then the email check), or null when nothing does. */
function blockFor(state: FormState, step: StepNumber): Block | null {
  const result = validateStep(step, state.values, state.flow);
  if (result.firstField) {
    return {
      errors: { ...omit(state.errors, stepFieldsFor(state.flow, step)), ...result.errors },
      summary: result.firstError,
      summaryField: result.firstField,
      focusField: result.firstField,
    };
  }
  if (step !== 1) return null;
  const gate = emailGate(state);
  if (!gate) return null;
  return {
    errors: gate.flagged ? { ...state.errors, email: gate.message } : state.errors,
    summary: gate.message,
    summaryField: gate.flagged ? "email" : null,
    focusField: "email",
  };
}

/** The earliest step that blocks submission, counting the email check, or null when the form can be submitted. */
export function firstBlockedStep(state: FormState): StepNumber | null {
  return stepsFor(state.flow).find((step) => blockFor(state, step) !== null) ?? null;
}

/** Apply a text edit, including the fields that depend on it (a new country resets the city and sets the dial code). */
function applyChange(state: FormState, field: TextFieldId, value: string): FormState {
  let values: FormValues = { ...state.values, [field]: value };
  let cleared: readonly FieldId[];
  let emailCheck = state.emailCheck;
  switch (field) {
    case "country":
      values = { ...values, city: "", cityOther: "", phoneCode: dialCodeFor(value) ?? values.phoneCode };
      cleared = ["country", "city", "cityOther", "phone"];
      break;
    case "city":
      if (value !== "Other") values = { ...values, cityOther: "" };
      cleared = ["city", "cityOther"];
      break;
    case "referralSource":
      if (value !== "Other") values = { ...values, referralSourceOther: "" };
      cleared = ["referralSource", "referralSourceOther"];
      break;
    case "phoneCode":
      cleared = ["phone"];
      break;
    case "email":
      // A new address needs a new check; whatever was found about the old one no longer applies.
      emailCheck = NO_EMAIL_CHECK;
      cleared = ["email"];
      break;
    case "website":
      cleared = [];
      break;
    default:
      cleared = [field];
  }
  return { ...state, values, emailCheck, errors: omit(state.errors, cleared), focusField: null, ...dropSummaryIfFixed(state, cleared) };
}

function resolveEmailCheck(state: FormState, email: string, outcome: EmailCheckOutcome): FormState {
  // Ignore an answer for an address that has since been replaced, or by a newer check.
  if (state.emailCheck.email !== email || state.values.email.trim() !== email) return state;
  const message = flaggedMessage(outcome);
  const waiting = state.summary === EMAIL_CHECKING_MESSAGE;
  if (message) {
    return {
      ...state,
      emailCheck: { email, status: "flagged", error: message },
      errors: { ...state.errors, email: message },
      ...(waiting ? { summary: message, summaryField: "email" as const } : {}),
    };
  }
  return { ...state, emailCheck: { email, status: "ok", error: "" }, ...(waiting ? NO_SUMMARY : {}) };
}

export function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case "change":
      return applyChange(state, action.field, action.value);

    case "toggle":
      return {
        ...state,
        values: { ...state.values, [action.field]: action.checked },
        errors: omit(state.errors, [action.field]),
        focusField: null,
        ...dropSummaryIfFixed(state, [action.field]),
      };

    case "blur": {
      // The plain email validator checks only the format, so it must not wipe a duplicate/undeliverable flag.
      const flagged = action.field === "email" ? emailGate(state) : null;
      const message = validateField(action.field, state.values) || (flagged?.flagged ? flagged.message : "");
      const errors = message ? { ...state.errors, [action.field]: message } : omit(state.errors, [action.field]);
      return { ...state, errors, focusField: null, ...(message ? {} : dropSummaryIfFixed(state, [action.field])) };
    }

    case "emailCheckStarted":
      return { ...state, emailCheck: { email: action.email, status: "pending", error: "" } };

    case "emailCheckResolved":
      return resolveEmailCheck(state, action.email, action.outcome);

    case "next": {
      if (state.step >= stepsFor(state.flow).length) return state;
      const block = blockFor(state, state.step);
      if (block) return { ...state, ...block };
      const step = (state.step + 1) as StepNumber;
      return {
        ...state,
        step,
        maxStep: Math.max(state.maxStep, step) as StepNumber,
        errors: omit(state.errors, stepFieldsFor(state.flow, state.step)),
        ...NO_SUMMARY,
        focusField: null,
      };
    }

    case "back":
      if (state.step <= 1) return state;
      return { ...state, step: (state.step - 1) as StepNumber, ...NO_SUMMARY, focusField: null };

    case "goto":
      if (action.step > state.maxStep) return state;
      return { ...state, step: action.step, ...NO_SUMMARY, focusField: null };

    case "submitAttempt": {
      const step = firstBlockedStep(state);
      const block = step === null ? null : blockFor(state, step);
      return step === null || block === null ? state : { ...state, step, ...block };
    }
  }
}
