import type { FaqContent, PolicyBlock, TableRow } from "@/content/types";

/**
 * Turns the legacy policy and FAQ pages into the typed content this site renders. Used by
 * scripts/sync-policy-content.ts, so the content is always what this parser makes of the pinned legacy pages
 * (tests/legacy-policy-content.test.ts) and never hand-edited. Plain string scanning: the legacy pages are
 * regular, hand-written HTML, and anything unexpected fails loudly rather than being guessed at.
 */

const ALLOWED_INLINE = new Set(["a", "code", "em", "strong"]);
/** The legacy apply page moved to /apply on this site. */
const LEGACY_APPLY_HREF = /^\/application(?=$|[?#])/;
const SAFE_HREF = /^(?:\/(?!\/)|https:\/\/|mailto:)/;

const TAG = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g;

function cleanHref(attributes: string): string | null {
  const match = /\bhref\s*=\s*"([^"]*)"/.exec(attributes);
  const href = match?.[1]?.trim() ?? "";
  if (!href || !SAFE_HREF.test(href)) return null;
  return href.replace(LEGACY_APPLY_HREF, "/apply");
}

/** Inline HTML limited to <a href>, <code>, <em> and <strong>; everything else is dropped, text is kept. */
export function inlineHtml(raw: string): string {
  const withoutScripts = raw.replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, "");
  const kept = withoutScripts.replace(TAG, (_whole, closing: string, name: string, attributes: string) => {
    const tag = name.toLowerCase();
    if (!ALLOWED_INLINE.has(tag)) return "";
    if (closing) return `</${tag}>`;
    if (tag !== "a") return `<${tag}>`;
    const href = cleanHref(attributes);
    return href ? `<a href="${href}">` : "<a>";
  });
  // A link we had to strip the target from would be an empty anchor; unwrap it.
  return kept.replace(/<a>([\s\S]*?)<\/a>/g, "$1").replace(/\s+/g, " ").trim();
}

function mainOf(html: string): string {
  const start = html.search(/<main\b[^>]*>/i);
  const end = html.search(/<\/main>/i);
  if (start === -1 || end === -1 || end < start) throw new Error("legacy page has no <main> element: the layout changed");
  return html.slice(html.indexOf(">", start) + 1, end);
}

const textOf = (html: string): string => inlineHtml(html);

function tableRows(table: string): readonly TableRow[] {
  const rows: TableRow[] = [];
  for (const row of table.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = [...(row[1] ?? "").matchAll(/<(th|td)\b[^>]*>([\s\S]*?)<\/\1>/gi)];
    if (cells.length === 0) continue;
    rows.push({ header: cells.every((c) => c[1]?.toLowerCase() === "th"), cells: cells.map((c) => textOf(c[2] ?? "")) });
  }
  return rows;
}

// One top-level element at a time, in document order. None of these nest within themselves in the legacy pages.
const BLOCK = /<(span)\b[^>]*class="eyebrow"[^>]*>([\s\S]*?)<\/span>|<(h1|h2)\b[^>]*>([\s\S]*?)<\/\3>|<(p)\b([^>]*)>([\s\S]*?)<\/p>|<(ul)\b[^>]*>([\s\S]*?)<\/ul>|<(table)\b[^>]*>([\s\S]*?)<\/table>/gi;

export function parsePolicyBlocks(html: string): readonly PolicyBlock[] {
  const blocks: PolicyBlock[] = [];
  for (const m of mainOf(html).matchAll(BLOCK)) {
    if (m[1]) blocks.push({ type: "eyebrow", html: textOf(m[2] ?? "") });
    else if (m[3]) blocks.push({ type: m[3].toLowerCase() as "h1" | "h2", html: textOf(m[4] ?? "") });
    else if (m[5]) blocks.push({ type: /class="[^"]*\bupdated\b/.test(m[6] ?? "") ? "updated" : "p", html: textOf(m[7] ?? "") });
    else if (m[8]) blocks.push({ type: "ul", items: [...(m[9] ?? "").matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)].map((li) => textOf(li[1] ?? "")) });
    else if (m[10]) blocks.push({ type: "table", rows: tableRows(m[11] ?? "") });
  }
  return blocks;
}

function required<T>(value: T | null | undefined, what: string): T {
  if (value === null || value === undefined || value === "") throw new Error(`legacy FAQ page is missing ${what}: the layout changed`);
  return value;
}

export function parseFaq(html: string): FaqContent {
  const main = mainOf(html);
  const eyebrow = /<span\b[^>]*class="eyebrow"[^>]*>([\s\S]*?)<\/span>/i.exec(main)?.[1];
  const heading = /<h1\b[^>]*>([\s\S]*?)<\/h1>/i.exec(main)?.[1];
  const intro = /<p\b[^>]*class="sub"[^>]*>([\s\S]*?)<\/p>/i.exec(main)?.[1];

  const items = main.split(/<div\b[^>]*class="faq-item"[^>]*>/i).slice(1).map((chunk, index) => {
    const question = /<button\b[^>]*class="faq-q"[^>]*>([\s\S]*?)<\/button>/i.exec(chunk)?.[1]?.replace(/<span\b[^>]*class="faq-chev"[^>]*>[\s\S]*?<\/span>/i, "");
    const answerHtml = /<div\b[^>]*class="faq-a"[^>]*>([\s\S]*?)<\/div>/i.exec(chunk)?.[1];
    const answer = [...(answerHtml ?? "").matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map((p) => textOf(p[1] ?? ""));
    if (answer.length === 0) throw new Error(`legacy FAQ item ${index + 1} has no answer paragraphs`);
    return { question: textOf(required(question, `question ${index + 1}`)), answer };
  });
  if (items.length === 0) throw new Error("legacy FAQ page has no questions");

  const footer = /<div\b[^>]*class="faq-footer"[^>]*>([\s\S]*?)<\/div>/i.exec(main)?.[1] ?? "";
  const cta = /<a\b([^>]*)>([\s\S]*?)<\/a>/i.exec(footer);
  return {
    eyebrow: textOf(required(eyebrow, "the eyebrow")),
    heading: textOf(required(heading, "the heading")),
    intro: textOf(required(intro, "the intro")),
    items,
    footer: {
      text: textOf(required(/<p\b[^>]*>([\s\S]*?)<\/p>/i.exec(footer)?.[1], "the footer text")),
      ctaHref: required(cleanHref(cta?.[1] ?? ""), "the footer link"),
      ctaLabel: textOf(required(cta?.[2], "the footer link label")),
    },
  };
}
