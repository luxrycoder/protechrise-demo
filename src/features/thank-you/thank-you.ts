import type { Track } from "@/lib/track-filters";

/** The legacy share copy and target, kept verbatim so shared links read the same as before. */
export const SHARE_URL = "https://protechrise.com/scholarship";
export const SHARE_MESSAGE =
  "I just applied for a scholarship at ProTech Rise Academy — Africa's scholarship-first tech academy. Over 90% funded, 13 career tracks.";

export type ShareLink = { readonly label: string; readonly href: string };

const withQuery = (base: string, params: Record<string, string>): string => {
  const url = new URL(base);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return url.toString();
};

export function shareLinks(): readonly ShareLink[] {
  return [
    { label: "WhatsApp", href: withQuery("https://wa.me/", { text: `${SHARE_MESSAGE} ${SHARE_URL}` }) },
    { label: "X", href: withQuery("https://twitter.com/intent/tweet", { text: SHARE_MESSAGE, url: SHARE_URL }) },
    { label: "Facebook", href: withQuery("https://www.facebook.com/sharer/sharer.php", { u: SHARE_URL }) },
    { label: "LinkedIn", href: withQuery("https://www.linkedin.com/sharing/share-offsite/", { url: SHARE_URL }) },
  ];
}

/**
 * The track name to mention on the page, or null. The query string is attacker-controllable, so the name is only
 * used when it matches a real track exactly; anything else would let a crafted link put arbitrary words on our page.
 */
export function resolveTrackName(raw: string | readonly string[] | undefined, tracks: readonly Track[] | null): string | null {
  if (typeof raw !== "string" || tracks === null) return null;
  const wanted = raw.trim();
  return tracks.find((t) => t.name === wanted)?.name ?? null;
}
