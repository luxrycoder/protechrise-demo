import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";
import nextConfig from "../next.config";
import { LEGACY_REDIRECTS, ROBOTS_DISALLOWED_PATHS, isProxiedLegacyPath } from "@/lib/legacy-routes";

describe("isProxiedLegacyPath", () => {
  test.each([
    "/status/verify",
    "/referrer/verify",
    "/claim",
    "/community",
    "/community/pod",
    "/r/abc123",
    "/r/ada-promo",
  ])("%s is a server-side legacy route and is proxied", (p) => {
    expect(isProxiedLegacyPath(p)).toBe(true);
  });

  test.each([
    // Pages the new front-end owns (or will own): they must never be forwarded to the API.
    "/status",
    "/referrer",
    "/claim/start",
    "/claim/confirmed",
    "/apply",
    "/faq",
    // Legacy aliases that are handled by redirects instead.
    "/scholarship",
    "/application",
    // Malformed or hostile shapes: nothing outside the allow-list reaches the API.
    "/r/",
    "/r",
    "/r/a/b",
    "/r/..%2Fadmin",
    "/r/a.b",
    "/r/a b",
    "/status/verify/",
    "/status/verify/extra",
    "/claim/",
    "/discourse/sso",
    "/dashboard",
    "/login",
    "//status/verify",
  ])("%s is not proxied", (p) => {
    expect(isProxiedLegacyPath(p)).toBe(false);
  });

  test("referral codes are limited to 64 characters like the legacy server", () => {
    expect(isProxiedLegacyPath(`/r/${"a".repeat(64)}`)).toBe(true);
    expect(isProxiedLegacyPath(`/r/${"a".repeat(65)}`)).toBe(false);
  });
});

describe("LEGACY_REDIRECTS", () => {
  const appDir = path.resolve(__dirname, "../src/app");
  const routeExists = (p: string) => existsSync(path.join(appDir, p === "/" ? "" : p.replace(/^\//, ""), "page.tsx"));

  test("sends the legacy application form and its aliases to /apply", () => {
    const map = new Map(LEGACY_REDIRECTS.map((r) => [r.source, r.destination]));
    expect(map.get("/application")).toBe("/apply");
    expect(map.get("/application.html")).toBe("/apply");
    expect(map.get("/scholarship")).toBe("/apply");
  });

  test("sends the .html forms of pages that already exist to their clean URLs", () => {
    const map = new Map(LEGACY_REDIRECTS.map((r) => [r.source, r.destination]));
    expect(map.get("/index.html")).toBe("/");
    expect(map.get("/faq.html")).toBe("/faq");
    expect(map.get("/privacy.html")).toBe("/privacy");
    expect(map.get("/refund-policy.html")).toBe("/refund-policy");
  });

  test("every destination is a real route, so a redirect never lands on a 404", () => {
    for (const r of LEGACY_REDIRECTS) expect(routeExists(r.destination), r.destination).toBe(true);
  });

  test("sources are unique, absolute paths, and never overlap proxied routes", () => {
    const sources = LEGACY_REDIRECTS.map((r) => r.source);
    expect(new Set(sources).size).toBe(sources.length);
    for (const s of sources) {
      expect(s.startsWith("/")).toBe(true);
      expect(isProxiedLegacyPath(s)).toBe(false);
    }
  });

  test("next.config serves exactly these as permanent redirects", async () => {
    const redirects = await nextConfig.redirects?.();
    expect(redirects).toEqual(LEGACY_REDIRECTS.map((r) => ({ source: r.source, destination: r.destination, permanent: true })));
  });
});

describe("ROBOTS_DISALLOWED_PATHS", () => {
  test("keeps the API and the token-bearing or personal routes out of search engines", () => {
    for (const p of ["/api/", "/status", "/portal", "/referrer", "/claim", "/r/", "/community"]) {
      expect(ROBOTS_DISALLOWED_PATHS).toContain(p);
    }
  });
});
