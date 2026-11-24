import { describe, expect, test } from "vitest";
import { StatusMeSchema, type StatusMe } from "@/lib/api/schemas/status";
import { describeStatus, entryMessage, formatTimestamp, isSafeLocalPath, statusLabel } from "@/features/status/status-view";

const base = {
  ok: true as const,
  currentApplicationId: 7,
  applications: [{ id: 7, cohortName: "Cohort 2", preferredTrack: "Data Analytics" }],
  fullName: "Ada Obi",
  preferredTrack: "Data Analytics",
  timezone: "Africa/Lagos",
  currentStatus: "under_review",
  statusHistory: [
    { status: "submitted", created_at: "2026-11-01T09:30:00Z" },
    { status: "under_review", created_at: "2026-11-11T09:30:00Z" },
  ],
  pod: { name: null, state: "preparing", url: null },
  trackChangeEligible: false,
  trackChangeReissuesStudentId: false,
};
const me = (over: Record<string, unknown> = {}): StatusMe => StatusMeSchema.parse({ ...base, ...over });
const statusView = (over: Record<string, unknown> = {}) => {
  const view = describeStatus(me(over));
  if (view.kind !== "status") throw new Error("expected the status view");
  return view;
};

describe("statusLabel", () => {
  test("turns underscores into spaces", () => {
    expect(statusLabel("under_review")).toBe("under review");
    expect(statusLabel("payment_pending")).toBe("payment pending");
  });

  test("calls a lapsed discount 'Discount Expired', not a scary error", () => {
    expect(statusLabel("expired_full_price")).toBe("Discount Expired");
  });
});

describe("describeStatus: not yet reviewable", () => {
  test("an application younger than the review window shows when the status becomes available", () => {
    const view = describeStatus(
      StatusMeSchema.parse({
        ok: true,
        eligible: false,
        fullName: "Ada Obi",
        availableAfter: "2026-11-11T09:30:00Z",
        currentApplicationId: 7,
        applications: [],
      }),
    );
    expect(view).toMatchObject({ kind: "notReady", name: "Ada Obi" });
    expect(view.kind === "notReady" && view.availableText).toContain("2026");
  });
});

describe("describeStatus: the status matrix", () => {
  test("under review: a plain pill, no claim button, no confirmation", () => {
    const view = statusView();
    expect(view).toMatchObject({ name: "Ada Obi", track: "Data Analytics", pill: { label: "under review", status: "under_review" }, claim: null, confirmed: false });
  });

  test.each(["shortlisted", "assessed", "interview", "rejected", "withdrawn", "waitlisted"])("%s reads as its own name and offers nothing to pay", (status) => {
    const view = statusView({ currentStatus: status });
    expect(view.pill.label).toBe(status);
    expect(view.claim).toBeNull();
    expect(view.confirmed).toBe(false);
  });

  test("an unpaid applicant with an open discount offer is invited to claim, with the deadline", () => {
    const view = statusView({ currentStatus: "payment_pending", offerState: "discounted", claimUrl: "/claim?token=abc123", claimDeadline: "2026-11-20T10:00:00Z" });
    expect(view.claim).toMatchObject({ href: "/claim?token=abc123", label: "Claim your scholarship" });
    expect(view.claim?.deadline).toMatch(/^Offer closes .*2026/);
  });

  test("after the discount window the button says 'Continue Enrollment' and the deadline is for payments", () => {
    const view = statusView({ currentStatus: "expired_full_price", offerState: "full", claimUrl: "/claim?token=abc123", claimDeadline: "2026-11-30T10:00:00Z" });
    expect(view.claim).toMatchObject({ label: "Continue Enrollment" });
    expect(view.claim?.deadline).toMatch(/^Payments close /);
    expect(view.pill.label).toBe("Discount Expired");
  });

  test("a lapsed discount whose offer is still the discounted one reads 'Scholarship available'", () => {
    const view = statusView({ currentStatus: "expired_full_price", offerState: "discounted", claimUrl: "/claim?token=abc123" });
    expect(view.pill.label).toBe("Scholarship available");
  });

  test("a fixed-payment deadline is shown one minute earlier than the stored cutoff", () => {
    const view = statusView({ claimUrl: "/claim?token=abc", claimDeadline: "2026-11-20T10:00:00Z", fixedPayment: true, timezone: "UTC" });
    expect(view.claim?.deadline).toContain("9:59");
  });

  test("a claim without a usable deadline shows none", () => {
    expect(statusView({ claimUrl: "/claim?token=abc", claimDeadline: null }).claim?.deadline).toBeNull();
  });

  test("never links to a claim URL that is not a claim path on this site", () => {
    for (const claimUrl of ["https://evil.example/claim?token=x", "//evil.example", "javascript:alert(1)"]) {
      expect(statusView({ claimUrl }).claim).toBeNull();
    }
  });

  test("a paid applicant sees the confirmation, not a claim button, even if a claim link is still sent", () => {
    const view = statusView({ currentStatus: "accepted", paymentConfirmed: true, studentId: "PTR-1", claimUrl: "/claim?token=abc", communityUrl: "/community" });
    expect(view).toMatchObject({ confirmed: true, claim: null, community: true });
  });

  test("the community button appears only for the exact /community hand-off", () => {
    expect(statusView({ paymentConfirmed: true, communityUrl: "https://evil.example" }).community).toBe(false);
    expect(statusView({ paymentConfirmed: true }).community).toBe(false);
  });
});

