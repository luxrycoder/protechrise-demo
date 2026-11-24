/** Inline HTML limited to <a>, <code>, <em>, <strong> (enforced by tests/content.test.ts). */
export type InlineHtml = string;

export type TableRow = { readonly header: boolean; readonly cells: readonly InlineHtml[] };

export type PolicyBlock =
  | { readonly type: "eyebrow" | "h1" | "h2" | "p" | "updated"; readonly html: InlineHtml }
  | { readonly type: "ul"; readonly items: readonly InlineHtml[] }
  | { readonly type: "table"; readonly rows: readonly TableRow[] };

export type FaqItem = { readonly question: string; readonly answer: readonly InlineHtml[] };

export type Testimonial = {
  readonly quote: string;
  readonly name: string;
  readonly role: string;
  readonly tags: readonly string[];
  /** A real, verifiable post this quote is taken from — never invented. */
  readonly source?: { readonly platform: "x" | "linkedin" | "tiktok" | "instagram" | "facebook"; readonly url: string };
};

export type FaqContent = {
  readonly eyebrow: string;
  readonly heading: string;
  readonly intro: InlineHtml;
  readonly items: readonly FaqItem[];
  readonly footer: { readonly text: InlineHtml; readonly ctaHref: string; readonly ctaLabel: string };
};
