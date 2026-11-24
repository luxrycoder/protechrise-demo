import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { TRACK_ART, trackArt } from "@/content/track-art";

// The CSP only allows images from this site, so a remote URL here would render as a blank dark card.
describe("track card art", () => {
  test("every image is served from this site and the file exists", () => {
    expect(TRACK_ART.length).toBeGreaterThan(0);
    for (const src of TRACK_ART) {
      expect(src.startsWith("/images/tracks/")).toBe(true);
      expect(existsSync(join(process.cwd(), "public", src))).toBe(true);
    }
  });

  test("cycles when there are more tracks than images", () => {
    expect(trackArt(TRACK_ART.length)).toBe(TRACK_ART[0]);
    expect(trackArt(1)).toBe(TRACK_ART[1]);
  });
});
