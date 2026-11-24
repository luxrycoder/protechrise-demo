import {
  ClaimAcceptInputSchema,
  ClaimAcceptResponseSchema,
  ClaimConfirmedSchema,
  ClaimStartInfoSchema,
} from "@/lib/api/schemas/claim";
import { failure } from "@/lib/api/result";
import type { CallOptions, Requester } from "@/lib/api/types";
import { validateInput } from "@/lib/api/validate";
import type { z } from "zod";

/**
 * Claiming a seat. Payment itself is never started here: `accept` returns a `/claim?token=` path that the
 * server turns into the Paystack redirect, and access is granted only by the payment webhook.
 */
export function claimEndpoints(request: Requester) {
  const quiet = { retryBusy: false } as const;
  return {
    startInfo: (token: string, options: CallOptions = {}) =>
      request({ path: "/api/claim/start-info", query: { token }, schema: ClaimStartInfoSchema, ...quiet, ...options }),

    accept: async (input: z.input<typeof ClaimAcceptInputSchema>, options: CallOptions = {}) => {
      const valid = validateInput(ClaimAcceptInputSchema, input);
      if (!valid.ok) return failure(valid.error);
      return request({ method: "POST", path: "/api/claim/accept", body: valid.data, schema: ClaimAcceptResponseSchema, ...quiet, ...options });
    },

    /** `found: false` means the API has no record of that payment reference (yet): not an error. */
    confirmed: (ref: string, options: CallOptions = {}) =>
      request({ path: "/api/claim/confirmed", query: { ref }, schema: ClaimConfirmedSchema, ...quiet, ...options }),
  };
}
