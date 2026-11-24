import type { Metadata } from "next";
import { FaqList } from "@/components/faq-list";
import { InlineHtml } from "@/components/inline-html";
import { FAQ } from "@/content/faq";
import { loadPublicTerms } from "@/lib/fee";
import { JsonLd } from "@/components/json-ld";
import { faqJsonLd } from "@/lib/json-ld";
import styles from "@/components/prose.module.css";

// The fee is a live server setting, so this page renders per request (the API call itself is cached 60s).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Everything you need to know about the scholarship, the tracks, the schedule, and what happens after you apply.",
};

export default async function FaqPage() {
  const terms = await loadPublicTerms();

  return (
    <section className={styles.page}>
      <div className={`container ${styles.narrow}`}>
        <span className={styles.eyebrow}>{FAQ.eyebrow}</span>
        <h1 className={styles.title}>{FAQ.heading}</h1>
        <InlineHtml as="p" html={FAQ.intro} className={styles.lede} />
        <FaqList items={FAQ.items} terms={terms} />
        <div className={styles.prose} style={{ marginTop: 40 }}>
          <InlineHtml as="p" html={FAQ.footer.text} />
          <a className="btn btn-primary" style={{ color: "#fff", textDecoration: "none" }} href={FAQ.footer.ctaHref}>
            {FAQ.footer.ctaLabel}
          </a>
        </div>
      </div>
      <JsonLd data={faqJsonLd(FAQ.items, terms)} />
    </section>
  );
}
