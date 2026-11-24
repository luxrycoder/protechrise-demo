import { afterEach, describe, expect, test, vi } from "vitest";
import { buildCsp, CSP_HEADER, CSP_REPORT_ONLY_HEADER, generateNonce } from "@/lib/csp";
import nextConfig from "../next.config";

const NONCE = "dGVzdC1ub25jZQ==";

/** The value of one directive, e.g. directive(csp, "script-src") -> "'self' 'nonce-…' …". */
function directive(csp: string, name: string): string | undefined {
  const found = csp.split("; ").find((d) => d === name || d.startsWith(`${name} `));
  return found?.slice(name.length).trim();
}

describe("generateNonce", () => {
  test("is unique per call and valid base64", () => {
    const a = generateNonce();
    expect(a).not.toBe(generateNonce());
    expect(() => atob(a)).not.toThrow();
  });
});

describe("buildCsp (production)", () => {
  const csp = buildCsp({ nonce: NONCE, isDev: false });

  test("scripts need the nonce and never allow inline or eval", () => {
    const scripts = directive(csp, "script-src") ?? "";
    expect(scripts).toContain(`'nonce-${NONCE}'`);
    expect(scripts).toContain("'strict-dynamic'");
    expect(scripts).not.toContain("'unsafe-inline'");
    expect(scripts).not.toContain("'unsafe-eval'");
  });

  test("style blocks need the nonce; only style attributes may be inline", () => {
    expect(directive(csp, "style-src")).toBe(`'self' 'nonce-${NONCE}'`);
    expect(directive(csp, "style-src-attr")).toBe("'unsafe-inline'");
  });

  test("keeps the hardening directives that must not regress", () => {
    expect(directive(csp, "frame-ancestors")).toBe("'none'");
    expect(directive(csp, "base-uri")).toBe("'self'");
    expect(directive(csp, "object-src")).toBe("'none'");
    expect(directive(csp, "form-action")).toBe("'self'");
    expect(csp).toContain("upgrade-insecure-requests");
  });

  test("allows no third-party origin until one is added on purpose", () => {
    expect(csp).not.toMatch(/https?:\/\//);
    expect(directive(csp, "connect-src")).toBe("'self'");
    expect(directive(csp, "img-src")).toBe("'self' blob: data:");
  });
});

describe("buildCsp (development)", () => {
  const csp = buildCsp({ nonce: NONCE, isDev: true });

  test("adds eval and inline styles for hot reload, and no https upgrade on plain-http localhost", () => {
    expect(directive(csp, "script-src")).toContain("'unsafe-eval'");
    expect(directive(csp, "style-src")).toContain("'unsafe-inline'");
    expect(csp).not.toContain("upgrade-insecure-requests");
    expect(directive(csp, "connect-src")).toContain("ws:");
  });
});

describe("buildCsp extra sources", () => {
  test("adds a vetted origin to just the directives named", () => {
    const csp = buildCsp({ nonce: NONCE, isDev: false, extra: { "connect-src": ["https://o1.ingest.sentry.io"] } });
    expect(directive(csp, "connect-src")).toBe("'self' https://o1.ingest.sentry.io");
    expect(directive(csp, "img-src")).toBe("'self' blob: data:");
  });
});

describe("static security headers in next.config", () => {
  test("every page gets the hardening headers", async () => {
    const rules = (await nextConfig.headers?.()) ?? [];
    const all = rules.find((r) => r.source === "/:path*");
    const headers = Object.fromEntries((all?.headers ?? []).map((h) => [h.key, h.value]));
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(headers["X-Frame-Options"]).toBe("DENY");
    expect(headers["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["Permissions-Policy"]).toContain("geolocation=()");
  });
});

describe("proxy", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  async function loadProxy(env: Record<string, string> = {}) {
    vi.resetModules();
    vi.stubEnv("API_ORIGIN", "http://api.test");
    for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value);
    const { NextRequest } = await import("next/server");
    const { proxy } = await import("@/proxy");
    return { proxy, request: (path: string) => new NextRequest(`http://site.test${path}`) };
  }

  test("pages get an enforced CSP carrying that request's nonce", async () => {
    const { proxy, request } = await loadProxy();
    const res = proxy(request("/faq"));
    const csp = res.headers.get(CSP_HEADER) ?? "";
    expect(csp).toMatch(/script-src [^;]*'nonce-[A-Za-z0-9+/=]+'/);
    expect(res.headers.get(CSP_REPORT_ONLY_HEADER)).toBeNull();
  });

  test("each request gets a different nonce", async () => {
    const { proxy, request } = await loadProxy();
    const nonceOf = (path: string) => /'nonce-([^']+)'/.exec(proxy(request(path)).headers.get(CSP_HEADER) ?? "")?.[1];
    expect(nonceOf("/")).toBeTruthy();
    expect(nonceOf("/")).not.toBe(nonceOf("/"));
  });

  test("CSP_REPORT_ONLY=true sends it report-only instead", async () => {
    const { proxy, request } = await loadProxy({ CSP_REPORT_ONLY: "true" });
    const res = proxy(request("/faq"));
    expect(res.headers.get(CSP_REPORT_ONLY_HEADER)).toContain("script-src");
    expect(res.headers.get(CSP_HEADER)).toBeNull();
  });

  test("API calls are proxied without a page policy", async () => {
    const { proxy, request } = await loadProxy();
    const res = proxy(request("/api/tracks"));
    expect(res.headers.get("x-middleware-rewrite")).toBe("http://api.test/api/tracks");
    expect(res.headers.get(CSP_HEADER)).toBeNull();
  });

  test("Next's own endpoints (hot-reload socket, assets) are passed through untouched", async () => {
    const { proxy, request } = await loadProxy();
    const res = proxy(request("/_next/hmr"));
    expect(res.headers.get(CSP_HEADER)).toBeNull();
    expect(res.headers.get("x-middleware-request-content-security-policy")).toBeNull();
  });

  test("the dev login still blocks before any page is served", async () => {
    const { proxy, request } = await loadProxy({ DEV_BASIC_AUTH_USER: "u", DEV_BASIC_AUTH_PASS: "p" });
    const res = proxy(request("/faq"));
    expect(res.status).toBe(401);
    expect(res.headers.get(CSP_HEADER)).toBeNull();
  });
});
