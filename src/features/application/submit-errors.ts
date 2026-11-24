import type { ApiError } from "@/lib/api/result";

export const CONTACT_EMAIL = "hello@protechrise.com";

export type SubmitErrorDescription = {
  readonly message: string;
  /** Set when the message ends by pointing at this address, which the page renders as a mailto link. */
  readonly contactEmail?: string;
};

/**
 * The text shown when submitting fails, in the legacy form's words. The meaning of each case is the API's;
 * only the wording is ours.
 *
 * One deliberate improvement: the legacy form showed the "site is busy" message for EVERY 503. A 503 is also what
 * "applications are not open right now" returns, which is not a busy site, so that case shows the API's own text.
 */
export function describeSubmitError(error: ApiError): SubmitErrorDescription {
  switch (error.kind) {
    case "conflict":
      return {
        message:
          "You've already submitted an application for this cohort with this email. If you need to correct something or check your status, contact us at",
        contactEmail: CONTACT_EMAIL,
      };
    case "rate_limited":
      return { message: "You've submitted a few times in a row — please wait a few minutes before trying again." };
    case "busy":
      return {
        message:
          "We could not save your application because the site is very busy. Your answers are still here: please click Submit again in a minute.",
      };
    case "network":
    case "timeout":
      return { message: "Could not reach the server. Please try again." };
    case "unavailable":
    case "validation":
      return { message: error.message };
    default:
      // The API's own text when it sent one ("Could not submit application."), always with a way forward.
      return { message: "Could not submit application. Please try again." };
  }
}
