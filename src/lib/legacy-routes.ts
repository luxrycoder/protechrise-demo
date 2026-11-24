/**
 * Legacy URL compatibility. Emails already sent contain links that the legacy waitlist-api answers
 * itself, outside /api: magic-link verification, claim redirects to Paystack, referral links, the
 * community hand-off. They must keep working when the new front-end serves the same hostname.
 *
 * This file is the single source of truth, used by the proxy (src/proxy.ts), the redirects
 * (next.config.ts) and robots.txt. The human-readable map is docs/LEGACY_URLS.md.
 *
 * It must stay free of imports and environment access: next.config.ts loads it at build time.
 */

/**
 * Server-side routes the legacy API answers and the new front-end must forward unchanged
 * (any method: /status/verify is a GET page and a POST confirmation). Exact matches only.
 *
 * Deliberately NOT listed: /status, /referrer, /claim/start and /claim/confirmed. Those are pages the
 * new front-end owns (or will own); the API's redirects land the browser on them.
 */
const PROXIED_EXACT_PATHS: ReadonlySet<string> = new Set([
  "/status/verify",
  "/referrer/verify",
  "/claim",
  "/community",
  "/community/pod",
]);

/** Referral links: random [A-Za-z0-9] codes or admin-chosen [a-z0-9-] codes, at most 64 characters. */
const REFERRAL_PATH = /^\/r\/[A-Za-z0-9-]{1,64}$/;

export function isProxiedLegacyPath(pathname: string): boolean {
  return PROXIED_EXACT_PATHS.has(pathname) || REFERRAL_PATH.test(pathname);
}

export type LegacyRedirect = { readonly source: string; readonly destination: string };

/**
 * Legacy page URLs whose content now lives elsewhere. The legacy server also redirects to
 * /application (for example after /r/<code>), so /application must land on the new form.
 * Query strings are preserved by Next, so /application?ref=x becomes /apply?ref=x.
 */
export const LEGACY_REDIRECTS: readonly LegacyRedirect[] = [
  { source: "/application", destination: "/apply" },
  { source: "/application.html", destination: "/apply" },
  { source: "/scholarship", destination: "/apply" },
  { source: "/index.html", destination: "/" },
  { source: "/faq.html", destination: "/faq" },
  { source: "/privacy.html", destination: "/privacy" },
  { source: "/refund-policy.html", destination: "/refund-policy" },
];

/** Paths kept out of search engines: the API, and token-bearing or personal pages. Prefix matches. */
export const ROBOTS_DISALLOWED_PATHS: readonly string[] = [
  "/api/",
  "/status",
  "/portal",
  "/referrer",
  "/claim",
  "/r/",
  "/community",
];
