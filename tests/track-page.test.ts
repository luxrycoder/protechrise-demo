import { describe, expect, test } from "vitest";
import { courseJsonLd } from "@/lib/json-ld";
import { findTrack, relatedTracks, type Track } from "@/lib/track-filters";

const track = (slug: string, category: string | null, sortOrder: number, blurb: string | null = "About."): Track => ({
  name: slug.toUpperCase(),
  slug,
  category,
  blurb,
  color: null,
  sortOrder,
});

const tracks: readonly Track[] = [
  track("frontend", "Engineering", 10),
  track("backend", "Engineering", 20),
  track("cloud", "Engineering", 30),
  track("mobile", "Engineering", 40),
  track("data", "Data & AI", 50),
  track("loose", null, 60),
];

describe("findTrack", () => {
  test("finds a track by its exact slug", () => {
    expect(findTrack(tracks, "cloud")?.name).toBe("CLOUD");
  });

  test("returns null for an unknown or differently-cased slug", () => {
    expect(findTrack(tracks, "nope")).toBeNull();
    expect(findTrack(tracks, "Cloud")).toBeNull();
  });
});

describe("relatedTracks", () => {
  test("returns other tracks from the same category in order, never the track itself", () => {
    expect(relatedTracks(tracks, "frontend", 5).map((t) => t.slug)).toEqual(["backend", "cloud", "mobile"]);
  });

  test("respects the limit", () => {
    expect(relatedTracks(tracks, "frontend", 2).map((t) => t.slug)).toEqual(["backend", "cloud"]);
  });

  test("is empty when the track is alone in its category, has none, or does not exist", () => {
    expect(relatedTracks(tracks, "data", 3)).toEqual([]);
    expect(relatedTracks(tracks, "loose", 3)).toEqual([]);
    expect(relatedTracks(tracks, "nope", 3)).toEqual([]);
  });
});

describe("courseJsonLd", () => {
  test("describes an online three-month Course from the provider", () => {
    const ld = courseJsonLd(tracks[0] as Track, "ProTech Rise Academy");
    expect(ld).toMatchObject({
      "@type": "Course",
      name: "FRONTEND",
      description: "About.",
      courseMode: "Online",
      timeRequired: "P3M",
      provider: { "@type": "Organization", name: "ProTech Rise Academy" },
    });
  });

  test("omits the description when the track has no blurb", () => {
    expect("description" in courseJsonLd(track("x", null, 1, null), "P")).toBe(false);
  });
});
