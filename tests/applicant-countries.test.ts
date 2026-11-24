import { describe, expect, test } from "vitest";
import {
  getApplicantCountries,
  loadApplicantCountries,
  parseApplicantCountriesResponse,
  tickerCopies,
} from "@/lib/applicant-countries";

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

describe("parseApplicantCountriesResponse", () => {
  test("accepts a valid payload and sorts by count descending", () => {
    const data = parseApplicantCountriesResponse({
      ok: true,
      totalCountries: 3,
      countries: [
        { name: "Ghana", count: 10 },
        { name: "Nigeria", count: 812 },
      ],
    });
    expect(data).toEqual({
      totalCountries: 3,
      countries: [
        { name: "Nigeria", count: 812 },
        { name: "Ghana", count: 10 },
      ],
    });
  });

  test("accepts the zero-countries shape", () => {
    expect(parseApplicantCountriesResponse({ ok: true, totalCountries: 0, countries: [] })).toEqual({
      totalCountries: 0,
      countries: [],
    });
  });

  test("rejects anything malformed, never passing bad data to the page", () => {
    expect(parseApplicantCountriesResponse({ ok: false, totalCountries: 1, countries: [] })).toBeNull();
    expect(parseApplicantCountriesResponse({ ok: true, countries: [] })).toBeNull();
    expect(parseApplicantCountriesResponse({ ok: true, totalCountries: -1, countries: [] })).toBeNull();
    expect(parseApplicantCountriesResponse({ ok: true, totalCountries: 1, countries: "Nigeria" })).toBeNull();
    expect(
      parseApplicantCountriesResponse({ ok: true, totalCountries: 1, countries: [{ name: "Nigeria", count: 0 }] }),
    ).toBeNull();
    expect(
      parseApplicantCountriesResponse({ ok: true, totalCountries: 1, countries: [{ name: "", count: 1 }] }),
    ).toBeNull();
    expect(parseApplicantCountriesResponse(null)).toBeNull();
  });
});

describe("getApplicantCountries", () => {
  test("calls the public-applicant-countries endpoint", async () => {
    let calledUrl = "";
    const data = await getApplicantCountries("https://api.test", async (url) => {
      calledUrl = url;
      return jsonResponse({ ok: true, totalCountries: 1, countries: [{ name: "Nigeria", count: 5 }] });
    });
    expect(data?.totalCountries).toBe(1);
    expect(calledUrl).toBe("https://api.test/api/public-applicant-countries");
  });

  test("returns null on a server error, malformed JSON, or a failed fetch", async () => {
    expect(await getApplicantCountries("https://api.test", async () => jsonResponse({ ok: false }, 500))).toBeNull();
    expect(
      await getApplicantCountries("https://api.test", async () => jsonResponse({ ok: true, countries: "nope" })),
    ).toBeNull();
    expect(
      await getApplicantCountries("https://api.test", async () => {
        throw new Error("ECONNREFUSED");
      }),
    ).toBeNull();
  });
});

describe("loadApplicantCountries", () => {
  test("returns null instead of throwing when API_ORIGIN is not configured", async () => {
    const saved = process.env.API_ORIGIN;
    delete process.env.API_ORIGIN;
    try {
      expect(await loadApplicantCountries()).toBeNull();
    } finally {
      if (saved !== undefined) process.env.API_ORIGIN = saved;
    }
  });
});

describe("tickerCopies", () => {
  test("repeats a short list until one set reaches the minimum, so the ticker never leaves the right side empty", () => {
    expect(tickerCopies(1, 16)).toBe(16);
    expect(tickerCopies(3, 16)).toBe(6);
    expect(tickerCopies(5, 16) * 5).toBeGreaterThanOrEqual(16);
  });

  test("leaves a list that is already long enough alone", () => {
    expect(tickerCopies(16, 16)).toBe(1);
    expect(tickerCopies(30, 16)).toBe(1);
  });

  test("never returns less than one copy", () => {
    expect(tickerCopies(0, 16)).toBe(1);
  });
});
