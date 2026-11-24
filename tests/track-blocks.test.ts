import { describe, expect, test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CURRICULA } from "@/content/curricula";
import { FeatureList } from "@/components/track/feature-list";
import { PitchBlock } from "@/components/track/pitch-block";
import { pitchFor, TRACK_PITCHES } from "@/content/track-pitches";
import { QuickFacts } from "@/components/track/quick-facts";

describe("QuickFacts", () => {
  test("shows each fact's label and value", () => {
    const html = renderToStaticMarkup(QuickFacts({ facts: [{ label: "Level", value: "Beginner" }, { label: "Format", value: "Live" }] }));
    expect(html).toContain("Level");
    expect(html).toContain("Beginner");
    expect(html).toContain("Format");
  });

  test("renders nothing when there are no facts", () => {
    expect(QuickFacts({ facts: [] })).toBeNull();
  });
});

describe("FeatureList", () => {
  test("lists every feature", () => {
    const html = renderToStaticMarkup(FeatureList({ features: ["One", "Two"] }));
    expect(html).toContain("One");
    expect(html).toContain("Two");
  });

  test("renders nothing when there are no features", () => {
    expect(FeatureList({ features: [] })).toBeNull();
  });
});

describe("track pitches", () => {
  test("each pitch has a unique slug and non-blank text", () => {
    expect(new Set(TRACK_PITCHES.map((p) => p.trackSlug)).size).toBe(TRACK_PITCHES.length);
    for (const p of TRACK_PITCHES) {
      expect(p.learn.trim()).not.toBe("");
      expect(p.who.trim()).not.toBe("");
    }
  });

  test("every track with a curriculum also has a pitch", () => {
    for (const c of CURRICULA) expect(pitchFor(c.trackSlug)).not.toBeNull();
  });

  test("a pitch makes no job or salary promise", () => {
    for (const p of TRACK_PITCHES) expect(`${p.learn} ${p.who}`).not.toMatch(/\b(hired|salary|guarantee|job-ready)\b/i);
  });

  test("the block shows both parts, and nothing without a pitch", () => {
    const html = renderToStaticMarkup(PitchBlock({ pitch: { trackSlug: "x", learn: "Learn A.", who: "For B." } }));
    expect(html).toContain("Learn A.");
    expect(html).toContain("For B.");
    expect(PitchBlock({ pitch: null })).toBeNull();
  });
});
