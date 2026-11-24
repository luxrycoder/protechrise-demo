import { z } from "zod";

/**
 * The application contract, mirrored from the legacy `waitlist-api/lib/validators.js`
 * (`validateApplicationPayload`). Same fields, same limits, same option values and the same user-facing
 * messages, so the form shows exactly what the server would say. The server stays the authority: this
 * schema catches mistakes before the request, it does not replace the server's checks.
 *
 * Not checkable here (the server validates against live data): that the country and city exist in the
 * geo list, and that the preferred track is offered by the open cohort.
 */

export const CURRENT_STATUS_OPTIONS = [
  "Student",
  "Employed full-time",
  "Employed part-time",
  "Self-employed / Freelancer",
  "Unemployed - job seeking",
] as const;
export const EXPERIENCE_LEVEL_OPTIONS = ["Complete beginner", "Some exposure", "Intermediate", "Advanced"] as const;
export const WEEKLY_HOURS_OPTIONS = ["Under 5 hours", "5-10 hours", "10-15 hours", "15-20 hours", "20+ hours"] as const;
export const CAN_SELF_FUND_OPTIONS = ["Yes", "No"] as const;
export const REFERRAL_SOURCE_OPTIONS = [
  "Social media",
  "Friend or referral",
  "Search engine",
  "Community event",
  "Other",
] as const;

export const FIELD_LIMITS = {
  firstName: 60,
  lastName: 60,
  email: 254,
  phone: 32,
  city: 100,
  cityOther: 100,
  preferredTrack: 80,
  motivationEssay: 3000,
  careerGoal: 400,
  commitmentPlan: 1000,
  referralSourceOther: 100,
} as const;

export const MIN_LENGTHS = { motivationEssay: 120, commitmentPlan: 60, careerGoal: 20 } as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[\d\s().-]{7,24}$/;
/** Sanity cap on the optional tracking values; the server also enforces a body size limit. */
const TRACKING_MAX = 2000;

/** A trimmed string where a missing value reports the same message as an empty or invalid one. */
const text = (message: string) => z.string({ error: message }).trim();
const choice = <T extends readonly [string, ...string[]]>(options: T, message: string) => z.enum(options, { error: message });
const tracking = () => z.string().max(TRACKING_MAX).optional();

/** Fields both application forms collect, with identical rules and messages. */
const sharedFields = {
  firstName: text("Enter a valid first name.").min(1, "Enter a valid first name.").max(FIELD_LIMITS.firstName, "Enter a valid first name."),
  lastName: text("Enter a valid last name.").min(1, "Enter a valid last name.").max(FIELD_LIMITS.lastName, "Enter a valid last name."),
  email: z
    .string({ error: "Enter a valid email address." })
    .trim()
    .toLowerCase()
    .max(FIELD_LIMITS.email, "Enter a valid email address.")
    .regex(EMAIL_RE, "Enter a valid email address."),
  phone: text("Enter a valid phone number.").max(FIELD_LIMITS.phone, "Enter a valid phone number.").regex(PHONE_RE, "Enter a valid phone number."),
  country: text("Select a valid country.").min(1, "Select a valid country."),
  preferredTrack: text("Select a valid preferred track.")
    .min(1, "Select a valid preferred track.")
    .max(FIELD_LIMITS.preferredTrack, "Select a valid preferred track."),
  experienceLevel: choice(EXPERIENCE_LEVEL_OPTIONS, "Select a valid experience level."),
  // Must be exactly true: the server records which policy version was accepted and when.
  consent: z.literal(true, { error: "You must agree to the application terms." }),
  refundPolicyAccepted: z.literal(true, { error: "You must accept the policies." }),
};

/** Optional, never required: the browser's time zone, marketing attribution and the honeypot. Shared by both forms. */
const attributionFields = {
  timezone: z.string().max(64).optional(),
  analyticsConsent: z.boolean().optional(),
  utm_source: tracking(),
  utm_medium: tracking(),
  utm_campaign: tracking(),
  fbp: tracking(),
  fbc: tracking(),
  fbclid: tracking(),
  ttp: tracking(),
  ttp1: tracking(),
  ttp2: tracking(),
  ttclid: tracking(),
  documentReferrer: tracking(),
  /** The referral code when the applicant came through a referral link. The server also reads the attribution cookie. */
  referrerCode: z.string().max(64).optional(),
  /** Honeypot: real people never fill it. The server silently accepts and discards a filled one. */
  website: z.string().optional(),
};

