export type GateConfig = {
  readonly noindex: boolean;
  readonly basicAuth: { readonly user: string; readonly pass: string } | null;
};

export type GateDecision = { readonly allow: boolean; readonly noindex: boolean };

/** Paths that must stay reachable so the platform health probe works. */
const UNGATED_PATHS: readonly string[] = ["/api/health"];

export function parseBasicAuth(header: string | null): { user: string; pass: string } | null {
  if (!header || !header.startsWith("Basic ")) return null;
  const encoded = header.slice("Basic ".length).trim();
  let decoded: string;
  try {
    const bytes = atob(encoded);
    decoded = bytes;
  } catch {
    return null;
  }
  const idx = decoded.indexOf(":");
  if (idx < 0) return null;
  return { user: decoded.slice(0, idx), pass: decoded.slice(idx + 1) };
}

/** Constant-time string comparison to avoid leaking credential length/prefix via timing. */
function safeEqual(a: string, b: string): boolean {
  let diff = a.length ^ b.length;
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i += 1) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

/**
 * Decide whether a request may proceed on a gated (non-production) environment.
 * Pure so it is unit-testable; the proxy only translates the decision into a Response.
 */
export function evaluateGate(
  config: GateConfig,
  authorization: string | null,
  pathname: string,
): GateDecision {
  const { noindex, basicAuth } = config;
  if (!basicAuth || UNGATED_PATHS.includes(pathname)) return { allow: true, noindex };
  const supplied = parseBasicAuth(authorization);
  const ok =
    supplied !== null &&
    safeEqual(supplied.user, basicAuth.user) &&
    safeEqual(supplied.pass, basicAuth.pass);
  return { allow: ok, noindex };
}
