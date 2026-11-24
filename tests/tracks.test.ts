import { describe, expect, test } from "vitest";
import {
  categoriesOf,
  filterTracks,
  getTracks,
  initialsOf,
  loadTracks,
  parseTracksResponse,
  trackAccent,
  trackStats,
  type Track,
} from "@/lib/tracks";

const payload = {
  ok: true,
  cohort: "cohort-1",
  tracks: [
    { name: "Backend", slug: "backend", category: "Engineering", blurb: "APIs.", color: "7C3AED", sortOrder: 20 },
    { name: "Frontend", slug: "frontend", category: "Engineering", blurb: "Sites.", color: "2563EB", sortOrder: 10 },
    { name: "Data", slug: "data", category: "Data & AI", blurb: "Analyse.", color: "059669", sortOrder: 50 },
    { name: "Loose", slug: "loose", category: null, blurb: null, color: "nothex", sortOrder: 60 },
  ],
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

describe("parseTracksResponse", () => {
  test("returns the tracks sorted by sortOrder and marks applications open when a cohort is returned", () => {
    const parsed = parseTracksResponse(payload);
    expect(parsed?.isOpen).toBe(true);
    expect(parsed?.tracks.map((t) => t.slug)).toEqual(["frontend", "backend", "data", "loose"]);
  });

  test("reports which application flow the open cohort uses; an API that does not say yet means the award flow", () => {
    expect(parseTracksResponse({ ...payload, payAtApply: true })?.payAtApply).toBe(true);
    expect(parseTracksResponse({ ...payload, payAtApply: false })?.payAtApply).toBe(false);
    expect(parseTracksResponse(payload)?.payAtApply).toBe(false);
    expect(parseTracksResponse({ ...payload, payAtApply: "yes" })?.payAtApply).toBe(false);
  });

  test("a null cohort means no cohort is taking applications", () => {
    expect(parseTracksResponse({ ok: true, cohort: null, tracks: [] })).toEqual({ isOpen: false, payAtApply: false, tracks: [] });
  });

  test("keeps tracks with missing category or blurb, and drops an invalid colour instead of trusting it", () => {
    const loose = parseTracksResponse(payload)?.tracks.find((t) => t.slug === "loose");
    expect(loose).toMatchObject({ category: null, blurb: null, color: null });
  });

  test("rejects payloads that are not the expected shape", () => {
    expect(parseTracksResponse(null)).toBeNull();
    expect(parseTracksResponse({ ok: false })).toBeNull();
    expect(parseTracksResponse({ ok: true, cohort: "c", tracks: "nope" })).toBeNull();
    expect(parseTracksResponse({ ok: true, cohort: "c", tracks: [{ name: "x" }] })).toBeNull();
  });
});

describe("track stats from the API (difficulty and enrolleeCount)", () => {
  const one = (extra: Record<string, unknown>) =>
    parseTracksResponse({ ok: true, cohort: "c", tracks: [{ name: "A", slug: "a", sortOrder: 1, ...extra }] })?.tracks[0];

  test("are read when the API sends them", () => {
    expect(one({ difficulty: "beginner", enrolleeCount: 1240 })).toMatchObject({ difficulty: "beginner", enrolleeCount: 1240 });
  });

  test("are null when an API that does not send them yet omits them, so nothing is shown", () => {
    expect(one({})).toMatchObject({ difficulty: null, enrolleeCount: null });
    expect(one({ difficulty: null, enrolleeCount: null })).toMatchObject({ difficulty: null, enrolleeCount: null });
  });

  test("each odd value falls back to null on its own, without dropping the track or the other value", () => {
    expect(one({ difficulty: "expert", enrolleeCount: 12 })).toMatchObject({ difficulty: null, enrolleeCount: 12 });
    expect(one({ difficulty: "advanced", enrolleeCount: -3 })).toMatchObject({ difficulty: "advanced", enrolleeCount: null });
    expect(one({ difficulty: "advanced", enrolleeCount: "many" })).toMatchObject({ difficulty: "advanced", enrolleeCount: null });
    expect(one({ enrolleeCount: 1.5 })).toMatchObject({ enrolleeCount: null });
  });
});

describe("trackStats", () => {
  test("shows the level and the enrolment, each only when present", () => {
    expect(trackStats({ difficulty: "intermediate", enrolleeCount: 1240 })).toEqual(["Intermediate", "1,240 applied"]);
    expect(trackStats({ difficulty: "beginner", enrolleeCount: null })).toEqual(["Beginner"]);
    expect(trackStats({ difficulty: null, enrolleeCount: 7 })).toEqual(["7 applied"]);
  });

  test("shows nothing, no placeholder, when the API sent neither, or no one has applied yet", () => {
    expect(trackStats({})).toEqual([]);
    expect(trackStats({ difficulty: null, enrolleeCount: null })).toEqual([]);
    expect(trackStats({ difficulty: null, enrolleeCount: 0 })).toEqual([]);
  });
});

describe("categoriesOf and filterTracks", () => {
  const tracks = parseTracksResponse(payload)?.tracks as readonly Track[];

  test("lists each category once, in track order, ignoring tracks without one", () => {
    expect(categoriesOf(tracks)).toEqual(["Engineering", "Data & AI"]);
  });

  test("filters by category, returns everything for null, and nothing for an unknown category", () => {
    expect(filterTracks(tracks, null)).toHaveLength(4);
    expect(filterTracks(tracks, "Engineering").map((t) => t.slug)).toEqual(["frontend", "backend"]);
    expect(filterTracks(tracks, "Nope")).toEqual([]);
  });
});

describe("initialsOf", () => {
  test("takes the first letter of up to two name parts", () => {
    expect(initialsOf("Adebayo O.")).toBe("AO");
    expect(initialsOf("Folake")).toBe("F");
    expect(initialsOf("ada lovelace byron")).toBe("AL");
  });

  test("falls back to a question mark for names with no letters", () => {
    expect(initialsOf("")).toBe("?");
    expect(initialsOf("1 2")).toBe("?");
  });
});

describe("trackAccent", () => {
  test("returns a CSS colour for valid hex and the brand colour otherwise", () => {
    expect(trackAccent("2563EB")).toBe("#2563EB");
    expect(trackAccent(null)).toBe("var(--color-primary)");
  });
});

describe("getTracks / loadTracks", () => {
  test("fetches /api/tracks and returns parsed data", async () => {
    let url = "";
    const result = await getTracks("https://api.test", async (u) => {
      url = u;
      return jsonResponse(payload);
    });
    expect(url).toBe("https://api.test/api/tracks");
    expect(result?.tracks).toHaveLength(4);
  });

  test("returns null when the API fails or returns junk", async () => {
    expect(await getTracks("https://api.test", async () => jsonResponse({}, 500))).toBeNull();
    expect(await getTracks("https://api.test", async () => jsonResponse({ ok: true, tracks: 1 }))).toBeNull();
    expect(
      await getTracks("https://api.test", async () => {
        throw new Error("down");
      }),
    ).toBeNull();
  });

  test("loadTracks returns null instead of throwing when API_ORIGIN is not configured", async () => {
    const saved = process.env.API_ORIGIN;
    delete process.env.API_ORIGIN;
    try {
      expect(await loadTracks()).toBeNull();
    } finally {
      if (saved !== undefined) process.env.API_ORIGIN = saved;
    }
  });
});
