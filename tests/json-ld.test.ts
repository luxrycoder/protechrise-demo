import { describe, expect, test } from "vitest";
import { NO_TERMS } from "@/lib/fee";
import { faqJsonLd, serializeJsonLd } from "@/lib/json-ld";
import { stripInlineHtml } from "@/lib/inline-html";

describe("faqJsonLd", () => {
  const items = [
    { question: "How much?", answer: ["Only a {{ONBOARDING_FEE}} fee.", 'See <a href="/faq">the FAQ</a> &amp; more.'] },
  ];

  test("builds a FAQPage with the live fee and plain-text answers", () => {
    const ld = faqJsonLd(items, { ...NO_TERMS, fee: "₦19,500" });
    expect(ld["@type"]).toBe("FAQPage");
    expect(ld.mainEntity[0]?.name).toBe("How much?");
    expect(ld.mainEntity[0]?.acceptedAnswer.text).toBe("Only a ₦19,500 fee. See the FAQ & more.");
  });

  test("fills tokens in the question too, not just the answer", () => {
    const ld = faqJsonLd([{ question: "Is the {{ONBOARDING_FEE}} fee refundable?", answer: ["No."] }], { ...NO_TERMS, fee: "₦9,500" });
    expect(ld.mainEntity[0]?.name).toBe("Is the ₦9,500 fee refundable?");
  });

  test("never embeds a raw fee token", () => {
    expect(JSON.stringify(faqJsonLd(items, NO_TERMS))).not.toContain("{{");
  });
});

describe("serializeJsonLd", () => {
  test("escapes < so content cannot close the script tag", () => {
    const out = serializeJsonLd({ a: "</script><script>alert(1)</script>" });
    expect(out).not.toContain("</script>");
    expect(JSON.parse(out).a).toBe("</script><script>alert(1)</script>");
  });
});

describe("stripInlineHtml", () => {
  test("removes tags, decodes basic entities and collapses whitespace", () => {
    expect(stripInlineHtml("a  <em>b</em>\n&lt;c&gt; &quot;d&quot; &#39;e&#39;")).toBe("a b <c> \"d\" 'e'");
  });
});
