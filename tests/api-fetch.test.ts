import { afterEach, describe, expect, test, vi } from "vitest";
import { fetchApiJson } from "@/lib/api-fetch";

afterEach(() => vi.restoreAllMocks());

describe("fetchApiJson logging", () => {
  test("a 404 degrades to null with a warning, not an error (console.error opens the Next dev overlay)", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const out = await fetchApiJson("https://api.test", "/api/public-fee", async () => new Response("", { status: 404 }));
    expect(out).toBeNull();
    expect(warn).toHaveBeenCalledOnce();
    expect(error).not.toHaveBeenCalled();
  });

  test("a 5xx is still logged as an error", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const out = await fetchApiJson("https://api.test", "/api/tracks", async () => new Response("", { status: 503 }));
    expect(out).toBeNull();
    expect(error).toHaveBeenCalledOnce();
  });
});

describe("fetchApiJson network failures", () => {
  test("an unreachable API is an error in production and a warning in development", async () => {
    const failing = async () => {
      throw new Error("timeout");
    };
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubEnv("NODE_ENV", "production");
    expect(await fetchApiJson("https://api.test", "/api/tracks", failing)).toBeNull();
    expect(error).toHaveBeenCalledOnce();
    vi.stubEnv("NODE_ENV", "development");
    expect(await fetchApiJson("https://api.test", "/api/tracks", failing)).toBeNull();
    expect(warn).toHaveBeenCalledOnce();
    vi.unstubAllEnvs();
  });
});
