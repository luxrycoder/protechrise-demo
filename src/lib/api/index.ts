import { applicationEndpoints, waitlistEndpoints } from "@/lib/api/applications";
import { apiRequest, type ClientConfig } from "@/lib/api/client";
import { claimEndpoints } from "@/lib/api/claim";
import { portalEndpoints } from "@/lib/api/portal";
import { referrerEndpoints } from "@/lib/api/referrer";
import { statusEndpoints } from "@/lib/api/status";
import type { Requester } from "@/lib/api/types";

/**
 * Typed client for the applicant-facing waitlist-api endpoints. Every call returns an `ApiResult` and
 * never throws. In the browser use `createApi()` (same-origin relative URLs through the proxy); on the
 * server pass `{ baseUrl: <API origin> }`.
 *
 *   const api = createApi();
 *   const result = await api.applications.checkEmail("ada@example.com");
 *   if (!result.ok) showError(result.error.message);
 *
 * Live public data (tracks, fee) is read server-side by `src/lib/tracks.ts` and `src/lib/fee.ts`.
 */
export function createApi(config: ClientConfig = {}) {
  const request: Requester = (options) => apiRequest(config, options);
  return {
    applications: applicationEndpoints(request),
    waitlist: waitlistEndpoints(request),
    status: statusEndpoints(request),
    claim: claimEndpoints(request),
    referrer: referrerEndpoints(request),
    portal: portalEndpoints(request),
  };
}

export type Api = ReturnType<typeof createApi>;

export { BUSY_RETRY_DELAYS_MS, type ClientConfig, type FetchLike } from "@/lib/api/client";
export { type ApiError, type ApiErrorKind, type ApiResult } from "@/lib/api/result";
export type { CallOptions } from "@/lib/api/types";
export {
  ApplicationInputSchema,
  CAN_SELF_FUND_OPTIONS,
  CURRENT_STATUS_OPTIONS,
  EXPERIENCE_LEVEL_OPTIONS,
  FIELD_LIMITS,
  MIN_LENGTHS,
  REFERRAL_SOURCE_OPTIONS,
  WEEKLY_HOURS_OPTIONS,
  applicationFieldErrors,
  type ApplicationInput,
} from "@/lib/api/schemas/applications";
export type { ClaimConfirmed } from "@/lib/api/schemas/claim";
export type { ReferrerMe } from "@/lib/api/schemas/referrer";
export type { StatusMe } from "@/lib/api/schemas/status";
