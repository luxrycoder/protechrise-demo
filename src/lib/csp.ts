/**
 * Content Security Policy, built per request by the proxy (src/proxy.ts) with a fresh nonce.
 * Pure: no environment or request access, so it is tested directly (tests/csp.test.ts).
 *
 * Next.js reads the nonce back out of this header while rendering and stamps it on its own scripts and
 * styles, so components never handle it. That needs every page to render per request, which the root
 * layout already forces (`dynamic = "force-dynamic"`).
 *
 * Today the app loads nothing from a third party, so every directive is `'self'`. When error monitoring
 * (Sentry, #12) and consent-gated analytics (#21) are added, put their origins in EXTRA_SOURCES below and
 * nowhere else, so each allowed origin is visible in one reviewable place.
 */

export const CSP_HEADER = "Content-Security-Policy";
export const CSP_REPORT_ONLY_HEADER = "Content-Security-Policy-Report-Only";

type Extra = { readonly [directive: string]: readonly string[] };

/** Third-party origins by directive. Empty on purpose: see the note above. */
export const EXTRA_SOURCES: Extra = {};

/** A fresh, unguessable nonce for one request (base64 of a random UUID, as the Next.js guide does). */
export function generateNonce(): string {
  return btoa(crypto.randomUUID());
}

type Options = {
  readonly nonce: string;
  /** Development needs eval (React's debugging) and inline styles (hot reload); production does not. */
  readonly isDev: boolean;
  readonly extra?: Extra;
};

/**
 * The policy as one header value.
 *
 * - Scripts: only our own files and ones carrying the nonce; `strict-dynamic` lets those load the chunks they need.
 * - Styles: our own files and nonced `<style>` blocks. Style *attributes* (the `style={{ … }}` props used across
 *   the components) cannot carry a nonce, so they are allowed separately through `style-src-attr`; that is much
 *   lower risk than allowing inline `<style>` blocks or scripts.
 * - Everything else is `'self'`, plus the hardening directives that must not regress (frame-ancestors, base-uri, object-src).
 */
export function buildCsp({ nonce, isDev, extra = EXTRA_SOURCES }: Options): string {
  const withExtra = (directive: string, base: readonly string[]) => [...base, ...(extra[directive] ?? [])].join(" ");

  const directives: string[] = [
    `default-src ${withExtra("default-src", ["'self'"])}`,
    `script-src ${withExtra("script-src", ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'", ...(isDev ? ["'unsafe-eval'"] : [])])}`,
    `style-src ${withExtra("style-src", ["'self'", isDev ? "'unsafe-inline'" : `'nonce-${nonce}'`])}`,
    `style-src-attr ${withExtra("style-src-attr", ["'unsafe-inline'"])}`,
    `img-src ${withExtra("img-src", ["'self'", "blob:", "data:"])}`,
    `font-src ${withExtra("font-src", ["'self'"])}`,
    `connect-src ${withExtra("connect-src", ["'self'", ...(isDev ? ["ws:", "wss:"] : [])])}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ];
  // Upgrading requests to https would break plain-http localhost in development.
  if (!isDev) directives.push("upgrade-insecure-requests");
  return directives.join("; ");
}
