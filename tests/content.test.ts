import { describe, expect, test } from "vitest";
import { FAQ } from "@/content/faq";
import { PRIVACY_BLOCKS } from "@/content/privacy";
import { REFUND_BLOCKS } from "@/content/refund-policy";
import { HOME, PROCESS_STEPS } from "@/content/home";
import { HOME_FAQ } from "@/content/home-faq";
import { PERSONAS } from "@/content/personas";
import { TESTIMONIALS } from "@/content/testimonials";
import { findUnsafeInlineHtml } from "@/lib/inline-html";
import type { Platform } from "@/lib/testimonial-segments";

function allInlineHtml(): string[] {
  const out: string[] = [FAQ.intro, FAQ.footer.text];
  for (const item of FAQ.items) out.push(...item.answer);
  for (const item of HOME_FAQ) out.push(...item.answer);
  for (const step of PROCESS_STEPS) out.push(step.html);
  for (const block of [...PRIVACY_BLOCKS, ...REFUND_BLOCKS]) {
    if ("html" in block) out.push(block.html);
    else if (block.type === "ul") out.push(...block.items);
    else for (const row of block.rows) out.push(...row.cells);
  }
  return out;
}

describe("legacy content carried over", () => {
  test("keeps all 17 FAQ questions and the 10 privacy sections", () => {
    expect(FAQ.items).toHaveLength(17);
    expect(PRIVACY_BLOCKS.filter((b) => b.type === "h2")).toHaveLength(10);
  });

  test("the fee token appears in the FAQ so the live fee can be filled in", () => {
    expect(FAQ.items.flatMap((i) => i.answer).some((a) => a.includes("{{ONBOARDING_FEE}}"))).toBe(true);
  });

  test("points the apply links at the new /apply route, not the legacy /application", () => {
    expect(allInlineHtml().join("\n")).not.toContain('href="/application"');
  });
});

describe("refund policy content", () => {
  test("keeps all 5 sections and the policy version line that consent records refer to", () => {
    expect(REFUND_BLOCKS.filter((b) => b.type === "h2")).toHaveLength(5);
    const updated = REFUND_BLOCKS.find((b) => b.type === "updated");
    expect(updated && "html" in updated ? updated.html : "").toContain("Version 2026-11");
  });
});

describe("home page content", () => {
  test("carries over the 7 home FAQ items, 11 unique testimonials and 4 process steps", () => {
    expect(HOME_FAQ).toHaveLength(7);
    expect(TESTIMONIALS).toHaveLength(11);
    expect(new Set(TESTIMONIALS.map((t) => t.quote)).size).toBe(11);
    expect(PROCESS_STEPS).toHaveLength(4);
  });

  test("has a handful of personas, each complete and unique, and none with markup (the copy is plain text)", () => {
    expect(PERSONAS.length).toBeGreaterThanOrEqual(3);
    expect(new Set(PERSONAS.map((p) => p.label)).size).toBe(PERSONAS.length);
    expect(new Set(PERSONAS.map((p) => p.headline)).size).toBe(PERSONAS.length);
    for (const p of PERSONAS) {
      expect(p.label.trim()).not.toBe("");
      expect(p.headline.trim()).not.toBe("");
      expect(p.body.trim()).not.toBe("");
      expect(`${p.label}${p.headline}${p.body}`).not.toMatch(/[<>]/);
    }
  });

  test("persona copy stays short and makes no claim the site does not (pay, guarantees, flexible hours, 9-5)", () => {
    for (const p of PERSONAS) {
      expect(p.label.length).toBeLessThanOrEqual(30);
      expect(p.headline.length).toBeLessThanOrEqual(60);
      expect(p.body.length).toBeLessThanOrEqual(180);
      expect(`${p.headline} ${p.body}`).not.toMatch(/salary|salaries|\bearn(s|ed|ing)?\b|guarantee|free\b|flexible|9-5|\bjob offer\b/i);
    }
  });

  test("the hero does not claim 100% funding or free entry (the live scholarship is a percentage and there is a fee)", () => {
    expect(HOME.hero.sub).not.toMatch(/100%|\bfree\b/i);
  });

  test("every testimonial with a source links to a real https URL", () => {
    for (const t of TESTIMONIALS) {
      if (t.source) expect(t.source.url).toMatch(/^https:\/\//);
    }
  });

  test("every testimonial has a unique source link, so cards can be keyed by it", () => {
    const keys = TESTIMONIALS.map((t) => t.source?.url ?? t.name);
    expect(new Set(keys).size).toBe(TESTIMONIALS.length);
  });

  test("every testimonial source is on its own platform's domain", () => {
    const hosts: Record<Platform, RegExp> = {
      x: /^(x|twitter)\.com$/,
      linkedin: /^([a-z]+\.)?linkedin\.com$/,
      tiktok: /^([a-z]+\.)?tiktok\.com$/,
      instagram: /^([a-z]+\.)?instagram\.com$/,
      facebook: /^([a-z]+\.)?facebook\.com$/,
    };
    for (const t of TESTIMONIALS) {
      if (t.source) expect(new URL(t.source.url).hostname).toMatch(hosts[t.source.platform]);
    }
  });

  test("keeps the time-sensitive campaign claims in one place so they are easy to update", () => {
    expect(HOME.campaign).toEqual({ spots: "2500", cohortLabel: "January 2027" });
  });

  test("home FAQ still carries the fee token so the live fee is filled in", () => {
    expect(HOME_FAQ.flatMap((i) => i.answer).some((a) => a.includes("{{ONBOARDING_FEE}}"))).toBe(true);
  });
});

describe("findUnsafeInlineHtml", () => {
  test("all shipped inline markup uses only allowed tags and safe link targets", () => {
    for (const html of allInlineHtml()) expect(findUnsafeInlineHtml(html)).toEqual([]);
  });

  test("no inline-html link leaves the site, because these anchors cannot open in a new tab", () => {
    const external = allInlineHtml().flatMap((html) => [...html.matchAll(/href="(https?:\/\/[^"]*)"/g)].map((m) => m[1]));
    // If an outside link is ever needed here, make the renderer add target="_blank" rel="noopener noreferrer" first.
    expect(external).toEqual([]);
  });

  test("flags scripts, event handlers and javascript: links", () => {
    expect(findUnsafeInlineHtml("<script>x</script>")).toContain("script");
    expect(findUnsafeInlineHtml('<a href="/x" onclick="y()">z</a>')).toContain("onclick");
    expect(findUnsafeInlineHtml('<a href="javascript:alert(1)">z</a>')).toContain("href:javascript:alert(1)");
    expect(findUnsafeInlineHtml('<img src="x">')).toContain("img");
  });

  test("allows <a>, <code>, <em>, <strong> and relative, https and mailto links", () => {
    expect(
      findUnsafeInlineHtml('<a href="/faq">a</a> <a href="https://x.test">b</a> <a href="mailto:a@b.test">c</a> <code>d</code> <em>e</em> <strong>f</strong>'),
    ).toEqual([]);
  });
});
