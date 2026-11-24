// Pure helpers for the home page's "network map": tracks are grouped into at most five coloured lines, and a module's
// free-text duration ("Weeks 1-2") is turned into a start and end week. No React or server imports, so tests run them directly.
import type { Track } from "@/lib/track-filters";

/** The line colours, in order. Each maps to a --line-* pair in globals.css. */
export const LINE_KEYS = ["build", "infra", "data", "product", "biz"] as const;
export type LineKey = (typeof LINE_KEYS)[number];

export type TrackLine = {
  readonly key: LineKey;
  readonly name: string;
  readonly tracks: readonly Track[];
};

const MAX_LINES = 5;

/**
 * Group tracks into lines by their category, in the order categories first appear. A track with no category joins a
 * "More tracks" line. If the API sends no usable categories at all, the list is split evenly instead, so the map never
 * collapses into one very long line.
 */
export function groupIntoLines(tracks: readonly Track[]): readonly TrackLine[] {
  if (tracks.length === 0) return [];
  const byName = new Map<string, Track[]>();
  for (const track of tracks) {
    const name = track.category ?? "More tracks";
    byName.set(name, [...(byName.get(name) ?? []), track]);
  }
  let groups = [...byName.entries()];
  if (groups.length === 1 && tracks.length > 4) {
    const lineCount = Math.min(MAX_LINES, Math.ceil(tracks.length / 3));
    const size = Math.ceil(tracks.length / lineCount);
    groups = Array.from({ length: lineCount }, (_, i) => [`Line ${i + 1}`, tracks.slice(i * size, (i + 1) * size)] as [string, Track[]]);
  }
  if (groups.length > MAX_LINES) {
    const head = groups.slice(0, MAX_LINES - 1);
    const tail = groups.slice(MAX_LINES - 1).flatMap(([, list]) => list);
    groups = [...head, ["More tracks", tail]];
  }
  return groups.map(([name, list], i) => ({ key: LINE_KEYS[i % LINE_KEYS.length] as LineKey, name, tracks: list }));
}

/** "Weeks 1-2" -> {start: 1, end: 2}; "Week 6" -> {start: 6, end: 6}; anything else -> null. */
export function weeksOf(duration: string | undefined): { readonly start: number; readonly end: number } | null {
  if (!duration) return null;
  const match = /(\d+)(?:\s*[-–]\s*(\d+))?/.exec(duration);
  if (!match) return null;
  const start = Number(match[1]);
  const end = match[2] ? Number(match[2]) : start;
  if (start < 1 || end < start) return null;
  return { start, end };
}

/** One letter for a line's badge. */
export function lineLetter(name: string): string {
  return (name.trim().charAt(0) || "L").toUpperCase();
}
