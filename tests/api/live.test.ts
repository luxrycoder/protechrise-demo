import { describe, expect, test } from "vitest";
import { createApi } from "@/lib/api";
import { apiRequest } from "@/lib/api/client";
import { SubmitResponseSchema } from "@/lib/api/schemas/applications";

/**
 * Opt-in checks against a REAL waitlist-api, to catch drift between this client and the server:
 *
 *   API_LIVE_ORIGIN=https://dev-api.protechrise.com npm test -- tests/api/live.test.ts
 *
 * Skipped unless API_LIVE_ORIGIN is set, so CI stays hermetic. Only safe requests: reads and deliberately
 * invalid or anonymous calls, so nothing is created or changed and no email is sent. Dev API only.
 */
const origin = process.env.API_LIVE_ORIGIN?.replace(/\/+$/, "");

describe.skipIf(!origin)("live API (read-only and invalid requests)", () => {
  const api = createApi({ baseUrl: origin });

  test("check-email answers with the typed shape", async () => {
    const res = await api.applications.checkEmail("live.check@tasksystems.com");
    expect(res.ok).toBe(true);
    if (res.ok) expect(typeof res.data.deliverable).toBe("boolean");
  });

  test("a malformed email is a validation error with the API's own message", async () => {
    const res = await api.applications.checkEmail("not-an-email");
    expect(!res.ok && res.error).toMatchObject({ kind: "validation", status: 400, message: "Enter a valid email address." });
  });

  test("anonymous status, referrer and portal calls are classified correctly", async () => {
    const status = await api.status.me();
    const referrer = await api.referrer.me();
    const portal = await api.portal.state();
    expect(!status.ok && status.error.kind).toBe("unauthorized");
    expect(!referrer.ok && referrer.error.kind).toBe("unauthorized");
    expect(!portal.ok && portal.error.kind).toBe("not_found");
  });

  test("an unknown claim link is not_found, and an unknown payment reference is `found: false`", async () => {
    const info = await api.claim.startInfo("bogus-token");
    const confirmed = await api.claim.confirmed("bogus-reference");
    expect(!info.ok && info.error).toMatchObject({ kind: "not_found", message: "This link is not valid any more." });
    expect(confirmed.ok && confirmed.data.found).toBe(false);
  });

  test("the server's own validation of an empty application matches our wording", async () => {
    // Bypasses the client-side check on purpose, to see what the server itself says.
    const res = await apiRequest({ baseUrl: origin }, { method: "POST", path: "/api/applications", body: {}, schema: SubmitResponseSchema, retryBusy: false });
    expect(!res.ok && res.error).toMatchObject({ kind: "validation", message: "Enter a valid first name." });
  });

  test("generic sign-in link requests answer the same for an unknown email and send nothing", async () => {
    const res = await api.status.requestLink({ email: "nobody-live-check@invalid.test" });
    expect(res.ok).toBe(true);
  });

  test("logout without a session is a harmless success", async () => {
    const res = await api.status.logout();
    expect(res.ok).toBe(true);
  });
});
