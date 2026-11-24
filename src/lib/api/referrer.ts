import { OkMessageSchema, OkSchema } from "@/lib/api/schemas/common";
import { ReferrerApplyInputSchema, ReferrerMeSchema, ReferrerRequestLinkInputSchema } from "@/lib/api/schemas/referrer";
import { failure } from "@/lib/api/result";
import type { CallOptions, Requester } from "@/lib/api/types";
import { validateInput } from "@/lib/api/validate";
import type { z } from "zod";

export function referrerEndpoints(request: Requester) {
  const quiet = { retryBusy: false } as const;
  return {
    apply: async (input: z.input<typeof ReferrerApplyInputSchema>, options: CallOptions = {}) => {
      const valid = validateInput(ReferrerApplyInputSchema, input);
      if (!valid.ok) return failure(valid.error);
      return request({ method: "POST", path: "/api/referrer/apply", body: valid.data, schema: OkMessageSchema, ...quiet, ...options });
    },
    requestLink: async (input: z.input<typeof ReferrerRequestLinkInputSchema>, options: CallOptions = {}) => {
      const valid = validateInput(ReferrerRequestLinkInputSchema, input);
      if (!valid.ok) return failure(valid.error);
      return request({ method: "POST", path: "/api/referrer/request-link", body: valid.data, schema: OkMessageSchema, ...quiet, ...options });
    },
    /** 401 (`unauthorized`) when there is no valid referrer session. */
    me: (options: CallOptions = {}) => request({ path: "/api/referrer/me", schema: ReferrerMeSchema, ...quiet, ...options }),
    logout: (options: CallOptions = {}) =>
      request({ method: "POST", path: "/api/referrer/logout", body: {}, schema: OkSchema, ...quiet, ...options }),
  };
}
