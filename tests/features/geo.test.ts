import { describe, expect, test } from "vitest";
import { COUNTRY_NAMES, GEO_ATTRIBUTION, citiesFor, dialCodeFor, flagFor, phoneCodeOptions } from "@/features/application/geo";

describe("geo data", () => {
  test("lists 245 unique countries, including the markets the programme serves", () => {
    expect(COUNTRY_NAMES).toHaveLength(245);
    expect(new Set(COUNTRY_NAMES).size).toBe(245);
    for (const name of ["Nigeria", "Ghana", "Kenya", "South Africa"]) expect(COUNTRY_NAMES).toContain(name);
  });

  test("keeps the legacy order (alphabetical, as in the source file)", () => {
    expect(COUNTRY_NAMES[0]).toBe("Afghanistan");
    const sorted = [...COUNTRY_NAMES].sort((a, b) => a.localeCompare(b, "en"));
    expect(COUNTRY_NAMES.slice(0, 5)).toEqual(sorted.slice(0, 5));
  });

  test("looks up dial codes and cities, and answers safely for unknown countries", () => {
    expect(dialCodeFor("Nigeria")).toBe("+234");
    expect(dialCodeFor("Atlantis")).toBeNull();
    expect(citiesFor("Nigeria")).toContain("Lagos");
    expect(citiesFor("Atlantis")).toEqual([]);
  });

  test("every country has a dial code and at least one city", () => {
    for (const name of COUNTRY_NAMES) {
      expect(dialCodeFor(name), name).toMatch(/^\+\d+/);
      expect(citiesFor(name).length, name).toBeGreaterThan(0);
    }
  });

  test("builds flag emoji from the ISO code, with a globe for unknown countries", () => {
    expect(flagFor("Nigeria")).toBe("🇳🇬");
    expect(flagFor("Ghana")).toBe("🇬🇭");
    expect(flagFor("Atlantis")).toBe("🌐");
  });

  test("offers one calling-code option per country, labelled like the legacy select", () => {
    const options = phoneCodeOptions();
    expect(options).toHaveLength(245);
    expect(options.find((o) => o.key === "Nigeria")).toMatchObject({ value: "+234", label: "+234 Nigeria" });
  });

  test("keeps the data licence attribution that ships with the source data", () => {
    expect(GEO_ATTRIBUTION).toMatch(/ODbL/);
    expect(GEO_ATTRIBUTION).toMatch(/CC BY/);
  });
});
