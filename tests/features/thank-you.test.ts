import { describe, expect, test } from "vitest";
import { SHARE_MESSAGE, SHARE_URL, resolveTrackName, shareLinks } from "@/features/thank-you/thank-you";
import type { Track } from "@/lib/track-filters";

const track = (name: string, slug: string): Track => ({ name, slug, category: null, blurb: null, color: null, sortOrder: 1 });
const TRACKS = [track("Frontend Development", "frontend"), track("Data Analytics", "data-analytics")];

describe("resolveTrackName", () => {
  test("returns the catalogue name for an exact match", () => {
    expect(resolveTrackName("Data Analytics", TRACKS)).toBe("Data Analytics");
  });

  test("ignores surrounding whitespace", () => {
    expect(resolveTrackName("  Frontend Development ", TRACKS)).toBe("Frontend Development");
  });

  test("returns null for text that is not a real track, so a crafted link cannot put words on the page", () => {
    expect(resolveTrackName("Send your password to evil.example", TRACKS)).toBeNull();
  });

  test("returns null when the parameter is missing, repeated or empty", () => {
    expect(resolveTrackName(undefined, TRACKS)).toBeNull();
    expect(resolveTrackName(["Data Analytics", "x"], TRACKS)).toBeNull();
    expect(resolveTrackName("", TRACKS)).toBeNull();
  });

  test("returns null when the track list could not be loaded", () => {
    expect(resolveTrackName("Data Analytics", null)).toBeNull();
  });
});

describe("shareLinks", () => {
  const links = shareLinks();
  const urlOf = (label: string): URL => {
    const link = links.find((l) => l.label === label);
    if (!link) throw new Error(`no ${label} link`);
    return new URL(link.href);
  };

  test("offers WhatsApp, X, Facebook and LinkedIn", () => {
    expect(links.map((l) => l.label)).toEqual(["WhatsApp", "X", "Facebook", "LinkedIn"]);
  });

  test("shares the legacy message and the scholarship URL", () => {
    expect(urlOf("WhatsApp").searchParams.get("text")).toBe(`${SHARE_MESSAGE} ${SHARE_URL}`);
    expect(urlOf("X").searchParams.get("text")).toBe(SHARE_MESSAGE);
    expect(urlOf("X").searchParams.get("url")).toBe(SHARE_URL);
    expect(urlOf("Facebook").searchParams.get("u")).toBe(SHARE_URL);
    expect(urlOf("LinkedIn").searchParams.get("url")).toBe(SHARE_URL);
  });

  test("shares the public scholarship URL, never a dev host", () => {
    expect(SHARE_URL).toBe("https://protechrise.com/scholarship");
  });
});
