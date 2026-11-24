import { OkMessageSchema, OkSchema } from "@/lib/api/schemas/common";
import {
  StatusLmsSchema,
  StatusMeSchema,
  StatusRequestLinkInputSchema,
  SwitchInputSchema,
  TrackChangeInputSchema,
} from "@/lib/api/schemas/status";
import { failure } from "@/lib/api/result";
import type { CallOptions, Requester } from "@/lib/api/types";
import { validateInput } from "@/lib/api/validate";
import type { z } from "zod";

/** The applicant status portal. Sessions are cookies set by the API on `/status/verify` (same-origin via the proxy). */
export function statusEndpoints(request: Requester) {
  const quiet = { retryBusy: false } as const;
  return {
    /** Ask for a sign-in link. The answer is deliberately the same whether or not the email is known. */
    requestLink: async (input: z.input<typeof StatusRequestLinkInputSchema>, options: CallOptions = {}) => {
      const valid = validateInput(StatusRequestLinkInputSchema, input);
      if (!valid.ok) return failure(valid.error);
      return request({ method: "POST", path: "/api/status/request-link", body: valid.data, schema: OkMessageSchema, ...quiet, ...options });
    },
    /** 401 (`unauthorized`) when there is no valid session. */
    me: (options: CallOptions = {}) => request({ path: "/api/status/me", schema: StatusMeSchema, ...quiet, ...options }),
    logout: (options: CallOptions = {}) =>
      request({ method: "POST", path: "/api/status/logout", body: {}, schema: OkSchema, ...quiet, ...options }),
    /** A closed window comes back as a `conflict` whose `error.body.reason` explains why. */
    requestTrackChange: async (input: z.input<typeof TrackChangeInputSchema>, options: CallOptions = {}) => {
      const valid = validateInput(TrackChangeInputSchema, input);
      if (!valid.ok) return failure(valid.error);
      return request({ method: "POST", path: "/api/status/track-change", body: valid.data, schema: OkSchema, ...quiet, ...options });
    },
    /** Switch between this person's applications (cohorts). */
    switchApplication: async (input: z.input<typeof SwitchInputSchema>, options: CallOptions = {}) => {
      const valid = validateInput(SwitchInputSchema, input);
      if (!valid.ok) return failure(valid.error);
      return request({ method: "POST", path: "/api/status/switch", body: valid.data, schema: OkSchema, ...quiet, ...options });
    },
    lms: (options: CallOptions = {}) => request({ path: "/api/status/lms", schema: StatusLmsSchema, ...quiet, ...options }),
    lmsHandoff: (options: CallOptions = {}) =>
      request({ method: "POST", path: "/api/status/lms-handoff", body: {}, schema: StatusLmsSchema, ...quiet, ...options }),
  };
}
