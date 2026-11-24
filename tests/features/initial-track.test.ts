import { describe, expect, test } from "vitest";
import fixture from "../fixtures/api/tracks.json";
import { emptyValues } from "@/features/application/fields";
import { initialState } from "@/features/application/form-state";
import { initialTrackName } from "@/features/application/initial-track";
import { validateField } from "@/features/application/validation";
import { parseTracksResponse } from "@/lib/tracks";

const TRACKS = parseTracksResponse(fixture.body)?.tracks ?? [];

describe("initialTrackName", () => {
  test("turns a real slug into the track name the form stores", () => {
    expect(initialTrackName("cyber", TRACKS)).toBe("Cybersecurity");
    expect(initialTrackName("ai-prompt", TRACKS)).toBe("AI Prompt Engineering");
  });

  test("every live track's slug resolves to its own name", () => {
    for (const t of TRACKS) expect(initialTrackName(t.slug, TRACKS)).toBe(t.name);
  });

  test("ignores a missing, empty, unknown or repeated slug", () => {
    expect(initialTrackName(undefined, TRACKS)).toBe("");
    expect(initialTrackName("", TRACKS)).toBe("");
    expect(initialTrackName("astrology", TRACKS)).toBe("");
    expect(initialTrackName(["cyber", "data"], TRACKS)).toBe("");
    expect(initialTrackName("Cybersecurity", TRACKS)).toBe("");
  });

  test("ignores a slug the live list does not have, and an empty list", () => {
    expect(initialTrackName("cyber", TRACKS.filter((t) => t.slug !== "cyber"))).toBe("");
    expect(initialTrackName("cyber", [])).toBe("");
  });
});

describe("a form started on a linked track", () => {
  test("starts with the track selected and valid, in both flows", () => {
    for (const flow of ["award", "payAtApply"] as const) {
      const state = initialState({ ...emptyValues(), preferredTrack: initialTrackName("data", TRACKS) }, flow);
      expect(state.values.preferredTrack).toBe("Data Analytics");
      expect(validateField("preferredTrack", state.values)).toBe("");
    }
  });
});
