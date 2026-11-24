import { describe, expect, test } from "vitest";
import { proxyTarget } from "@/lib/api-proxy";

const ORIGIN = "https://dev-api.example.test";

describe("proxyTarget", () => {
  test("maps /api paths to the API origin and preserves the query string", () => {
    expect(proxyTarget(ORIGIN, "/api/tracks", "")).toBe("https://dev-api.example.test/api/tracks");
    expect(proxyTarget(ORIGIN, "/api/applications/check-email", "?email=a%40b.test")).toBe(
      "https://dev-api.example.test/api/applications/check-email?email=a%40b.test",
    );
  });

  test("never proxies the front-end's own health route", () => {
    expect(proxyTarget(ORIGIN, "/api/health", "")).toBeNull();
  });

  test("ignores non-api paths", () => {
    expect(proxyTarget(ORIGIN, "/", "")).toBeNull();
    expect(proxyTarget(ORIGIN, "/apiary", "")).toBeNull();
    expect(proxyTarget(ORIGIN, "/faq", "?x=1")).toBeNull();
  });

  test("does not let a crafted path escape to another host", () => {
    expect(proxyTarget(ORIGIN, "/api//evil.test/x", "")).toBe(
      "https://dev-api.example.test/api//evil.test/x",
    );
    expect(proxyTarget(ORIGIN, "/api/../admin", "")).toBe("https://dev-api.example.test/api/../admin");
  });

  describe("legacy server-side routes outside /api", () => {
    test("forwards them with their token query strings untouched", () => {
      expect(proxyTarget(ORIGIN, "/status/verify", "?token=abc.def")).toBe(
        "https://dev-api.example.test/status/verify?token=abc.def",
      );
      expect(proxyTarget(ORIGIN, "/claim", "?token=t%2B1")).toBe("https://dev-api.example.test/claim?token=t%2B1");
      expect(proxyTarget(ORIGIN, "/r/ada-promo", "")).toBe("https://dev-api.example.test/r/ada-promo");
      expect(proxyTarget(ORIGIN, "/referrer/verify", "?token=x")).toBe("https://dev-api.example.test/referrer/verify?token=x");
    });

    test("leaves pages the new front-end owns, and anything off the allow-list, alone", () => {
      for (const p of ["/status", "/claim/start", "/claim/confirmed", "/apply", "/referrer", "/r/", "/r/a/b", "/discourse/sso"]) {
        expect(proxyTarget(ORIGIN, p, "?x=1"), p).toBeNull();
      }
    });
  });
});
