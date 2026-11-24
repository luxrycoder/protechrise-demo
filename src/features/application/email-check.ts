import type { ApiResult } from "@/lib/api/result";

export type EmailCheckOutcome = "ok" | "duplicate" | "undeliverable" | "unknown";

/** The legacy wording, shown on the email field and in the error summary. */
export const EMAIL_DUPLICATE_MESSAGE = "You've already submitted an application for this cohort with this email.";
export const EMAIL_UNDELIVERABLE_MESSAGE = "We could not verify that email domain. Please check for typos.";
export const EMAIL_CHECKING_MESSAGE = "Still checking your email — please wait a moment and try again.";

/** The slice of the check-email response the form needs. */
type CheckEmailData = { readonly deliverable: boolean; readonly alreadyRegistered: boolean };

/**
 * Turn a check-email result into what the form should do. `unknown` means the check itself failed: it is best
 * effort (the server checks again at submit), so a failed check never blocks the applicant.
 */
export function emailCheckOutcome(result: ApiResult<CheckEmailData>): EmailCheckOutcome {
  if (!result.ok) return "unknown";
  if (result.data.alreadyRegistered) return "duplicate";
  return result.data.deliverable ? "ok" : "undeliverable";
}

/** The message for an outcome that flags the address, or an empty string when it does not. */
export function flaggedMessage(outcome: EmailCheckOutcome): string {
  if (outcome === "duplicate") return EMAIL_DUPLICATE_MESSAGE;
  if (outcome === "undeliverable") return EMAIL_UNDELIVERABLE_MESSAGE;
  return "";
}