describe("describeStatus: pod and timeline", () => {
  test("describes the pod state, with the name when there is one", () => {
    expect(statusView({ pod: { name: "Pod 4", state: "ready", url: "/community/pod" } }).pod).toEqual({ text: "Pod 4 — Community ready", openLink: true });
    expect(statusView({ pod: { name: null, state: "inactive", url: null } }).pod).toEqual({ text: "Community access inactive", openLink: false });
    expect(statusView({ pod: { name: null, state: "something_new", url: null } }).pod?.text).toBe("Community being prepared");
  });

  test("opens the pod only when it is ready and the link is the known pod path", () => {
    expect(statusView({ pod: { name: "P", state: "ready", url: "https://evil.example" } }).pod?.openLink).toBe(false);
    expect(statusView({ pod: { name: "P", state: "preparing", url: "/community/pod" } }).pod?.openLink).toBe(false);
  });

  test("lists the history with readable labels and dates in the applicant's own time zone", () => {
    const { timeline } = statusView();
    expect(timeline.map((t) => t.label)).toEqual(["submitted", "under review"]);
    expect(timeline[0]?.date).toContain("Nov 1, 2026");
    expect(timeline[0]?.date).toContain("10:30"); // 09:30 UTC is 10:30 in Lagos
  });
});

describe("formatTimestamp", () => {
  test("formats in the given zone", () => {
    expect(formatTimestamp("2026-11-01T09:30:00Z", "Africa/Lagos")).toBe("Nov 1, 2026, 10:30 AM GMT+1");
  });

  test("returns the input unchanged when it is not a date", () => {
    expect(formatTimestamp("soon", "UTC")).toBe("soon");
  });

  test("ignores a time zone the runtime does not know", () => {
    expect(formatTimestamp("2026-11-01T09:30:00Z", "Not/AZone")).toContain("2026");
  });
});

describe("isSafeLocalPath", () => {
  test("accepts a path on this site only", () => {
    expect(isSafeLocalPath("/community")).toBe(true);
    expect(isSafeLocalPath("//evil.example")).toBe(false);
    expect(isSafeLocalPath("/\\evil.example")).toBe(false);
    expect(isSafeLocalPath("https://evil.example")).toBe(false);
    expect(isSafeLocalPath(null)).toBe(false);
  });

  test("refuses control characters: a browser drops them, so '/\\t/evil.example' would become '//evil.example'", () => {
    for (const bad of ["/\t/evil.example", "/\n/evil.example", "/\r/evil.example", "/\u0000/evil.example", "/ok\t", "/a\u007fb", "/a\\b", "/%5c" + "\\"]) {
      expect(isSafeLocalPath(bad)).toBe(false);
    }
  });

  test("every accepted path stays on this site when a browser resolves it", () => {
    for (const ok of ["/portal", "/status?next=%2Fportal", "/community#x", "/a/b/c", "/%2f/x", "/ /x"]) {
      expect(isSafeLocalPath(ok)).toBe(true);
      expect(new URL(ok, "https://dev.protechrise.com").origin).toBe("https://dev.protechrise.com");
    }
  });

  test("refuses empty, relative and over-long values", () => {
    expect(isSafeLocalPath("")).toBe(false);
    expect(isSafeLocalPath("portal")).toBe(false);
    expect(isSafeLocalPath("/" + "a".repeat(2048))).toBe(false);
    expect(isSafeLocalPath("/" + "a".repeat(2047))).toBe(true);
  });
});

describe("entryMessage", () => {
  test("says the link expired, as an error", () => {
    expect(entryMessage({ expired: "1", next: undefined })).toEqual({ text: "That link has expired. Request a new one below.", isError: true });
  });

  test("explains that community login is separate when sent here from the community", () => {
    expect(entryMessage({ expired: undefined, next: "/community" })?.text).toBe("Sign in to check your application status. Community login is separate.");
  });

  test("asks to sign in to the portal when that is where the learner was going; an expired link still wins", () => {
    expect(entryMessage({ expired: undefined, next: "/portal" })).toEqual({ text: "Sign in to open your portal.", isError: false });
    expect(entryMessage({ expired: "1", next: "/portal" })?.isError).toBe(true);
    expect(entryMessage({ expired: undefined, next: "/portal/x" })?.text).toContain("application status");
  });

  test("says nothing otherwise", () => {
    expect(entryMessage({ expired: undefined, next: undefined })).toBeNull();
  });
});
