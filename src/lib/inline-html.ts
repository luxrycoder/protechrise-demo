/**
 * Content modules carry a little inline HTML (links, code, emphasis) carried over from the legacy
 * pages. It is repo-owned, not user input, but it is still rendered as HTML, so this module defines
 * the only markup allowed and is used both by tests and as a render-time guard.
 */
const ALLOWED_TAGS: ReadonlySet<string> = new Set(["a", "code", "em", "strong"]);
const ALLOWED_ATTRS: Readonly<Record<string, ReadonlySet<string>>> = { a: new Set(["href"]) };
const SAFE_HREF = /^(\/|https:\/\/|mailto:)/;

const TAG_RE = /<\/?([a-zA-Z][a-zA-Z0-9]*)([^>]*)>/g;
const ATTR_RE = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;

/** Returns a list of problems (tag names, attribute names, bad hrefs); empty means safe. */
export function findUnsafeInlineHtml(html: string): string[] {
  const problems: string[] = [];
  for (const tag of html.matchAll(TAG_RE)) {
    const name = (tag[1] ?? "").toLowerCase();
    if (!ALLOWED_TAGS.has(name)) {
      problems.push(name);
      continue;
    }
    const allowedAttrs = ALLOWED_ATTRS[name] ?? new Set<string>();
    for (const attr of (tag[2] ?? "").matchAll(ATTR_RE)) {
      const attrName = (attr[1] ?? "").toLowerCase();
      if (!allowedAttrs.has(attrName)) {
        problems.push(attrName);
        continue;
      }
      const value = attr[2] ?? attr[3] ?? attr[4] ?? "";
      if (attrName === "href" && !SAFE_HREF.test(value.trim())) problems.push(`href:${value}`);
    }
  }
  return problems;
}

/** Throws if the markup is outside the allowed set; use right before rendering as HTML. */
export function assertSafeInlineHtml(html: string): string {
  const problems = findUnsafeInlineHtml(html);
  if (problems.length > 0) throw new Error(`Unsafe inline HTML: ${problems.join(", ")}`);
  return html;
}

const ENTITIES: Readonly<Record<string, string>> = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'" };

/** Plain text of an inline HTML fragment (for JSON-LD and meta descriptions). */
export function stripInlineHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&(amp|lt|gt|quot|#39);/g, (m) => ENTITIES[m] ?? m)
    .replace(/\s+/g, " ")
    .trim();
}
