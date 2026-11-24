import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";
import { createApi } from "@/lib/api";
import { jsonResponse, noSleep, recordingFetch } from "./helpers";

const fixture = (dir: string, name: string) =>
  JSON.parse(readFileSync(path.resolve(__dirname, "../fixtures/api", dir, `${name}.json`), "utf8")) as { status: number; body: unknown };
const fromCode = (name: string) => fixture("from-code", name);
const recorded = (name: string) => fixture(".", name);

const respond = (f: { status: number; body: unknown }) => jsonResponse(f.status, f.body);

const validApplication = {
  firstName: "Ada",
  lastName: "Obi",
  email: " Ada@Example.com ",
  phone: "+234 801 234 5678",
  country: "Nigeria",
  city: "Lagos",
  preferredTrack: "Frontend Development",
  motivationEssay: "m".repeat(120),
  commitmentPlan: "c".repeat(60),
  currentStatus: "Student",
  experienceLevel: "Complete beginner",
  weeklyHours: "5-10 hours",
  careerGoal: "g".repeat(20),
  canSelfFund: "No",
  referralSource: "Social media",
  consent: true,
  refundPolicyAccepted: true,
} as const;

const validShortApplication = {
  firstName: "Ada",
  lastName: "Obi",
  email: " Ada@Example.com ",
  phone: "+234 801 234 5678",
  country: "Nigeria",
  preferredTrack: "Frontend Development",
  experienceLevel: "Complete beginner",
  consent: true,
  refundPolicyAccepted: true,
} as const;

const make = (responses: Parameters<typeof recordingFetch>[0]) => {
  const rec = recordingFetch(responses);
  return { ...rec, api: createApi({ fetchImpl: rec.fetchImpl, sleep: noSleep }) };
};

describe("applications", () => {
  test("checkEmail sends a GET with the trimmed email and returns the typed answer", async () => {
    const { api, calls } = make([respond(recorded("check-email-ok"))]);
    const res = await api.applications.checkEmail("  someone@tasksystems.com ");
    expect(calls[0]?.url).toBe("/api/applications/check-email?email=someone%40tasksystems.com");
    expect(res).toEqual({ ok: true, data: { ok: true, deliverable: true, alreadyRegistered: false } });
  });

  test("submit validates first, then posts the normalised payload", async () => {
    const { api, calls } = make([respond(fromCode("application-submit-ok"))]);
    const res = await api.applications.submit(validApplication);
    expect(res.ok).toBe(true);
    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toBe("/api/applications");
    const sent = JSON.parse(String(calls[0]?.init?.body)) as Record<string, unknown>;
    expect(sent.email).toBe("ada@example.com");
    expect(sent.consent).toBe(true);
  });

  test("submitShort posts the short apply-and-pay form and returns the pay link", async () => {
    const payOk = { status: 201, body: { ok: true, message: "application-submitted", payUrl: "/claim?token=abc-123_x" } };
    const { api, calls } = make([respond(payOk)]);
    const res = await api.applications.submitShort(validShortApplication);
    expect(res).toEqual({ ok: true, data: payOk.body });
    expect(calls[0]?.url).toBe("/api/applications");
    const sent = JSON.parse(String(calls[0]?.init?.body)) as Record<string, unknown>;
    expect(sent.email).toBe("ada@example.com");
    expect(sent).not.toHaveProperty("city");
    expect(sent).not.toHaveProperty("motivationEssay");
  });

  test("submitShort drops a pay link that is not on our claim route but still reports success", async () => {
    const { api } = make([respond({ status: 201, body: { ok: true, message: "application-submitted", payUrl: "https://evil.example/pay" } })]);
    const res = await api.applications.submitShort(validShortApplication);
    expect(res.ok && res.data.payUrl).toBeUndefined();
    expect(res.ok).toBe(true);
  });

  test("submitShort never calls the API with an invalid application", async () => {
    const { api, calls } = make([respond(fromCode("application-submit-ok"))]);
    const res = await api.applications.submitShort({ ...validShortApplication, refundPolicyAccepted: false } as never);
    expect(calls).toHaveLength(0);
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect((res.error.body as { fields: Record<string, string> }).fields).toMatchObject({ refundPolicyAccepted: "You must accept the policies." });
  });

  test("submitShort keeps trying while the database is busy, like the long form", async () => {
    const busy = () => respond(fromCode("application-submit-busy"));
    const { api, calls } = make([busy, respond({ status: 201, body: { ok: true, message: "application-submitted", payUrl: "/claim?token=zzz" } })]);
    const res = await api.applications.submitShort(validShortApplication, { onWait: () => undefined });
    expect(res.ok).toBe(true);
    expect(calls).toHaveLength(2);
    expect(calls[1]?.init?.body).toBe(calls[0]?.init?.body);
  });

  test("submit never calls the API with an invalid application; it returns per-field errors instead", async () => {
    const { api, calls } = make([respond(fromCode("application-submit-ok"))]);
    const res = await api.applications.submit({ ...validApplication, firstName: "", consent: false } as never);
    expect(calls).toHaveLength(0);
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error.kind).toBe("validation");
    expect((res.error.body as { fields: Record<string, string> }).fields).toMatchObject({
      firstName: "Enter a valid first name.",
      consent: "You must agree to the application terms.",
    });
  });

  test("submit keeps trying while the database is busy, then succeeds, without losing the body", async () => {
    const busy = () => respond(fromCode("application-submit-busy"));
    const { api, calls } = make([busy, respond(fromCode("application-submit-ok"))]);
    const waits: number[] = [];
    const res = await api.applications.submit(validApplication, { onWait: (_a, delay) => waits.push(delay) });
    expect(res.ok).toBe(true);
    expect(calls).toHaveLength(2);
    expect(calls[0]?.init?.body).toBe(calls[1]?.init?.body);
    expect(waits).toEqual([2000]);
  });

  test("submit reports a closed cohort straight away, with the API's wording", async () => {
    const { api, calls } = make([respond(fromCode("application-submit-closed"))]);
    const res = await api.applications.submit(validApplication);
    expect(calls).toHaveLength(1);
    expect(!res.ok && res.error).toMatchObject({ kind: "unavailable", message: "Applications are not open right now. Please check back soon." });
  });

  test("submit maps a duplicate email to a conflict", async () => {
    const { api } = make([respond(fromCode("application-submit-duplicate"))]);
    const res = await api.applications.submit(validApplication);
    expect(!res.ok && res.error.kind).toBe("conflict");
  });
});

