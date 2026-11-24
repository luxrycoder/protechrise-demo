// Presentation art for the track cards. The API does not send images, so each track gets one of these abstract
// photos (no faces) by its position in the list. The files are served from this site (public/images/tracks), not
// hot-linked, because the Content Security Policy only allows images from 'self'. They came from Pexels (free to
// use and host, no attribution required). Replace with real track art when it exists.
export const TRACK_ART: readonly string[] = Array.from({ length: 13 }, (_, i) => `/images/tracks/art-${String(i + 1).padStart(2, "0")}.jpg`);

export function trackArt(position: number): string {
  return TRACK_ART[position % TRACK_ART.length] as string;
}
