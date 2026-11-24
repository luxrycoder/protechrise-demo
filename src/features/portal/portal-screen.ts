import type { ApiResult } from "@/lib/api/result";
import type { PortalHome, PortalHomeResponse } from "@/lib/api/schemas/portal";
import { interpretPortal, type GateKind, type SupportView } from "@/lib/portal";

/**
 * What the portal page shows, worked out from the answer of `GET /api/portal/home` with no DOM involved.
 * The components only draw the result.
 */

export type PortalScreen =
  | { readonly kind: "loading" }
  /** No session (401), or it expired. */
  | { readonly kind: "signIn" }
  /** 404: the portal is switched off. Looks like any unknown page, never an error. */
  | { readonly kind: "off" }
  /** Anything else that went wrong: network, rate limit, busy, server, an answer we cannot read. */
  | { readonly kind: "error"; readonly message: string; readonly retryable: boolean }
  | { readonly kind: "gate"; readonly gate: GateKind; readonly retryAfterSeconds: number | null; readonly support: SupportView }
  | { readonly kind: "home"; readonly home: PortalHome };

export function screenFromResult(result: ApiResult<PortalHomeResponse>): PortalScreen {
  if (!result.ok) {
    switch (result.error.kind) {
      case "unauthorized":
        return { kind: "signIn" };
      case "not_found":
        return { kind: "off" };
      case "aborted":
        return { kind: "loading" };
      default:
        return { kind: "error", message: result.error.message, retryable: result.error.retryable };
    }
  }
  return interpretPortal(result.data);
}

export type GateCopy = {
  readonly title: string;
  readonly body: string;
  readonly waiting: boolean;
  readonly action: { readonly label: string; readonly href: string } | null;
  readonly showSupport: boolean;
};

/** Where to sign in. The status page sends the learner back to the portal afterwards (`next` is a local path). */
export const SIGN_IN_HREF = "/status?next=%2Fportal";

export function gateCopy(gate: GateKind): GateCopy {
  switch (gate) {
    case "confirming":
      return {
        title: "We are confirming your seat",
        body: "This usually takes a few minutes. You do not need to do anything; this page checks again by itself.",
        waiting: true,
        action: null,
        showSupport: false,
      };
    case "stuck":
      return {
        title: "This is taking longer than expected",
        body: "Your payment is recorded, but we could not finish confirming your seat automatically. Please contact us so we can fix it quickly.",
        waiting: false,
        action: null,
        showSupport: true,
      };
    case "not_paid":
      return {
        title: "We have not received your payment yet",
        body: "The portal opens once your payment is confirmed. You can check where your application stands.",
        waiting: false,
        action: { label: "Check your status", href: "/status" },
        showSupport: false,
      };
    case "unavailable":
      return { title: "The portal is not available right now", body: "Please try again in a little while.", waiting: false, action: null, showSupport: false };
  }
}

export const SIGN_IN_COPY = {
  title: "Sign in to continue",
  body: "Use the sign-in link we email you from your status page. There is no password.",
  actionLabel: "Go to sign in",
} as const;

/** "Welcome, Ada" or "Welcome, scholar" when the name is missing. */
export function welcomeText(home: PortalHome): string {
  const name = home.learner?.firstName?.trim();
  return `Welcome, ${name || "scholar"}`;
}

/** "Data Analysis · Cohort 1", skipping what is missing. */
export function eyebrowText(home: PortalHome): string {
  return [home.learner?.track, home.learner?.cohortName].map((v) => v?.trim()).filter(Boolean).join(" · ");
}
