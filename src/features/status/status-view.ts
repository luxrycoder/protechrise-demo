import { CLAIM_PATH } from "@/lib/api/schemas/applications";
import type { StatusMe } from "@/lib/api/schemas/status";

/**
 * What the status page shows, worked out from `GET /api/status/me` with no DOM involved. Every string and
 * decision lives here so the whole status matrix can be tested; the components only draw the result.
 */

const STATUS_LABELS: Readonly<Record<string, string>> = {
  // Reads as an error in capitals if left raw; it really means "the discount window passed, full price still works".
  expired_full_price: "Discount Expired",
};

export const statusLabel = (status: string): string => STATUS_LABELS[status] ?? status.replaceAll("_", " ");

/**
 * A path on this site, and nothing else. Same rules as waitlist-api's `isSafeLocalPath`: starts with a single "/", no
 * backslash and no control characters (a tab or newline is dropped by the browser, so "/\t/evil.example" would become
 * "//evil.example" and leave the site), and not absurdly long.
 */
export const isSafeLocalPath = (value: string | null | undefined): value is string =>
  typeof value === "string" &&
  value.length > 0 &&
  value.length <= 2048 &&
  value[0] === "/" &&
  value[1] !== "/" &&
  value[1] !== "\\" &&
  !/[\u0000-\u001f\u007f\\]/.test(value);

/** Format in the zone captured when the applicant applied, so the page reads the same on every device. */
export function formatTimestamp(value: string, timeZone?: string | null): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const options: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" };
  try {
    return date.toLocaleString("en-US", { ...options, ...(timeZone ? { timeZone } : {}) });
  } catch {
    // A time zone this runtime does not know: show the viewer's own rather than fail.
    return date.toLocaleString("en-US", options);
  }
}

export type ClaimOffer = { readonly href: string; readonly label: string; readonly deadline: string | null };
export type PodView = { readonly text: string; readonly openLink: boolean };
export type TimelineEntry = { readonly status: string; readonly label: string; readonly date: string };

export type StatusViewModel =
  | { readonly kind: "notReady"; readonly name: string; readonly availableText: string }
  | {
      readonly kind: "status";
      readonly name: string;
      readonly track: string;
      readonly pill: { readonly label: string; readonly status: string };
      /** True once the payment webhook has confirmed the seat: the API's word, never inferred here. */
      readonly confirmed: boolean;
      readonly community: boolean;
      readonly pod: PodView | null;
      readonly claim: ClaimOffer | null;
      readonly timeline: readonly TimelineEntry[];
    };

const POD_LABELS: Readonly<Record<string, string>> = {
  ready: "Community ready",
  preparing: "Community being prepared",
  migration_pending: "Community migration pending",
  inactive: "Community access inactive",
};

type FullStatus = Extract<StatusMe, { eligible: true }>;

function podView(pod: FullStatus["pod"]): PodView {
  const label = POD_LABELS[pod.state] ?? POD_LABELS.preparing;
  return { text: `${pod.name ? `${pod.name} — ` : ""}${label}`, openLink: pod.state === "ready" && pod.url === "/community/pod" };
}

function claimOffer(me: FullStatus): ClaimOffer | null {
  if (me.paymentConfirmed || !me.claimUrl || !CLAIM_PATH.test(me.claimUrl)) return null;
  const full = me.offerState === "full";
  const closes = me.claimDeadline ? new Date(me.claimDeadline) : null;
  let deadline: string | null = null;
  if (closes && !Number.isNaN(closes.getTime())) {
    // A fixed-payment deadline is published one minute before the stored cutoff.
    const shown = me.fixedPayment ? new Date(closes.getTime() - 60_000).toISOString() : me.claimDeadline;
    deadline = `${full ? "Payments close" : "Offer closes"} ${formatTimestamp(shown ?? "", me.timezone)}`;
  }
  return { href: me.claimUrl, label: full ? "Continue Enrollment" : "Claim your scholarship", deadline };
}

export function describeStatus(me: StatusMe): StatusViewModel {
  if (!me.eligible) {
    return { kind: "notReady", name: me.fullName, availableText: formatTimestamp(me.availableAfter) };
  }
  const discountedLapse = me.currentStatus === "expired_full_price" && me.offerState === "discounted";
  return {
    kind: "status",
    name: me.fullName,
    track: me.preferredTrack,
    pill: { label: discountedLapse ? "Scholarship available" : statusLabel(me.currentStatus), status: me.currentStatus },
    confirmed: me.paymentConfirmed === true,
    community: me.paymentConfirmed === true && me.communityUrl === "/community",
    pod: podView(me.pod),
    claim: claimOffer(me),
    timeline: me.statusHistory.map((h) => ({ status: h.status, label: statusLabel(h.status), date: formatTimestamp(h.created_at, me.timezone) })),
  };
}

export type EntryMessage = { readonly text: string; readonly isError: boolean };

/** What to say above the sign-in form when the visitor arrives from an expired link or from the community. */
export function entryMessage(params: { readonly expired: string | undefined; readonly next: string | undefined }): EntryMessage | null {
  if (params.expired) return { text: "That link has expired. Request a new one below.", isError: true };
  if (params.next === "/portal") return { text: "Sign in to open your portal.", isError: false };
  if (params.next) return { text: "Sign in to check your application status. Community login is separate.", isError: false };
  return null;
}
