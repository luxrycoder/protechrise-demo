import { describe, expect, it } from "vitest";
import { groupIntoLines, lineLetter, weeksOf } from "@/lib/track-lines";
import type { Track } from "@/lib/track-filters";

const t = (slug: string, category: string | null): Track => ({ name: slug, slug, category, blurb: null, color: null, sortOrder: 1 });

describe("groupIntoLines", () => {
  it("groups by category in first-seen order and assigns line colours in order", () => {
    const lines = groupIntoLines([t("a", "Software"), t("b", "Data"), t("c", "Software")]);
    expect(lines.map((l) => [l.name, l.key, l.tracks.map((x) => x.slug)])).toEqual([
      ["Software", "build", ["a", "c"]],
      ["Data", "infra", ["b"]],
    ]);
  });

  it("puts uncategorised tracks on a 'More tracks' line", () => {
    expect(groupIntoLines([t("a", "X"), t("b", null)]).map((l) => l.name)).toEqual(["X", "More tracks"]);
  });

  it("never makes more than five lines", () => {
    const tracks = ["A", "B", "C", "D", "E", "F", "G"].map((c, i) => t(`t${i}`, c));
    const lines = groupIntoLines(tracks);
    expect(lines).toHaveLength(5);
    expect(lines[4]?.name).toBe("More tracks");
    expect(lines.flatMap((l) => l.tracks)).toHaveLength(7);
  });

  it("splits an uncategorised long list evenly instead of one huge line", () => {
    const lines = groupIntoLines(Array.from({ length: 10 }, (_, i) => t(`t${i}`, null)));
    expect(lines.length).toBeGreaterThan(1);
    expect(lines.flatMap((l) => l.tracks)).toHaveLength(10);
  });

  it("returns nothing for no tracks", () => {
    expect(groupIntoLines([])).toEqual([]);
  });
});

describe("weeksOf", () => {
  it("reads ranges, single weeks and en dashes", () => {
    expect(weeksOf("Weeks 1-2")).toEqual({ start: 1, end: 2 });
    expect(weeksOf("Week 6")).toEqual({ start: 6, end: 6 });
    expect(weeksOf("Weeks 10–12")).toEqual({ start: 10, end: 12 });
  });
  it("returns null for missing or odd text", () => {
    expect(weeksOf(undefined)).toBeNull();
    expect(weeksOf("Ongoing")).toBeNull();
    expect(weeksOf("Weeks 5-2")).toBeNull();
  });
});

describe("lineLetter", () => {
  it("is the first letter, upper-cased", () => {
    expect(lineLetter("data & ai")).toBe("D");
    expect(lineLetter("")).toBe("L");
  });
});
