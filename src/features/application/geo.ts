import countryIsoJson from "@/data/country-iso.json";
import geoJson from "@/data/geo.json";

/**
 * Country, dial-code and city data for the application form. These are the same two files the legacy API
 * validates against (`waitlist-api/public/data/`), copied unchanged, so a country or city the form offers is
 * one the server accepts. Keep them identical if the API's copies change.
 */
type GeoFile = {
  readonly _source: string;
  readonly countries: Readonly<Record<string, { readonly dialCode: string; readonly cities: readonly string[] }>>;
};

const geo = geoJson as unknown as GeoFile;
const isoByCountry = countryIsoJson as unknown as Readonly<Record<string, string>>;

/** Required attribution for the source data (ODbL for countries and dial codes, CC BY 4.0 for cities). */
export const GEO_ATTRIBUTION: string = geo._source;

/** In the legacy order (alphabetical). */
export const COUNTRY_NAMES: readonly string[] = Object.keys(geo.countries);

const GLOBE = "🌐";
const REGIONAL_INDICATOR_OFFSET = 127397;

export function dialCodeFor(country: string): string | null {
  return geo.countries[country]?.dialCode ?? null;
}

export function citiesFor(country: string): readonly string[] {
  return geo.countries[country]?.cities ?? [];
}

/** Flag emoji from the country's ISO 3166-1 alpha-2 code, or a globe when unknown. */
export function flagFor(country: string): string {
  const iso = isoByCountry[country];
  if (!iso || iso.length !== 2) return GLOBE;
  return String.fromCodePoint(
    iso.charCodeAt(0) + REGIONAL_INDICATOR_OFFSET,
    iso.charCodeAt(1) + REGIONAL_INDICATOR_OFFSET,
  );
}

export type PhoneCodeOption = {
  /** The country this option belongs to (several countries share a dial code such as +1). */
  readonly key: string;
  /** The calling code, for example `+234`: what the form stores. */
  readonly value: string;
  /** For example `+234 Nigeria`, like the legacy select. */
  readonly label: string;
  readonly flag: string;
};

let cachedPhoneCodes: readonly PhoneCodeOption[] | null = null;

/** One option per country, in the legacy order. */
export function phoneCodeOptions(): readonly PhoneCodeOption[] {
  cachedPhoneCodes ??= COUNTRY_NAMES.map((name) => {
    const value = dialCodeFor(name) ?? "";
    return { key: name, value, label: `${value} ${name}`, flag: flagFor(name) };
  });
  return cachedPhoneCodes;
}
