import { NextResponse, type NextRequest } from "next/server";
import { proxyTarget } from "@/lib/api-proxy";
import { buildCsp, CSP_HEADER, CSP_REPORT_ONLY_HEADER, generateNonce } from "@/lib/csp";
import { evaluateGate } from "@/lib/dev-gate";
import { parseEnv } from "@/lib/env";

const env = parseEnv(process.env);
const ROBOTS_NOINDEX = "noindex, nofollow";

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const decision = evaluateGate(
    { noindex: env.noindex, basicAuth: env.basicAuth },
    request.headers.get("authorization"),
    pathname,
  );

  if (!decision.allow) {
    const denied = new NextResponse("Authentication required", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="ProTech Rise dev", charset="UTF-8"' },
    });
    if (decision.noindex) denied.headers.set("X-Robots-Tag", ROBOTS_NOINDEX);
    return denied;
  }

  // Same-origin proxy to this environment's waitlist-api, so cookies and CSRF stay same-origin.
  const target = proxyTarget(env.apiOrigin, pathname, search);
  if (target) {
    // API calls return data, not documents, so there is no page for a CSP to protect.
    const rewritten = NextResponse.rewrite(new URL(target));
    if (decision.noindex) rewritten.headers.set("X-Robots-Tag", ROBOTS_NOINDEX);
    return rewritten;
  }

  // Next's own endpoints (the dev hot-reload socket at /_next/hmr, build assets) are not pages: leave them untouched.
  if (pathname.startsWith("/_next/")) {
    const internal = NextResponse.next();
    if (decision.noindex) internal.headers.set("X-Robots-Tag", ROBOTS_NOINDEX);
    return internal;
  }

  // Pages: a fresh nonce per request. Next.js reads it from the request's CSP header while rendering and
  // stamps it on its own scripts and styles; the response header is what the browser enforces.
  const nonce = generateNonce();
  const policy = buildCsp({ nonce, isDev: process.env.NODE_ENV === "development" });
  const cspHeader = env.cspReportOnly ? CSP_REPORT_ONLY_HEADER : CSP_HEADER;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set(cspHeader, policy);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set(cspHeader, policy);
  if (decision.noindex) response.headers.set("X-Robots-Tag", ROBOTS_NOINDEX);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
