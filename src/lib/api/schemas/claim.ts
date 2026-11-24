import { z } from "zod";

/** Claiming a seat: `GET /api/claim/start-info`, `POST /api/claim/accept`, `GET /api/claim/confirmed`. */

/** The API sends course names as plain strings; an object with a `name` is also accepted and reduced to it. */
const OfferedTrackSchema = z.union([z.string(), z.object({ name: z.string() }).transform((track) => track.name)]);

export const ClaimStartInfoSchema = z.object({
  ok: z.literal(true),
  firstName: z.string(),
  cohortName: z.string(),
  /** The amount of a checkout started now, formatted like `₦19,500`. */
  feeText: z.string(),
  currentTrack: z.string(),
  tracks: z.array(OfferedTrackSchema),
  /** True when the applicant already accepted the policies, so the pay step can be skipped. */
  policyAccepted: z.boolean(),
});

export type ClaimStartInfo = z.output<typeof ClaimStartInfoSchema>;

export const ClaimAcceptInputSchema = z.object({
  token: z.string().min(1),
  accepted: z.literal(true, { error: "You must accept the policies to continue." }),
  /** A course picked on the pay page before payment, if the applicant changed it. */
  track: z.string().nullable().optional(),
});

export const ClaimAcceptResponseSchema = z.object({
  ok: z.literal(true),
  /** A path on this site, `/claim?token=...`, which the API turns into the Paystack redirect. */
  payUrl: z.string(),
});

const ConfirmedNotFoundSchema = z.object({ ok: z.literal(true), found: z.literal(false) });

const ConfirmedFoundSchema = z.object({
  ok: z.literal(true),
  found: z.literal(true),
  /** False while the webhook has not arrived yet: keep polling. */
  paid: z.boolean(),
  firstName: z.string(),
  studentId: z.string().nullable(),
  /** Amount in kobo (minor units). */
  amountMinor: z.number(),
  currency: z.string(),
  amountCategory: z.string().nullish(),
  cohortStartDate: z.string().nullable(),
  claimUrl: z.string().nullable(),
  claimDeadline: z.string().nullable(),
  fixedPayment: z.boolean(),
  communityConfigured: z.boolean(),
});

export const ClaimConfirmedSchema = z.discriminatedUnion("found", [ConfirmedNotFoundSchema, ConfirmedFoundSchema]);
export type ClaimConfirmed = z.output<typeof ClaimConfirmedSchema>;
