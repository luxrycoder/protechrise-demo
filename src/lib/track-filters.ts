// Pure, browser-safe helpers for track data. No server-only imports, so client components can use them.

export type Track = {
  readonly name: string;
  readonly slug: string;
  readonly category: string | null;
  readonly blurb: string | null;
  /** Validated 6-digit hex without "#", or null. */
  readonly color: string | null;
  readonly sortOrder: number;
  /** The track's instructor, when the API sends one. Absent (or null) from an API that does not send it yet. */
  readonly instructor?: string | null;
  /** Editorial level set by the curriculum owner. Absent (or null) from an API that does not send it yet. */
  readonly difficulty?: Difficulty | null;
  /** People who have applied to the track. Absent (or null) from an API that does not send it yet. */
  readonly enrolleeCount?: number | null;
};

export const DIFFICULTIES = ["beginner", "intermediate", "advanced"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

/**
 * The extra facts to show on a track's card and page: its level and how many have applied. Each appears only when
 * the API supplied a real value, so an API that does not send them yet shows nothing (no placeholder, no "0 applied").
 */
export function trackStats(track: Pick<Track, "difficulty" | "enrolleeCount">): string[] {
  const stats: string[] = [];
  if (track.difficulty) stats.push(track.difficulty.charAt(0).toUpperCase() + track.difficulty.slice(1));
  if (typeof track.enrolleeCount === "number" && track.enrolleeCount > 0) {
    stats.push(`${track.enrolleeCount.toLocaleString("en-US")} applied`);
  }
  return stats;
}

export function categoriesOf(tracks: readonly Track[]): string[] {
  const seen = new Set<string>();
  for (const track of tracks) if (track.category) seen.add(track.category);
  return [...seen];
}

export function filterTracks(tracks: readonly Track[], category: string | null): readonly Track[] {
  return category === null ? tracks : tracks.filter((t) => t.category === category);
}

export function findTrack(tracks: readonly Track[], slug: string): Track | null {
  return tracks.find((t) => t.slug === slug) ?? null;
}

/** Other tracks in the same category, in catalogue order (empty when the track has no category or peers). */
export function relatedTracks(tracks: readonly Track[], slug: string, limit: number): readonly Track[] {
  const current = findTrack(tracks, slug);
  if (!current?.category) return [];
  return tracks.filter((t) => t.slug !== slug && t.category === current.category).slice(0, limit);
}

export function trackAccent(color: string | null): string {
  return color ? `#${color}` : "var(--color-primary)";
}

/** "Adebayo O." -> "AO". Used for avatars so no third-party photos are needed. */
export function initialsOf(name: string): string {
  const letters = name
    .split(/\s+/)
    .map((part) => part.replace(/[^\p{L}]/gu, "").charAt(0))
    .filter(Boolean)
    .slice(0, 2)
    .join("");
  return letters.toUpperCase() || "?";
}
