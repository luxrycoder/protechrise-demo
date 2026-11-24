import type { ReactNode } from "react";
import { InlineHtml } from "@/components/inline-html";
import { APPLY_PAY } from "@/content/apply-pay";
import { fillTokens, type PublicTerms } from "@/lib/fee";
import styles from "@/features/application/application.module.css";

type Props = {
  readonly terms: PublicTerms;
  /** The line under the summary: the "fill in the form" note at the top, the checkout note at the bottom. */
  readonly note: string;
  /** The pay button, shown in the bottom block only. */
  readonly children?: ReactNode;
};

/** What the applicant pays and what it saves: the full tuition struck through, the fee, and the scholarship percent. */
export function PriceBlock({ terms, note, children }: Props) {
  const fill = (text: string) => fillTokens(text, terms);
  return (
    <div className={styles.priceBlock}>
      {terms.fee && terms.tuition ? (
        <div className={styles.priceRow}>
          <span className={styles.priceWas} aria-label="Full tuition fee">
            {terms.tuition}
          </span>
          <span className={styles.priceNow}>{terms.fee}</span>
          {terms.scholarshipPercent !== null ? <span className={styles.priceBadge}>{fill(APPLY_PAY.scholarshipBadge)}</span> : null}
        </div>
      ) : null}
      <InlineHtml as="p" html={fill(APPLY_PAY.priceSummary)} />
      {children}
      <p className={styles.priceNote}>{note}</p>
    </div>
  );
}
