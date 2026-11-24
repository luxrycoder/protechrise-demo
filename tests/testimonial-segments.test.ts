import { describe, expect, test } from "vitest";
import { TESTIMONIALS } from "@/content/testimonials";
import type { Testimonial } from "@/content/types";
import { PLATFORM_LABELS, fillRow, segmentsOf, type Platform } from "@/lib/testimonial-segments";

const base = { quote: "q", role: "r", tags: [] as string[] };
const t = (name: string, platform?: Platform): Testimonial => ({
  ...base,
  name,
  ...(platform ? { source: { platform, url: `https://example.com/${name}` } } : {}),
});

describe("segmentsOf", () => {
  test("groups by platform in a fixed order, with unlinked stories last", () => {
    const segments = segmentsOf([t("a"), t("b", "tiktok"), t("c", "linkedin"), t("d", "linkedin"), t("e", "x")]);
    expect(segments.map((s) => [s.key, s.items.length])).toEqual([
      ["all", 5],
      ["linkedin", 2],
      ["x", 1],
      ["tiktok", 1],
      ["stories", 1],
    ]);
  });

  test("places Instagram and Facebook between X and TikTok", () => {
    const keys = segmentsOf([t("a", "tiktok"), t("b", "facebook"), t("c", "instagram"), t("d", "x"), t("e", "linkedin")]).map(
      (s) => s.key,
    );
    expect(keys).toEqual(["all", "linkedin", "x", "instagram", "facebook", "tiktok"]);
  });

  test("every platform has a non-empty label", () => {
    for (const label of Object.values(PLATFORM_LABELS)) expect(label.trim()).not.toBe("");
    expect(Object.keys(PLATFORM_LABELS).sort()).toEqual(["facebook", "instagram", "linkedin", "tiktok", "x"]);
  });

  test("omits platforms with no posts", () => {
    const keys = segmentsOf([t("a", "linkedin"), t("b")]).map((s) => s.key);
    expect(keys).toEqual(["all", "linkedin", "stories"]);
  });

  test("returns only 'all' when there is nothing to segment", () => {
    expect(segmentsOf([t("a"), t("b")]).map((s) => s.key)).toEqual(["all"]);
    expect(segmentsOf([t("a", "x")]).map((s) => s.key)).toEqual(["all"]);
    expect(segmentsOf([]).map((s) => s.key)).toEqual(["all"]);
  });

  test("every testimonial lands in exactly one non-'all' segment", () => {
    const [all, ...groups] = segmentsOf(TESTIMONIALS);
    expect(all.items).toHaveLength(TESTIMONIALS.length);
    expect(groups.reduce((n, g) => n + g.items.length, 0)).toBe(TESTIMONIALS.length);
  });
});

describe("fillRow", () => {
  test("repeats a short segment until the set is full, real cards first and repeats marked", () => {
    const row = fillRow([t("a", "x"), t("b", "x"), t("c", "x")], 6);
    expect(row.map((c) => `${c.item.name}${c.copy}`)).toEqual(["a0", "b0", "c0", "a1", "b1", "c1"]);
  });

  test("leaves a segment that already fills the set alone, and never returns less than one copy", () => {
    expect(fillRow([t("a"), t("b"), t("c")], 2).every((c) => c.copy === 0)).toBe(true);
    expect(fillRow([t("a"), t("b")], 1)).toHaveLength(2);
    expect(fillRow([], 6)).toEqual([]);
  });

  test("always keeps exactly one real copy of each story", () => {
    const row = fillRow(TESTIMONIALS.slice(0, 3), 6);
    expect(row.filter((c) => c.copy === 0)).toHaveLength(3);
  });
});
