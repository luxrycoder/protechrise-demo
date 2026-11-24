import type { FaqItem } from "@/content/types";
import { InlineHtml } from "@/components/inline-html";
import { fillTokens, type PublicTerms } from "@/lib/fee";
import styles from "./faq-list.module.css";

/**
 * Native <details> accordion: works without JavaScript and is keyboard- and screen-reader-accessible
 * out of the box. The live prices are filled in on the server, so it never flashes a placeholder.
 */
export function FaqList({ items, terms }: { readonly items: readonly FaqItem[]; readonly terms: PublicTerms }) {
  return (
    <div className={styles.list}>
      {items.map((item) => (
        <details key={item.question} className={styles.item}>
          <summary className={styles.question}>{fillTokens(item.question, terms)}</summary>
          <div className={styles.answer}>
            {item.answer.map((paragraph, i) => (
              <InlineHtml key={i} as="p" html={fillTokens(paragraph, terms)} />
            ))}
          </div>
        </details>
      ))}
    </div>
  );
}
