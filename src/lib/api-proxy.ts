import { isProxiedLegacyPath } from "@/lib/legacy-routes";

const API_PREFIX = "/api/";
/** Routes served by this app itself; they must never be forwarded to the API. */
const LOCAL_API_PATHS: readonly string[] = ["/api/health"];

/**
 * Decide where a request should be proxied. Returns the absolute target URL, or null when the
 * request belongs to this app. The origin is fixed (taken from configuration, never from the
 * request), so a crafted path cannot redirect the proxy to another host.
 *
 * Two kinds of path are forwarded: everything under /api/ (except this app's own routes), and the
 * explicit allow-list of legacy server-side routes in src/lib/legacy-routes.ts. Nothing else is,
 * so this is not an open proxy.
 *
 * This runs per request in the proxy (src/proxy.ts) so API_ORIGIN is a runtime setting; it is not baked
 * into the build the way next.config rewrites are.
 */
export function proxyTarget(apiOrigin: string, pathname: string, search: string): string | null {
  if (LOCAL_API_PATHS.includes(pathname)) return null;
  if (!pathname.startsWith(API_PREFIX) && !isProxiedLegacyPath(pathname)) return null;
  return `${apiOrigin}${pathname}${search}`;
}
