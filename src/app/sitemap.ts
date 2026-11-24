import type { MetadataRoute } from "next";
import { buildSitemap } from "@/lib/seo";
import { loadSiteConfig } from "@/lib/site-config";
import { loadTracks } from "@/lib/tracks";

// Tracks come from the live API, so the sitemap is built per request (the API call is cached 60s).
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { siteUrl } = loadSiteConfig();
  const data = await loadTracks();
  return buildSitemap(siteUrl, (data?.tracks ?? []).map((track) => track.slug));
}
