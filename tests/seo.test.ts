import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";
import { ROBOTS_DISALLOWED_PATHS } from "@/lib/legacy-routes";
import { buildRobots, buildSitemap } from "@/lib/seo";
import { SITEMAP_STATIC_PATHS } from "@/lib/site";
import { breadcrumbJsonLd, organizationJsonLd, websiteJsonLd } from "@/lib/json-ld";

const SITE = "https://dev.example.test";

describe("buildSitemap", () => {
  const entries = buildSitemap(SITE, ["frontend", "data & ai"]);
  const urls = entries.map((e) => e.url);

  test("lists the public pages and every track as absolute URLs", () => {
    expect(urls).toContain("https://dev.example.test/");
    expect(urls).toContain("https://dev.example.test/faq");
    expect(urls).toContain("https://dev.example.test/privacy");
    expect(urls).toContain("https://dev.example.test/refund-policy");
    expect(urls).toContain("https://dev.example.test/tracks/frontend");
  });

  test("percent-encodes track slugs", () => {
    expect(urls).toContain("https://dev.example.test/tracks/data%20%26%20ai");
  });

  test("has no duplicate URLs and leaves out the placeholder apply page", () => {
    expect(new Set(urls).size).toBe(urls.length);
    expect(urls.some((u) => u.endsWith("/apply"))).toBe(false);
  });

  test("with no tracks (API down) still lists the static pages", () => {
    expect(buildSitemap(SITE, []).map((e) => e.url)).toEqual(urls.slice(0, SITEMAP_STATIC_PATHS.length));
  });

  test("every static sitemap path is a real route, so the sitemap never advertises a 404", () => {
    const appDir = path.resolve(__dirname, "../src/app");
    for (const p of SITEMAP_STATIC_PATHS) {
      const segment = p === "/" ? "" : p.replace(/^\//, "");
      expect(existsSync(path.join(appDir, segment, "page.tsx")), p).toBe(true);
    }
  });
});

describe("buildRobots", () => {
  test("a noindex environment blocks everything and advertises no sitemap", () => {
    expect(buildRobots(SITE, true)).toEqual({ rules: { userAgent: "*", disallow: "/" } });
  });

  test("production allows crawling, keeps the API and token routes out, and points at the sitemap", () => {
    expect(buildRobots(SITE, false)).toEqual({
      rules: { userAgent: "*", allow: "/", disallow: [...ROBOTS_DISALLOWED_PATHS] },
      sitemap: "https://dev.example.test/sitemap.xml",
    });
  });
});

describe("structured data builders", () => {
  test("organization and website data use the configured site URL and name", () => {
    expect(organizationJsonLd(SITE, "Acme")).toMatchObject({
      "@type": "EducationalOrganization",
      name: "Acme",
      url: SITE,
    });
    expect(websiteJsonLd(SITE, "Acme")).toMatchObject({ "@type": "WebSite", name: "Acme", url: SITE });
  });

  test("breadcrumbs are numbered from 1 and carry absolute URLs", () => {
    const ld = breadcrumbJsonLd([
      { name: "Home", url: `${SITE}/` },
      { name: "Frontend", url: `${SITE}/tracks/frontend` },
    ]);
    expect(ld["@type"]).toBe("BreadcrumbList");
    expect(ld.itemListElement.map((i) => i.position)).toEqual([1, 2]);
    expect(ld.itemListElement[1]).toMatchObject({ name: "Frontend", item: `${SITE}/tracks/frontend` });
  });
});
