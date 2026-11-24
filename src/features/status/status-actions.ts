import { formatTimestamp } from "@/features/status/status-view";
import type { ApiResult } from "@/lib/api/result";
import type { StatusLms, StatusMe } from "@/lib/api/schemas/status";
import { handoffHref } from "@/lib/portal";

/**
 * The actions on the status page, as pure functions: change course, switch between cohorts, and open the learning
 * platform. The components only draw these results and call the API.
 */

type FullStatus = Extract<StatusMe, { eligible: true }>;

export const DEFAULT_TRACK_NOTE =
  "You can ask to change your course once. An admin reviews every request, and you will get an email when it is decided. Choose carefully: once your change is approved you cannot change again. Requests close 24 hours before your first class, and also once you have activated your classroom account. If your course is not running this cohort you can ask to join the next one. After you submit you will see Waiting for admin review. You do not need to contact support.";

// ---- Course change ----

export type TrackChangeView =
  | { readonly kind: "form"; readonly options: readonly string[]; readonly note: string; readonly reissueNote: string | null }
  | { readonly kind: "request"; readonly tone: "pending" | "approved" | "rejected"; readonly text: string }
  | { readonly kind: "closed"; readonly text: string };

function reissueNote(me: FullStatus): string | null {
  if (!me.trackChangeReissuesStudentId) return null;
  const tail = me.studentId ? `, and ${me.studentId} will stop working.` : ".";
  return `You can change course once, and an admin reviews every request. If it is approved you will get a new Student ID${tail}`;
}

function requestView(me: FullStatus): TrackChangeView | null {
  const request = me.trackChangeRequest;
  if (!request) return null;
  switch (request.status) {
    case "pending":
      return { kind: "request", tone: "pending", text: `Waiting for admin review. Your request to switch to ${request.requestedTrack} is pending.` };
    case "approved": {
      const id = me.paymentConfirmed && me.studentId ? ` Your new Student ID is ${me.studentId}.` : "";
      return { kind: "request", tone: "approved", text: `Your course change to ${request.requestedTrack} was approved.${id}` };
    }
    case "rejected": {
      const note = request.decisionNote ? ` ${request.decisionNote}` : "";
      return { kind: "request", tone: "rejected", text: `Your request to switch to ${request.requestedTrack} was declined.${note}` };
    }
    default:
      return null;
  }
}

export function describeTrackChange(me: FullStatus): TrackChangeView | null {
  if (me.trackChangeEligible) {
    return { kind: "form", options: me.availableTracks ?? [], note: me.trackChangeLmsNote || DEFAULT_TRACK_NOTE, reissueNote: reissueNote(me) };
  }
  const request = requestView(me);
  if (request) return request;
  return me.trackChangeClosedReason ? { kind: "closed", text: me.trackChangeClosedReason } : null;
}

export const trackChangeConfirmText = (current: string, target: string): string =>
  `Switch from ${current} to ${target}? Once it is approved you cannot change again.`;

export type TrackChangeOutcome =
  | { readonly kind: "sent" }
  | { readonly kind: "closed"; readonly text: string }
  | { readonly kind: "signedOut" }
  | { readonly kind: "error"; readonly text: string };

export function trackChangeOutcome(result: ApiResult<unknown>): TrackChangeOutcome {
  if (result.ok) return { kind: "sent" };
  const { kind, message } = result.error;
  if (kind === "unauthorized") return { kind: "signedOut" };
  // 409: the window closed or a request is already waiting; the API's own words say which.
  if (kind === "conflict") return { kind: "closed", text: message };
  return { kind: "error", text: message };
}

// ---- Switching between cohorts ----

export type SwitcherView = { readonly selected: string; readonly options: readonly { readonly value: string; readonly label: string }[] };

/** An email can have one application per cohort; the applicant can move between them. */
export function describeSwitcher(me: { readonly currentApplicationId: number; readonly applications: FullStatus["applications"] }): SwitcherView | null {
  if (me.applications.length < 2) return null;
  return {
    selected: String(me.currentApplicationId),
    options: me.applications.map((a) => ({ value: String(a.id), label: `${a.cohortName ?? "Earlier cohort"} · ${a.preferredTrack}` })),
  };
}

// ---- The learning platform ----

export type LmsData = Pick<StatusLms, "state" | "availableAt" | "lmsStage">;

export type LmsView = {
  readonly hidden: boolean;
  readonly message: string;
  readonly stage: string | null;
  readonly ready: boolean;
  /** The button label, or null when there is nothing to press. */
  readonly button: "Open LMS" | "Check LMS access again" | null;
};

const LMS_UNAVAILABLE = "The learning platform is temporarily unavailable. Your application and payment remain recorded.";

const LMS_MESSAGES: Readonly<Record<string, string>> = {
  ready: "Your learning platform is ready. Activate your LMS account or continue to sign in.",
  preparing: "Your LMS access is being prepared. You can check again here.",
  not_eligible: "LMS access is not currently available for this application.",
  not_open: "Your LMS access has not opened yet.",
  unavailable: LMS_UNAVAILABLE,
};

const LMS_STAGES: Readonly<Record<string, string>> = {
  prepared: "LMS update: your enrollment is prepared.",
  invited: "LMS update: your invitation has been sent.",
  activated: "LMS update: your account is activated.",
  onboarded: "LMS update: onboarding is complete.",
  revoked: "LMS update: your LMS access has been withdrawn.",
};

export function describeLms(data: LmsData, timeZone?: string | null): LmsView {
  const state = data.state && data.state in LMS_MESSAGES ? data.state : data.state === "disabled" ? "disabled" : "unavailable";
  const message =
    state === "not_open" && data.availableAt
      ? `Your LMS access opens on ${formatTimestamp(data.availableAt, timeZone)}.`
      : (LMS_MESSAGES[state] ?? LMS_UNAVAILABLE);
  const button = state === "ready" ? "Open LMS" : state === "preparing" || state === "unavailable" ? "Check LMS access again" : null;
  return { hidden: state === "disabled", message, stage: (data.lmsStage && LMS_STAGES[data.lmsStage]) || null, ready: state === "ready", button };
}

export type HandoffOutcome =
  | { readonly kind: "open"; readonly url: string }
  | { readonly kind: "signedOut" }
  | { readonly kind: "state"; readonly data: LmsData };

const UNAVAILABLE: HandoffOutcome = { kind: "state", data: { state: "unavailable" } };

/** The hand-off address is followed only if it passes `handoffHref` (the configured LMS origin, the hand-off path, a ticket). */
export function handoffOutcome(result: ApiResult<StatusLms>, lmsOrigin: string | null): HandoffOutcome {
  if (result.ok) {
    const url = result.data.ok ? handoffHref(result.data.handoffUrl, lmsOrigin) : null;
    return url ? { kind: "open", url } : UNAVAILABLE;
  }
  if (result.error.kind === "unauthorized") return { kind: "signedOut" };
  const body = result.error.body;
  const state = typeof body === "object" && body !== null && "state" in body && typeof body.state === "string" ? body.state : null;
  return state ? { kind: "state", data: { state } } : UNAVAILABLE;
}
