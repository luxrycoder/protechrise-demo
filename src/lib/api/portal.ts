import { PortalCompleteInputSchema, PortalCompleteResponseSchema, PortalGateSchema, PortalHomeResponseSchema } from "@/lib/api/schemas/portal";
import { failure } from "@/lib/api/result";
import type { CallOptions, Requester } from "@/lib/api/types";
import { validateInput } from "@/lib/api/validate";
import type { z } from "zod";

/**
 * The learner portal door. Every route answers 404 (`not_found`) while the API's PORTAL_ENABLED flag is off.
 * `home` answers the learner's home or a gate body (use `interpretPortal` from `@/lib/portal`); `state` answers the gate only.
 */
export function portalEndpoints(request: Requester) {
  const quiet = { retryBusy: false } as const;
  return {
    state: (options: CallOptions = {}) => request({ path: "/api/portal/state", schema: PortalGateSchema, ...quiet, ...options }),
    home: (options: CallOptions = {}) => request({ path: "/api/portal/home", schema: PortalHomeResponseSchema, ...quiet, ...options }),
    completeItem: async (input: z.input<typeof PortalCompleteInputSchema>, options: CallOptions = {}) => {
      const valid = validateInput(PortalCompleteInputSchema, input);
      if (!valid.ok) return failure(valid.error);
      return request({ method: "POST", path: "/api/portal/items/complete", body: valid.data, schema: PortalCompleteResponseSchema, ...quiet, ...options });
    },
  };
}
