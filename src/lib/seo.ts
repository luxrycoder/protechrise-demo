import type { MetadataRoute } from "next";
import { ROBOTS_DISALLOWED_PATHS } from "@/lib/legacy-routes";
import { SITEMAP_STATIC_PATHS } from "@/lib/site";
import { absoluteUrl } from "@/lib/site-config";

const TRACK_PRIORITY = 0.7;

/** Sitemap entries for the static public pages plus one per live track (empty list when the API is down). */
export function buildSitemap(siteUrl: string, trackSlugs: readonly string[]): MetadataRoute.Sitemap {
  const pages = SITEMAP_STATIC_PATHS.map((path) => ({
    url: absoluteUrl(siteUrl, path),
    changeFrequency: path === "/" ? ("weekly" as const) : ("monthly" as const),
    priority: path === "/" ? 1 : 0.5,
  }));
  const tracks = trackSlugs.map((slug) => ({
    url: absoluteUrl(siteUrl, `/tracks/${encodeURIComponent(slug)}`),
    changeFrequency: "monthly" as const,
    priority: TRACK_PRIORITY,
  }));
  return [...pages, ...tracks];
}

/** A non-production environment blocks all crawling; production allows it and advertises the sitemap. */
export function buildRobots(siteUrl: string, noindex: boolean): MetadataRoute.Robots {
  if (noindex) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: [...ROBOTS_DISALLOWED_PATHS] },
    sitemap: absoluteUrl(siteUrl, "/sitemap.xml"),
  };
}
