import { z } from "zod";

/** The applicant status portal: `GET /api/status/me` and its companions. Read from the legacy `handleStatusMe`. */

export const StatusChoiceSchema = z.object({
  id: z.number(),
  cohortName: z.string().nullable(),
  preferredTrack: z.string(),
});

export const StatusHistoryEntrySchema = z.object({
  status: z.string(),
  /** ISO-8601 with a Z suffix. */
  created_at: z.string(),
});

/**
 * The learner's community pod. `state` is `preparing`, `inactive`, `migration_pending` or `ready` today; it is
 * kept a plain string so a state the API adds later cannot break the whole status page. `url` is set when ready.
 */
export const PodSchema = z.object({
  name: z.string().nullable(),
  state: z.string(),
  url: z.string().nullable(),
});

const CarrySchema = z.object({ cohortName: z.string(), applicationId: z.number() });

/** An application younger than the review window cannot be checked yet. */
const NotEligibleSchema = z.object({
  ok: z.literal(true),
  eligible: z.literal(false),
  fullName: z.string(),
  /** ISO-8601 time the status becomes available. */
  availableAfter: z.string(),
  currentApplicationId: z.number(),
  applications: z.array(StatusChoiceSchema),
});

const FullStatusSchema = z.object({
  ok: z.literal(true),
  currentApplicationId: z.number(),
  applications: z.array(StatusChoiceSchema),
  fullName: z.string(),
  preferredTrack: z.string(),
  timezone: z.string().nullable(),
  /** For example `submitted`, `under_review`, `shortlisted`, `accepted`, `rejected`, `waitlisted`, `payment_pending`. */
  currentStatus: z.string(),
  statusHistory: z.array(StatusHistoryEntrySchema),
  pod: PodSchema,
  movedTo: CarrySchema.optional(),
  carriedFrom: CarrySchema.optional(),
  trackChangeEligible: z.boolean(),
  availableTracks: z.array(z.string()).optional(),
  trackChangeLmsNote: z.string().nullish(),
  trackChangeClosedReason: z.string().optional(),
  trackChangeReissuesStudentId: z.boolean(),
  trackChangeRequest: z
    .object({ requestedTrack: z.string(), status: z.string(), decisionNote: z.string().nullable() })
    .optional(),
  // Paid learners
  paymentConfirmed: z.literal(true).optional(),
  studentId: z.string().nullish(),
  communityUrl: z.string().optional(),
  // Unpaid applicants with an open offer
  offerState: z.string().optional(),
  claimUrl: z.string().optional(),
  claimDeadline: z.string().nullable().optional(),
  fixedPayment: z.boolean().optional(),
});

/** Normalised so callers can switch on `eligible`: the API only sends that key for the not-yet-eligible case. */
export const StatusMeSchema = z.union([NotEligibleSchema, FullStatusSchema]).transform((value) =>
  "eligible" in value ? value : { ...value, eligible: true as const },
);
export type StatusMe = z.output<typeof StatusMeSchema>;

export const TrackChangeInputSchema = z.object({ requestedTrack: z.string().trim().min(1, "Choose a course to change to.") });
export const SwitchInputSchema = z.object({ applicationId: z.number().int().min(1) });

export const StatusRequestLinkInputSchema = z.object({
  email: z.string().trim().toLowerCase().min(1).max(254),
  /** Where to send the applicant after sign-in; optional. */
  next: z.string().max(500).optional(),
});

/** LMS hand-off and status. `state` is a plain string so a state the API adds later cannot break the page. */
export const StatusLmsSchema = z.looseObject({
  ok: z.boolean(),
  state: z.string().optional(),
  availableAt: z.string().nullish(),
  /** Only in the answer to a hand-off request; an https address on the learning platform, never kept or logged. */
  handoffUrl: z.string().optional(),
  lmsStage: z.string().optional(),
});
export type StatusLms = z.output<typeof StatusLmsSchema>;
