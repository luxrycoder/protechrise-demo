import type { PolicyBlock } from "@/content/types";

export type VersionLine = { readonly version: string; readonly updated: string };

// "Version 2026-11 &middot; Last updated November 7, 2026" (the separator is an HTML entity in the page content).
const VERSION_LINE = /^Version\s+(\S+)\s+(?:&middot;|·)\s+Last updated\s+(.+)$/;

/**
 * The version and date a policy page declares, read from the page's own text so the form never carries a copy that
 * can drift. Null when the page has no version line (the privacy policy only has a date).
 */
export function parseVersionLine(blocks: readonly PolicyBlock[]): VersionLine | null {
  for (const block of blocks) {
    if (block.type !== "updated") continue;
    const match = VERSION_LINE.exec(block.html.trim());
    if (match?.[1] && match[2]) return { version: match[1], updated: match[2] };
  }
  return null;
}
