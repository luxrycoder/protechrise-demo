import { findTrack, type Track } from "@/lib/track-filters";

/**
 * The preferred-track value to start the form with, from the `?track=<slug>` link the quiz and track pages send.
 * The form stores the track's name, so the slug is looked up in the live list and only a real track is used.
 * A missing, repeated or unknown slug gives "" (the dropdown stays on "Select a track").
 */
export function initialTrackName(slug: string | readonly string[] | undefined, tracks: readonly Track[]): string {
  if (typeof slug !== "string" || slug === "") return "";
  return findTrack(tracks, slug)?.name ?? "";
}
