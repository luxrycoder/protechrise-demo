import type { MetadataRoute } from "next";
import { buildRobots } from "@/lib/seo";
import { loadSiteConfig } from "@/lib/site-config";

// Read per request so the same image blocks crawlers on dev and allows them in production.
export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  const { siteUrl, noindex } = loadSiteConfig();
  return buildRobots(siteUrl, noindex);
}