/** The apply-and-pay short form (cohorts with `payAtApply`): contact details, track and experience, plus the two acceptances. */
export const ShortApplicationInputSchema = z.object({ ...sharedFields, ...attributionFields });
export type ShortApplicationInput = z.input<typeof ShortApplicationInputSchema>;

/** The award flow's long form. */
export const ApplicationInputSchema = z
  .object({
    ...sharedFields,
    city: text("Select a valid city for your country.").min(1, "Select a valid city for your country."),
    cityOther: z.string().trim().optional(),
    motivationEssay: text("Your motivation response must be between 120 and 3000 characters.")
      .min(MIN_LENGTHS.motivationEssay, "Your motivation response must be between 120 and 3000 characters.")
      .max(FIELD_LIMITS.motivationEssay, "Your motivation response must be between 120 and 3000 characters."),
    commitmentPlan: text("Your commitment plan must be between 60 and 1000 characters.")
      .min(MIN_LENGTHS.commitmentPlan, "Your commitment plan must be between 60 and 1000 characters.")
      .max(FIELD_LIMITS.commitmentPlan, "Your commitment plan must be between 60 and 1000 characters."),
    currentStatus: choice(CURRENT_STATUS_OPTIONS, "Select a valid current status."),
    weeklyHours: choice(WEEKLY_HOURS_OPTIONS, "Select a valid weekly time commitment."),
    careerGoal: text("Your 6-month goal must be between 20 and 400 characters.")
      .min(MIN_LENGTHS.careerGoal, "Your 6-month goal must be between 20 and 400 characters.")
      .max(FIELD_LIMITS.careerGoal, "Your 6-month goal must be between 20 and 400 characters."),
    // NAMING TRAP: the form asks "Do you need scholarship support?" and stores the answer here, so `Yes` means the
    // applicant NEEDS support (staff see this field labelled "Needs scholarship support"). The name says the opposite.
    // Keep the values as they are: flipping them would invert the meaning against all existing applications.
    canSelfFund: choice(CAN_SELF_FUND_OPTIONS, "Select whether you can self-fund."),
    referralSource: choice(REFERRAL_SOURCE_OPTIONS, "Select how you heard about us."),
    referralSourceOther: z.string().trim().optional(),
    ...attributionFields,
  })
  .superRefine((value, ctx) => {
    if (value.city === "Other" && (!value.cityOther || value.cityOther.length > FIELD_LIMITS.cityOther)) {
      ctx.addIssue({ code: "custom", path: ["cityOther"], message: "Enter your city." });
    }
    if (
      value.referralSource === "Other" &&
      (!value.referralSourceOther || value.referralSourceOther.length > FIELD_LIMITS.referralSourceOther)
    ) {
      ctx.addIssue({ code: "custom", path: ["referralSourceOther"], message: "Tell us how you heard about us." });
    }
  });

/** What a form collects (before normalisation). */
export type ApplicationInput = z.input<typeof ApplicationInputSchema>;
/** What is sent to the API (trimmed, email lower-cased). */
export type ApplicationData = z.output<typeof ApplicationInputSchema>;

/** First message per field, keyed by field name, ready to show next to each input. */
export { fieldErrors as applicationFieldErrors } from "@/lib/api/validate";

export const WaitlistInputSchema = z.object({
  email: z
    .string({ error: "A valid email is required." })
    .trim()
    .toLowerCase()
    .max(FIELD_LIMITS.email, "A valid email is required.")
    .regex(EMAIL_RE, "A valid email is required."),
  /** A track name the open cohort offers; the server rejects an unknown one. */
  track: z.string().trim().max(FIELD_LIMITS.preferredTrack).optional(),
  /** Honeypot. */
  website: z.string().optional(),
});

/**
 * `payUrl` is returned for an apply-and-pay cohort: the applicant is sent straight to payment. It must be a claim link
 * on our own site; anything else is dropped (the application is saved either way), so a bad value can never send the
 * browser to another site.
 */
/** The only shape of pay link the site follows: a `/claim?token=` path on this origin, never another host. */
export const CLAIM_PATH = /^\/claim\?token=[A-Za-z0-9_%.~-]+$/;
export const SubmitResponseSchema = z.object({
  ok: z.literal(true),
  message: z.string(),
  payUrl: z.string().regex(CLAIM_PATH).optional().catch(undefined),
});
export type SubmitResponse = z.output<typeof SubmitResponseSchema>;
export const CheckEmailResponseSchema = z.object({
  ok: z.literal(true),
  /** False when the address cannot receive mail (disposable domain or no MX record). */
  deliverable: z.boolean(),
  alreadyRegistered: z.boolean(),
});
export const WaitlistResponseSchema = z.object({ ok: z.literal(true), message: z.string().optional() });