describe("waitlist", () => {
  test("join posts the email and optional track", async () => {
    const { api, calls } = make([jsonResponse(200, { ok: true })]);
    const res = await api.waitlist.join({ email: "a@b.test", track: "Data Analytics" });
    expect(res.ok).toBe(true);
    expect(calls[0]?.url).toBe("/api/waitlist");
    expect(JSON.parse(String(calls[0]?.init?.body))).toEqual({ email: "a@b.test", track: "Data Analytics" });
  });
});

describe("status", () => {
  test("me returns a normalised status and treats a missing session as unauthorized", async () => {
    const full = make([respond(fromCode("status-me-eligible"))]);
    const res = await full.api.status.me();
    expect(res.ok && res.data.eligible).toBe(true);
    expect(full.calls[0]?.url).toBe("/api/status/me");
    const anon = make([respond(recorded("status-me-anonymous"))]);
    const denied = await anon.api.status.me();
    expect(!denied.ok && denied.error.kind).toBe("unauthorized");
  });

  test("requestLink, logout, track change and switch use the right routes and bodies", async () => {
    const { api, calls } = make([respond(recorded("status-request-link-invalid")), respond(recorded("status-logout")), jsonResponse(200, { ok: true }), jsonResponse(200, { ok: true })]);
    expect((await api.status.requestLink({ email: " A@B.test " })).ok).toBe(true);
    expect((await api.status.logout()).ok).toBe(true);
    expect((await api.status.requestTrackChange({ requestedTrack: "Backend Development" })).ok).toBe(true);
    expect((await api.status.switchApplication({ applicationId: 12 })).ok).toBe(true);
    expect(calls.map((c) => `${c.init?.method} ${c.url}`)).toEqual([
      "POST /api/status/request-link",
      "POST /api/status/logout",
      "POST /api/status/track-change",
      "POST /api/status/switch",
    ]);
    expect(JSON.parse(String(calls[0]?.init?.body))).toEqual({ email: "a@b.test" });
    expect(JSON.parse(String(calls[3]?.init?.body))).toEqual({ applicationId: 12 });
  });

  test("a closed track-change window comes back as a conflict that still carries its reason", async () => {
    const { api } = make([respond(fromCode("status-track-change-closed"))]);
    const res = await api.status.requestTrackChange({ requestedTrack: "x" });
    expect(!res.ok && res.error.kind).toBe("conflict");
    expect(!res.ok && (res.error.body as { reason: string }).reason).toBe("window_closed");
  });

  test("rejects a bad switch id or empty track before calling the API", async () => {
    const { api, calls } = make([jsonResponse(200, { ok: true })]);
    expect((await api.status.switchApplication({ applicationId: 0 })).ok).toBe(false);
    expect((await api.status.requestTrackChange({ requestedTrack: "  " })).ok).toBe(false);
    expect(calls).toHaveLength(0);
  });
});

