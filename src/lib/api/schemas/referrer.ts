import { z } from "zod";

/** Referrers: apply, request a sign-in link, and the portal (`GET /api/referrer/me`). */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const ReferrerApplyInputSchema = z.object({
  name: z.string({ error: "A name and a valid email are required." }).trim().min(1, "A name and a valid email are required.").max(120, "A name and a valid email are required."),
  email: z
    .string({ error: "A name and a valid email are required." })
    .trim()
    .toLowerCase()
    .regex(EMAIL_RE, "A name and a valid email are required."),
  phone: z.string().trim().max(64).optional(),
  /** The server truncates this to 2000 characters. */
  promoPlan: z.string().trim().max(2000).optional(),
  /** Honeypot, as on the application form. */
  website: z.string().optional(),
});

export const ReferrerRequestLinkInputSchema = z.object({ email: z.string().trim().toLowerCase().min(1).max(254) });

export const ReferrerStatsSchema = z.object({
  applied: z.number(),
  waitlisted: z.number(),
  paid: z.number(),
  earned: z.number(),
  paidOut: z.number(),
  outstanding: z.number(),
});

export const ReferredApplicantSchema = z.object({
  /** First name and last initial only: no contact details. */
  name: z.string(),
  country: z.string().nullable(),
  appliedAt: z.string(),
  paid: z.boolean(),
  payoutState: z.string().nullable(),
  paidOutAt: z.string().nullable(),
});

export const ReferrerMeSchema = z.object({
  ok: z.literal(true),
  name: z.string(),
  code: z.string(),
  /** The shareable `/r/<code>` link, built from the API's public base URL. */
  link: z.string(),
  tokenAmount: z.number().nullable(),
  stats: ReferrerStatsSchema,
  applicants: z.array(ReferredApplicantSchema),
});
export type ReferrerMe = z.output<typeof ReferrerMeSchema>;
