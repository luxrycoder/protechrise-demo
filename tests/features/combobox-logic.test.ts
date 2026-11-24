import { describe, expect, test } from "vitest";
import { filterOptions, moveActive, normalizeForSearch } from "@/features/application/combobox-logic";

const options = [
  { key: "a", label: "Nigeria" },
  { key: "b", label: "Niger" },
  { key: "c", label: "Côte d'Ivoire" },
  { key: "d", label: "South Africa" },
  { key: "e", label: "Ghana" },
];

describe("normalizeForSearch", () => {
  test("lower-cases, strips accents and trims", () => {
    expect(normalizeForSearch("  Côte d'Ivoire ")).toBe("cote d'ivoire");
    expect(normalizeForSearch("Åland")).toBe("aland");
  });
});

describe("filterOptions", () => {
  test("an empty query returns everything, in order", () => {
    expect(filterOptions(options, "").map((o) => o.key)).toEqual(["a", "b", "c", "d", "e"]);
    expect(filterOptions(options, "   ").map((o) => o.key)).toEqual(["a", "b", "c", "d", "e"]);
  });

  test("matches anywhere in the label, ignoring case and accents", () => {
    expect(filterOptions(options, "AFRICA").map((o) => o.label)).toEqual(["South Africa"]);
    expect(filterOptions(options, "cote").map((o) => o.label)).toEqual(["Côte d'Ivoire"]);
  });

  test("lists labels that start with the query before labels that merely contain it", () => {
    const list = [
      { key: "1", label: "Guinea-Bissau" },
      { key: "2", label: "Papua New Guinea" },
      { key: "3", label: "Guinea" },
    ];
    expect(filterOptions(list, "guinea").map((o) => o.key)).toEqual(["1", "3", "2"]);
  });

  test("returns nothing when nothing matches", () => {
    expect(filterOptions(options, "zzz")).toEqual([]);
  });

  test("works on calling-code labels", () => {
    const codes = [
      { key: "ng", label: "+234 Nigeria" },
      { key: "gh", label: "+233 Ghana" },
    ];
    expect(filterOptions(codes, "+233").map((o) => o.key)).toEqual(["gh"]);
    expect(filterOptions(codes, "nig").map((o) => o.key)).toEqual(["ng"]);
  });
});

describe("moveActive", () => {
  test("steps down and up, wrapping at both ends", () => {
    expect(moveActive(0, 1, 5)).toBe(1);
    expect(moveActive(4, 1, 5)).toBe(0);
    expect(moveActive(0, -1, 5)).toBe(4);
  });

  test("with nothing active, down goes to the first and up to the last", () => {
    expect(moveActive(-1, 1, 5)).toBe(0);
    expect(moveActive(-1, -1, 5)).toBe(4);
  });

  test("an empty list has no active option", () => {
    expect(moveActive(-1, 1, 0)).toBe(-1);
  });
});