describe("claim", () => {
  test("startInfo, accept and confirmed use the right routes", async () => {
    const { api, calls } = make([respond(fromCode("claim-start-info-ok")), respond(fromCode("claim-accept-ok")), respond(fromCode("claim-confirmed-paid"))]);
    const info = await api.claim.startInfo("TOK EN");
    const accept = await api.claim.accept({ token: "TOK EN", accepted: true });
    const confirmed = await api.claim.confirmed("ref-1");
    expect(info.ok && info.data.feeText).toBe("₦19,500");
    expect(accept.ok && accept.data.payUrl).toBe("/claim?token=TOKEN");
    expect(confirmed.ok && confirmed.data.found && confirmed.data.paid).toBe(true);
    expect(calls.map((c) => c.url)).toEqual(["/api/claim/start-info?token=TOK+EN", "/api/claim/accept", "/api/claim/confirmed?ref=ref-1"]);
  });

  test("accept refuses to call the API unless the policies were accepted", async () => {
    const { api, calls } = make([respond(fromCode("claim-accept-ok"))]);
    const res = await api.claim.accept({ token: "t", accepted: false } as never);
    expect(calls).toHaveLength(0);
    expect(!res.ok && res.error.message).toBe("You must accept the policies to continue.");
  });

  test("an unknown link is a not_found with the API's message", async () => {
    const { api } = make([respond(recorded("claim-start-info-bogus"))]);
    const res = await api.claim.startInfo("bogus");
    expect(!res.ok && res.error).toMatchObject({ kind: "not_found", message: "This link is not valid any more." });
  });

  test("an unknown payment reference is `found: false`, not an error", async () => {
    const { api } = make([respond(recorded("claim-confirmed-unknown"))]);
    const res = await api.claim.confirmed("nope");
    expect(res.ok && res.data.found).toBe(false);
  });
});

describe("referrer and portal", () => {
  test("referrer apply validates, me parses, logout works", async () => {
    const { api, calls } = make([jsonResponse(200, { ok: true, message: "Thanks" }), respond(fromCode("referrer-me-ok")), respond(recorded("referrer-logout"))]);
    expect((await api.referrer.apply({ name: " Ngozi ", email: "N@B.test" })).ok).toBe(true);
    const me = await api.referrer.me();
    expect(me.ok && me.data.stats.paid).toBe(2);
    expect((await api.referrer.logout()).ok).toBe(true);
    expect(JSON.parse(String(calls[0]?.init?.body))).toMatchObject({ name: "Ngozi", email: "n@b.test" });
  });

  test("referrer apply rejects an empty name before calling the API", async () => {
    const { api, calls } = make([jsonResponse(200, { ok: true, message: "x" })]);
    const res = await api.referrer.apply({ name: "", email: "n@b.test" });
    expect(calls).toHaveLength(0);
    expect(!res.ok && res.error.message).toBe("A name and a valid email are required.");
  });

  test("portal calls answer 404 while the portal flag is off", async () => {
    const { api } = make([respond(recorded("portal-state-anonymous"))]);
    const res = await api.portal.state();
    expect(!res.ok && res.error.kind).toBe("not_found");
  });
});

describe("createApi configuration", () => {
  test("a base URL makes every request absolute (for server-side use)", async () => {
    const rec = recordingFetch([respond(recorded("check-email-ok"))]);
    const api = createApi({ baseUrl: "https://api.test", fetchImpl: rec.fetchImpl, sleep: noSleep });
    await api.applications.checkEmail("a@b.test");
    expect(rec.calls[0]?.url).toBe("https://api.test/api/applications/check-email?email=a%40b.test");
  });

  test("read-only calls do not wait out a busy database", async () => {
    const busy = jsonResponse(503, { ok: false, retryable: true, error: "busy" });
    const { api, calls } = make([busy]);
    const res = await api.status.me();
    expect(calls).toHaveLength(1);
    expect(!res.ok && res.error.kind).toBe("busy");
  });
});
