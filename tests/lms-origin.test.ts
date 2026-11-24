import { describe, expect, test } from "vitest";
import { loadLmsOrigin } from "@/lib/lms-origin";

describe("loadLmsOrigin", () => {
  test("reads LMS_ORIGIN, normalised", () => {
    expect(loadLmsOrigin({ LMS_ORIGIN: "https://learn.example.com/", NODE_ENV: "production" })).toBe("https://learn.example.com");
  });
  test("missing or invalid means null (the hand-off fails closed)", () => {
    expect(loadLmsOrigin({ NODE_ENV: "production" })).toBeNull();
    expect(loadLmsOrigin({ LMS_ORIGIN: "", NODE_ENV: "production" })).toBeNull();
    expect(loadLmsOrigin({ LMS_ORIGIN: "learn.example.com", NODE_ENV: "production" })).toBeNull();
    expect(loadLmsOrigin({ LMS_ORIGIN: "https://learn.example.com/academy", NODE_ENV: "production" })).toBeNull();
  });
  test("plain http on this machine is accepted outside production only", () => {
    expect(loadLmsOrigin({ LMS_ORIGIN: "http://localhost:3000", NODE_ENV: "development" })).toBe("http://localhost:3000");
    expect(loadLmsOrigin({ LMS_ORIGIN: "http://localhost:3000", NODE_ENV: "production" })).toBeNull();
  });
});
