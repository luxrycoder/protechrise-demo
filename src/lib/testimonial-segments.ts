// Pure, browser-safe helpers for grouping testimonials by where the original post lives.
import type { Testimonial } from "@/content/types";

export type Platform = NonNullable<Testimonial["source"]>["platform"];

export const PLATFORM_LABELS: Record<Platform, string> = {
  x: "X",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
  instagram: "Instagram",
  facebook: "Facebook",
};

/** Display order of the social segments. */
const PLATFORM_ORDER: readonly Platform[] = ["linkedin", "x", "instagram", "facebook", "tiktok"];

export const ALL_SEGMENT = "all";
export const STORIES_SEGMENT = "stories";

export type Segment = {
  /** "all", "stories" (no linked post) or a platform. */
  readonly key: string;
  readonly label: string;
  /** Set on the social segments only. */
  readonly platform?: Platform;
  readonly items: readonly Testimonial[];
};

/**
 * "All", then one segment per social platform that actually has a linked post, then the testimonials
 * with no linked post. Segments with nothing in them are never returned; with fewer than two
 * distinct groups there is nothing to segment, so only the "all" entry comes back.
 */
export function segmentsOf(testimonials: readonly Testimonial[]): readonly [Segment, ...Segment[]] {
  const all: Segment = { key: ALL_SEGMENT, label: "All stories", items: testimonials };
  const groups: Segment[] = [];

  for (const platform of PLATFORM_ORDER) {
    const items = testimonials.filter((t) => t.source?.platform === platform);
    if (items.length > 0) groups.push({ key: platform, label: PLATFORM_LABELS[platform], platform, items });
  }
  const stories = testimonials.filter((t) => !t.source);
  if (stories.length > 0) groups.push({ key: STORIES_SEGMENT, label: "Student stories", items: stories });

  return groups.length > 1 ? [all, ...groups] : [all];
}

export type TickerCard = {
  readonly item: Testimonial;
  /** 0 for the real card; 1+ for repeats added only so a short segment still fills the row. */
  readonly copy: number;
};

/**
 * The cards of one ticker set. A segment with only a few stories repeats them until the set holds at
 * least `minCards`, so it loops without a gap like the longer ones. Repeats are marked (copy > 0) so the
 * view can hide them from assistive tech; every real story stays first, in order.
 */
export function fillRow(items: readonly Testimonial[], minCards: number): readonly TickerCard[] {
  if (items.length === 0) return [];
  const rounds = Math.max(1, Math.ceil(minCards / items.length));
  return Array.from({ length: rounds }, (_, copy) => items.map((item) => ({ item, copy }))).flat();
}
