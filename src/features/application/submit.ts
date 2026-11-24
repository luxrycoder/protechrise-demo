import { createApi } from "@/lib/api";
import type { ApiResult } from "@/lib/api/result";
import type { ApplicationInput, ShortApplicationInput, SubmitResponse } from "@/lib/api/schemas/applications";

export type SubmitHooks = {
  /** Called when the API's database is busy and the submission is being retried, so the page can say so. */
  readonly onWait: (attempt: number) => void;
  /** Receives the successful response, to read the event-id headers the thank-you page needs. */
  readonly onResponse: (response: Response) => void;
};

/** What the form sends: the award flow's long application, or the apply-and-pay short one. */
export type SubmitRequest =
  | { readonly flow: "award"; readonly input: ApplicationInput }
  | { readonly flow: "payAtApply"; readonly input: ShortApplicationInput };

export type SubmitHandler = (request: SubmitRequest, hooks: SubmitHooks) => Promise<ApiResult<SubmitResponse>>;

/** The slice of the check-email response the form needs. */
export type EmailChecker = (email: string) => Promise<ApiResult<{ deliverable: boolean; alreadyRegistered: boolean }>>;

const api = createApi();

/**
 * Send an application through the typed API client: validated first, retried with the same body while the
 * database is briefly busy.
 */
export const submitApplication: SubmitHandler = (request, hooks) => {
  const options = { onWait: (attempt: number) => hooks.onWait(attempt), onResponse: (response: Response) => hooks.onResponse(response) };
  return request.flow === "payAtApply" ? api.applications.submitShort(request.input, options) : api.applications.submit(request.input, options);
};

/** Is this address deliverable, and is it already registered for the open cohort? */
export const checkEmailAddress: EmailChecker = (email) => api.applications.checkEmail(email);
