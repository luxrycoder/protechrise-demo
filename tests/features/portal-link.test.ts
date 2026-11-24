import { describe, expect, test } from "vitest";
import { PORTAL_PATH, portalLinkVisible } from "@/features/portal/portal-link";
import { buildError } from "@/lib/api/result";
import type { ApiResult } from "@/lib/api/result";
import { PortalGateSchema, type PortalGate } from "@/lib/api/schemas/portal";
import { isSafeLocalPath } from "@/features/status/status-view";

const ok = (state: string): ApiResult<PortalGate> => ({ ok: true, data: PortalGateSchema.parse({ ok: true, state }) });
const fail = (kind: Parameters<typeof buildError>[0], status: number | null): ApiResult<PortalGate> => ({ ok: false, error: buildError(kind, status, null) });

describe("portalLinkVisible", () => {
  test.each(["eligible", "confirming", "stuck"])("shown when the portal is open for the learner (%s)", (state) => expect(portalLinkVisible(ok(state))).toBe(true));
  test.each(["not_paid", "blocked", "unknown", "something-new", ""])("hidden for %j", (state) => expect(portalLinkVisible(ok(state))).toBe(false));
  test("hidden when the portal is off (404), signed out (401), or we cannot tell", () => {
    for (const [k, s] of [["not_found", 404], ["unauthorized", 401], ["rate_limited", 429], ["network", null], ["timeout", null], ["server", 500], ["invalid_response", 200], ["aborted", null]] as const) {
      expect(portalLinkVisible(fail(k, s))).toBe(false);
    }
  });
  test("the link goes to a local path", () => {
    expect(isSafeLocalPath(PORTAL_PATH)).toBe(true);
    expect(PORTAL_PATH).toBe("/portal");
  });
});
