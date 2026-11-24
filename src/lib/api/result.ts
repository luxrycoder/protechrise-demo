/**
 * Every API call returns an ApiResult instead of throwing, so callers handle failure explicitly and a
 * network blip can never crash a page.
 */
export type ApiErrorKind =
  | "network" // the request never completed
  | "timeout" // it took too long
  | "aborted" // the caller cancelled it
  | "busy" // the database was locked and retries ran out (503 marked retryable)
  | "unavailable" // a 503 that is not a lock, for example "applications are not open"
  | "rate_limited" // 429
  | "validation" // 400
  | "unauthorized" // 401
  | "forbidden" // 403
  | "not_found" // 404
  | "conflict" // 409
  | "gone" // 410
  | "too_large" // 413
  | "server" // 5xx
  | "unexpected" // any other 4xx
  | "invalid_response"; // 2xx that does not match the schema, or is not JSON

export type ApiError = {
  readonly kind: ApiErrorKind;
  /** HTTP status, or null when there was no response. */
  readonly status: number | null;
  /** Safe to show to the user: the API's own message for 4xx/503, otherwise a generic one. */
  readonly message: string;
  /** Whether trying again later can reasonably succeed (offer a "Try again" button). */
  readonly retryable: boolean;
  /** Machine-readable code when the API sent one (for example `cross_site_request_blocked`). */
  readonly code?: string;
  /** The parsed error body, for callers that need extra fields such as `reason`. Never render it directly. */
  readonly body?: unknown;
  /** Developer detail (schema issues, original error). Never show to users. */
  readonly detail?: string;
};

export type ApiResult<T> =
  | { readonly ok: true; readonly data: T }
  | { readonly ok: false; readonly error: ApiError };

const DEFAULT_MESSAGES: Readonly<Record<ApiErrorKind, string>> = {
  network: "We could not reach the server. Check your connection and try again.",
  timeout: "The server took too long to respond. Please try again.",
  aborted: "Cancelled.",
  busy: "The site is busy right now. Please try again in a moment.",
  unavailable: "This is temporarily unavailable. Please try again later.",
  rate_limited: "Too many requests. Please wait a moment and try again.",
  validation: "Please check your details and try again.",
  unauthorized: "Your session has expired. Please sign in again.",
  forbidden: "You do not have access to this.",
  not_found: "We could not find that.",
  conflict: "That conflicts with an existing record.",
  gone: "This link is no longer available.",
  too_large: "That is too large to submit.",
  server: "Something went wrong on our side. Please try again.",
  unexpected: "Something went wrong. Please try again.",
  invalid_response: "We received an unexpected response. Please try again.",
};

const RETRYABLE: ReadonlySet<ApiErrorKind> = new Set(["network", "timeout", "busy", "unavailable", "rate_limited", "server"]);

/** The API's own error text is user-facing for 4xx and 503; this keeps technical codes and long text out. */
const CODE_LIKE = /^[a-z]+(_[a-z]+)+$/;
const MAX_API_MESSAGE = 300;

export function kindForStatus(status: number, retryableFlag: boolean): ApiErrorKind {
  if (status === 503) return retryableFlag ? "busy" : "unavailable";
  if (status === 400) return "validation";
  if (status === 401) return "unauthorized";
  if (status === 403) return "forbidden";
  if (status === 404) return "not_found";
  if (status === 409) return "conflict";
  if (status === 410) return "gone";
  if (status === 413) return "too_large";
  if (status === 429) return "rate_limited";
  if (status >= 500) return "server";
  return "unexpected";
}

export function buildError(kind: ApiErrorKind, status: number | null, body?: unknown, detail?: string): ApiError {
  const env = body !== null && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const apiText = typeof env.error === "string" ? env.error : undefined;
  const code = apiText && CODE_LIKE.test(apiText) ? apiText : undefined;
  const trustedStatus = status !== null && (status < 500 || status === 503);
  const candidate = code ? (typeof env.detail === "string" ? env.detail : undefined) : apiText;
  const message =
    trustedStatus && candidate && candidate.length <= MAX_API_MESSAGE ? candidate : DEFAULT_MESSAGES[kind];
  return {
    kind,
    status,
    message,
    retryable: RETRYABLE.has(kind),
    ...(code ? { code } : {}),
    ...(body !== undefined ? { body } : {}),
    ...(detail ? { detail } : {}),
  };
}

export const failure = (error: ApiError): ApiResult<never> => ({ ok: false, error });
export const success = <T>(data: T): ApiResult<T> => ({ ok: true, data });
