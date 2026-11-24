import { z } from "zod";
import { DEMO_PAYLOADS, demoDataEnabled } from "@/lib/demo-data";
import { apiOriginFromEnv, fetchApiJson, type FetchLike } from "@/lib/api-fetch";

export const FEE_TOKEN = "{{ONBOARDING_FEE}}";
export const TUITION_TOKEN = "{{TUITION_FEE}}";
/** Matched with its trailing percent sign, so the number and the sign are replaced together. */
const PERCENT_TOKEN_PATTERN = /\{\{SCHOLARSHIP_PERCENT\}\}%?/g;
/** Used when the live fee cannot be fetched: a number-free word, so a stale amount is never shown. */
export const FEE_FALLBACK_WORD = "small";
export const TUITION_FALLBACK_WORD = "much more";
export const PERCENT_FALLBACK_WORD = "large";

const FeeResponseSchema = z.object({
  ok: z.literal(true),
  fee: z.string().regex(/^₦[\d,]+(\.\d{2})?$/),
});

/** Validate the API payload; returns the formatted naira amount or null. Never trusts the shape. */
export function parseFeeResponse(raw: unknown): string | null {
  const parsed = FeeResponseSchema.safeParse(raw);
  return parsed.success ? parsed.data.fee : null;
}

export function fillFeeToken(text: string, fee: string | null): string {
  return text.split(FEE_TOKEN).join(fee ?? FEE_FALLBACK_WORD);
}

/** Fetch the live fee from this environment's API. Returns null on any failure. */
export async function getPublicFee(apiOrigin: string, fetchImpl?: FetchLike): Promise<string | null> {
  return parseFeeResponse(await fetchApiJson(apiOrigin, "/api/public-fee", fetchImpl));
}

/** Server-side convenience for pages: reads API_ORIGIN at request time. */
export async function loadPublicFee(): Promise<string | null> {
  if (demoDataEnabled()) return parseFeeResponse(DEMO_PAYLOADS.terms);
  const origin = apiOriginFromEnv();
  return origin ? getPublicFee(origin) : null;
}

/** The amounts the public pages quote, as the API reports them. Each value is null when it could not be loaded. */
export type PublicTerms = {
  readonly fee: string | null;
  readonly tuition: string | null;
  readonly scholarshipPercent: number | null;
};

export const NO_TERMS: PublicTerms = { fee: null, tuition: null, scholarshipPercent: null };

const NAIRA = /^₦[\d,]+(\.\d{2})?$/;
const nairaOrNull = (value: unknown): string | null => (typeof value === "string" && NAIRA.test(value) ? value : null);
const percentOrNull = (value: unknown): number | null =>
  typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 100 ? value : null;

/**
 * Each value is checked on its own: an API that has not been upgraded yet still gives the fee, and one odd value never
 * reaches the page or hides the others.
 */
export function parseTermsResponse(raw: unknown): PublicTerms {
  if (typeof raw !== "object" || raw === null || (raw as { ok?: unknown }).ok !== true) return NO_TERMS;
  const body = raw as Record<string, unknown>;
  return { fee: nairaOrNull(body.fee), tuition: nairaOrNull(body.tuition), scholarshipPercent: percentOrNull(body.scholarshipPercent) };
}

export async function getPublicTerms(apiOrigin: string, fetchImpl?: FetchLike): Promise<PublicTerms> {
  return parseTermsResponse(await fetchApiJson(apiOrigin, "/api/public-fee", fetchImpl));
}

/** Server-side convenience for pages: reads API_ORIGIN at request time. */
export async function loadPublicTerms(): Promise<PublicTerms> {
  if (demoDataEnabled()) return parseTermsResponse(DEMO_PAYLOADS.terms);
  const origin = apiOriginFromEnv();
  return origin ? getPublicTerms(origin) : NO_TERMS;
}

/** Fill every price token. Unavailable values become number-free words, never a stale amount or a bare token. */
export function fillTokens(text: string, terms: PublicTerms): string {
  return fillFeeToken(text, terms.fee)
    .split(TUITION_TOKEN)
    .join(terms.tuition ?? TUITION_FALLBACK_WORD)
    .replace(PERCENT_TOKEN_PATTERN, terms.scholarshipPercent === null ? PERCENT_FALLBACK_WORD : `${terms.scholarshipPercent}%`);
}
