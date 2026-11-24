import { describe, expect, test } from "vitest";
import {
  MAX_ATTEMPTS,
  POLL_INTERVAL_MS,
  describeAttempt,
  formatMoney,
  paymentReference,
  type ConfirmedFound,
} from "@/features/claim-confirmed/confirmed";
import type { ApiResult } from "@/lib/api/result";
import type { ClaimConfirmed } from "@/lib/api/schemas/claim";

const found = (over: Partial<ConfirmedFound> = {}): ClaimConfirmed => ({
  ok: true,
  found: true,
  paid: false,
  firstName: "Ada",
  studentId: null,
  amountMinor: 950000,
  currency: "NGN",
  amountCategory: "discounted",
  cohortStartDate: null,
  claimUrl: null,
  claimDeadline: null,
  fixedPayment: false,
  communityConfigured: false,
  ...over,
});
const okResult = (data: ClaimConfirmed): ApiResult<ClaimConfirmed> => ({ ok: true, data });
const failed: ApiResult<ClaimConfirmed> = {
  ok: false,
  error: { kind: "network", status: null, message: "offline", retryable: true },
};

describe("paymentReference", () => {
  test("reads ref, then reference, then trxref (Paystack appends both reference and trxref)", () => {
    expect(paymentReference({ ref: "a", reference: "b" })).toBe("a");
    expect(paymentReference({ reference: "b", trxref: "c" })).toBe("b");
    expect(paymentReference({ trxref: " c " })).toBe("c");
  });

  test("is empty when there is no usable value", () => {
    expect(paymentReference({})).toBe("");
    expect(paymentReference({ ref: ["a", "b"] })).toBe("");
    expect(paymentReference({ ref: "  " })).toBe("");
  });
});

describe("describeAttempt", () => {
  test("shows the paid view and stops polling as soon as the payment is recorded", () => {
    const step = describeAttempt(okResult(found({ paid: true, studentId: "PTR-1" })), 1);
    expect(step.poll).toBe(false);
    expect(step.view.kind).toBe("paid");
  });

  test("keeps polling and shows the finalising view while the webhook is in flight", () => {
    const step = describeAttempt(okResult(found()), 1);
    expect(step.poll).toBe(true);
    expect(step.view).toMatchObject({ kind: "pending", message: expect.stringContaining("confirming your payment with Paystack"), retryUrl: null });
  });

  test("stops after the last attempt and offers the claim link when the API still has one", () => {
    const step = describeAttempt(okResult(found({ claimUrl: "/claim?token=abc_123", claimDeadline: "2026-11-20T10:00:00.000Z" })), MAX_ATTEMPTS);
    expect(step.poll).toBe(false);
    expect(step.view).toMatchObject({ kind: "pending", retryUrl: "/claim?token=abc_123" });
    expect(step.view.kind === "pending" && step.view.message).toContain("We haven't received a confirmed payment yet");
  });

  test("states no deadline when the offer has none", () => {
    const step = describeAttempt(okResult(found({ claimUrl: "/claim?token=abc" })), MAX_ATTEMPTS);
    expect(step.view.kind === "pending" && step.view.message).toContain("your claim link is still valid");
  });

  test("never offers a retry link that is not a claim path on this site", () => {
    for (const claimUrl of ["https://evil.example/claim?token=x", "//evil.example", "/claim?token=x&next=//evil", "javascript:alert(1)"]) {
      const step = describeAttempt(okResult(found({ claimUrl })), MAX_ATTEMPTS);
      expect(step.view).toMatchObject({ kind: "pending", retryUrl: null });
    }
  });

  test("an unknown reference is an error straight away, with no polling", () => {
    const step = describeAttempt(okResult({ ok: true, found: false }), 1);
    expect(step).toEqual({ view: { kind: "error" }, poll: false });
  });

  test("a failed request is retried, then reported as an error on the last attempt", () => {
    expect(describeAttempt(failed, 1)).toEqual({ view: { kind: "loading" }, poll: true });
    expect(describeAttempt(failed, MAX_ATTEMPTS)).toEqual({ view: { kind: "error" }, poll: false });
  });

  test("polls about every three seconds for about fifteen seconds in total", () => {
    expect(POLL_INTERVAL_MS).toBe(3000);
    expect(MAX_ATTEMPTS).toBe(5);
  });
});

describe("paid view", () => {
  const paidView = (over: Partial<ConfirmedFound>) => {
    const view = describeAttempt(okResult(found({ paid: true, ...over })), 1).view;
    if (view.kind !== "paid") throw new Error("expected the paid view");
    return view;
  };

  test("greets the applicant by first name and shows the student ID", () => {
    const view = paidView({ studentId: "PTR-C02-0042" });
    expect(view.heading).toBe("You're in, Ada! 🎓");
    expect(view.studentId).toBe("PTR-C02-0042");
  });

  test("falls back to a plain heading and says the ID is on its way when it is not generated yet", () => {
    const view = paidView({ firstName: "", studentId: null });
    expect(view.heading).toBe("You're in! 🎓");
    expect(view.facts).toContain("Your Student ID is being generated and will be in your confirmation email.");
  });

  test("lists the fee with the legacy category wording", () => {
    expect(paidView({ amountCategory: "discounted" }).facts[0]).toBe("Commitment fee paid: ₦9,500 (90%+ scholarship applied)");
    expect(paidView({ amountCategory: "full" }).facts[0]).toBe("Commitment fee paid: ₦9,500 (full programme fee)");
    expect(paidView({ amountCategory: null }).facts[0]).toBe("Commitment fee paid: ₦9,500");
  });

  test("lists the cohort start date when there is one", () => {
    const view = paidView({ cohortStartDate: "2026-12-07" });
    expect(view.facts.some((f) => f.startsWith("Cohort starts: ") && f.includes("2026"))).toBe(true);
  });

  test("links the community only when it is configured, otherwise points at WhatsApp and Telegram", () => {
    expect(paidView({ communityConfigured: true }).communityHref).toBe("/community");
    expect(paidView({ communityConfigured: false }).communityHref).toBeNull();
  });
});

describe("formatMoney", () => {
  test("formats naira from kobo", () => {
    expect(formatMoney(950000, "NGN")).toBe("₦9,500");
    expect(formatMoney(1950050, "NGN")).toBe("₦19,500.5");
  });

  test("shows other currencies with their code", () => {
    expect(formatMoney(2500, "USD")).toBe("25 USD");
  });
});
