import { z } from "zod";
import { DEMO_PAYLOADS, demoDataEnabled } from "@/lib/demo-data";
import { apiOriginFromEnv, fetchApiJson, type FetchLike } from "@/lib/api-fetch";

const CountryEntrySchema = z.object({
  name: z.string().min(1),
  count: z.number().int().positive(),
});

const ApplicantCountriesResponseSchema = z.object({
  ok: z.literal(true),
  totalCountries: z.number().int().nonnegative(),
  countries: z.array(CountryEntrySchema),
});

export type CountryEntry = { readonly name: string; readonly count: number };
export type ApplicantCountriesData = {
  readonly totalCountries: number;
  readonly countries: readonly CountryEntry[];
};

/** The API orders by count already; sorted again here defensively. Returns null on any mismatch. */
export function parseApplicantCountriesResponse(raw: unknown): ApplicantCountriesData | null {
  const parsed = ApplicantCountriesResponseSchema.safeParse(raw);
  if (!parsed.success) return null;
  const countries = [...parsed.data.countries].sort((a, b) => b.count - a.count);
  return { totalCountries: parsed.data.totalCountries, countries };
}

export async function getApplicantCountries(
  apiOrigin: string,
  fetchImpl?: FetchLike,
): Promise<ApplicantCountriesData | null> {
  return parseApplicantCountriesResponse(
    await fetchApiJson(apiOrigin, "/api/public-applicant-countries", fetchImpl),
  );
}

export async function loadApplicantCountries(): Promise<ApplicantCountriesData | null> {
  if (demoDataEnabled()) return parseApplicantCountriesResponse(DEMO_PAYLOADS.countries);
  const origin = apiOriginFromEnv();
  return origin ? getApplicantCountries(origin) : null;
}

/**
 * How many times to repeat a ticker's list so one set is at least `minItems` long. A short list would
 * otherwise be narrower than the screen, leaving the ticker empty on the right.
 */
export function tickerCopies(itemCount: number, minItems: number): number {
  return itemCount <= 0 ? 1 : Math.max(1, Math.ceil(minItems / itemCount));
}
