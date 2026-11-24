import { describe, expect, test } from "vitest";
import { inlineHtml, parseFaq, parsePolicyBlocks } from "@/lib/legacy-policy-html";

const MAIN = (inner: string) => `<html><body><nav>skip</nav><main>${inner}</main><footer>skip</footer></body></html>`;

describe("inlineHtml", () => {
  test("keeps the allowed tags, drops other tags and attributes, and collapses whitespace", () => {
    expect(inlineHtml(`Hello   <strong class="x">world</strong>\n <span>and</span> <em>more</em> <code>c</code>`)).toBe("Hello <strong>world</strong> and <em>more</em> <code>c</code>");
  });

  test("keeps only the href of a link and points the legacy apply route at /apply", () => {
    expect(inlineHtml(`<a href="/application" class="btn" target="_blank">Apply</a>`)).toBe(`<a href="/apply">Apply</a>`);
    expect(inlineHtml(`<a href="mailto:hello@protechrise.com" onclick="x()">Email</a>`)).toBe(`<a href="mailto:hello@protechrise.com">Email</a>`);
  });

  test("leaves the fee tokens and entities untouched", () => {
    expect(inlineHtml("Pay {{ONBOARDING_FEE}} &middot; now")).toBe("Pay {{ONBOARDING_FEE}} &middot; now");
  });

  test("never lets a script or javascript: link through", () => {
    expect(inlineHtml(`<script>alert(1)</script>ok`)).toBe("ok");
    expect(inlineHtml(`<a href="javascript:alert(1)">x</a>`)).toBe("x");
  });
});

describe("parsePolicyBlocks", () => {
  test("reads the eyebrow, title, version line, paragraphs, headings, lists and tables in order", () => {
    const html = MAIN(`
      <span class="eyebrow">Refund Policy</span>
      <h1>Title</h1>
      <p class="updated">Version 2026-11 &middot; Last updated November 7, 2026</p>
      <p>First <a href="/faq">link</a>.</p>
      <h2>Section</h2>
      <ul><li>One</li><li>Two <code>x</code></li></ul>
      <table><tr><th>A</th><th>B</th></tr><tr><td>1</td><td>2</td></tr></table>`);
    expect(parsePolicyBlocks(html)).toEqual([
      { type: "eyebrow", html: "Refund Policy" },
      { type: "h1", html: "Title" },
      { type: "updated", html: "Version 2026-11 &middot; Last updated November 7, 2026" },
      { type: "p", html: `First <a href="/faq">link</a>.` },
      { type: "h2", html: "Section" },
      { type: "ul", items: ["One", "Two <code>x</code>"] },
      { type: "table", rows: [{ header: true, cells: ["A", "B"] }, { header: false, cells: ["1", "2"] }] },
    ]);
  });

  test("ignores everything outside <main>", () => {
    expect(parsePolicyBlocks(MAIN(`<h1>In</h1>`))).toEqual([{ type: "h1", html: "In" }]);
  });

  test("fails loudly when there is no <main> (the page layout changed)", () => {
    expect(() => parsePolicyBlocks("<html><body><h1>x</h1></body></html>")).toThrow(/main/);
  });
});

describe("parseFaq", () => {
  const html = MAIN(`
    <span class="eyebrow">Frequently Asked Questions</span>
    <h1>Questions, answered.</h1>
    <p class="sub">Intro text.</p>
    <div id="faq-list">
      <div class="faq-item">
        <button class="faq-q" aria-expanded="false">Is it <strong>free</strong>?<span class="faq-chev">▾</span></button>
        <div class="faq-a" id="faq-a-1"><p>Mostly.</p><p>See <a href="/application">apply</a>.</p></div>
      </div>
      <div class="faq-item">
        <button class="faq-q">Second?<span class="faq-chev">▾</span></button>
        <div class="faq-a"><p>Yes.</p></div>
      </div>
    </div>
    <div class="faq-footer"><p>Still have a question?</p><a href="mailto:hello@protechrise.com" class="nav-cta">Contact Us</a></div>`);

  test("reads the heading, intro, every question with its answer paragraphs, and the footer", () => {
    expect(parseFaq(html)).toEqual({
      eyebrow: "Frequently Asked Questions",
      heading: "Questions, answered.",
      intro: "Intro text.",
      items: [
        { question: "Is it <strong>free</strong>?", answer: ["Mostly.", `See <a href="/apply">apply</a>.`] },
        { question: "Second?", answer: ["Yes."] },
      ],
      footer: { text: "Still have a question?", ctaHref: "mailto:hello@protechrise.com", ctaLabel: "Contact Us" },
    });
  });

  test("fails loudly when a question has no answer", () => {
    const broken = MAIN(`<span class="eyebrow">E</span><h1>H</h1><p class="sub">I</p><div class="faq-item"><button class="faq-q">Q<span class="faq-chev">▾</span></button></div><div class="faq-footer"><p>f</p><a href="/x">c</a></div>`);
    expect(() => parseFaq(broken)).toThrow(/answer/);
  });
});
