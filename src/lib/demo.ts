import type { Testimonial } from "@/content/types";

/**
 * Demo content (made-up tutors and reviews) is shown only on non-production sites, where `DEV_NOINDEX` is on
 * (see `noindex` in lib/env.ts). When the site is promoted to production (`DEV_NOINDEX=false`) it switches off by
 * itself, so invented people and ratings can never reach real applicants. Never add demo content to structured data.
 */
export function demoContentEnabled(noindex: boolean): boolean {
  return noindex;
}

export type Review = {
  readonly quote: string;
  readonly name: string;
  readonly role: string;
  /** True for made-up reviews: shown with a "Demo" badge and a 5-star mark. Real reviews never carry stars. */
  readonly demo: boolean;
  readonly source?: Testimonial["source"];
};

/** Which track a real testimonial belongs to, from its first tag (its subject). */
const TAG_TO_SLUG: Readonly<Record<string, string>> = {
  Frontend: "frontend",
  "Data Analytics": "data",
  "Data Analysis": "data",
  "Digital Marketing": "marketing",
  "AI Automation": "ai-auto",
};

export const MIN_REVIEWS = 2;
export const MAX_REVIEWS = 3;

/**
 * Reviews for a track: its real testimonials first (up to MAX_REVIEWS), topped up with demo reviews to MIN_REVIEWS
 * only when demo content is enabled. With demo off, a track with no real reviews gets none.
 */
export function reviewsFor(
  slug: string,
  real: readonly Testimonial[],
  demo: ReadonlyArray<{ readonly trackSlug: string; readonly quote: string; readonly name: string; readonly role: string }>,
  demoEnabled: boolean,
): readonly Review[] {
  const own: Review[] = real
    .filter((t) => TAG_TO_SLUG[t.tags[0] ?? ""] === slug)
    .slice(0, MAX_REVIEWS)
    .map((t) => ({ quote: t.quote, name: t.name, role: t.role, demo: false, source: t.source }));
  if (!demoEnabled || own.length >= MIN_REVIEWS) return own;
  const filler: Review[] = demo
    .filter((d) => d.trackSlug === slug)
    .slice(0, MIN_REVIEWS - own.length)
    .map((d) => ({ quote: d.quote, name: d.name, role: d.role, demo: true }));
  return [...own, ...filler];
}
