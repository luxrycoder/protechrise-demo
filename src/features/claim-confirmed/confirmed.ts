import type { ApiResult } from "@/lib/api/result";
import { CLAIM_PATH } from "@/lib/api/schemas/applications";
import type { ClaimConfirmed } from "@/lib/api/schemas/claim";

/** Poll every few seconds, for about fifteen seconds: the Paystack webhook normally lands within that. */
export const POLL_INTERVAL_MS = 3000;
export const MAX_ATTEMPTS = 5;

export type ConfirmedFound = Extract<ClaimConfirmed, { found: true }>;

export type PaidView = {
  readonly kind: "paid";
  readonly heading: string;
  readonly studentId: string | null;
  readonly facts: readonly string[];
  /** `/community` when the community hand-off is configured; null means point at WhatsApp and Telegram instead. */
  readonly communityHref: string | null;
};

export type ConfirmedView =
  | { readonly kind: "loading" }
  | PaidView
  | { readonly kind: "pending"; readonly message: string; readonly retryUrl: string | null }
  | { readonly kind: "error" };

export type PollStep = { readonly view: ConfirmedView; readonly poll: boolean };

const PENDING_MESSAGE =
  "We're confirming your payment with Paystack. This usually takes a few seconds — your confirmation email with your Student ID will follow shortly.";

/** The payment reference Paystack appends to the return URL (it sends `reference` and `trxref`; our own links use `ref`). */
export function paymentReference(params: Record<string, string | readonly string[] | undefined>): string {
  for (const key of ["ref", "reference", "trxref"]) {
    const value = params[key];
    if (typeof value === "string" && value.trim() !== "") return value.trim();
  }
  return "";
}

export function formatMoney(minor: number, currency: string): string {
  const amount = (Number.isFinite(minor) ? minor : 0) / 100;
  const text = amount.toLocaleString("en-US", { maximumFractionDigits: 2 });
  return currency && currency !== "NGN" ? `${text} ${currency}` : `₦${text}`;
}

const dateFormat = (options: Intl.DateTimeFormatOptions) => (iso: string, fixed = false): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  if (!fixed) return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
  // A fixed-payment deadline is published one minute earlier than the stored cutoff, in Lagos time.
  return `${new Date(date.getTime() - 60_000).toLocaleString("en-US", options)} WAT`;
};

const formatDate = dateFormat({ timeZone: "Africa/Lagos", weekday: "long", month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

const CATEGORY_NOTE: Readonly<Record<string, string>> = {
  discounted: " (90%+ scholarship applied)",
  full: " (full programme fee)",
};

function paidView(d: ConfirmedFound): PaidView {
  const facts = [`Commitment fee paid: ${formatMoney(d.amountMinor, d.currency)}${CATEGORY_NOTE[d.amountCategory ?? ""] ?? ""}`];
  const start = d.cohortStartDate ? formatDate(d.cohortStartDate) : "";
  if (start) facts.push(`Cohort starts: ${start}`);
  if (!d.studentId) facts.push("Your Student ID is being generated and will be in your confirmation email.");
  return {
    kind: "paid",
    heading: d.firstName ? `You're in, ${d.firstName}! 🎓` : "You're in! 🎓",
    studentId: d.studentId,
    facts,
    communityHref: d.communityConfigured ? "/community" : null,
  };
}

function exhaustedMessage(d: ConfirmedFound): string {
  const base = "We haven't received a confirmed payment yet. If you completed it, your email confirmation will arrive shortly. ";
  if (!d.claimUrl) return PENDING_MESSAGE;
  const deadline = d.claimDeadline ? formatDate(d.claimDeadline, d.fixedPayment) : "";
  return base + (deadline ? `If it didn’t go through, your claim link is valid until ${deadline}.` : "If it didn’t go through, your claim link is still valid.");
}

/**
 * What to show after attempt number `attempt` (1-based) and whether to ask again. A payment is only ever shown as
 * received when the API says `paid`, and that flag is set by the Paystack webhook alone: this page never grants anything.
 */
export function describeAttempt(result: ApiResult<ClaimConfirmed>, attempt: number): PollStep {
  const last = attempt >= MAX_ATTEMPTS;
  if (!result.ok) return last ? { view: { kind: "error" }, poll: false } : { view: { kind: "loading" }, poll: true };
  const data = result.data;
  if (!data.found) return { view: { kind: "error" }, poll: false };
  if (data.paid) return { view: paidView(data), poll: false };
  if (!last) return { view: { kind: "pending", message: PENDING_MESSAGE, retryUrl: null }, poll: true };
  const retryUrl = data.claimUrl && CLAIM_PATH.test(data.claimUrl) ? data.claimUrl : null;
  return { view: { kind: "pending", message: exhaustedMessage(data), retryUrl }, poll: false };
}
