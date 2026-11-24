import { describe, expect, test } from "vitest";
import { absoluteUrl, parseSiteConfig } from "@/lib/site-config";

describe("parseSiteConfig", () => {
  test("defaults to a non-production build: dev labels, localhost URL", () => {
    expect(parseSiteConfig({}, true)).toEqual({
      siteUrl: "http://localhost:3100",
      siteName: "ProTech Rise Academy",
      noindex: true,
      isDevBuild: true,
    });
  });

  test("uses SITE_URL and strips trailing slashes", () => {
    expect(parseSiteConfig({ SITE_URL: "https://dev.example.test///" }, true).siteUrl).toBe(
      "https://dev.example.test",
    );
  });

  test("production (noindex=false) drops the noindex flag and the dev labels", () => {
    const prod = parseSiteConfig({ SITE_URL: "https://protechrise.com" }, false);
    expect(prod).toMatchObject({ noindex: false, isDevBuild: false, siteUrl: "https://protechrise.com" });
  });

  test("production refuses to start without SITE_URL, so canonicals never point at localhost", () => {
    expect(() => parseSiteConfig({}, false)).toThrow(/SITE_URL is required/);
  });

  test("production requires https", () => {
    expect(() => parseSiteConfig({ SITE_URL: "http://protechrise.com" }, false)).toThrow(/https/);
  });

  test("rejects a malformed SITE_URL in any mode", () => {
    expect(() => parseSiteConfig({ SITE_URL: "not a url" }, true)).toThrow(/SITE_URL must be an absolute URL/);
  });

  test("noindex is taken as given, not re-derived from raw env", () => {
    expect(parseSiteConfig({ DEV_NOINDEX: "false" }, true).noindex).toBe(true);
    expect(parseSiteConfig({ SITE_URL: "https://x.test" }, false).noindex).toBe(false);
  });
});

describe("absoluteUrl", () => {
  test("joins the site URL and a path", () => {
    expect(absoluteUrl("https://x.test", "/faq")).toBe("https://x.test/faq");
    expect(absoluteUrl("https://x.test", "faq")).toBe("https://x.test/faq");
    expect(absoluteUrl("https://x.test", "/")).toBe("https://x.test/");
  });
});
