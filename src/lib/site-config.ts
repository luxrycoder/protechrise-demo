import { parseEnv } from "@/lib/env";

export const SITE_NAME = "ProTech Rise Academy";

const DEFAULT_SITE_URL = "http://localhost:3100";

export type SiteConfig = {
  /** Origin only, no trailing slash. Used for canonical, Open Graph and sitemap URLs. */
  readonly siteUrl: string;
  readonly siteName: string;
  /** True everywhere except production (DEV_NOINDEX=false). */
  readonly noindex: boolean;
  /** Non-production builds get "(dev)" labels; production must not. */
  readonly isDevBuild: boolean;
};

function toOrigin(raw: string): string {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("Invalid site config: SITE_URL must be an absolute URL");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Invalid site config: SITE_URL must be an absolute URL");
  }
  return url.origin;
}

/**
 * Site-wide settings from the environment. Pure (takes the raw record), and independent of
 * API_ORIGIN so it never breaks a build that has no runtime settings.
 *
 * `noindex` is taken as input rather than re-derived from `DEV_NOINDEX` here, so there is a
 * single source of truth for the flag: `parseEnv` in `src/lib/env.ts` (also used by the proxy).
 *
 * Production (noindex is false) must set an https SITE_URL: a missing one would otherwise
 * ship canonical and sitemap URLs that point at localhost, so it fails fast instead.
 */
export function parseSiteConfig(raw: Record<string, string | undefined>, noindex: boolean): SiteConfig {
  const configured = raw.SITE_URL?.trim();

  if (!noindex && !configured) {
    throw new Error("Invalid site config: SITE_URL is required when DEV_NOINDEX=false (production)");
  }
  const siteUrl = configured ? toOrigin(configured) : DEFAULT_SITE_URL;
  if (!noindex && !siteUrl.startsWith("https://")) {
    throw new Error("Invalid site config: SITE_URL must use https in production");
  }
  return { siteUrl, siteName: SITE_NAME, noindex, isDevBuild: noindex };
}

/** Read the site config from this process's environment (server-side, at request time). */
export function loadSiteConfig(): SiteConfig {
  return parseSiteConfig(process.env, parseEnv(process.env).noindex);
}

export function absoluteUrl(siteUrl: string, path: string): string {
  return `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}
