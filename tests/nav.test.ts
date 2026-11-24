import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";
import { FOOTER_LINKS, NAV_LINKS } from "@/lib/site";

const APP_DIR = path.resolve(__dirname, "../src/app");

function routeExists(href: string): boolean {
  const pathname = href.split("#")[0] ?? "";
  const segment = pathname === "/" || pathname === "" ? "" : pathname.replace(/^\//, "");
  return existsSync(path.join(APP_DIR, segment, "page.tsx"));
}

describe("site navigation", () => {
  test.each([...NAV_LINKS, ...FOOTER_LINKS].map((l) => [l.label, l.href] as const))(
    "%s -> %s points at a real route",
    (_label, href) => {
      expect(routeExists(href)).toBe(true);
    },
  );

  test("the header's Apply button target exists", () => {
    expect(routeExists("/apply")).toBe(true);
  });
});
