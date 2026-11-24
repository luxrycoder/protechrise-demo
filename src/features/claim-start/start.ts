import type { ApiError, ApiResult } from "@/lib/api/result";
import { CLAIM_PATH } from "@/lib/api/schemas/applications";
import type { ClaimStartInfo } from "@/lib/api/schemas/claim";

export type StartInfo = ClaimStartInfo;

const TOKEN = /^[A-Za-z0-9_%.~-]+$/;

/** The claim token from the query string, or an empty string when it is missing or not shaped like one. */
export function claimToken(params: Record<string, string | readonly string[] | undefined>): string {
  const raw = params.token;
  const value = (Array.isArray(raw) ? raw[0] : raw)?.trim() ?? "";
  return TOKEN.test(value) ? value : "";
}

export type CourseOption = { readonly value: string; readonly label: string };

export type StartFormView = {
  readonly heading: string;
  readonly intro: string;
  /** The amount of a checkout started now, as the API formatted it: never computed here. */
  readonly feeText: string;
  readonly options: readonly CourseOption[];
  readonly selectedTrack: string;
};

const CHOOSE_COURSE: CourseOption = { value: "", label: "Choose a course" };

export function describeStartInfo(info: StartInfo): StartFormView {
  const options = info.tracks.map((name) => ({ value: name, label: name }));
  const offered = info.tracks.includes(info.currentTrack);
  return {
    heading: `Confirm your place, ${info.firstName}`,
    intro: `Your place in ${info.cohortName} is ready. Confirm your course and accept the policies, then pay to secure it.`,
    feeText: info.feeText,
    options: offered ? options : [CHOOSE_COURSE, ...options],
    selectedTrack: offered ? info.currentTrack : "",
  };
}

export const canContinue = ({ accepted, track }: { readonly accepted: boolean; readonly track: string }): boolean =>
  accepted && track !== "";

/** Answers that mean the link itself is spent or wrong. Anything else (a network fault, a rate limit) can be retried. */
const LINK_IS_BAD: ReadonlySet<ApiError["kind"]> = new Set(["not_found", "validation", "conflict", "gone"]);

export type StartErrorView = { readonly kind: "closed" } | { readonly kind: "retry" };

export function describeStartError(error: ApiError): StartErrorView {
  return LINK_IS_BAD.has(error.kind) ? { kind: "closed" } : { kind: "retry" };
}

export type AcceptOutcome =
  | { readonly kind: "pay"; readonly url: string }
  | { readonly kind: "closed" }
  | { readonly kind: "error"; readonly message: string };

const GENERIC_ERROR = "Something went wrong. Please try again.";
const LINK_CLOSED: ReadonlySet<ApiError["kind"]> = new Set(["not_found", "conflict", "gone"]);

/**
 * What to do with the answer to "accept the policies". The only place the applicant is sent is the `/claim?token=`
 * path the API returns, which the server turns into the Paystack redirect; anything else is refused. Access is never
 * granted here: the payment webhook does that.
 */
export function acceptOutcome(result: ApiResult<{ readonly ok: true; readonly payUrl: string }>): AcceptOutcome {
  if (result.ok) return CLAIM_PATH.test(result.data.payUrl) ? { kind: "pay", url: result.data.payUrl } : { kind: "error", message: GENERIC_ERROR };
  if (LINK_CLOSED.has(result.error.kind)) return { kind: "closed" };
  return { kind: "error", message: result.error.message || GENERIC_ERROR };
}
