import { describe, expect, test } from "vitest";
import { evaluateGate, parseBasicAuth } from "@/lib/dev-gate";

const basic = (user: string, pass: string) =>
  `Basic ${Buffer.from(`${user}:${pass}`).toString("base64")}`;

describe("parseBasicAuth", () => {
  test("returns user and password from a valid header", () => {
    expect(parseBasicAuth(basic("dev", "s3cret"))).toEqual({ user: "dev", pass: "s3cret" });
  });

  test("keeps colons that appear inside the password", () => {
    expect(parseBasicAuth(basic("dev", "a:b:c"))).toEqual({ user: "dev", pass: "a:b:c" });
  });

  test("returns null for missing, non-basic or malformed headers", () => {
    expect(parseBasicAuth(null)).toBeNull();
    expect(parseBasicAuth("Bearer abc")).toBeNull();
    expect(parseBasicAuth("Basic !!!not-base64")).toBeNull();
    expect(parseBasicAuth(`Basic ${Buffer.from("nocolon").toString("base64")}`)).toBeNull();
  });
});

describe("evaluateGate", () => {
  const open = { noindex: false, basicAuth: null };

  test("allows everything and adds no robots header when the gate is open", () => {
    expect(evaluateGate(open, null, "/")).toEqual({ allow: true, noindex: false });
  });

  test("adds noindex when configured", () => {
    expect(evaluateGate({ noindex: true, basicAuth: null }, null, "/")).toEqual({
      allow: true,
      noindex: true,
    });
  });

  test("challenges requests without credentials when basic auth is configured", () => {
    const cfg = { noindex: true, basicAuth: { user: "dev", pass: "s3cret" } };
    expect(evaluateGate(cfg, null, "/")).toEqual({ allow: false, noindex: true });
  });

  test("rejects wrong credentials and accepts correct ones", () => {
    const cfg = { noindex: true, basicAuth: { user: "dev", pass: "s3cret" } };
    expect(evaluateGate(cfg, basic("dev", "nope"), "/").allow).toBe(false);
    expect(evaluateGate(cfg, basic("dev", "s3cret"), "/").allow).toBe(true);
  });

  test("never gates the health endpoint so the platform probe works", () => {
    const cfg = { noindex: true, basicAuth: { user: "dev", pass: "s3cret" } };
    expect(evaluateGate(cfg, null, "/api/health").allow).toBe(true);
  });
});
