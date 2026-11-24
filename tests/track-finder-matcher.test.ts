import { describe, expect, test } from "vitest";
import { INTEREST_TRACKS, answersQuery, matchTracks, parseAnswers, resultsNote } from "@/features/track-finder/matcher";
import { QUESTIONS } from "@/features/track-finder/questions";
import type { Track } from "@/lib/track-filters";

import fixture from "./fixtures/api/tracks.json";
import { parseTracksResponse } from "@/lib/tracks";

const track = (slug: string, category: string | null = "Engineering"): Track => ({
  name: slug,
  slug,
  category,
  blurb: null,
  color: null,
  sortOrder: 1,
});

// The 13 real tracks, as recorded from the API (categories included).
const TRACKS: readonly Track[] = parseTracksResponse(fixture.body)?.tracks ?? [];

const interest = (value: string) => [{ questionId: "interest", value }];
const slugs = (tracks: readonly Track[]) => tracks.map((t) => t.slug);

describe("matchTracks against the real tracks", () => {
  test("the fixture holds all 13 tracks", () => {
    expect(TRACKS).toHaveLength(13);
  });

  test.each([
    ["products", ["product", "project"]],
    ["code", ["frontend", "backend", "cloud", "mobile"]],
    ["data", ["data"]],
    ["ai", ["ai-prompt", "ai-auto"]],
    ["design", ["design"]],
    ["security", ["cyber"]],
    ["marketing", ["marketing"]],
    ["admin", ["project", "virtual"]],
  ])("%s returns %j", (value, expected) => {
    const result = matchTracks(interest(value), TRACKS);
    expect(result.narrowed).toBe(true);
    expect(slugs(result.tracks).sort()).toEqual([...expected].sort());
  });

  test("every real track is reachable from at least one interest", () => {
    const reached = new Set(Object.keys(INTEREST_TRACKS).flatMap((v) => slugs(matchTracks(interest(v), TRACKS).tracks)));
    expect([...reached].sort()).toEqual(slugs(TRACKS).sort());
  });

  test("results keep the catalogue order", () => {
    expect(slugs(matchTracks(interest("code"), TRACKS).tracks)).toEqual(["frontend", "backend", "cloud", "mobile"]);
  });
});

describe("matchTracks fallbacks", () => {
  test("ignores slugs the live list no longer has, and narrows to the rest", () => {
    const live = [track("frontend"), track("backend")];
    expect(slugs(matchTracks(interest("code"), live).tracks)).toEqual(["frontend", "backend"]);
  });

  test("falls back to the whole list when none of the mapped tracks exist", () => {
    const live = [track("frontend"), track("backend")];
    expect(matchTracks(interest("security"), live)).toEqual({ tracks: live, narrowed: false });
  });

  test("falls back to the whole list for a missing or unknown interest answer", () => {
    expect(matchTracks([], TRACKS)).toEqual({ tracks: TRACKS, narrowed: false });
    expect(matchTracks(interest("astrology"), TRACKS)).toEqual({ tracks: TRACKS, narrowed: false });
  });

  test("an empty live list stays empty", () => {
    expect(matchTracks(interest("code"), [])).toEqual({ tracks: [], narrowed: false });
  });

  test("never returns a track that is not in the input list", () => {
    const subset = TRACKS.slice(2, 6);
    for (const value of Object.keys(INTEREST_TRACKS)) {
      for (const t of matchTracks(interest(value), subset).tracks) expect(subset).toContain(t);
    }
  });

  test("every interest option in the quiz has mapped tracks, so none is a dead end", () => {
    const interestQuestion = QUESTIONS.find((q) => q.id === "interest");
    for (const option of interestQuestion?.options ?? []) {
      if (option.value === "unsure") continue; // deliberately shows every track
      expect(INTEREST_TRACKS[option.value]?.length).toBeGreaterThan(0);
    }
  });
});

describe("resultsNote", () => {
  const note = (...pairs: [string, string][]) => resultsNote(pairs.map(([questionId, value]) => ({ questionId, value })));

  test("with no answers it states only the 3-month evening format", () => {
    expect(note()).toBe("Every track runs 3 months, live in the evenings (6PM/7:30PM WAT).");
  });

  test("tells beginners what the FAQ says: no experience, but a computer, a device and internet", () => {
    for (const value of ["none", "some"]) {
      expect(note(["experience", value])).toContain("No experience needed");
      expect(note(["experience", value])).toContain("basic computer literacy, a device and internet access");
    }
    expect(note(["experience", "lots"])).not.toContain("No experience needed");
  });

  test("mentions recordings only when evenings are hard", () => {
    expect(note(["evenings", "no"])).toContain("Sessions are recorded too.");
    expect(note(["evenings", "yes"])).not.toContain("recorded");
  });

  test("never claims daytime classes or free days", () => {
    for (const q of QUESTIONS) for (const o of q.options) expect(note([q.id, o.value])).not.toMatch(/days|full-time|self-paced/i);
  });
});

describe("quiz questions", () => {
  test("ask no question about daytime study, which the site does not offer", () => {
    expect(QUESTIONS.map((q) => q.id)).toEqual(["experience", "interest", "evenings"]);
  });
});

describe("answers in the URL", () => {
  const full = { experience: "none", interest: "ai", evenings: "no" };

  test("a full, valid set round-trips", () => {
    const answers = parseAnswers(full);
    expect(answers).toHaveLength(3);
    expect(Object.fromEntries(new URLSearchParams(answersQuery(answers)))).toEqual(full);
  });

  test("a missing, unknown or repeated value gives no answers, never a partial result", () => {
    expect(parseAnswers({})).toEqual([]);
    expect(parseAnswers({ ...full, interest: "astrology" })).toEqual([]);
    expect(parseAnswers({ ...full, evenings: undefined })).toEqual([]);
    expect(parseAnswers({ ...full, interest: ["ai", "code"] })).toEqual([]);
  });

  test("'not sure yet' is a valid answer and shows every track", () => {
    expect(parseAnswers({ ...full, interest: "unsure" })).toHaveLength(3);
    expect(matchTracks(interest("unsure"), TRACKS)).toEqual({ tracks: TRACKS, narrowed: false });
  });
});
