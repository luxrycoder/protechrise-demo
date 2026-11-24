import type { ApiResult } from "@/lib/api/result";
import type { PortalLms } from "@/lib/api/schemas/portal";
import type { StatusLms } from "@/lib/api/schemas/status";
import { formatInstant, handoffHref, instantMs } from "@/lib/portal";

/**
 * The classroom (LMS) card, worked out with no DOM involved. The portal home only carries a state (never a URL or
 * ticket); the one-time address comes from `POST /api/status/lms-handoff`, to the person who clicks.
 * Any state other than `not_open`, `ready` or `unavailable` (including `hidden`, or one added later) hides the card.
 */

export type LmsCardView = {
  readonly state: "not_open" | "ready" | "unavailable";
  readonly message: string;
  /** "From Monday 1 February 2027 at 08:00 WAT", or null when the opening time is unknown or invalid. */
  readonly opens: string | null;
  /** Only a ready classroom has a button. */
  readonly button: boolean;
  /** An unavailable classroom points to support. */
  readonly showSupport: boolean;
};

export const LMS_NOT_OPEN = "Opens on class day";
export const LMS_READY = "Your classroom is open. This is where your lessons and assignments live.";
export const LMS_READY_NOTE = "You may be asked to sign in or activate your account there.";
export const LMS_UNAVAILABLE = "The classroom is not available right now. Please try again in a little while.";
export const LMS_FAILED = "We could not open the classroom just now. Please try again in a moment, or contact support.";

export function lmsCardView(lms: PortalLms | undefined, cohortTimezone: string | null | undefined, lmsOrigin: string | null): LmsCardView | null {
  // A ready classroom cannot be opened safely without a configured LMS origin: say it is unavailable, never offer a dead button.
  const state = lms?.state === "ready" && !lmsOrigin ? "unavailable" : lms?.state;
  switch (state) {
    case "not_open":
      return {
        state: "not_open",
        message: LMS_NOT_OPEN,
        opens: instantMs(lms?.opensAt) === null ? null : `From ${formatInstant(lms?.opensAt, cohortTimezone)}`,
        button: false,
        showSupport: false,
      };
    case "ready":
      return { state: "ready", message: LMS_READY, opens: null, button: true, showSupport: false };
    case "unavailable":
      return { state: "unavailable", message: LMS_UNAVAILABLE, opens: null, button: false, showSupport: true };
    default:
      return null;
  }
}

export type LmsOpenOutcome =
  /** Navigate to `url`. It carries a one-time secret in its fragment: never store, log or render it. */
  | { readonly kind: "open"; readonly url: string }
  | { readonly kind: "signedOut" }
  | { readonly kind: "failed" };

export function lmsOpenOutcome(result: ApiResult<StatusLms>, lmsOrigin: string | null): LmsOpenOutcome {
  if (result.ok) {
    const url = result.data.ok === true ? handoffHref(result.data.handoffUrl, lmsOrigin) : null;
    return url ? { kind: "open", url } : { kind: "failed" };
  }
  return result.error.kind === "unauthorized" ? { kind: "signedOut" } : { kind: "failed" };
}
