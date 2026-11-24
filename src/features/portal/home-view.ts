import type { PortalHome } from "@/lib/api/schemas/portal";
import { BEING_ASSIGNED, countdownText, formatDay, startText, supportView, type SupportView } from "@/lib/portal";
import { eyebrowText, welcomeText } from "@/features/portal/portal-screen";

/**
 * What the learner's home shows, worked out from `GET /api/portal/home` with no DOM involved. A card whose data is
 * missing is `null` (hidden), never filled with invented values. Missing single values read "—", except the ones the
 * legacy portal words as "Being assigned" (Student ID and pod, which really are assigned later).
 */

export const DASH = "—";

export type DetailRow = { readonly label: string; readonly value: string };

export type CommunityView = { readonly state: "ready"; readonly href: string } | { readonly state: "preparing"; readonly message: string };

export type HomeView = {
  readonly eyebrow: string;
  readonly welcome: string;
  /** Null when the cohort has no start date: the card then shows only `startLine`. */
  readonly countdown: (nowMs: number) => string;
  readonly startLine: string;
  readonly details: readonly DetailRow[] | null;
  readonly community: CommunityView | null;
  readonly receipt: { readonly rows: readonly DetailRow[]; readonly reference: string } | null;
  readonly support: SupportView;
};

export const COMMUNITY_PREPARING = "We are getting your invitation ready. It will appear here shortly; check back in a little while.";

const clean = (value: string | null | undefined): string | null => {
  const v = value?.trim();
  return v ? v : null;
};

export function buildHomeView(home: PortalHome): HomeView {
  const learner = home.learner;
  const studentId = clean(learner?.studentId);
  const pod = home.pod;
  const podName = pod && pod.state === "ready" ? clean(pod.name) : null;

  const details: readonly DetailRow[] | null =
    learner || pod
      ? [
          { label: "Student ID", value: studentId ?? BEING_ASSIGNED },
          { label: "Track", value: clean(learner?.track) ?? DASH },
          { label: "Cohort", value: clean(learner?.cohortName) ?? DASH },
          { label: "Pod", value: podName ?? BEING_ASSIGNED },
        ]
      : null;

  const community: CommunityView | null = home.community
    ? home.community.state === "ready"
      ? { state: "ready", href: "/community" }
      : { state: "preparing", message: COMMUNITY_PREPARING }
    : null;

  const receipt = home.receipt;
  const zone = home.schedule?.cohortTimezone;
  const receiptView = receipt
    ? {
        rows: [
          { label: "Amount paid", value: clean(receipt.amountText) ?? DASH },
          { label: "Date paid", value: formatDay(receipt.paidAt, zone) ?? DASH },
          { label: "Student ID", value: clean(receipt.studentId) ?? studentId ?? BEING_ASSIGNED },
        ],
        reference: clean(receipt.reference) ?? DASH,
      }
    : null;

  return {
    eyebrow: eyebrowText(home),
    welcome: welcomeText(home),
    countdown: (nowMs) => countdownText(home.schedule?.startsAt, nowMs),
    startLine: startText(home.schedule),
    details,
    community,
    receipt: receiptView,
    support: supportView(home.support),
  };
}
