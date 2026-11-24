import { describe, expect, test } from "vitest";
import { parseEnv } from "@/lib/env";

describe("parseEnv", () => {
  test("applies safe defaults: noindex on, no basic auth", () => {
    const env = parseEnv({ API_ORIGIN: "http://localhost:3000" });
    expect(env.noindex).toBe(true);
    expect(env.basicAuth).toBeNull();
    expect(env.apiOrigin).toBe("http://localhost:3000");
  });

  test("only turns noindex off when explicitly set to false", () => {
    expect(parseEnv({ API_ORIGIN: "http://x.test", DEV_NOINDEX: "false" }).noindex).toBe(false);
    expect(parseEnv({ API_ORIGIN: "http://x.test", DEV_NOINDEX: "nope" }).noindex).toBe(true);
  });

  test("builds basic auth only when both user and password are set", () => {
    expect(
      parseEnv({ API_ORIGIN: "http://x.test", DEV_BASIC_AUTH_USER: "u", DEV_BASIC_AUTH_PASS: "p" })
        .basicAuth,
    ).toEqual({ user: "u", pass: "p" });
    expect(parseEnv({ API_ORIGIN: "http://x.test", DEV_BASIC_AUTH_USER: "u" }).basicAuth).toBeNull();
  });

  test("enforces the CSP unless CSP_REPORT_ONLY is exactly true", () => {
    expect(parseEnv({ API_ORIGIN: "http://x.test" }).cspReportOnly).toBe(false);
    expect(parseEnv({ API_ORIGIN: "http://x.test", CSP_REPORT_ONLY: "true" }).cspReportOnly).toBe(true);
    expect(parseEnv({ API_ORIGIN: "http://x.test", CSP_REPORT_ONLY: "yes" }).cspReportOnly).toBe(false);
  });

  test("strips a trailing slash from the API origin", () => {
    expect(parseEnv({ API_ORIGIN: "https://api.test/" }).apiOrigin).toBe("https://api.test");
  });

  test("throws a clear error when API_ORIGIN is missing or not a URL", () => {
    expect(() => parseEnv({})).toThrow(/API_ORIGIN is required/);
    expect(() => parseEnv({ API_ORIGIN: "not a url" })).toThrow(/API_ORIGIN must be an absolute URL/);
  });
});
