import { describe, expect, test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CurriculumList } from "@/components/track/curriculum-list";
import { CURRICULA, curriculumFor, type Curriculum } from "@/content/curricula";

// The track slugs the API returns. A typo here would silently hide a track's section.
const TRACK_SLUGS = [
  "frontend", "backend", "cloud", "mobile", "data", "ai-prompt", "ai-auto",
  "product", "project", "virtual", "marketing", "cyber", "design",
];

const sample: readonly Curriculum[] = [
  { trackSlug: "a", modules: [{ title: "One", summary: "First." }, { title: "Two" }] },
  { trackSlug: "b", modules: [{ title: "Only" }] },
];

describe("curriculumFor", () => {
  test("finds a track's curriculum by slug", () => {
    expect(curriculumFor("a", sample)?.modules.map((m) => m.title)).toEqual(["One", "Two"]);
    expect(curriculumFor("b", sample)?.modules).toHaveLength(1);
  });

  test("returns null for a track with no entry, so the page shows no section at all", () => {
    expect(curriculumFor("missing", sample)).toBeNull();
    expect(curriculumFor("a", [])).toBeNull();
  });
});

describe("CURRICULA content", () => {
  test("each entry is a real curriculum: a unique slug, at least one module, and titled, unique modules", () => {
    expect(new Set(CURRICULA.map((c) => c.trackSlug)).size).toBe(CURRICULA.length);
    for (const c of CURRICULA) {
      expect(c.trackSlug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(c.modules.length).toBeGreaterThan(0);
      expect(new Set(c.modules.map((m) => m.title)).size).toBe(c.modules.length);
      for (const m of c.modules) {
        expect(m.title.trim()).not.toBe("");
        if (m.summary !== undefined) expect(m.summary.trim()).not.toBe("");
        if (m.duration !== undefined) expect(m.duration.trim()).not.toBe("");
        if (m.topics !== undefined) {
          expect(m.topics.length).toBeGreaterThan(0);
          expect(new Set(m.topics).size).toBe(m.topics.length);
          for (const topic of m.topics) expect(topic.trim()).not.toBe("");
        }
      }
    }
  });
});

describe("CURRICULA slugs", () => {
  test("every entry is keyed by a real track slug", () => {
    for (const c of CURRICULA) expect(TRACK_SLUGS).toContain(c.trackSlug);
  });
});

describe("CurriculumList", () => {
  test("shows a module's duration with and without a summary", () => {
    const html = renderToStaticMarkup(
      CurriculumList({ modules: [{ title: "One", summary: "First.", duration: "Weeks 1-2" }, { title: "Two", duration: "Week 3" }] }),
    );
    expect(html).toContain("Weeks 1-2");
    expect(html).toContain("Week 3");
  });

  test("lists a module's topics, and a module with only topics still expands", () => {
    const html = renderToStaticMarkup(CurriculumList({ modules: [{ title: "One", topics: ["Alpha", "Beta"] }] }));
    expect(html).toContain("<details");
    expect(html).toContain("Alpha");
    expect(html).toContain("Beta");
  });

  test("omits the duration when a module has none", () => {
    const html = renderToStaticMarkup(CurriculumList({ modules: [{ title: "Only" }] }));
    expect(html).toContain("Only");
    expect(html).not.toContain("Week");
  });
});
