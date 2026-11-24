import {
  ApplicationInputSchema,
  CheckEmailResponseSchema,
  ShortApplicationInputSchema,
  SubmitResponseSchema,
  WaitlistInputSchema,
  WaitlistResponseSchema,
  type ApplicationInput,
  type ShortApplicationInput,
} from "@/lib/api/schemas/applications";
import { failure } from "@/lib/api/result";
import type { CallOptions, Requester } from "@/lib/api/types";
import { validateInput } from "@/lib/api/validate";
import type { z } from "zod";

export function applicationEndpoints(request: Requester) {
  return {
    /** Is this address deliverable, and is it already registered for the open cohort? */
    checkEmail: (email: string, options: CallOptions = {}) =>
      request({
        path: "/api/applications/check-email",
        query: { email: email.trim() },
        schema: CheckEmailResponseSchema,
        retryBusy: false,
        ...options,
      }),

    /**
     * Submit an application. Validated first (an invalid one never reaches the API; the per-field
     * messages are in `error.body.fields`). While the API's database is briefly locked it waits and
     * retries with the same body, so a submission is not lost; pass `onWait` to tell the applicant.
     */
    submit: async (input: ApplicationInput, options: CallOptions = {}) => {
      const valid = validateInput(ApplicationInputSchema, input);
      if (!valid.ok) return failure(valid.error);
      return request({ method: "POST", path: "/api/applications", body: valid.data, schema: SubmitResponseSchema, ...options });
    },

    /**
     * Submit the apply-and-pay short form (a cohort with `payAtApply`). Same endpoint, busy retry and error handling as
     * `submit`; the response carries `payUrl`, the checkout link, when the cohort takes payment at apply.
     */
    submitShort: async (input: ShortApplicationInput, options: CallOptions = {}) => {
      const valid = validateInput(ShortApplicationInputSchema, input);
      if (!valid.ok) return failure(valid.error);
      return request({ method: "POST", path: "/api/applications", body: valid.data, schema: SubmitResponseSchema, ...options });
    },
  };
}

export function waitlistEndpoints(request: Requester) {
  return {
    join: async (input: z.input<typeof WaitlistInputSchema>, options: CallOptions = {}) => {
      const valid = validateInput(WaitlistInputSchema, input);
      if (!valid.ok) return failure(valid.error);
      return request({ method: "POST", path: "/api/waitlist", body: valid.data, schema: WaitlistResponseSchema, retryBusy: false, ...options });
    },
  };
}
